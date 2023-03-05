import * as _ from "lodash"
import * as fs from 'fs';
const SvgBuilder = require('svg-builder')

/**
 * 便宜上のメイン関数
 * @returns 
 */
function main() {
  const svg = SvgBuilder.width(600).height(600);
  svg.line({
    x1:0,
    y1:0,
    x2:125,
    y2:125,
    stroke:'#FF0000',
    'stroke-width': 10
  }).line({
      x1:0,
      y1:125,
      x2:125,
      y2:0,
      stroke:'#FF0000',
      'stroke-width': 10
  }).render();
  const r = svg.render();
  fs.writeFileSync("t.svg", r);
}

try {
  main();
} catch (e) {
  console.error(e);
}
