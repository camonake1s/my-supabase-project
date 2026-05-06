// Generate a polished 16:9 pitch deck PDF that matches the live site's design
// language (cream background, teal headings, orange accents, paw decorations)
// and embeds real screenshots of the deployed product. Run with:
//
//     npm run pitch-deck
//
// Output:
//     ./pitch-deck.pdf            (combined deck)
//     ./deck-assets/<n>-<slug>.pdf (one PDF per slide for re-use)
//     ./deck-assets/screenshots/  (PNGs captured from the live site)
//
// Each slide is 1920x1080 px so the PDF prints/projects cleanly at 16:9.
// The deck is generated as HTML rendered via Playwright (chromium), then merged
// with pdf-lib into the final file.

import { chromium } from 'playwright'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'node:fs/promises'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE = 'https://invisionueducationplayful-paws.vercel.app'
const OUT_DIR = path.resolve('./deck-assets')
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots')
const FINAL_PDF = path.resolve('./pitch-deck.pdf')

const W = 1920
const H = 1080

// Palette (matches src/index.css and the live site)
const C = {
  bg: '#FAF6F0',
  teal: '#1A5C52',
  tealDark: '#134a42',
  tealSoft: '#CFE3C9',
  orange: '#C8773A',
  dark: '#1f1f1f',
  muted: '#5a5a5a',
  warm: '#f4ebe0',
  cardBorder: 'rgba(26, 92, 82, 0.18)',
  green200: '#d6e8e4',
}

const HERO_IMAGE_URL =
  'https://i.pinimg.com/736x/16/bd/d9/16bdd92a5093b8166b4b31f322536220.jpg'

// ---------------------------------------------------------------------------
// SVG icon library (inline - no external requests)
// ---------------------------------------------------------------------------

const ICON = {
  paw: (color = C.teal, opacity = 1) => `
    <svg viewBox="0 0 100 100" fill="${color}" fill-opacity="${opacity}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="68" rx="22" ry="18"/>
      <ellipse cx="20" cy="44" rx="9" ry="12"/>
      <ellipse cx="38" cy="22" rx="9" ry="12"/>
      <ellipse cx="62" cy="22" rx="9" ry="12"/>
      <ellipse cx="80" cy="44" rx="9" ry="12"/>
    </svg>`,
  instagram: (color = C.dark) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="${color}" stroke="none"/>
    </svg>`,
  whatsapp: (color = C.dark) => `
    <svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.05 4.91A9.86 9.86 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01ZM12.04 20.13h-.01a8.21 8.21 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.23-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.69 8.21-8.23 8.21Zm4.51-6.16c-.25-.13-1.46-.72-1.69-.8-.23-.08-.39-.13-.56.13-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06a6.78 6.78 0 0 1-1.99-1.23 7.5 7.5 0 0 1-1.38-1.72c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42l-.48-.01c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.13 0 1.26.92 2.47 1.05 2.64.13.17 1.81 2.77 4.39 3.88.61.26 1.09.42 1.46.54.61.19 1.17.16 1.61.1.49-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.17-.48-.3Z"/>
    </svg>`,
  facebook: (color = C.dark) => `
    <svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/>
    </svg>`,
  excel: (color = C.dark) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
    </svg>`,
  phone: (color = C.dark) => `
    <svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2.3 2.3Z"/>
    </svg>`,
  database: (color = C.teal) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/>
      <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/>
    </svg>`,
  filter: (color = C.teal) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4h18l-7 9v6l-4 2v-8L3 4Z"/>
    </svg>`,
  form: (color = C.teal) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3" width="14" height="18" rx="2"/>
      <path d="M9 8h6M9 12h6M9 16h4"/>
    </svg>`,
  bell: (color = C.teal) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 5 3 9H3c0-4 3-2 3-9Z"/>
      <path d="M10 21a2 2 0 0 0 4 0"/>
    </svg>`,
  pin: (color = C.orange) => `
    <svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
    </svg>`,
  check: (color = C.teal) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12.5l5 5 9-11"/>
    </svg>`,
  x: (color = '#C62828') => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5l14 14M19 5L5 19"/>
    </svg>`,
  arrowRight: (color = C.teal) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>`,
  user: (color = C.teal) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
    </svg>`,
  admin: (color = C.orange) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
      <path d="M16 4l2 2-2 2"/>
    </svg>`,
}

// ---------------------------------------------------------------------------
// Shared HTML/CSS shell
// ---------------------------------------------------------------------------

function shell(slideBody, { hideFooter = false } = {}) {
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet"/>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; background: ${C.bg}; color: ${C.dark};
  font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
.slide { width: ${W}px; height: ${H}px; position: relative; overflow: hidden;
  padding: 80px 110px; display: flex; flex-direction: column; }
.slide.no-pad { padding: 0; }
.slide h1, .slide h2, .slide h3 { font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.05; color: ${C.dark}; }
.slide h1 { font-size: 120px; font-weight: 800; letter-spacing: -0.02em; }
.slide h2 { font-size: 72px; font-weight: 800; letter-spacing: -0.015em; }
.slide h3 { font-size: 44px; font-weight: 700; letter-spacing: -0.01em; }
.slide p, .slide li { font-size: 28px; line-height: 1.5; color: ${C.dark}; }
.eyebrow { font-size: 22px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.orange}; margin-bottom: 24px; }
.muted { color: ${C.muted}; }
.teal { color: ${C.teal}; }
.orange { color: ${C.orange}; }
.brand { color: ${C.teal}; }
.highlight { background: ${C.tealSoft}; padding: 0 12px; }
.dash { width: 56px; height: 4px; background: ${C.orange}; border-radius: 2px; margin: 24px 0 32px; }
.footer { position: absolute; left: 110px; right: 110px; bottom: 44px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 18px; color: ${C.muted}; font-weight: 500; letter-spacing: 0.05em; }
.footer .brand-mark { color: ${C.teal}; font-weight: 700; }
.paw-deco { position: absolute; opacity: 0.08; pointer-events: none; }
.icon { display: inline-block; vertical-align: middle; }
${hideFooter ? '.footer { display: none; }' : ''}
</style></head><body>${slideBody}</body></html>`
}

function footer(num, total, brand = 'PlayFul Paws') {
  return `<div class="footer">
    <div class="brand-mark">${brand}</div>
    <div>${num} / ${total}</div>
  </div>`
}

function pawDecoSet() {
  // Decorative scattered paw prints (top-right + bottom-left)
  return `
    <div class="paw-deco" style="top:60px;right:60px;width:160px;height:160px;transform:rotate(18deg)">
      ${ICON.paw(C.teal, 1)}
    </div>
    <div class="paw-deco" style="bottom:120px;left:60px;width:120px;height:120px;transform:rotate(-22deg)">
      ${ICON.paw(C.orange, 1)}
    </div>`
}

// ---------------------------------------------------------------------------
// Slide builders
// Each returns { label, html }
// ---------------------------------------------------------------------------

const TEAM = ['Balaussa Satymbek', 'Milena Gukengeimer', 'Zarina Doszhanova', 'Aruzhan Yerkinova']
const COURSE = 'Foundations of Computational Thinking · Foundation Year 2025-2026'
const TOTAL = 18

function slide01_cover() {
  const body = `
    <div class="slide" style="justify-content:center;align-items:flex-start;background:${C.bg}">
      <div class="paw-deco" style="top:-40px;right:-60px;width:520px;height:520px;transform:rotate(28deg)">${ICON.paw(C.teal, 1)}</div>
      <div class="paw-deco" style="bottom:-80px;left:-40px;width:380px;height:380px;transform:rotate(-18deg)">${ICON.paw(C.orange, 1)}</div>
      <p class="eyebrow" style="margin-bottom:32px">Final Project · Pitch Deck</p>
      <h1 style="font-size:200px;line-height:0.92"><span class="brand">PlayFul</span><br/><span style="color:${C.orange}">Paws</span></h1>
      <p style="font-size:36px;color:${C.muted};margin-top:36px;max-width:1000px">A digital home for the
        <strong style="color:${C.dark}">"Comes" Animal Shelter</strong>, Kainar village.</p>
      <div style="margin-top:auto;font-size:22px;color:${C.muted}">
        <div style="font-weight:600;color:${C.dark};font-size:24px;margin-bottom:8px">${TEAM.join(' · ')}</div>
        <div>${COURSE}</div>
      </div>
    </div>`
  return { label: '01-cover', html: shell(body, { hideFooter: true }) }
}

function slide02_hook(heroDataUri) {
  const body = `
    <div class="slide no-pad" style="position:relative">
      <img src="${heroDataUri}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%"/>
      <div style="position:absolute;inset:0;background:linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.15) 100%)"></div>
      <div style="position:relative;height:100%;padding:110px;display:flex;flex-direction:column;justify-content:center;color:white">
        <p class="eyebrow" style="color:${C.orange};margin-bottom:32px">Before we start</p>
        <h2 style="font-size:88px;color:white;max-width:1300px">
          How many of you have seen a stray animal<br/>
          on the street and <span style="background:${C.orange};color:white;padding:0 18px">wished you could help?</span>
        </h2>
        <p style="margin-top:48px;font-size:32px;color:rgba(255,255,255,0.86);max-width:1000px">
          That feeling is exactly why this project exists.
        </p>
      </div>
    </div>`
  return { label: '02-hook', html: shell(body, { hideFooter: true }) }
}

function slide03_client(heroDataUri) {
  const body = `
    <div class="slide" style="display:grid;grid-template-columns:1fr 720px;gap:80px;align-items:center;padding-top:100px">
      ${pawDecoSet()}
      <div>
        <p class="eyebrow">Our client</p>
        <h2><span class="brand">Yulia</span><br/>Snegireva</h2>
        <div class="dash"></div>
        <p style="font-size:32px;font-weight:600;color:${C.dark};margin-bottom:18px">
          Founder, "Comes" Animal Shelter
        </p>
        <p style="display:flex;align-items:center;gap:12px;font-size:26px;color:${C.muted};margin-bottom:14px">
          <span class="icon" style="width:28px;height:28px">${ICON.pin()}</span>
          Kainar village · 37 km from Almaty
        </p>
        <p style="font-size:26px;color:${C.muted}">
          17 years of rescues alongside her brother, <strong style="color:${C.dark}">Sergei Snegirev</strong>.
        </p>
        <div style="margin-top:48px;display:flex;gap:24px;flex-wrap:wrap">
          <span style="background:${C.warm};border:1px solid ${C.cardBorder};border-radius:999px;padding:14px 26px;font-size:22px;font-weight:600;color:${C.tealDark}">10+ shelters contacted</span>
          <span style="background:${C.warm};border:1px solid ${C.cardBorder};border-radius:999px;padding:14px 26px;font-size:22px;font-weight:600;color:${C.tealDark}">6 responded</span>
          <span style="background:${C.tealSoft};border:1px solid ${C.teal};border-radius:999px;padding:14px 26px;font-size:22px;font-weight:700;color:${C.tealDark}">1 chosen</span>
        </div>
      </div>
      <div style="position:relative">
        <img src="${heroDataUri}" style="width:100%;height:840px;object-fit:cover;border-radius:32px;box-shadow:0 30px 80px rgba(0,0,0,0.18)"/>
      </div>
      ${footer(3, TOTAL)}
    </div>`
  return { label: '03-client', html: shell(body) }
}

function slide04_scale() {
  const stat = (num, label, color = C.teal) => `
    <div style="background:white;border:1px solid ${C.cardBorder};border-radius:24px;padding:54px 36px;text-align:center;box-shadow:0 6px 22px rgba(0,0,0,0.04)">
      <div style="font-family:'Plus Jakarta Sans';font-size:140px;font-weight:800;color:${color};line-height:0.9;letter-spacing:-0.03em">${num}</div>
      <div style="font-size:24px;color:${C.muted};font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-top:18px">${label}</div>
    </div>`
  const body = `
    <div class="slide">
      <p class="eyebrow">Comes Shelter at a glance</p>
      <h2>The scale of one person's dedication</h2>
      <div class="dash"></div>
      <div style="margin-top:56px;display:grid;grid-template-columns:repeat(4, 1fr);gap:32px">
        ${stat('17<span style="font-size:80px">+</span>', 'Years of rescue')}
        ${stat('350', 'Dogs')}
        ${stat('40<span style="font-size:80px">+</span>', 'Cats')}
        ${stat('2', 'People running it all', C.orange)}
      </div>
      <p style="margin-top:64px;font-size:28px;color:${C.muted};max-width:1400px">
        No paid staff. No agency partnership. Just two siblings who decided that the animals nobody else
        would help still deserved a chance.
      </p>
      ${footer(4, TOTAL)}
    </div>`
  return { label: '04-scale', html: shell(body) }
}

function slide05_viktoria() {
  const body = `
    <div class="slide" style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center">
      ${pawDecoSet()}
      <div>
        <p class="eyebrow">Why this matters</p>
        <h2><span class="orange">Viktoria's</span><br/>story</h2>
        <div class="dash"></div>
        <p style="font-size:30px;line-height:1.55;color:${C.dark};max-width:760px">
          A stray cat slipped into a building hallway to escape the cold. A resident poured a powerful
          chemical solvent on her.
        </p>
        <p style="margin-top:32px;font-size:30px;line-height:1.55;color:${C.dark};max-width:760px">
          She survived only because Yulia raised emergency funds on Instagram, post by post,
          and coordinated <span class="highlight"><strong>three skin-graft surgeries</strong></span>.
        </p>
      </div>
      <div style="background:linear-gradient(165deg, ${C.warm} 0%, #ede4d8 100%);border:1px solid rgba(200,119,58,0.45);border-radius:28px;padding:64px 56px">
        <div style="display:flex;flex-direction:column;gap:36px">
          <div>
            <div style="font-size:24px;color:${C.muted};font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Critical condition</div>
            <div style="font-size:36px;font-weight:700;color:${C.dark}">Three skin-graft surgeries</div>
          </div>
          <div>
            <div style="font-size:24px;color:${C.muted};font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Funded by</div>
            <div style="font-size:36px;font-weight:700;color:${C.dark}">Instagram followers, post by post</div>
          </div>
          <div>
            <div style="font-size:24px;color:${C.muted};font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Coordinated by</div>
            <div style="font-size:36px;font-weight:700;color:${C.dark}">One person · one phone</div>
          </div>
        </div>
      </div>
      ${footer(5, TOTAL)}
    </div>`
  return { label: '05-viktoria', html: shell(body) }
}

function slide06_problem() {
  const body = `
    <div class="slide">
      <p class="eyebrow">The problem</p>
      <h2>Thousands of strays.<br/>One person's phone.</h2>
      <div class="dash"></div>
      <div style="margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:60px">
        <div style="background:white;border-left:6px solid ${C.orange};border-radius:18px;padding:48px 44px;box-shadow:0 6px 22px rgba(0,0,0,0.04)">
          <h3 style="color:${C.orange};font-size:36px;margin-bottom:20px">In Kazakhstan</h3>
          <p style="font-size:28px;line-height:1.5">
            Thousands of stray animals on the streets every year. Few official shelters.
            Limited government support. Many state shelters keep animals only <strong>5 days</strong>
            before euthanasia.
          </p>
        </div>
        <div style="background:white;border-left:6px solid ${C.teal};border-radius:18px;padding:48px 44px;box-shadow:0 6px 22px rgba(0,0,0,0.04)">
          <h3 style="color:${C.teal};font-size:36px;margin-bottom:20px">At Comes</h3>
          <p style="font-size:28px;line-height:1.5">
            <strong>5-10 rescues</strong> a month. <strong>50 adoption inquiries</strong> in March alone.
            Every message handled by Yulia herself. The system works only because of her
            extraordinary dedication - and it does not scale.
          </p>
        </div>
      </div>
      ${footer(6, TOTAL)}
    </div>`
  return { label: '06-problem', html: shell(body) }
}

function slide07_dfdOld() {
  const appCard = (icon, label, sub) => `
    <div style="display:flex;flex-direction:column;align-items:center;background:white;border:1px solid ${C.cardBorder};border-radius:18px;padding:24px 18px 20px;box-shadow:0 4px 14px rgba(0,0,0,0.05);width:200px">
      <div style="width:64px;height:64px;margin-bottom:14px">${icon}</div>
      <div style="font-size:22px;font-weight:700;color:${C.dark}">${label}</div>
      <div style="font-size:16px;color:${C.muted};text-align:center;margin-top:4px">${sub}</div>
    </div>`
  const body = `
    <div class="slide">
      <p class="eyebrow">Current method</p>
      <h2>How the shelter runs <span class="orange">today</span></h2>
      <div class="dash"></div>
      <div style="margin-top:54px;display:grid;grid-template-columns:1fr 80px 1fr;align-items:center;gap:30px">
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;justify-items:center">
          ${appCard(ICON.instagram(), 'Instagram', 'DMs + posts')}
          ${appCard(ICON.whatsapp(), 'WhatsApp #1', 'General questions')}
          ${appCard(ICON.whatsapp(), 'WhatsApp #2', 'Adoption requests')}
          ${appCard(ICON.facebook(), 'Facebook', 'Posts + comments')}
          ${appCard(ICON.excel(), 'Excel', 'Rarely updated')}
          ${appCard(ICON.phone(), 'Two phones', '24/7 on call')}
        </div>
        <div style="font-size:80px;color:${C.orange};text-align:center">→</div>
        <div style="background:${C.warm};border:2px solid ${C.orange};border-radius:24px;padding:48px 36px;text-align:center">
          <div style="width:120px;height:120px;margin:0 auto 20px">${ICON.paw(C.orange)}</div>
          <h3 style="color:${C.dark};font-size:38px">Yulia's memory</h3>
          <p style="margin-top:14px;font-size:24px;color:${C.muted};line-height:1.5">
            One person. <br/><strong style="color:${C.orange}">24/7</strong> social media.<br/>
            No database. No filters.<br/>No application form.
          </p>
        </div>
      </div>
      ${footer(7, TOTAL)}
    </div>`
  return { label: '07-dfd-old', html: shell(body) }
}

function slide08_requirements() {
  const tile = (icon, title, body) => `
    <div style="background:white;border:1px solid ${C.cardBorder};border-radius:24px;padding:44px 38px;box-shadow:0 6px 22px rgba(0,0,0,0.04)">
      <div style="width:80px;height:80px;margin-bottom:24px">${icon}</div>
      <h3 style="font-size:32px;color:${C.teal};margin-bottom:14px">${title}</h3>
      <p style="font-size:22px;line-height:1.5;color:${C.muted}">${body}</p>
    </div>`
  const body = `
    <div class="slide">
      <p class="eyebrow">Investigation → Requirements</p>
      <h2>What we needed to build</h2>
      <div class="dash"></div>
      <div style="margin-top:48px;display:grid;grid-template-columns:repeat(4, 1fr);gap:28px">
        ${tile(ICON.database(), 'Animal database', 'Searchable profiles with photos, status, and availability - visible 24/7 without messaging Yulia.')}
        ${tile(ICON.filter(), 'Filters', 'Adopters narrow by type and status on their own, cutting dozens of back-and-forth messages.')}
        ${tile(ICON.form(), 'Adoption form', 'Every request structured, saved, and trackable - replaces lost WhatsApp DMs.')}
        ${tile(ICON.bell(C.orange), 'Admin dashboard', 'One place for the admin to see every application instead of three messaging apps.')}
      </div>
      ${footer(8, TOTAL)}
    </div>`
  return { label: '08-requirements', html: shell(body) }
}

function slide09_dfdNew() {
  const proc = (num, title, sub, color = C.teal) => `
    <div style="background:white;border:2px solid ${color};border-radius:20px;padding:28px 24px;text-align:center;width:300px">
      <div style="font-family:'Plus Jakarta Sans';font-size:44px;font-weight:800;color:${color};line-height:1">${num}</div>
      <div style="font-size:24px;font-weight:700;margin-top:10px">${title}</div>
      <div style="font-size:18px;color:${C.muted};margin-top:6px">${sub}</div>
    </div>`
  const dataStore = (title, sub) => `
    <div style="display:flex;align-items:center;gap:18px;background:${C.warm};border-radius:14px;padding:18px 24px">
      <div style="width:36px;height:36px;flex-shrink:0">${ICON.database(C.tealDark)}</div>
      <div>
        <div style="font-size:22px;font-weight:700;color:${C.dark}">${title}</div>
        <div style="font-size:18px;color:${C.muted}">${sub}</div>
      </div>
    </div>`
  const body = `
    <div class="slide">
      <p class="eyebrow">New method · Data flow</p>
      <h2>One platform. Clean roles.</h2>
      <div class="dash"></div>
      <div style="margin-top:42px;display:flex;align-items:center;justify-content:space-between;gap:24px">
        <div style="background:${C.tealSoft};border:2px dashed ${C.teal};border-radius:20px;padding:36px 30px;text-align:center;width:240px">
          <div style="width:64px;height:64px;margin:0 auto 14px">${ICON.user()}</div>
          <div style="font-size:26px;font-weight:700;color:${C.tealDark}">User</div>
          <div style="font-size:18px;color:${C.muted};margin-top:4px">Adopter</div>
        </div>
        <div style="font-size:54px;color:${C.teal}">→</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
          ${proc('1.0', 'Browse & view', 'Shelter info + rescue stories')}
          ${proc('2.0', 'Filter animals', 'By type, age, status')}
          ${proc('3.0', 'View profile', 'Photos, health, story')}
          ${proc('4.0', 'Submit application', 'Triggers admin alert', C.orange)}
        </div>
        <div style="font-size:54px;color:${C.orange}">→</div>
        <div style="background:#fff3e0;border:2px dashed ${C.orange};border-radius:20px;padding:36px 30px;text-align:center;width:240px">
          <div style="width:64px;height:64px;margin:0 auto 14px">${ICON.admin()}</div>
          <div style="font-size:26px;font-weight:700;color:${C.orange}">Admin</div>
          <div style="font-size:18px;color:${C.muted};margin-top:4px">Yulia · Shelter</div>
        </div>
      </div>
      <div style="margin-top:46px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
        ${dataStore('D1 · Animals DB', 'Profiles, status, photos')}
        ${dataStore('D2 · Applications DB', 'Every adoption request')}
        ${dataStore('D3 · Shelter Info DB', 'Static content, stories')}
      </div>
      ${footer(9, TOTAL)}
    </div>`
  return { label: '09-dfd-new', html: shell(body) }
}

function featureSlide(num, label, eyebrow, title, blurb, screenshotDataUri, slug) {
  const body = `
    <div class="slide" style="display:grid;grid-template-columns:560px 1fr;gap:64px;align-items:center">
      ${pawDecoSet()}
      <div>
        <p class="eyebrow">MVP · Feature ${num}</p>
        <h2 style="font-size:64px">${title}</h2>
        <div class="dash"></div>
        <p style="font-size:26px;line-height:1.55;color:${C.dark}">${blurb}</p>
        <p style="font-size:20px;color:${C.muted};margin-top:32px">${eyebrow}</p>
      </div>
      <div style="border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.18);border:1px solid ${C.cardBorder};background:white;height:840px;display:flex;align-items:flex-start;justify-content:center">
        <img src="${screenshotDataUri}" style="width:100%;height:100%;object-fit:cover;object-position:top"/>
      </div>
      ${footer(label, TOTAL)}
    </div>`
  return { label: slug, html: shell(body) }
}

function slide14_testingR1() {
  const tester = (name, role, color, issue) => `
    <div style="background:white;border-radius:18px;border:1px solid ${C.cardBorder};padding:32px 28px;box-shadow:0 6px 22px rgba(0,0,0,0.05);display:flex;flex-direction:column;align-items:center;text-align:center">
      <div style="width:96px;height:96px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:700;font-family:'Plus Jakarta Sans'">${name[0]}</div>
      <div style="font-size:28px;font-weight:700;margin-top:18px">${name}</div>
      <div style="font-size:18px;color:${C.muted};margin-bottom:18px">${role}</div>
      <div style="display:flex;align-items:center;gap:10px;background:#FFEBEE;color:#C62828;padding:10px 18px;border-radius:999px;font-size:18px;font-weight:600">
        <span style="width:18px;height:18px">${ICON.x()}</span> ${issue}
      </div>
    </div>`
  const body = `
    <div class="slide">
      <p class="eyebrow">Testing · Round 1</p>
      <h2>Three students. <span class="orange">Three real problems.</span></h2>
      <div class="dash"></div>
      <div style="margin-top:46px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
        ${tester('Aidar', 'Student', C.teal, 'Unclear what site is')}
        ${tester('Amira', 'Student', C.orange, 'Form did not submit')}
        ${tester('Ayaulim', 'Student', C.teal, 'No success message')}
      </div>
      <p style="margin-top:48px;font-size:26px;color:${C.muted};text-align:center">
        Observed in a quiet room. Tasks TC-01 to TC-05. <strong style="color:${C.dark}">3 / 3 failed TC-03</strong> (adoption form).
      </p>
      ${footer(14, TOTAL)}
    </div>`
  return { label: '14-testing-r1', html: shell(body) }
}

function slide15_testingR2() {
  const tester = (name, role, color, win) => `
    <div style="background:white;border-radius:18px;border:1px solid ${C.cardBorder};padding:32px 28px;box-shadow:0 6px 22px rgba(0,0,0,0.05);display:flex;flex-direction:column;align-items:center;text-align:center">
      <div style="width:96px;height:96px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:700;font-family:'Plus Jakarta Sans'">${name[0]}</div>
      <div style="font-size:28px;font-weight:700;margin-top:18px">${name}</div>
      <div style="font-size:18px;color:${C.muted};margin-bottom:18px">${role}</div>
      <div style="display:flex;align-items:center;gap:10px;background:#E8F5E9;color:#2E7D32;padding:10px 18px;border-radius:999px;font-size:18px;font-weight:600">
        <span style="width:18px;height:18px">${ICON.check('#2E7D32')}</span> ${win}
      </div>
    </div>`
  const body = `
    <div class="slide">
      <p class="eyebrow">Testing · Round 2</p>
      <h2>Fixed. New people. <span class="teal">100% pass.</span></h2>
      <div class="dash"></div>
      <div style="margin-top:46px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
        ${tester('Rasul', 'Student', C.teal, 'Liked multi-page flow')}
        ${tester('Niyaz', 'CRE engineer', C.orange, 'Suggested CTA placement')}
        ${tester('Nurdaulet', 'Math teacher', C.teal, 'Cards intuitive')}
      </div>
      <p style="margin-top:48px;font-size:26px;color:${C.muted};text-align:center">
        Two-round testing with different user groups → fresh, honest perspectives → real product, not internal checks.
      </p>
      ${footer(15, TOTAL)}
    </div>`
  return { label: '15-testing-r2', html: shell(body) }
}

function slide16_future() {
  const card = (title, body, color) => `
    <div style="background:white;border-top:6px solid ${color};border-radius:18px;padding:42px 36px;box-shadow:0 6px 22px rgba(0,0,0,0.05)">
      <h3 style="font-size:32px;color:${color};margin-bottom:18px">${title}</h3>
      <p style="font-size:24px;line-height:1.55;color:${C.dark}">${body}</p>
    </div>`
  const body = `
    <div class="slide">
      <p class="eyebrow">Evaluation & future work</p>
      <h2>What's done. What's next.</h2>
      <div class="dash"></div>
      <div style="margin-top:54px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
        ${card('What works', 'Live site on Vercel + Supabase. Catalog, profiles, adoption form, donations. Two rounds of user testing passed.', C.teal)}
        ${card('Honest limits', 'Animal data must be entered manually. No multilingual support yet. No native admin dashboard - admin uses Supabase directly.', C.muted)}
        ${card('Next steps', 'Build a dedicated admin dashboard. Add Russian + Kazakh language toggles. Connect Instagram bio link to drive traffic.', C.orange)}
      </div>
      ${footer(16, TOTAL)}
    </div>`
  return { label: '16-future', html: shell(body) }
}

function slide17_cta(qrDataUri) {
  const body = `
    <div class="slide" style="background:linear-gradient(135deg, ${C.bg} 0%, ${C.green200} 100%);display:grid;grid-template-columns:1fr 720px;gap:80px;align-items:center">
      <div>
        <p class="eyebrow">Try it live</p>
        <h2 style="font-size:88px">Scan, browse,<br/><span class="orange">adopt or donate.</span></h2>
        <div class="dash"></div>
        <p style="font-size:30px;line-height:1.5;color:${C.dark};margin-bottom:24px">
          Every contribution goes directly to the "Comes" Public Foundation.
          100% of donations reach animals in need - no intermediaries.
        </p>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:36px">
          <div style="display:flex;align-items:center;gap:18px">
            <div style="width:40px;height:40px">${ICON.instagram(C.tealDark)}</div>
            <span style="font-size:26px;font-weight:600">@comes.kz.almaty</span>
          </div>
          <div style="display:flex;align-items:center;gap:18px">
            <div style="width:40px;height:40px">${ICON.whatsapp(C.tealDark)}</div>
            <span style="font-size:26px;font-weight:600">+7 701 723 01 04</span>
          </div>
          <div style="display:flex;align-items:center;gap:18px">
            <div style="width:40px;height:40px">${ICON.pin(C.orange)}</div>
            <span style="font-size:26px;font-weight:600">invisionueducationplayful-paws.vercel.app</span>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:24px">
        <div style="background:white;padding:36px;border-radius:32px;box-shadow:0 24px 60px rgba(0,0,0,0.18);border:4px solid ${C.teal}">
          <img src="${qrDataUri}" style="display:block;width:520px;height:520px"/>
        </div>
        <div style="font-size:24px;color:${C.tealDark};font-weight:600">Scan with your phone camera</div>
      </div>
      ${footer(17, TOTAL)}
    </div>`
  return { label: '17-cta', html: shell(body) }
}

function slide18_thanks() {
  const body = `
    <div class="slide" style="justify-content:center;align-items:center;text-align:center;background:${C.bg}">
      <div class="paw-deco" style="top:60px;left:80px;width:240px;height:240px;transform:rotate(-22deg)">${ICON.paw(C.teal, 1)}</div>
      <div class="paw-deco" style="bottom:80px;right:80px;width:200px;height:200px;transform:rotate(28deg)">${ICON.paw(C.orange, 1)}</div>
      <p class="eyebrow" style="margin-bottom:32px">Thank you</p>
      <h1 style="font-size:160px"><span class="brand">PlayFul</span> <span class="orange">Paws</span></h1>
      <p style="margin-top:48px;font-size:32px;color:${C.muted};max-width:1100px">
        A digital home for the animals nobody else would help.
      </p>
      <div style="margin-top:auto;font-size:22px;color:${C.muted}">
        <div style="font-weight:700;color:${C.dark};font-size:26px;margin-bottom:8px">${TEAM.join(' · ')}</div>
        <div>${COURSE}</div>
      </div>
    </div>`
  return { label: '18-thanks', html: shell(body, { hideFooter: true }) }
}

// ---------------------------------------------------------------------------
// Live screenshot capture
// ---------------------------------------------------------------------------

async function fetchAsDataUri(context, url) {
  // Use Playwright's request to fetch the URL bytes (so we can embed them).
  const response = await context.request.get(url)
  const buf = await response.body()
  const ct = response.headers()['content-type'] || 'image/jpeg'
  return `data:${ct};base64,${buf.toString('base64')}`
}

async function captureScreenshots(context) {
  await fs.mkdir(SHOTS_DIR, { recursive: true })

  const shots = {}

  // Hero image: download once and reuse for slides 2 & 3
  console.log('  fetching hero image...')
  shots.hero = await fetchAsDataUri(context, HERO_IMAGE_URL)

  async function capture(routePath, selector, fileName) {
    const page = await context.newPage()
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(BASE + routePath, { waitUntil: 'domcontentloaded' })
    if (selector) {
      try {
        await page.waitForSelector(selector, { timeout: 12000 })
      } catch {
        /* fall through to full screenshot */
      }
    }
    await page.waitForTimeout(2000)
    const filePath = path.join(SHOTS_DIR, fileName)
    await page.screenshot({ path: filePath, fullPage: true })
    await page.close()
    const buf = await fs.readFile(filePath)
    return `data:image/png;base64,${buf.toString('base64')}`
  }

  console.log('  shooting /animals (catalog)...')
  shots.catalog = await capture('/animals', 'div[role="button"]', 'animals.png')

  // Discover an animal id via /animals to use for the profile + apply screenshots
  let animalId = null
  try {
    const probe = await context.newPage()
    await probe.goto(BASE + '/animals', { waitUntil: 'domcontentloaded' })
    await probe.waitForSelector('div[role="button"]', { timeout: 12000 })
    await probe.locator('div[role="button"]').first().click()
    await probe.waitForURL(/\/animal\/.+/, { timeout: 8000 })
    animalId = new URL(probe.url()).pathname.split('/').pop()
    await probe.close()
  } catch {
    /* leave null */
  }

  if (animalId) {
    console.log(`  shooting /animal/${animalId} (profile)...`)
    shots.profile = await capture(`/animal/${animalId}`, 'h1', 'profile.png')
    console.log(`  shooting /apply/${animalId} (form)...`)
    shots.apply = await capture(`/apply/${animalId}`, 'form, h1', 'apply.png')
  } else {
    console.log('  could not discover animal id; reusing catalog shot for profile/apply slides')
    shots.profile = shots.catalog
    shots.apply = shots.catalog
  }

  console.log('  shooting / (donation block)...')
  shots.donate = await capture('/', '.charity-strip', 'donate.png')

  return shots
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function renderSlide(context, html, label) {
  const page = await context.newPage()
  await page.setViewportSize({ width: W, height: H })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  const buf = await page.pdf({
    width: `${W}px`,
    height: `${H}px`,
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    pageRanges: '1',
  })
  await fs.writeFile(path.join(OUT_DIR, `${label}.pdf`), buf)
  await page.close()
  return buf
}

async function main() {
  const startedAt = Date.now()
  await fs.mkdir(OUT_DIR, { recursive: true })

  console.log('\nLaunching headless Chromium...')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
  })

  console.log('\nCapturing assets from live site:')
  const shots = await captureScreenshots(context)

  console.log('\nGenerating QR code...')
  const qrDataUri = await QRCode.toDataURL(BASE, {
    width: 1040,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: C.tealDark, light: '#FFFFFF' },
  })

  console.log('\nBuilding slides...')
  const slides = [
    slide01_cover(),
    slide02_hook(shots.hero),
    slide03_client(shots.hero),
    slide04_scale(),
    slide05_viktoria(),
    slide06_problem(),
    slide07_dfdOld(),
    slide08_requirements(),
    slide09_dfdNew(),
    featureSlide(
      1, 10,
      'Browse the live catalog at /animals.',
      'Animal catalog<br/>+ filters',
      'Every animal as a card with photo, name, and status. Filter by Dogs, Cats, or Everything - no more scrolling Instagram to find who is available.',
      shots.catalog,
      '10-mvp-catalog',
    ),
    featureSlide(
      2, 11,
      'Tap a card to open the full profile page.',
      'Profile pages<br/>with stories',
      'Each animal gets a full profile: photo, age, status tags, character description, and a question box that goes straight to the shelter team.',
      shots.profile,
      '11-mvp-profile',
    ),
    featureSlide(
      3, 12,
      'Adoption form replaces WhatsApp DMs.',
      'Structured<br/>adoption form',
      'Name, phone, email, living environment - validated and saved to Supabase. Every request is trackable. No more lost messages.',
      shots.apply,
      '12-mvp-apply',
    ),
    featureSlide(
      4, 13,
      'Multiple payment paths · 100% to the foundation.',
      'Donations,<br/>transparent.',
      'QR code linked to the official "Comes" Public Foundation. Five payment methods (Kaspi, Freedom, Forte, VTB, PayPal) with one-tap copy. No intermediaries.',
      shots.donate,
      '13-mvp-donate',
    ),
    slide14_testingR1(),
    slide15_testingR2(),
    slide16_future(),
    slide17_cta(qrDataUri),
    slide18_thanks(),
  ]

  console.log(`\nRendering ${slides.length} slides:`)
  const merged = await PDFDocument.create()
  for (const s of slides) {
    process.stdout.write(`  -> ${s.label.padEnd(22, ' ')}`)
    const buf = await renderSlide(context, s.html, s.label)
    const sub = await PDFDocument.load(buf)
    const pages = await merged.copyPages(sub, sub.getPageIndices())
    pages.forEach(p => merged.addPage(p))
    process.stdout.write(` (${(buf.length / 1024).toFixed(0)} KB)\n`)
  }

  merged.setTitle('PlayFul Paws - Pitch Deck')
  merged.setAuthor('PlayFul Paws team')
  merged.setSubject('Final project pitch for Comes Animal Shelter')
  merged.setProducer('Playwright + pdf-lib')

  const finalBytes = await merged.save()
  await fs.writeFile(FINAL_PDF, finalBytes)
  await browser.close()

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`\nDone in ${elapsed}s`)
  console.log(`  Combined: ${FINAL_PDF}`)
  console.log(`  Per-slide: ${OUT_DIR}\\`)
}

main().catch(err => {
  console.error('\nDeck build failed:', err)
  process.exit(1)
})
