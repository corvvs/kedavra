import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './parse';
import { Stats } from "./stats";
import { Graph } from "./graph";
import { StudentRaw, FeatureStats, Histogram } from "./definitions";

const SvgParameter = {
  path: "t.svg",
  // 全体幅
  width: 600,
  // 全体高さ
  height: 600,
  // 全体マージン
  margin: 20,
  // 全体上マージン
  topMargin: 50,
  // 全体左マージン
  leftMargin: 100,
  // ヒストグラムの上マージン
  figureTopMargin: 20,
  // ヒストグラムの横マージン
  figureSideMargin: 20,
  // 縦軸詳細メモリの幅
  xFineScalerSize: 16,
  // 横軸詳細メモリの高さ
  yFineScalerSize: 8,
};

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
  if (!feature) {
    throw new Error("feature unspecified");
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

  // [生徒データを階級値化する]
  const selected_stat = feature_stats.find(f => f.name === feature);
  if (!selected_stat) {
    throw new Error("feature not found");
  }
  const histo = Stats.students_to_bins(raw_students, selected_stat, 40);

  // [SVGを生成する]
  const histo_svg = Graph.drawHistogram(histo);

  // [ファイルに書き出す]
  fs.writeFileSync(SvgParameter.path, histo_svg);
}

try {
  main();
} catch (e) {
  console.error(e);
}
