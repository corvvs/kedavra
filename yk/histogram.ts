import * as _ from "lodash"
import * as fs from 'fs';
import { Flow } from './libs/flow';
import { Utils } from './libs/utils';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { Graph } from "./libs/graph";
import { Geometric } from "./libs/geometric";
import { Box } from "./libs/definitions";
import { IO } from "./libs/io";
import { Spider } from "./libs/spider";

/**
 * 便宜上のメイン関数
 * @returns 
 */
function main() {
  // [treat ARGV]
  const [dataset_path, feature] = process.argv.slice(2);
  if (!dataset_path) {
    Flow.exit_with_error(
      `usage: ${Utils.basename(process.argv[0])} ${Utils.basename(process.argv[1])} [dataset path] [feature name]`
    );
  }
  // [データセット読み取り]
  const data = fs.readFileSync(dataset_path, 'utf-8');

  // [スキーマ処理]
  const [schema, ...rows] = data.split("\n");
  const normalized_fields = schema.split(",").map((s) => s.split(/\s+/).map(t => t.toLowerCase()).join("_"));
  const float_features: string[] = normalized_fields.filter(s => Parser.is_float_feature(s));

  if (!float_features.includes(feature)) {
    Flow.exit_with_error([
      `usage: ${Utils.basename(process.argv[0])} ${Utils.basename(process.argv[1])} [dataset path] [feature name]`,
      "",
      "<available feature names>",
      ...float_features.map(n => `- ${n}`),
    ].join("\n"));
  }

  // [生徒データの生成]
  const raw_students = rows
    .map(row => Parser.parse_line_as_student(row, normalized_fields))
    .filter(r => _.isFinite(r.index));

  // [カテゴリカル変数の数値化]
  raw_students.forEach(r => Parser.quantize_categoricals(r));

  // [統計データの計算]
  const [selected_stat] = [feature].map(feature => Stats.derive_feature_stats(feature, raw_students));

  // [生徒データを階級値化する]
  const histo = Stats.students_to_bins(raw_students, selected_stat, 40);

  // [SVGを生成する]
  const box: Box = {
    p1: { x: 0, y: 0 },
    p2: { x: 600, y: 600 },
  };
  const dimension = Geometric.formDimensionByBox(box);
  const svg = new Spider(dimension);
  Graph.drawHistogram(svg, box, histo);
  const histo_svg = svg.render();

  // [ファイルに書き出す]
  IO.save(`histogram_${feature}.svg`, histo_svg);
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
