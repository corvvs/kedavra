// データ型などを定義する

/**
 * 生徒データ
 * Rawじゃないやつは今後登場するのだろうか・・・
 */
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

/**
 * ある特徴量に関する統計データ
 */
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

/**
 * 階級値データ
 */
export type Histogram = {
  feature: string,
  stat: FeatureStats;
  bins: number;
  counts: number[];
  max_count: number;
};

/**
 * 2次元の点
 */
export type Vector2D = {
  x: number;
  y: number;
};

/**
 * 矩形領域
 */
export type Box = {
  p1: Vector2D;
  p2: Vector2D;
};

export type Dimension = {
  width: number;
  height: number;
};

/**
 * インセット, すなわちある矩形領域の境界から内部方向への「余白」
 */
export type Inset = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type Vector2DPlus = Vector2D & {
  fill?: string;
};

export type PairedData = {
  feature_x: FeatureStats;
  feature_y: FeatureStats;
  count: number;
  pairs: Vector2DPlus[];
  box: Box;
};
