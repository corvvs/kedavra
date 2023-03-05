// データ型などを定義する

export type StudentRaw = {
  index: number;
  hogwarts_house: string;
  first_name: string;
  last_name: string;
  birthday: string;
  best_hand: string;
  scores: {
    [K in string]: number;
  };
}

export type FeatureStats = {
  name: string;
  // 総数
  count: number;
  // 平均値
  mean: number;
  // 標準偏差
  std: number;
  // 最小値(0パーセンタイル値)
  p0: number;
  // 25パーセンタイル値
  p25: number;
  // 50パーセンタイル値
  p50: number;
  // 75パーセンタイル値
  p75: number;
  // 最大値(100パーセンタイル値)
  p100: number;
};
