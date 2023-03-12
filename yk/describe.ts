import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { FeatureCorrelation } from "./libs/definitions";

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
  const float_features: string[] = normalized_fields.filter(s => Parser.is_float_feature(s));

  // [生徒データの生成]
  const raw_students = rows
    .map(row => Parser.parse_line_as_student(row, normalized_fields))
    .filter(r => _.isFinite(r.index));

  // [カテゴリカル変数の数値化]
  raw_students.forEach(r => Parser.quantize_categoricals(r));

  // [統計データの計算]
  const feature_stats = float_features.map(feature => Stats.derive_feature_stats(feature, raw_students));
  const correlations: FeatureCorrelation[][] = Stats.derive_features_covariances(feature_stats, raw_students);

  // [統計量の出力]
  Stats.print_stats_for_features(feature_stats, correlations);
}

try {
  main();
} catch (e) {
  if (e instanceof Error) {
    console.error(`[${e.name}]`, e.message);
  } else {
    console.error(e);
  }
}
