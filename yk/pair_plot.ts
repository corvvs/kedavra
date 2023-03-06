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
  const [dataset_path] = process.argv.slice(2);
  if (!dataset_path) {
    throw new Error("dataset unspecified");
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

  for (let i = 0; i < feature_stats.length; ++i) {
    for (let j = 0; j < feature_stats.length; ++j) {
      const stat_x = feature_stats[i];
      const stat_y = feature_stats[j];
      const subbox = {
        p1: { x: width * j, y: height * i },
        p2: { x: width * (j + 1), y: height * (i + 1) },
      };
      if (i === j) {
        const histo = Stats.students_to_bins(raw_students, stat_x, 40);
        Graph.drawHistogram(svg, subbox, histo);
      } else {
        const show_x_label = i === feature_stats.length - 1;
        const show_y_label = j === 0;
        const paired_data = Stats.make_pair(stat_y, stat_x, raw_students);
        Graph.drawScatter(svg, subbox, paired_data, {
          xLabel: show_x_label,
          yLabel: show_y_label,
        });
      }
    }
  }
  const pair_plot_svg = svg.render();

  // [ファイルに書き出す]
  const out_path = `pair_plot.svg`;
  fs.writeFileSync(out_path, pair_plot_svg);
}

try {
  main();
} catch (e) {
  console.error(e);
}
