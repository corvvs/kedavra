import * as _ from "lodash"
import { sprintf } from "sprintf-js";
import { StudentRaw, FeatureStats, Histogram } from "./definitions"

// 統計量をあつかう

export namespace Stats {
  /**
   * 生徒データ`students`をもとに、特徴量`feature`の統計量を計算する.
   * @param feature 
   * @param students 
   * @returns 
   */
  export function derive_feature_stats(feature: string, students: StudentRaw[]): FeatureStats {
    let count = 0;
    let sum = 0;
    const values: number[] = [];
    students.forEach(r => {
      const val = r.scores[feature];
      if (!_.isFinite(val)) { return; }
      count += 1;
      sum += val;
      values.push(val);
    });
    const mean = sum / count;
    let sqsum = 0;
    students.forEach(r => {
      const val = r.scores[feature];
      if (!_.isFinite(val)) { return; }
      sqsum += (val - mean) ** 2;
    });
    let std = Math.sqrt(sqsum / count);
    const sorted_values = _.sortBy(values, v => v);
    const i0 = 0;
    const i25 = Math.floor(count * 0.25);
    const i50 = Math.floor(count * 0.5);
    const i75 = Math.floor(count * 0.75);
    const i100 = count - 1;
    const [p0, p25, p50, p75, p100] = [i0, i25, i50, i75, i100].map(i => sorted_values[i]);
    return {
      name: feature,
      count,
      mean,
      std,
      p0,
      p25,
      p50,
      p75,
      p100,
    };
  }

  /**
   * FeatureStats に含まれる各統計量を1行ずつにまとめて表示する.
   * @param feature_stats 
   */
  export function print_stats_for_features(feature_stats: FeatureStats[]) {
    // フィールド長の算出
    // [見出し行]
    let line = "";
    line += sprintf("%10s", "");
    feature_stats.forEach(s => {
      const w = Math.max(s.name.length, 14);
      line += sprintf(` %${w}s`, s.name);
    });
    console.log(line);

    // [統計量]
    const name_map = {
      count: "Count",
      mean: "Mean",
      std: "Std",
      p0: "Min",
      p25: "25%",
      p50: "50%",
      p75: "75%",
      p100: "Max",
    };
    (["count", "mean", "std", "p0", "p25", "p50", "p75", "p100"] as const).forEach(key => {
      const display_name = name_map[key];
      let line = "";
      line += sprintf("%-10s", display_name);
      feature_stats.forEach(s => {
        const w = Math.max(s.name.length, 14);
        line += sprintf(` %${w}.6f`, s[key]);
      })
      console.log(line);
    });
  }

  /**
   * 生徒データから, 特定の特徴量を選んで階級化する.
   * 対象の特徴量は引数`stats`で指定する.
   * @param students 生徒データ
   * @param stat 階級化する特徴量の統計データ
   * @param bins 階級数; 1以上であること. 整数でない場合は切り捨てる.
   */
  export function students_to_bins(students: StudentRaw[], stat: FeatureStats, bins: number): Histogram {
    const n_bins = Math.floor(bins);
    if (n_bins < 1) {
      throw new Error("binsが1以上ではありません");
    }
    
    const feature = stat.name;
    const [min, max] = [stat.p0, stat.p100];
    const size = max - min;
    const counts = _.range(bins).map(s => 0);
    students.forEach(s => {
      const val = s.scores[feature];
      if (!_.isFinite(val)){ return; } // おかしな値(nan, infty, null, ...)をはじく
      const i = Math.min(Math.floor((val - min) / size * bins), bins - 1);
      counts[i] += 1;
    });
    return {
      stat,
      bins,
      counts,
      max_count: Math.max(...counts),
    };
  }
};
