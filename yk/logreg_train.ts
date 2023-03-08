import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { Graph } from "./libs/graph";
import { Box, Standardizers, StudentRaw } from "./libs/definitions";
import { Geometric } from "./libs/geometric";
import { Preprocessor, Probability, Trainer, Validator } from "./libs/train";
import { IO } from "./libs/io";
import { Flow } from "./libs/flow";
import { Utils } from "./libs/utils";
import { sprintf } from "sprintf-js";
const SvgBuilder = require('svg-builder')

/**
 * 便宜上のメイン関数
 * @returns 
 */
function main() {
  // [treat ARGV]
  const [dataset_path] = process.argv.slice(2);
  if (!dataset_path) {
    Flow.exit_with_error(
      `usage: ${Utils.basename(process.argv[0])} ${Utils.basename(process.argv[1])} [dataset path]`
    );
  }
  // [データセット読み取り]
  const data = fs.readFileSync(dataset_path, 'utf-8');

  // [スキーマ処理]
  const [schema, ...rows] = data.split("\n");
  const normalized_fields = schema.split(",").map((s) => s.split(/\s+/).map(t => t.toLowerCase()).join("_"));
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
  // 標準化するとデータが変更されるので, 復元用にとっておく
  const feature_stats = (() => {
    const feature_stats = float_features.map(feature => Stats.derive_feature_stats(feature, raw_students));
    return Preprocessor.reduce_by_corelation(feature_stats, raw_students);
  })();

  // [前処理:標準化]
  feature_stats.forEach(stats => Preprocessor.standardize(stats, raw_students));
  const using_features = feature_stats.map(f => f.name);

  // [定数項の付加]
  raw_students.forEach(s => s.scores["constant"] = 1);
  using_features.push("constant");

  // [学習]
  const cv_division = 8;
  Preprocessor.shuffle(raw_students);
  const results = _.map(_.range(cv_division), i => {
    const from = Math.floor(raw_students.length / cv_division * i);
    const to = Math.floor(raw_students.length / cv_division * (i + 1));
    const students_validate = raw_students.slice(from, to);
    const students_training = raw_students.filter((s, i) => i < from || to <= i);
    console.log(i, students_training.length, from, to, students_validate.length);
    const house_key = ["is_g", "is_r", "is_h", "is_s"];
    const ws = _(house_key).keyBy(key => key).mapValues(key => {
      const t0 = Date.now();
      const ws = Trainer.stochastic_gradient_descent(key, using_features, students_training);
      const t1 = Date.now();
      console.log(`${key}: ${t1 - t0}ms`);
      return ws;
    }).value();

    // [評価]
    const f_probability = (student: StudentRaw, weights: number[]) => Probability.logreg(student, using_features, weights);
    const { ok, no } = Validator.validate_weights(ws, students_validate, f_probability);
    const precision = ok / (ok + no);
    console.log(i, precision, `= ${ok} / (${ok} + ${no})`);
    _.each(ws, (ws, key) => {
      console.log(key, ":", "[", ws.map(w => sprintf("%+1.2f", w)).join(", "), "]");
    });
    return { i, ws, precision };
  });

  const ws = _.mapValues(results[0].ws, (ws, key) => {
    return Utils.average_vectors(results.map(r => r.ws[key]))
  })

  // console.log("wins:", champion.i, champion.precision);
  // _.each(champion.ws, (ws, key) => {
  //   console.log(key, ":", "[", ws.map(w => sprintf("%+1.2f", w)).join(", "), "]");
  // });
  console.log("averaged:");
  _.each(ws, (ws, key) => {
    console.log(key, ":", "[", ws.map(w => sprintf("%+1.2f", w)).join(", "), "]");
  });
  {
    const f_probability = (student: StudentRaw, weights: number[]) => Probability.logreg(student, using_features, weights);
    const { ok, no } = Validator.validate_weights(ws, raw_students, f_probability);
    console.log("whole:", ok / (ok + no), `= ${ok} / (${ok} + ${no})`);
  }


  // [パラメータファイル出力]
  {
    const standardizers: Standardizers = _(feature_stats).keyBy(s => s.name).mapValues((s) => ({
      mean: s.mean,
      std: s.std,
    })).value();
    const weights = _.mapValues(ws, (weights, key) => {
      const d: { [key: string]: number } = {};
      weights.forEach((w, i) => d[using_features[i]] = w);
      return d;
    });
    IO.save("parameters.json", JSON.stringify({
      weights, standardizers,
    }, null, 2));
  }

  // // [外したデータをでっかくしてペアプロット]
  // {
  //   house_key.forEach(key => using_features.push(`predicted_${key}`));
  //   const sorted_students = _.sortBy(raw_students, s => s.corrected ? 0 : 1);
  //   const out_features = using_features.filter(f => f !== "constant");
  //   const out_stats = out_features.map(feature => Stats.derive_feature_stats(feature, sorted_students));
  //   const width = 600;
  //   const height = 600;
  //   const box: Box = {
  //     p1: { x: 0, y: 0 },
  //     p2: { x: width * out_features.length, y: height * out_features.length },
  //   };
  //   const dimension = Geometric.formDimensionByBox(box);
  //   const svg = SvgBuilder.width(dimension.width).height(dimension.height);  

  //   // [SVGの作成]
  //   Graph.drawPairPlot(svg, { width, height }, sorted_students, out_stats);
  //   const pair_plot_svg = svg.render();

  //   IO.save("training.svg", pair_plot_svg);
  // }
}

try {
  main();
} catch (e) {
  console.error(e);
}
