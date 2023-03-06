import * as _ from "lodash"
import * as fs from 'fs';
import { Parser } from './libs/parse';
import { Stats } from "./libs/stats";
import { Graph } from "./libs/graph";
import { Box, FeatureStats, StudentRaw } from "./libs/definitions";
import { Geometric } from "./libs/geometric";
import { features } from "process";
import { Training } from "./libs/train";

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
  const feature_stats = float_features.map(feature => {
    return Stats.derive_feature_stats(feature, raw_students);
  });

  // [前処理:標準化]
  feature_stats.forEach(stats => Training.standardize(stats, raw_students));
  // feature_stats.forEach(stats => Training.normalize(stats, raw_students));

  /**
   * ある生徒の尤度 yi
   */
  const f_likelihood = (student: StudentRaw, features: string[], weights: number[]) => {
    const r = features.map((f, i) => weights[i] * student.scores[f]).reduce((s, n) => s + n, 0);
    return 1.0 / (1 + Math.exp(-r));
  };

  /**
   * 勾配ベクトルのある特徴量の成分のうち, ある生徒による寄与
   * (yi - ti) * xik
   */
  const f_partial_difference = (feature: string, actual: number, student: StudentRaw, likelyhood: number) => {
    const yi = likelyhood;
    const ti = actual;
    const xik = student.scores[feature];
    const v = (yi - ti) * xik;
    return v;
  }

  const f_train = (target: string, features: string[], students: StudentRaw[]) => {
    // [パラメータベクトルの初期化]
    let weights = features.map(v => (Math.random() * 2 - 1) * 10);

    // 学習率
    let learning_rate = 0.5;
    // 学習率減衰率
    const learning_rate_decay = 0.99998;
    let epoch = 0;
    // 変化量
    let d;
    while (true) {
      d = 0;
      const delta_weights = features.map(f => 0);
      students.forEach(s => {
        const likelihood = f_likelihood(s, features, weights);
        const actual = s.scores[target];
        features.forEach((f, k) => {
          const dv = f_partial_difference(f, actual, s, likelihood);
          delta_weights[k] += dv;
        });
      });
      
      delta_weights.forEach((dw, k) => {
        const v = dw / students.length;
        d += (v ** 2);
        weights[k] += -v * learning_rate;
      });
      d = Math.sqrt(d * learning_rate);
      // console.log(epoch, learning_rate, d, delta_weights);
      if (d < 0.001) {
        break;
      }
      learning_rate *= learning_rate_decay;
      epoch += 1;
    }
    console.log(target, d, epoch);
    return weights;
  }

  // 定数項の付加
  raw_students.forEach(s => s.scores["constant"] = 0.1);
  float_features.push("constant");

  const ws = _(["is_g", "is_r", "is_h", "is_s"]).keyBy(key => key).mapValues(key => f_train(key, float_features, raw_students)).value();
  _.each(ws, (weights, key) => {
    console.log(`[${key}]`);
    weights.forEach((w, i) => {
      console.log(float_features[i], w);
    })
  })
  // [評価]
  let ok = 0;
  let no = 0;
  for (let i = 0; i < raw_students.length; ++i) {
    const student = raw_students[i];
    const probabilities = _.mapValues(ws, (ws) => f_likelihood(student, float_features, ws));
    const predicted = _.maxBy(_.keys(probabilities), (key) => probabilities[key])!;
    ["is_"]
    const is_ok = (student.scores[predicted] === 1);
    if (is_ok) {
      ok += 1;
    } else {
      console.log(is_ok ? "[ok]" : "[KO]", i, student.first_name, student.last_name, student.hogwarts_house, predicted, probabilities);
      no += 1;
    }
  }
  console.log(ok / (ok + no), `= ${ok} / (${ok} + ${no})`);
}

try {
  main();
} catch (e) {
  console.error(e);
}
