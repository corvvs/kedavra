import * as _ from "lodash"
import { FeatureStats, StudentRaw } from "./definitions";
import { Stats } from "./stats";

export namespace Training {

  /**
   * (破壊的変更)
   * 生徒データのうち選択した`feature`を標準化する.
   * すなわち平均0, 分散1となるように全体を線形に変換する.
   * @param feature 
   * @param students 
   */
  export function standardize(stats: FeatureStats, students: StudentRaw[]) {
    students.forEach(s => {
      const v = s.scores[stats.name];
      if (!_.isFinite(v)) { return; }
      s.scores[stats.name] = (v - stats.mean) / stats.std;
    });
  }

  /**
   * (破壊的変更)
   * データを正規化する
   * @param stats 
   * @param students 
   */
  export function normalize(stats: FeatureStats, students: StudentRaw[]) {
    const w = (stats.p100 - stats.p0);
    students.forEach(s => {
      const v = s.scores[stats.name];
      if (!_.isFinite(v)) { return; }
      s.scores[stats.name] = (v - stats.p0) / w;
    });
  }

  export function shuffle(students: StudentRaw[]) {
    for (let i = 0; i < students.length; ++i) {
      const j = Math.floor((students.length - i) * Math.random()) + i;
      [students[i], students[j]] = [students[j], students[i]];
    }
  }
}
