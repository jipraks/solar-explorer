/* Generates the PWA icons in icons/ by drawing them on a canvas in a headless
   browser, so the artwork lives in code rather than as binary nobody can edit.
   Needs playwright and a chromium build:

       npm i playwright && npx playwright install chromium
       node tools/make-icons.mjs
*/
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const draw = `(size, maskable) => {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const S = size;

  // background: the app's night sky
  const bg = x.createRadialGradient(S*0.5, S*0.45, 0, S*0.5, S*0.5, S*0.72);
  bg.addColorStop(0, '#131a35');
  bg.addColorStop(1, '#05060f');
  x.fillStyle = bg;
  if(maskable){ x.fillRect(0, 0, S, S); }
  else {
    const r = S*0.22;                      // rounded square, like an app tile
    x.beginPath();
    x.moveTo(r, 0); x.arcTo(S, 0, S, S, r); x.arcTo(S, S, 0, S, r);
    x.arcTo(0, S, 0, 0, r); x.arcTo(0, 0, S, 0, r); x.closePath(); x.fill();
  }

  // everything inside the maskable safe zone (80% → scale artwork to 0.62)
  const k = maskable ? 0.62 : 0.86;
  x.save();
  x.translate(S/2, S/2); x.scale(k, k); x.translate(-S/2, -S/2);

  // a few stars
  x.fillStyle = 'rgba(255,255,255,.55)';
  const stars = [[.16,.2,.9],[.83,.17,.7],[.9,.62,.8],[.12,.75,.6],[.72,.87,.5],[.28,.9,.7]];
  for(const [sx, sy, a] of stars){
    x.globalAlpha = a*0.7;
    x.beginPath(); x.arc(S*sx, S*sy, S*0.011, 0, 7); x.fill();
  }
  x.globalAlpha = 1;

  // orbit ellipse, tilted
  x.save();
  x.translate(S*0.5, S*0.54); x.rotate(-0.32);
  x.strokeStyle = 'rgba(150,195,255,.5)'; x.lineWidth = S*0.017;
  x.beginPath(); x.ellipse(0, 0, S*0.38, S*0.165, 0, 0, 7); x.stroke();
  x.restore();

  // the sun
  const g = x.createRadialGradient(S*0.44, S*0.42, 0, S*0.5, S*0.5, S*0.3);
  g.addColorStop(0, '#fff6d0');
  g.addColorStop(0.42, '#ffb443');
  g.addColorStop(1, '#ff7a18');
  const glow = x.createRadialGradient(S*0.5, S*0.5, S*0.1, S*0.5, S*0.5, S*0.34);
  glow.addColorStop(0, 'rgba(255,170,60,.55)');
  glow.addColorStop(1, 'rgba(255,140,40,0)');
  x.fillStyle = glow; x.beginPath(); x.arc(S*0.5, S*0.5, S*0.34, 0, 7); x.fill();
  x.fillStyle = g;    x.beginPath(); x.arc(S*0.5, S*0.5, S*0.185, 0, 7); x.fill();

  // a planet riding the orbit
  x.save();
  x.translate(S*0.5, S*0.54); x.rotate(-0.32);
  const pg = x.createRadialGradient(-S*0.395, -S*0.02, 0, -S*0.38, 0, S*0.075);
  pg.addColorStop(0, '#a8d4ff'); pg.addColorStop(1, '#2f6fb8');
  x.fillStyle = pg; x.beginPath(); x.arc(-S*0.38, 0, S*0.062, 0, 7); x.fill();
  x.restore();

  x.restore();
  return c.toDataURL('image/png');
}`;

const b = await chromium.launch();
const p = await (await b.newContext({deviceScaleFactor:1})).newPage();
await p.goto('about:blank');
const out = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true]      // iOS masks it itself; full bleed
];
for(const [name, size, maskable] of out){
  const url = await p.evaluate(([d, s, m]) => eval(d)(s, m), [draw, size, maskable]);
  writeFileSync(new URL(`../icons/${name}`, import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', name, size);
}
await b.close();
