import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { Graph } from "./libs/graph";
import { Box } from "./libs/definitions";
import { Geometric } from "./libs/geometric";

const SvgBuilder = require('svg-builder')

/**
 * 便宜上のメイン関数
 * @returns 
 */
function main() {
  // [treat ARGV]
  const [dataset_path, feature_x, feature_y] = process.argv.slice(2);
  if (!dataset_path) {
    throw new Error("dataset unspecified");
  }
  if (!feature_x) {
    throw new Error("feature unspecified");
  }
  if (!feature_y) {
    throw new Error("feature unspecified");
  }
  if (feature_x === feature_y) {
    throw new Error("spexified same feature for x and y");
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
  const feature_stat_x = feature_stats.find(f => f.name === feature_x);
  if (!feature_stat_x) {
    throw new Error("feature for x is invalid");
  }
  const feature_stat_y = feature_stats.find(f => f.name === feature_y);
  if (!feature_stat_y) {
    throw new Error("feature for x is invalid");
  }

  // [ペアリングデータの作成]
  const paired_data = Stats.make_pair(feature_stat_x, feature_stat_y, raw_students);

  // [SVGを生成する]
  const box: Box = {
    p1: { x: 0, y: 0 },
    p2: { x: 600, y: 600 },
  };
  const dimension = Geometric.formDimensionByBox(box);
  const svg = SvgBuilder.width(dimension.width).height(dimension.height);
  Graph.drawScatter(svg, box, paired_data);
  const scatter_svg = svg.render();

  // [ファイルに書き出す]
  const out_path = `scatter_${feature_x}_vs_${feature_y}.svg`;
  fs.writeFileSync(out_path, scatter_svg);
}

try {
  main();
} catch (e) {
  console.error(e);
}
