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
import { Spider } from "./libs/spider";
import { exec } from "child_process";

/**
 * 便宜上のメイン関数
 * @returns 
 */
function main() {
  // [treat ARGV]
  const [dataset_path, feature_x, feature_y] = process.argv.slice(2);
  if (!dataset_path) {
    Flow.exit_with_error(
      `usage: ${Utils.basename(process.argv[0])} ${Utils.basename(process.argv[1])} [dataset path] [feature name] [another feature name]`
    );
  }

  // [データセット読み取り]
  const data = fs.readFileSync(dataset_path, 'utf-8');

  // [スキーマ処理]
  const [schema, ...rows] = data.split("\n");
  const normalized_fields = schema.split(",").map((s) => s.split(/\s+/).map(t => t.toLowerCase()).join("_"));
  const float_features: string[] = normalized_fields.filter(s => Parser.is_float_feature(s));

  if (!float_features.includes(feature_x) || !float_features.includes(feature_y)) {
    Flow.exit_with_error([
      `usage: ${Utils.basename(process.argv[0])} ${Utils.basename(process.argv[1])} [dataset path] [feature name] [another feature name]`,
      "",
      "<available feature names>",
      ...float_features.map(n => `- ${n}`),
    ].join("\n"));
  }
  if (feature_x === feature_y) {
    Flow.exit_with_error(
      "specify 2 different feature names.",
    );
  }

  // [生徒データの生成]
  const raw_students = rows
    .map(row => Parser.parse_line_as_student(row, normalized_fields))
    .filter(r => _.isFinite(r.index));

  // [カテゴリカル変数の数値化]
  raw_students.forEach(r => Parser.quantize_categoricals(r));

  // [統計データの計算]
  const [feature_stat_x, feature_stat_y] = [feature_x, feature_y].map(feature => Stats.derive_feature_stats(feature, raw_students));

  // [ペアリングデータの作成]
  const paired_data = Stats.make_pair(feature_stat_x, feature_stat_y, raw_students);

  // [SVGを生成する]
  const box: Box = {
    p1: { x: 0, y: 0 },
    p2: { x: 600, y: 600 },
  };
  const dimension = Geometric.formDimensionByBox(box);
  const svg = new Spider(dimension);
  Graph.drawScatter(svg, box, paired_data, { xLabel: true, yLabel: true });
  const scatter_svg = svg.render();

  // [ファイルに書き出す]
  const out_path = `scatter_${feature_x}_vs_${feature_y}.svg`;
  IO.save(out_path, scatter_svg);
  exec(`open ${out_path}`, (error, strout, strerr) => {
    if (error) {
      console.error(strerr);
    }
  });
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
