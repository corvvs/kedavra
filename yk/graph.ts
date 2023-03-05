import * as _ from "lodash"
import { Histogram, PairedData } from './definitions';
import { Geometric } from './geometric';

const SvgBuilder = require('svg-builder')

const SvgParameter = {
  path: "t.svg",
  dimension: { width: 600, height: 600 },
  wholeBox: Geometric.formBoxByDimension({ width: 600, height: 600 }),
  margin: {
    top: 50,
    bottom: 20,
    left: 100,
    right: 20,
  },
  // 縦軸詳細メモリの幅
  xFineScalerSize: 16,
  // 横軸詳細メモリの高さ
  yFineScalerSize: 8,
};

export namespace Graph {
  export function drawHistogram(histo: Histogram) {
    // [SVGを生成する]
    const svg = SvgBuilder.width(SvgParameter.dimension.width).height(SvgParameter.dimension.height);

    const figureInset = {
      top: 50,
      bottom: 20,
      left: 100,
      right: 20,
    };

    const HistogramInset = {
      top: 20,
      bottom: 0,
      left: 20,
      right: 20,
    };

    // [細かいサイズパラメータの定義]
    const figureOutBox = Geometric.formBoxByInset(SvgParameter.wholeBox, figureInset);
    const figureInBox = Geometric.formBoxByInset(figureOutBox, HistogramInset);
    const { width: figureWidth } = Geometric.formDimensionByBox(figureOutBox);
    const figureInDimension = Geometric.formDimensionByBox(figureInBox);
    // ヒストグラムの最大階級の高さ
    const maxLevelHeight = figureInDimension.height;
    // ヒストグラム部分の幅
    const levelsWidth = figureInDimension.width;
    // 1カウント当たりの高さ
    const heightPerCount = maxLevelHeight / histo.max_count;

    // [キャプション]
    {
      const x_center = figureOutBox.p1.x + figureWidth / 2;
      const y_top = figureOutBox.p1.y;
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
      const frame_x_left = figureOutBox.p1.x;
      const frame_y_top = figureOutBox.p1.y;
      const frame_x_right = figureOutBox.p2.x;
      const frame_y_bottom = figureOutBox.p2.y;
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
        const x = figureInBox.p1.x + levelsWidth / histo.bins * i;
        const y_top = figureInBox.p2.y;
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
      const x_right = figureOutBox.p1.x;
      const x_left = x_right - SvgParameter.xFineScalerSize;
      for (let i = 0; i * xScalerUnit < histo.max_count; ++i) {
        const y = figureOutBox.p2.y - i * xScalerUnit * heightPerCount;
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
        const x_dots_left = figureOutBox.p1.x;
        const x_dots_right = figureOutBox.p2.x;
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
      const y_bottom = figureOutBox.p2.y;
      const y_top = y_bottom - heightPerCount * n;
      const x_left = figureInBox.p1.x + levelsWidth / histo.bins * i;
      const x_right = figureInBox.p1.x + levelsWidth / histo.bins * (i + 1);
      svg.rect({
        x: x_left,
        y: y_top,
        width: x_right - x_left,
        height: y_bottom - y_top,
      });
    });

    return svg.render();
  }

  export function drawScatter(paired_data: PairedData) {
    // [SVGを生成する]
    const svg = SvgBuilder.width(SvgParameter.dimension.width).height(SvgParameter.dimension.height);

    const figureInset = {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    };

    const ScatterInset = {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
    };

    // [細かいサイズパラメータの定義]
    const figureOutBox = Geometric.formBoxByInset(SvgParameter.wholeBox, figureInset);
    const figureInBox = Geometric.formBoxByInset(figureOutBox, ScatterInset);
    const { width: figureWidth } = Geometric.formDimensionByBox(figureOutBox);
    const figureInDimension = Geometric.formDimensionByBox(figureInBox);

    // [枠線]
    {
      const frame_x_left = figureOutBox.p1.x;
      const frame_y_top = figureOutBox.p1.y;
      const frame_x_right = figureOutBox.p2.x;
      const frame_y_bottom = figureOutBox.p2.y;
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

    // [散布図本体]
    {
      const x_size = (paired_data.box.p2.x - paired_data.box.p1.x) / 2;
      const y_size = (paired_data.box.p2.y - paired_data.box.p1.y) / 2;
      const x_center = (paired_data.box.p2.x + paired_data.box.p1.x) / 2;
      const y_center = (paired_data.box.p2.y + paired_data.box.p1.y) / 2;
      paired_data.pairs.forEach(p => {
        svg.circle({
          r: 5,
          cx: figureInBox.p1.x + (p.x - x_center) / x_size * figureInDimension.width / 2 + figureInDimension.width / 2,
          cy: figureInBox.p1.y + (p.y - y_center) / y_size * figureInDimension.height / 2 + figureInDimension.height / 2,
          fill: "none",
          stroke: "#000",
        });
      });
    }

    return svg.render();
  }
}
