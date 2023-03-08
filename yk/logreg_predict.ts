import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { StudentRaw, TrainedParameters } from "./libs/definitions";
import { Preprocessor, Probability, Validator } from "./libs/train";
import { IO } from "./libs/io";
import { Flow } from "./libs/flow";
import { Utils } from "./libs/utils";

const default_parameters_path = "parameters.json";

/**
 * 便宜上のメイン関数
 * @returns 
 */
function main() {
  // [treat ARGV]
  const [dataset_path, given_parameters_path] = process.argv.slice(2);
  if (!dataset_path) {
    Flow.exit_with_error(
      `usage: ${Utils.basename(process.argv[0])} ${Utils.basename(process.argv[1])} [dataset path]`
    );
  }
  const parameters_path = given_parameters_path || default_parameters_path;
  // [データセット読み取り]
  const data = fs.readFileSync(dataset_path, 'utf-8');
  // [パラメータ読み取り]
  const parameters: TrainedParameters = JSON.parse(fs.readFileSync(parameters_path, 'utf-8'));

  // [スキーマ処理]
  const [schema_row, ...rows] = data.split("\n");
  const schema_fields = schema_row.split(",");
  const normalized_fields = schema_fields
    .map((s) => s.split(/\s+/).map(t => t.toLowerCase())
    .join("_"));
  const float_features: string[] = normalized_fields.filter(s => Parser.is_float_feature(s));

  // [生徒データの生成]
  const raw_students = rows
    .map(row => Parser.parse_line_as_student(row, normalized_fields))
    .filter(r => _.isFinite(r.index));

  // [カテゴリカル変数の数値化]
  raw_students.forEach(r => Parser.quantize_categoricals(r));
  float_features.push("is_left");

  // [統計データの計算]
  const feature_stats_0 = float_features.map(feature => {
    return Stats.derive_feature_stats(feature, raw_students);
  });

  // [欠損データの補完]
  for (let i = 0; i < raw_students.length; ++i) {
    const student = raw_students[i];
    feature_stats_0.forEach(stats => {
      const v = student.scores[stats.name];
      if (!_.isFinite(v)) {
        student.scores[stats.name] = stats.p50;
      }
    })
  }

  // [統計データの再計算]
  const feature_stats = (() => {
    const feature_stats = float_features.map(feature => Stats.derive_feature_stats(feature, raw_students));
    return Preprocessor.reduce_by_corelation(feature_stats, raw_students);
  })();

  // [前処理:標準化]
  // ここでは parameters.json の standardizer を使って標準化する
  feature_stats.forEach(stats => Preprocessor.standardize_by_ex(stats.name, parameters.standardizers[stats.name], raw_students));
  // feature_stats.forEach(stats => Training.normalize(stats, raw_students));
  const using_features = feature_stats.map(f => f.name);

  // [定数項の付加]
  // TODO: 定数項の値をライブラリ定数にする
  raw_students.forEach(s => s.scores["constant"] = 1);
  using_features.push("constant");

  const ws = _.mapValues(parameters.weights, (weights, key) => {
    return using_features.map(f => weights[f]);
  });

  // [予測]
  raw_students.forEach(s => {
    const f_probability = (student: StudentRaw, weights: number[]) => Probability.logreg(student, using_features, weights);
    const house = Validator.predict_house(ws, s, f_probability);
    s.raw_splitted["hogwarts_house"] = house;
  });

  // [CSV再生成]
  {
    const output_fields = ["index", "hogwarts_house"];
    let str = "";
    str += output_fields.map((s, i) => schema_fields[i]).join(",") + "\n";
    raw_students.forEach(s => {
      str += output_fields.map((s, i) => normalized_fields[i]).map((f) => s.raw_splitted[f]).join(",") + "\n";
    });
    IO.save("houses.csv", str);
  }
}

try {
  main();
} catch (e) {
  console.error(e);
}
