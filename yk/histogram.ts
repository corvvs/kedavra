import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './parse';
import { Stats } from "./stats";
import { StudentRaw, FeatureStats, Histogram } from "./definitions";
const SvgBuilder = require('svg-builder')

const SvgParameter = {
  path: "t.svg",
  // 全体幅
  width: 600,
  // 全体高さ
  height: 600,
  // 全体マージン
  margin: 20,
  // ヒストグラムの上マージン
  figureTopMargin: 20,
  // ヒストグラムの横マージン
  figureSideMargin: 20,
};


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

  // [生徒データを階級値化する]
  const histo = Stats.students_to_bins(raw_students, feature_stats[0], 40);

  // [SVGを生成する]
  const svg = SvgBuilder.width(SvgParameter.width).height(SvgParameter.height);


  // 図の幅
  const figureWidth = SvgParameter.width - SvgParameter.margin * 2;
  // 図の高さ
  const figureHeight = SvgParameter.height - SvgParameter.margin * 2;
  // ヒストグラムの最大階級の高さ
  const maxLevelHeight = figureHeight - SvgParameter.figureTopMargin;
  // ヒストグラム部分の幅
  const levelsWidth = figureWidth - SvgParameter.figureSideMargin * 2;
  // 1カウント当たりの高さ
  const heightPerCount = maxLevelHeight / histo.max_count;

  histo.counts.forEach((n, i) => {
    const levelWidth = levelsWidth / histo.bins;
    const y_bottom = SvgParameter.height - SvgParameter.margin;
    const y_top = y_bottom - heightPerCount * n;
    const x_left = SvgParameter.margin + SvgParameter.figureSideMargin + levelsWidth / histo.bins * i;
    const x_right = SvgParameter.margin + SvgParameter.figureSideMargin + levelsWidth / histo.bins * (i + 1);
    svg.rect({
      x: x_left, y: y_top,
      width: x_right - x_left,
      height: y_bottom - y_top,
    });
  });

  const r = svg.render();
  fs.writeFileSync(SvgParameter.path, r);
}

try {
  main();
} catch (e) {
  console.error(e);
}
