## DSLR

### 必要なもの

- nodejs
- npm
- SVG画像を表示できるもの
  - 普通のWebブラウザは表示できる

### 操作

`make`コマンドは, `npm`を使って必要な依存関係をインストールし, すべてのコードをトランスパイルする.

- `node describe.js [データファイル]`
  - データファイルを読み込み, 各特徴量の統計情報を表示する.
- `node histogram.js [データファイル] [特徴量名]`
  - データファイルを読み込み, 指定した特徴量についてヒストグラムを作成する.
- `node scatter.js [データファイル] [特徴量名X] [特徴量名Y]`
  - データファイルを読み込み, 指定した2つの特徴量について散布図を作成する.
- `node pair_plot.js [データファイル]`
  - データファイルを読み込み, ペアプロットを作成する.
- `node logreg_train.js [データファイル]`
  - データファイルを読み込み, 所属寮を予測するためのパラメータをロジスティック回帰で推定する.
- `node logreg_predict.js [テストファイル]`
  - **`logreg_train`が出力したパラメータファイルが必要**
  - パラメータファイルとテストファイルを読み込み, パラメータファイルを使ってテストファイル内の各生徒の所属寮を推定する.

