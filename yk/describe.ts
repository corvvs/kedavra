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

function is_integral_feature(name: string) {
  return name === "index";
}

function is_string_feature(name: string) {
  return ["hogwarts_house", "first_name", "last_name", "birthday", "best_hand"].includes(name);
}

function is_float_feature(name: string) {
  return !is_integral_feature(name) && !is_string_feature(name);
}

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
  const normalized_schema = schema.split(",").map((s) => s.split(/\s+/).map(t => t.toLowerCase()).join("_"));
  const float_features: string[] = normalized_schema.filter(s => is_float_feature(s));
  console.log(normalized_schema, float_features);

  // [生徒データの生成]
  const raw_students = rows.map(row => {
    const items = row.split(",");
    const r: any = {};
    r.scores = {};
    items.forEach((s, i) => {
      const name = normalized_schema[i];
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
    return r as StudentRaw;
  }).filter(r => _.isFinite(r.index));

  // [カテゴリカル変数の数値化]
  raw_students.forEach(r => {
    r.scores.is_left = r.best_hand === "Left" ? 1 : 0;
    r.scores.is_right = r.best_hand === "Right" ? 1 : 0;
    r.scores.is_r = r.hogwarts_house === "Ravenclaw" ? 1 : 0;
    r.scores.is_s = r.hogwarts_house === "Slytherin" ? 1 : 0;
    r.scores.is_g = r.hogwarts_house === "Gryffindor" ? 1 : 0;
    r.scores.is_h = r.hogwarts_house === "Hufflepuff" ? 1 : 0;
  });

  // [統計データの計算]
  const feature_stats = float_features.map(name => {
    let count = 0;
    let sum = 0;
    const values: number[] = [];
    raw_students.forEach(r => {
      const val = r.scores[name];
      if (!_.isFinite(val)) { return; }
      count += 1;
      sum += val;
      values.push(val);
    });
    const mean = sum / count;
    let sqsum = 0;
    raw_students.forEach(r => {
      const val = r.scores[name];
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
      name,
      count,
      mean,
      std,
      p0,
      p25,
      p50,
      p75,
      p100,
    };
  });

  // [統計量の出力]
  {
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
}

try {
  main();
} catch (e) {
  console.error(e);
}
