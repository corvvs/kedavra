import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { Graph } from "./libs/graph";
import { Geometric } from "./libs/geometric";
import { Box } from "./libs/definitions";

const SvgBuilder = require('svg-builder')

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
  const box: Box = {
    p1: { x: 0, y: 0 },
    p2: { x: 600, y: 600 },
  };
  const dimension = Geometric.formDimensionByBox(box);
  const svg = SvgBuilder.width(dimension.width).height(dimension.height);
  Graph.drawHistogram(svg, box, histo);
  const histo_svg = svg.render();

  // [ファイルに書き出す]
  const out_path = `historgram_${feature}.svg`;
  fs.writeFileSync(out_path, histo_svg);
}

try {
  main();
} catch (e) {
  console.error(e);
}
