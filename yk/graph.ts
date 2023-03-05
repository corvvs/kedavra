import * as _ from "lodash"
import { Histogram } from './definitions';
const SvgBuilder = require('svg-builder')

const SvgParameter = {
  path: "t.svg",
  // 全体幅
  width: 600,
  // 全体高さ
  height: 600,
  // 全体マージン
  margin: 20,
  // 全体上マージン
  topMargin: 50,
  // 全体左マージン
  leftMargin: 100,
  // ヒストグラムの上マージン
  figureTopMargin: 20,
  // ヒストグラムの横マージン
  figureSideMargin: 20,
  // 縦軸詳細メモリの幅
  xFineScalerSize: 16,
  // 横軸詳細メモリの高さ
  yFineScalerSize: 8,
};

export namespace Graph {
  export function drawHistogram(histo: Histogram) {
    // [SVGを生成する]
    const svg = SvgBuilder.width(SvgParameter.width).height(SvgParameter.height);


    // [細かいサイズパラメータの定義]
    // 図の左端
    const xLeftFigure = SvgParameter.leftMargin;
    // 図の右端
    const xRightFigure = SvgParameter.width - SvgParameter.margin;
    // 図の上端
    const yTopFigure = SvgParameter.topMargin;
    // 図の下端
    const yBottomFigure = SvgParameter.height - SvgParameter.margin;
    // 図の幅
    const figureWidth = xRightFigure - xLeftFigure;
    // 図の高さ
    const figureHeight = yBottomFigure - yTopFigure;
    // ヒストグラムの最大階級の高さ
    const maxLevelHeight = figureHeight - SvgParameter.figureTopMargin;
    // ヒストグラム部分の幅
    const levelsWidth = figureWidth - SvgParameter.figureSideMargin * 2;
    // 1カウント当たりの高さ
    const heightPerCount = maxLevelHeight / histo.max_count;

    // [キャプション]
    {
      const x_center = xLeftFigure + figureWidth / 2;
      const y_top = yTopFigure;
      svg.text({
        x: x_center,
        y: y_top,
        "font-size": 20,
        "text-anchor": "middle",
        dy: -20,
      }, histo.feature);
    }

    // [枠線]
    {
      const frame_x_left = xLeftFigure;
      const frame_y_top = yTopFigure;
      const frame_x_right = xRightFigure;
      const frame_y_bottom = yBottomFigure;
      svg.rect({
        x: frame_x_left,
        y: frame_y_top,
        width: frame_x_right - frame_x_left,
        height: frame_y_bottom - frame_y_top,
        stroke: "#000",
        stroke_width: "2",
        fill: "none",
      });
    }

    // [目盛: 横軸]
    {
      _.range(histo.bins + 1).forEach(i => {
        const x = xLeftFigure + SvgParameter.figureSideMargin + levelsWidth / histo.bins * i;
        const y_top = yBottomFigure;
        const y_bottom = y_top + SvgParameter.yFineScalerSize;
        svg.line({
          x1: x,
          y1: y_top,
          x2: x,
          y2: y_bottom,
          stroke: "#000",
          stroke_width: "1",
          fill: "none",
        });
      });
    }

    // [目盛: 縦軸]
    {
      const xScalerUnit = 25;
      const x_right = xLeftFigure;
      const x_left = x_right - SvgParameter.xFineScalerSize;
      for (let i = 0; i * xScalerUnit < histo.max_count; ++i) {
        const y = SvgParameter.height - SvgParameter.margin - i * xScalerUnit * heightPerCount;
        // 細かい目盛
        svg.line({
          x1: x_left,
          y1: y,
          x2: x_right,
          y2: y,
          stroke: "#000",
          stroke_width: "1",
          fill: "none",
        });
        // ラベル
        const x_text_right = x_left - 5;
        svg.text({
          x: x_text_right,
          y: y,
          "font-size": 16,
          "text-anchor": "end",
          dy: 6,
        }, `${i * xScalerUnit}`);
        // 点線
        const x_dots_left = xLeftFigure;
        const x_dots_right = xRightFigure;
        svg.line({
          x1: x_dots_left,
          y1: y,
          x2: x_dots_right,
          y2: y,
          stroke: "#000",
          stroke_width: "1",
          fill: "none",
          "stroke-dasharray": [5,2],
        });
      }
    }

    // [ヒストグラム本体]
    histo.counts.forEach((n, i) => {
      const y_bottom = yBottomFigure;
      const y_top = y_bottom - heightPerCount * n;
      const x_left = xLeftFigure + SvgParameter.figureSideMargin + levelsWidth / histo.bins * i;
      const x_right = xLeftFigure + SvgParameter.figureSideMargin + levelsWidth / histo.bins * (i + 1);
      svg.rect({
        x: x_left,
        y: y_top,
        width: x_right - x_left,
        height: y_bottom - y_top,
      });
    });

    return svg.render();
  }
}
