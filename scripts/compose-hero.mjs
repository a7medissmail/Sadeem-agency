// One-time asset step: bake the lone-figure cut-out into the hero backgrounds
// so the character is grounded and integrated (no floating overlay).
// Re-run after tuning the params below: `node scripts/compose-hero.mjs`
import sharp from "sharp";

const FIG = "public/hero/figure-trim.webp";
const FIG_RATIO = 956 / 652; // width / height of the trimmed cut-out

// figW: figure width as fraction of bg width
// cx:   horizontal center as fraction of bg width
// baseY: where the figure's feet/rock base sits, as fraction of bg height (>1 bleeds off bottom)
const jobs = [
  { base: "public/hero/slide1-base.webp", out: "public/hero/slide1.webp", figW: 0.345, cx: 0.64, baseY: 1.015 },
  { base: "public/hero/slide3-base.webp", out: "public/hero/slide3.webp", figW: 0.32, cx: 0.66, baseY: 1.02 },
  // Final CTA closing scene — figure further right + smaller, like the reference
  { base: "public/hero/slide1-base.webp", out: "public/hero/cta-scene.webp", figW: 0.17, cx: 0.8, baseY: 1.01 },
];

for (const j of jobs) {
  const bg = sharp(j.base);
  const meta = await bg.metadata();
  const W = meta.width, H = meta.height;

  const figW = Math.round(W * j.figW);
  const figH = Math.round(figW / FIG_RATIO);
  const left = Math.round(W * j.cx - figW / 2);
  const top = Math.round(H * j.baseY - figH);

  const fig = await sharp(FIG).resize({ width: figW }).toBuffer();

  await bg
    .composite([{ input: fig, left, top, blend: "over" }])
    .webp({ quality: 78 })
    .toFile(j.out);

  console.log(`${j.out}  fig ${figW}x${figH} @ (${left},${top}) on ${W}x${H}`);
}
