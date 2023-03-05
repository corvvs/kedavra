import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { Graph } from "./libs/graph";

/**
 * 便宜上のメイン関数
 * @returns 
 */
function main() {
  // [treat ARGV]
  const [dataset_path, feature] = process.argv.slice(2);
  if (!dataset_path) {
    throw new Error("dataset unspecified");
  }
  // if (!feature) {
  //   throw new Error("feature unspecified");
  // }
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
  const [feature_x, feature_y] = [feature_stats[0], feature_stats[1]];

  // [ペアリングデータの作成]
  const paired_data = Stats.make_pair(feature_x, feature_y, raw_students);

  // [SVGを生成する]
  const scatter_svg = Graph.drawScatter(paired_data);

  // [ファイルに書き出す]
  fs.writeFileSync("s.svg", scatter_svg);
}

try {
  main();
} catch (e) {
  console.error(e);
}
