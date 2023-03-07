import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { Graph } from "./libs/graph";
import { Box } from "./libs/definitions";
import { Geometric } from "./libs/geometric";
import { Preprocessor, Trainer, Validator } from "./libs/train";
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
  float_features.push("is_left");

  // [統計データの計算]
  const feature_stats_0 = float_features.map(feature => {
    return Stats.derive_feature_stats(feature, raw_students);
  });

  // [欠損データの補完]
  for (let i = 0; i < raw_students.length; ++i) {
    const student = raw_students[i];
    feature_stats_0.forEach(stats => {
      const v = student.scores[stats.name];
      if (!_.isFinite(v)) {
        student.scores[stats.name] = stats.p50;
      }
    })
  }

    // [統計データの再計算]
  // 標準化するとデータが変更されるので, 復元用にとっておく
  const feature_stats = float_features.map(feature => Stats.derive_feature_stats(feature, raw_students));

  // [前処理:標準化]
  feature_stats.forEach(stats => Preprocessor.standardize(stats, raw_students));
  // feature_stats.forEach(stats => Training.normalize(stats, raw_students));


  // [定数項の付加]
  raw_students.forEach(s => s.scores["constant"] = 0.1);
  float_features.push("constant");

  // [学習]
  const house_key = ["is_g", "is_r", "is_h", "is_s"];
  const ws = _(house_key).keyBy(key => key).mapValues(key => {
    const t0 = Date.now();
    const ws = Trainer.gradient_descent(key, float_features, raw_students);
    const t1 = Date.now();
    console.log(`${key}: ${t1 - t0}ms`);
    return ws;
  }).value();
  _.each(ws, (weights, key) => {
    console.log(`[${key}]`);
    weights.forEach((w, i) => {
      console.log(float_features[i], w);
    })
  });

  // [評価]
  {
    const { ok, no } = Validator.validate_weights(ws, float_features, raw_students);
    console.log(ok / (ok + no), `= ${ok} / (${ok} + ${no})`);
  }

  // [外したデータをでっかくしてペアプロット]
  {
    house_key.forEach(key => float_features.push(`predicted_${key}`));
    const sorted_students = _.sortBy(raw_students, s => s.corrected ? 0 : 1);
    const out_features = float_features.filter(f => f !== "constant");
    const out_stats = out_features.map(feature => Stats.derive_feature_stats(feature, sorted_students));
    const width = 600;
    const height = 600;
    const box: Box = {
      p1: { x: 0, y: 0 },
      p2: { x: width * out_features.length, y: height * out_features.length },
    };
    const dimension = Geometric.formDimensionByBox(box);
    const svg = SvgBuilder.width(dimension.width).height(dimension.height);  

    // [SVGの作成]
    Graph.drawPairPlot(svg, { width, height }, sorted_students, out_stats);
    const pair_plot_svg = svg.render();

    const out_path = `training.svg`;
    fs.writeFileSync(out_path, pair_plot_svg);
  }
}

try {
  main();
} catch (e) {
  console.error(e);
}
