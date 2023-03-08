import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { Graph } from "./libs/graph";
import { Box } from "./libs/definitions";
import { Geometric } from "./libs/geometric";
import { IO } from "./libs/io";
import { Flow } from "./libs/flow";
import { Utils } from "./libs/utils";

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
  float_features.push("is_g");
  float_features.push("is_r");
  float_features.push("is_h");
  float_features.push("is_s");

  // [統計データの計算]
  const feature_stats = float_features.map(feature => {
    return Stats.derive_feature_stats(feature, raw_students);
  });

  // [SVGの初期化]
  const width = 600;
  const height = 600;
  const box: Box = {
    p1: { x: 0, y: 0 },
    p2: { x: width * float_features.length, y: height * float_features.length },
  };
  const dimension = Geometric.formDimensionByBox(box);
  const svg = SvgBuilder.width(dimension.width).height(dimension.height);  

  // [SVGの作成]
  Graph.drawPairPlot(svg, { width, height }, raw_students, feature_stats);
  const pair_plot_svg = svg.render();

  // [ファイルに書き出す]
  IO.save("pair_plot.svg", pair_plot_svg);
}

try {
  main();
} catch (e) {
  console.error(e);
}
