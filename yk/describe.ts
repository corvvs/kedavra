import * as _ from "lodash"
import * as fs from 'fs';
import { sprintf } from "sprintf-js";

type StudentRaw = {
  index: number;
  hogwarts_house: string;
  first_name: string;
  last_name: string;
  birthday: string;
  best_hand: string;
  scores: {
    [K in string]: number;
  };
}

type FeatureStats = {
  name: string;
  // 総数
  count: number;
  // 平均値
  mean: number;
  // 標準偏差
  std: number;
  // 最小値(0パーセンタイル値)
  p0: number;
  // 25パーセンタイル値
  p25: number;
  // 50パーセンタイル値
  p50: number;
  // 75パーセンタイル値
  p75: number;
  // 最大値(100パーセンタイル値)
  p100: number;
};

function is_integral_feature(name: string) {
  return name === "index";
}

function is_string_feature(name: string) {
  return ["hogwarts_house", "first_name", "last_name", "birthday", "best_hand"].includes(name);
}

function is_float_feature(name: string) {
  return !is_integral_feature(name) && !is_string_feature(name);
}

/**
 * CSVの行`line`を StudentRaw として解釈する.
 * その際フィールド名`field_names`を使う.
 * @param line 
 * @param field_names 
 * @returns 
 */
function parse_line_as_student(line: string, field_names: string[]): StudentRaw {
  const items = line.split(",");
  const r: any = {};
  r.scores = {};
  items.forEach((s, i) => {
    const name = field_names[i];
    if (is_integral_feature(name)) {
      // integral field
      r.index = parseInt(s);
    } else if (is_string_feature(name)) {
      // string field
      r[name] = s;
    } else if (is_float_feature(name)) {
      // float field
      r.scores[name] = parseFloat(s);
    }
  });
  return r;
}

/**
 * 生徒データ`r`のカテゴリカル変数を数値化して`r.scores`に書き込む
 * @param r 
 */
function quantize_categoricals(r: StudentRaw) {
  r.scores.is_left = r.best_hand === "Left" ? 1 : 0;
  r.scores.is_right = r.best_hand === "Right" ? 1 : 0;
  r.scores.is_r = r.hogwarts_house === "Ravenclaw" ? 1 : 0;
  r.scores.is_s = r.hogwarts_house === "Slytherin" ? 1 : 0;
  r.scores.is_g = r.hogwarts_house === "Gryffindor" ? 1 : 0;
  r.scores.is_h = r.hogwarts_house === "Hufflepuff" ? 1 : 0;  
}

/**
 * 生徒データ`students`をもとに、特徴量`feature`の統計量を計算する.
 * @param feature 
 * @param students 
 * @returns 
 */
function derive_feature_stats(feature: string, students: StudentRaw[]): FeatureStats {
  let count = 0;
  let sum = 0;
  const values: number[] = [];
  students.forEach(r => {
    const val = r.scores[feature];
    if (!_.isFinite(val)) { return; }
    count += 1;
    sum += val;
    values.push(val);
  });
  const mean = sum / count;
  let sqsum = 0;
  students.forEach(r => {
    const val = r.scores[feature];
    if (!_.isFinite(val)) { return; }
    sqsum += (val - mean) ** 2;
  });
  let std = Math.sqrt(sqsum / count);
  const sorted_values = _.sortBy(values, v => v);
  const i0 = 0;
  const i25 = Math.floor(count * 0.25);
  const i50 = Math.floor(count * 0.5);
  const i75 = Math.floor(count * 0.75);
  const i100 = count - 1;
  const [p0, p25, p50, p75, p100] = [i0, i25, i50, i75, i100].map(i => sorted_values[i]);
  return {
    name: feature,
    count,
    mean,
    std,
    p0,
    p25,
    p50,
    p75,
    p100,
  };
}

/**
 * FeatureStats に含まれる各統計量を1行ずつにまとめて表示する.
 * @param feature_stats 
 */
function print_stats_for_features(feature_stats: FeatureStats[]) {
    // フィールド長の算出
    // [見出し行]
    let line = "";
    line += sprintf("%10s", "");
    feature_stats.forEach(s => {
      const w = Math.max(s.name.length, 14);
      line += sprintf(` %${w}s`, s.name);
    });
    console.log(line);

    // [統計量]
    const name_map = {
      count: "Count",
      mean: "Mean",
      std: "Std",
      p0: "Min",
      p25: "25%",
      p50: "50%",
      p75: "75%",
      p100: "Max",
    };
    (["count", "mean", "std", "p0", "p25", "p50", "p75", "p100"] as const).forEach(key => {
      const display_name = name_map[key];
      let line = "";
      line += sprintf("%-10s", display_name);
      feature_stats.forEach(s => {
        const w = Math.max(s.name.length, 14);
        line += sprintf(` %${w}.6f`, s[key]);
      })
      console.log(line);
    });
}

/**
 * 便宜上のメイン関数
 * @returns 
 */
function main() {
  // [treat ARGV]
  const [dataset_path] = process.argv.slice(2);
  if (!dataset_path) {
    console.warn("no file");
    return;
  }
  // [データセット読み取り]
  const data = fs.readFileSync(dataset_path, 'utf-8');

  // [スキーマ処理]
  const [schema, ...rows] = data.split("\n");
  const normalized_fields = schema.split(",").map((s) => s.split(/\s+/).map(t => t.toLowerCase()).join("_"));
  const float_features: string[] = normalized_fields.filter(s => is_float_feature(s));

  // [生徒データの生成]
  const raw_students = rows
    .map(row => parse_line_as_student(row, normalized_fields))
    .filter(r => _.isFinite(r.index));

  // [カテゴリカル変数の数値化]
  raw_students.forEach(r => quantize_categoricals(r));

  // [統計データの計算]
  const feature_stats = float_features.map(feature => derive_feature_stats(feature, raw_students));

  // [統計量の出力]
  print_stats_for_features(feature_stats);
}

try {
  main();
} catch (e) {
  console.error(e);
}
