// Build a real .pptx (PowerPoint / Google Slides compatible) of the pitch deck.
// Run with:  npm run pitch-deck-pptx
//
// Output:
//   ./pitch-deck.pptx                   - the deck (open in PowerPoint or upload to Slides)
//   ./deck-assets-pptx/assets/...       - the rendered illustrations + screenshots used
//
// Design philosophy: keep the 18-slide structure of the PDF deck but use
// minimal, scannable text per slide ("one idea per slide"), matching the
// example logic in PlayFul Paws.pptx (labels and phrases, not paragraphs).

import pptxgen from 'pptxgenjs'
import { chromium } from 'playwright'
import QRCode from 'qrcode'
import fs from 'node:fs/promises'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE = 'https://invisionueducationplayful-paws.vercel.app'
const OUT_DIR = path.resolve('./deck-assets-pptx')
const ASSETS_DIR = path.join(OUT_DIR, 'assets')
const SHOTS_DIR = path.join(ASSETS_DIR, 'screenshots')
const ILLUS_DIR = path.join(ASSETS_DIR, 'illustrations')
const FINAL_PPTX = path.resolve('./pitch-deck.pptx')

// Palette (no leading # for pptxgenjs)
const C = {
  bg: 'FAF6F0',
  teal: '1A5C52',
  tealDark: '134A42',
  tealSoft: 'CFE3C9',
  orange: 'C8773A',
  orangeSoft: 'F4DCC4',
  dark: '1F1F1F',
  muted: '5A5A5A',
  warm: 'F4EBE0',
  green200: 'D6E8E4',
  white: 'FFFFFF',
  red: 'C62828',
  redSoft: 'FFEBEE',
  green: '2E7D32',
  greenSoft: 'E8F5E9',
}

const FONT = 'Inter'
const FONT_DISPLAY = 'Plus Jakarta Sans'

// 16:9 widescreen layout: 13.333 × 7.5 inches
const W = 13.333
const H = 7.5

// ---------------------------------------------------------------------------
// SVG illustrations (rendered to PNG once via Playwright)
// ---------------------------------------------------------------------------

const SVG = {
  pawTeal: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#1A5C52">
    <ellipse cx="50" cy="68" rx="22" ry="18"/>
    <ellipse cx="20" cy="44" rx="9" ry="12"/>
    <ellipse cx="38" cy="22" rx="9" ry="12"/>
    <ellipse cx="62" cy="22" rx="9" ry="12"/>
    <ellipse cx="80" cy="44" rx="9" ry="12"/>
  </svg>`,
  pawOrange: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#C8773A">
    <ellipse cx="50" cy="68" rx="22" ry="18"/>
    <ellipse cx="20" cy="44" rx="9" ry="12"/>
    <ellipse cx="38" cy="22" rx="9" ry="12"/>
    <ellipse cx="62" cy="22" rx="9" ry="12"/>
    <ellipse cx="80" cy="44" rx="9" ry="12"/>
  </svg>`,
  cat: `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
    <!-- ears -->
    <path d="M62 92 L78 32 L106 86 Z" fill="#1A5C52"/>
    <path d="M178 92 L162 32 L134 86 Z" fill="#1A5C52"/>
    <path d="M76 80 L82 50 L94 78 Z" fill="#C8773A"/>
    <path d="M164 80 L158 50 L146 78 Z" fill="#C8773A"/>
    <!-- head -->
    <ellipse cx="120" cy="130" rx="68" ry="62" fill="#1A5C52"/>
    <!-- cheeks -->
    <ellipse cx="92" cy="156" rx="14" ry="10" fill="#134A42" opacity="0.5"/>
    <ellipse cx="148" cy="156" rx="14" ry="10" fill="#134A42" opacity="0.5"/>
    <!-- eyes -->
    <ellipse cx="98" cy="125" rx="9" ry="14" fill="#FAF6F0"/>
    <ellipse cx="142" cy="125" rx="9" ry="14" fill="#FAF6F0"/>
    <ellipse cx="98" cy="129" rx="4.5" ry="9" fill="#1F1F1F"/>
    <ellipse cx="142" cy="129" rx="4.5" ry="9" fill="#1F1F1F"/>
    <circle cx="100" cy="124" r="2" fill="#FAF6F0"/>
    <circle cx="144" cy="124" r="2" fill="#FAF6F0"/>
    <!-- nose -->
    <path d="M114 152 L126 152 L120 162 Z" fill="#C8773A"/>
    <!-- mouth -->
    <path d="M120 162 Q113 170 106 167" stroke="#FAF6F0" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M120 162 Q127 170 134 167" stroke="#FAF6F0" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- whiskers -->
    <line x1="58" y1="148" x2="86" y2="152" stroke="#FAF6F0" stroke-width="2" stroke-linecap="round"/>
    <line x1="58" y1="160" x2="86" y2="160" stroke="#FAF6F0" stroke-width="2" stroke-linecap="round"/>
    <line x1="182" y1="148" x2="154" y2="152" stroke="#FAF6F0" stroke-width="2" stroke-linecap="round"/>
    <line x1="182" y1="160" x2="154" y2="160" stroke="#FAF6F0" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  dog: `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
    <!-- floppy ears (behind head) -->
    <ellipse cx="55" cy="105" rx="26" ry="50" fill="#A65A20" transform="rotate(-12 55 105)"/>
    <ellipse cx="185" cy="105" rx="26" ry="50" fill="#A65A20" transform="rotate(12 185 105)"/>
    <!-- head -->
    <ellipse cx="120" cy="125" rx="72" ry="65" fill="#C8773A"/>
    <!-- snout -->
    <ellipse cx="120" cy="160" rx="42" ry="34" fill="#F4EBE0"/>
    <!-- spots -->
    <ellipse cx="86" cy="100" rx="20" ry="16" fill="#A65A20" opacity="0.55"/>
    <!-- eyes -->
    <circle cx="92" cy="120" r="9" fill="#1F1F1F"/>
    <circle cx="148" cy="120" r="9" fill="#1F1F1F"/>
    <circle cx="95" cy="117" r="3" fill="#FFFFFF"/>
    <circle cx="151" cy="117" r="3" fill="#FFFFFF"/>
    <!-- eyebrows -->
    <path d="M82 105 Q92 100 102 105" stroke="#1F1F1F" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M138 105 Q148 100 158 105" stroke="#1F1F1F" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- nose -->
    <ellipse cx="120" cy="148" rx="11" ry="9" fill="#1F1F1F"/>
    <ellipse cx="116" cy="146" rx="3" ry="2" fill="#FFFFFF" opacity="0.6"/>
    <!-- mouth -->
    <path d="M120 158 Q120 174 105 174" stroke="#1F1F1F" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M120 158 Q120 174 135 174" stroke="#1F1F1F" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <!-- tongue -->
    <ellipse cx="120" cy="178" rx="10" ry="7" fill="#FF8FA3"/>
    <line x1="120" y1="174" x2="120" y2="183" stroke="#D9748A" stroke-width="2"/>
  </svg>`,
  pawPrintGroup: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" fill="#1A5C52">
    <g opacity="0.85"><g transform="translate(0,0) scale(0.65)">
      <ellipse cx="50" cy="68" rx="22" ry="18"/>
      <ellipse cx="20" cy="44" rx="9" ry="12"/>
      <ellipse cx="38" cy="22" rx="9" ry="12"/>
      <ellipse cx="62" cy="22" rx="9" ry="12"/>
      <ellipse cx="80" cy="44" rx="9" ry="12"/>
    </g></g>
    <g fill="#C8773A" opacity="0.85"><g transform="translate(150,30) scale(0.55)">
      <ellipse cx="50" cy="68" rx="22" ry="18"/>
      <ellipse cx="20" cy="44" rx="9" ry="12"/>
      <ellipse cx="38" cy="22" rx="9" ry="12"/>
      <ellipse cx="62" cy="22" rx="9" ry="12"/>
      <ellipse cx="80" cy="44" rx="9" ry="12"/>
    </g></g>
    <g opacity="0.85"><g transform="translate(280,80) scale(0.5)">
      <ellipse cx="50" cy="68" rx="22" ry="18"/>
      <ellipse cx="20" cy="44" rx="9" ry="12"/>
      <ellipse cx="38" cy="22" rx="9" ry="12"/>
      <ellipse cx="62" cy="22" rx="9" ry="12"/>
      <ellipse cx="80" cy="44" rx="9" ry="12"/>
    </g></g>
  </svg>`,
  // App icons for the "current method" slide
  iconInstagram: `<svg viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="#1F1F1F"/>
  </svg>`,
  iconWhatsApp: `<svg viewBox="0 0 24 24" fill="#1F1F1F" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.05 4.91A9.86 9.86 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01ZM12.04 20.13h-.01a8.21 8.21 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.23-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.69 8.21-8.23 8.21Zm4.51-6.16c-.25-.13-1.46-.72-1.69-.8-.23-.08-.39-.13-.56.13-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06a6.78 6.78 0 0 1-1.99-1.23 7.5 7.5 0 0 1-1.38-1.72c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42l-.48-.01c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.13 0 1.26.92 2.47 1.05 2.64.13.17 1.81 2.77 4.39 3.88.61.26 1.09.42 1.46.54.61.19 1.17.16 1.61.1.49-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.17-.48-.3Z"/>
  </svg>`,
  iconFacebook: `<svg viewBox="0 0 24 24" fill="#1F1F1F" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/>
  </svg>`,
  iconExcel: `<svg viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" stroke-width="1.7" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
  </svg>`,
  iconPhone: `<svg viewBox="0 0 24 24" fill="#1F1F1F" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2.3 2.3Z"/>
  </svg>`,
  iconDatabase: `<svg viewBox="0 0 24 24" fill="none" stroke="#1A5C52" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/>
    <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/>
  </svg>`,
  iconFilter: `<svg viewBox="0 0 24 24" fill="none" stroke="#1A5C52" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4h18l-7 9v6l-4 2v-8L3 4Z"/>
  </svg>`,
  iconForm: `<svg viewBox="0 0 24 24" fill="none" stroke="#1A5C52" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="3" width="14" height="18" rx="2"/>
    <path d="M9 8h6M9 12h6M9 16h4"/>
  </svg>`,
  iconBell: `<svg viewBox="0 0 24 24" fill="none" stroke="#C8773A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 5 3 9H3c0-4 3-2 3-9Z"/>
    <path d="M10 21a2 2 0 0 0 4 0"/>
  </svg>`,
  iconUser: `<svg viewBox="0 0 24 24" fill="none" stroke="#1A5C52" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
  </svg>`,
  iconAdmin: `<svg viewBox="0 0 24 24" fill="none" stroke="#C8773A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
  </svg>`,
}

// ---------------------------------------------------------------------------
// SVG -> PNG via headless chromium
// ---------------------------------------------------------------------------

async function svgToPng(context, svgString, fileName, sizePx = 400) {
  const html = `<!doctype html><html><head><style>
    html, body { margin:0; padding:0; background:transparent; }
    .box { width:${sizePx}px; height:${sizePx}px; display:flex; align-items:center; justify-content:center; }
    svg { width:100%; height:100%; }
  </style></head><body><div class="box">${svgString}</div></body></html>`
  const page = await context.newPage()
  await page.setViewportSize({ width: sizePx, height: sizePx })
  await page.setContent(html, { waitUntil: 'load' })
  const buf = await page.locator('.box').screenshot({ omitBackground: true, type: 'png' })
  await page.close()
  const filePath = path.join(ILLUS_DIR, fileName)
  await fs.writeFile(filePath, buf)
  return filePath
}

// ---------------------------------------------------------------------------
// Live screenshot capture (viewport-sized, not full page)
// ---------------------------------------------------------------------------

async function fetchAsBuffer(context, url) {
  const response = await context.request.get(url)
  return await response.body()
}

async function captureScreenshots(context) {
  await fs.mkdir(SHOTS_DIR, { recursive: true })

  console.log('  fetching hero image...')
  const heroBuf = await fetchAsBuffer(
    context,
    'https://i.pinimg.com/736x/16/bd/d9/16bdd92a5093b8166b4b31f322536220.jpg',
  )
  const heroPath = path.join(SHOTS_DIR, 'hero.jpg')
  await fs.writeFile(heroPath, heroBuf)

  async function shot(routePath, selector, fileName) {
    const page = await context.newPage()
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(BASE + routePath, { waitUntil: 'domcontentloaded' })
    if (selector) {
      try {
        await page.waitForSelector(selector, { timeout: 12000 })
      } catch {
        /* ignore */
      }
    }
    await page.waitForTimeout(2000)
    const filePath = path.join(SHOTS_DIR, fileName)
    await page.screenshot({ path: filePath, fullPage: false })
    await page.close()
    return filePath
  }

  console.log('  shooting /animals (catalog)...')
  const catalog = await shot('/animals', 'div[role="button"]', 'animals.png')

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
    /* ignore */
  }

  let profile = catalog
  let apply = catalog
  if (animalId) {
    console.log(`  shooting /animal/${animalId} (profile)...`)
    profile = await shot(`/animal/${animalId}`, 'h1', 'profile.png')
    console.log(`  shooting /apply/${animalId} (form)...`)
    apply = await shot(`/apply/${animalId}`, 'form, h1', 'apply.png')
  }

  console.log('  shooting / (donation block)...')
  const donate = await shot('/#donate', '.charity-strip', 'donate.png')

  return { hero: heroPath, catalog, profile, apply, donate }
}

// ---------------------------------------------------------------------------
// Slide builders
// ---------------------------------------------------------------------------

const TEAM = 'Balaussa Satymbek · Milena Gukengeimer · Zarina Doszhanova · Aruzhan Yerkinova'
const COURSE = 'Foundations of Computational Thinking · Foundation Year 2025-2026'

function addEyebrow(slide, text, x, y, opts = {}) {
  slide.addText(text.toUpperCase(), {
    x, y, w: opts.w || 8, h: 0.35,
    fontFace: FONT, fontSize: 12, bold: true, color: C.orange,
    charSpacing: 4,
  })
}

function addDash(slide, x, y) {
  slide.addShape('rect', {
    x, y, w: 0.55, h: 0.06,
    fill: { color: C.orange }, line: { color: C.orange, width: 0 },
  })
}

function addFooter(slide, num, total) {
  slide.addText('PlayFul Paws', {
    x: 0.55, y: H - 0.45, w: 4, h: 0.3,
    fontFace: FONT, fontSize: 10, bold: true, color: C.teal,
  })
  slide.addText(`${num} / ${total}`, {
    x: W - 4.55, y: H - 0.45, w: 4, h: 0.3, align: 'right',
    fontFace: FONT, fontSize: 10, color: C.muted,
  })
}

function addPawDecoration(slide, illustrations) {
  // Small paw prints in top-right + bottom-left
  slide.addImage({
    path: illustrations.pawTeal, x: W - 1.2, y: 0.45, w: 0.85, h: 0.85,
    transparency: 90,
  })
  slide.addImage({
    path: illustrations.pawOrange, x: 0.5, y: H - 1.45, w: 0.7, h: 0.7,
    transparency: 90,
  })
}

function buildPresentation({ shots, illus }) {
  const pres = new pptxgen()
  pres.layout = 'LAYOUT_WIDE' // 13.333 × 7.5"
  pres.title = 'PlayFul Paws - Pitch Deck'
  pres.author = 'PlayFul Paws team'
  pres.company = 'inVision U'
  pres.subject = 'Final project pitch for Comes Animal Shelter'

  const TOTAL = 18

  // --- Slide 1 — Cover ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    s.addImage({ path: illus.pawTeal, x: 9, y: -0.5, w: 5, h: 5, transparency: 88 })
    s.addImage({ path: illus.pawOrange, x: -0.5, y: 4.5, w: 4, h: 4, transparency: 88 })
    s.addText('FINAL PROJECT · PITCH', {
      x: 0.85, y: 0.7, w: 6, h: 0.4,
      fontFace: FONT, fontSize: 14, bold: true, color: C.orange, charSpacing: 6,
    })
    s.addText([
      { text: 'PlayFul', options: { color: C.teal } },
      { text: '\nPaws', options: { color: C.orange } },
    ], {
      x: 0.85, y: 1.5, w: 9, h: 4.5,
      fontFace: FONT_DISPLAY, fontSize: 200, bold: true,
    })
    s.addText('A digital home for the "Comes" Animal Shelter.', {
      x: 0.85, y: 5.6, w: 10, h: 0.5,
      fontFace: FONT, fontSize: 22, color: C.muted, italic: true,
    })
    s.addText(TEAM, {
      x: 0.85, y: 6.45, w: 12, h: 0.35,
      fontFace: FONT, fontSize: 13, bold: true, color: C.dark,
    })
    s.addText(COURSE, {
      x: 0.85, y: 6.8, w: 12, h: 0.3,
      fontFace: FONT, fontSize: 11, color: C.muted,
    })
  }

  // --- Slide 2 — Hook ---
  {
    const s = pres.addSlide()
    s.background = { path: shots.hero }
    // Dark gradient overlay using a solid black rect at low transparency
    s.addShape('rect', {
      x: 0, y: 0, w: W, h: H,
      fill: { color: '000000', transparency: 35 }, line: { type: 'none' },
    })
    s.addShape('rect', {
      x: 0, y: 0, w: W * 0.6, h: H,
      fill: { color: '000000', transparency: 15 }, line: { type: 'none' },
    })
    s.addText('BEFORE WE START', {
      x: 0.85, y: 1.5, w: 8, h: 0.4,
      fontFace: FONT, fontSize: 14, bold: true, color: C.orange, charSpacing: 6,
    })
    s.addText('Have you seen a stray\nand wished you could help?', {
      x: 0.85, y: 2.2, w: 9.5, h: 3,
      fontFace: FONT_DISPLAY, fontSize: 56, bold: true, color: C.white,
      lineSpacingMultiple: 1.05,
    })
  }

  // --- Slide 3 — Client ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'Our client', 0.85, 0.7)
    s.addText('Yulia\nSnegireva', {
      x: 0.85, y: 1.2, w: 7, h: 2.6,
      fontFace: FONT_DISPLAY, fontSize: 78, bold: true, color: C.dark,
      lineSpacingMultiple: 1.0,
    })
    addDash(s, 0.85, 3.95)
    s.addText('Founder · "Comes" Shelter', {
      x: 0.85, y: 4.2, w: 8, h: 0.5,
      fontFace: FONT, fontSize: 24, bold: true, color: C.dark,
    })
    s.addText('Kainar village · 37 km from Almaty · 17 years', {
      x: 0.85, y: 4.7, w: 8, h: 0.5,
      fontFace: FONT, fontSize: 18, color: C.muted,
    })
    // 10 → 6 → 1 funnel
    const pillStyle = (color, fill) => ({
      fontFace: FONT, fontSize: 14, bold: true, color, align: 'center',
      fill: { color: fill },
    })
    s.addShape('roundRect', { x: 0.85, y: 5.7, w: 1.9, h: 0.6, fill: { color: C.warm }, line: { color: C.tealDark, width: 1 }, rectRadius: 0.3 })
    s.addText('10+ contacted', { x: 0.85, y: 5.7, w: 1.9, h: 0.6, ...pillStyle(C.tealDark, C.warm) })
    s.addShape('roundRect', { x: 2.95, y: 5.7, w: 1.7, h: 0.6, fill: { color: C.warm }, line: { color: C.tealDark, width: 1 }, rectRadius: 0.3 })
    s.addText('6 responded', { x: 2.95, y: 5.7, w: 1.7, h: 0.6, ...pillStyle(C.tealDark, C.warm) })
    s.addShape('roundRect', { x: 4.85, y: 5.7, w: 1.5, h: 0.6, fill: { color: C.tealSoft }, line: { color: C.teal, width: 2 }, rectRadius: 0.3 })
    s.addText('1 chosen', { x: 4.85, y: 5.7, w: 1.5, h: 0.6, ...pillStyle(C.tealDark, C.tealSoft) })
    // Photo
    s.addImage({ path: shots.hero, x: 8.4, y: 0.6, w: 4.4, h: 6.3, sizing: { type: 'cover', w: 4.4, h: 6.3 } })
    addFooter(s, 3, TOTAL)
  }

  // --- Slide 4 — Scale ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'At a glance', 0.85, 0.7)
    s.addText('The scale of one person.', {
      x: 0.85, y: 1.2, w: 12, h: 0.9,
      fontFace: FONT_DISPLAY, fontSize: 48, bold: true, color: C.dark,
    })
    addDash(s, 0.85, 2.2)
    const stats = [
      { num: '17+', label: 'Years of rescue', color: C.teal },
      { num: '350', label: 'Dogs', color: C.teal },
      { num: '40+', label: 'Cats', color: C.teal },
      { num: '2', label: 'People · no paid staff', color: C.orange },
    ]
    const cardW = 2.85
    const gap = 0.25
    const totalW = stats.length * cardW + (stats.length - 1) * gap
    const startX = (W - totalW) / 2
    stats.forEach((stat, i) => {
      const x = startX + i * (cardW + gap)
      const y = 2.85
      s.addShape('roundRect', {
        x, y, w: cardW, h: 3.2,
        fill: { color: C.white }, line: { color: C.tealSoft, width: 1 }, rectRadius: 0.15,
      })
      s.addText(stat.num, {
        x, y: y + 0.4, w: cardW, h: 1.7,
        fontFace: FONT_DISPLAY, fontSize: 88, bold: true, color: stat.color, align: 'center',
      })
      s.addText(stat.label.toUpperCase(), {
        x, y: y + 2.3, w: cardW, h: 0.6,
        fontFace: FONT, fontSize: 12, bold: true, color: C.muted, align: 'center', charSpacing: 4,
      })
    })
    addFooter(s, 4, TOTAL)
  }

  // --- Slide 5 — Viktoria ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'Why this matters', 0.85, 0.7)
    s.addText([
      { text: "Viktoria's", options: { color: C.orange } },
      { text: '\nstory', options: { color: C.dark } },
    ], {
      x: 0.85, y: 1.2, w: 6, h: 2.5,
      fontFace: FONT_DISPLAY, fontSize: 78, bold: true,
      lineSpacingMultiple: 1.0,
    })
    addDash(s, 0.85, 4.0)
    // 3 single-line facts
    const facts = [
      { kicker: 'Critical condition', text: '3 skin-graft surgeries' },
      { kicker: 'Funded by', text: 'Instagram followers, post by post' },
      { kicker: 'Coordinated by', text: 'One person · one phone' },
    ]
    facts.forEach((f, i) => {
      const y = 4.4 + i * 0.85
      s.addText(f.kicker.toUpperCase(), {
        x: 0.85, y, w: 6, h: 0.3,
        fontFace: FONT, fontSize: 11, bold: true, color: C.muted, charSpacing: 4,
      })
      s.addText(f.text, {
        x: 0.85, y: y + 0.3, w: 6.3, h: 0.5,
        fontFace: FONT, fontSize: 19, bold: true, color: C.dark,
      })
    })
    // Cat illustration on the right
    s.addShape('roundRect', {
      x: 8, y: 1.4, w: 4.7, h: 5.2,
      fill: { color: C.warm }, line: { color: C.orange, width: 2 }, rectRadius: 0.2,
    })
    s.addImage({ path: illus.cat, x: 8.6, y: 1.7, w: 3.5, h: 3.5 })
    s.addText('Saved by community.', {
      x: 8.2, y: 5.7, w: 4.3, h: 0.5,
      fontFace: FONT_DISPLAY, fontSize: 22, bold: true, italic: true, color: C.tealDark, align: 'center',
    })
    addFooter(s, 5, TOTAL)
  }

  // --- Slide 6 — Problem ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'The problem', 0.85, 0.7)
    s.addText('Thousands of strays.\nOne person\u2019s phone.', {
      x: 0.85, y: 1.2, w: 12, h: 1.8,
      fontFace: FONT_DISPLAY, fontSize: 46, bold: true, color: C.dark,
      lineSpacingMultiple: 1.05,
    })
    addDash(s, 0.85, 3.1)
    // Two cards side by side
    const cards = [
      { title: 'In Kazakhstan', body: '5 days before euthanasia.\nFew official shelters.', color: C.orange },
      { title: 'At Comes', body: '5-10 rescues / month.\n50 inquiries in March.', color: C.teal },
    ]
    cards.forEach((card, i) => {
      const x = 0.85 + i * 6.2
      const y = 3.55
      s.addShape('roundRect', {
        x, y, w: 5.8, h: 3.0,
        fill: { color: C.white }, line: { color: card.color, width: 0 }, rectRadius: 0.12,
      })
      // Left accent bar
      s.addShape('rect', {
        x, y, w: 0.12, h: 3.0,
        fill: { color: card.color }, line: { type: 'none' },
      })
      s.addText(card.title, {
        x: x + 0.4, y: y + 0.4, w: 5.2, h: 0.5,
        fontFace: FONT_DISPLAY, fontSize: 24, bold: true, color: card.color,
      })
      s.addText(card.body, {
        x: x + 0.4, y: y + 1.0, w: 5.2, h: 1.8,
        fontFace: FONT, fontSize: 20, color: C.dark, lineSpacingMultiple: 1.4,
      })
    })
    addFooter(s, 6, TOTAL)
  }

  // --- Slide 7 — Current method (DFD-old) ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'Current method', 0.85, 0.7)
    s.addText('How it runs today.', {
      x: 0.85, y: 1.2, w: 12, h: 0.9,
      fontFace: FONT_DISPLAY, fontSize: 44, bold: true, color: C.dark,
    })
    addDash(s, 0.85, 2.2)
    // 6 app icons in 2x3 grid (left side)
    const apps = [
      { icon: illus.iconInstagram, label: 'Instagram', sub: 'DMs + posts' },
      { icon: illus.iconWhatsApp, label: 'WhatsApp #1', sub: 'General' },
      { icon: illus.iconWhatsApp, label: 'WhatsApp #2', sub: 'Adoption' },
      { icon: illus.iconFacebook, label: 'Facebook', sub: 'Posts' },
      { icon: illus.iconExcel, label: 'Excel', sub: 'Rarely updated' },
      { icon: illus.iconPhone, label: 'Two phones', sub: '24/7' },
    ]
    const tileW = 1.65
    const tileH = 1.5
    const startX = 0.85
    const startY = 2.85
    apps.forEach((app, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = startX + col * (tileW + 0.18)
      const y = startY + row * (tileH + 0.2)
      s.addShape('roundRect', {
        x, y, w: tileW, h: tileH,
        fill: { color: C.white }, line: { color: C.tealSoft, width: 1 }, rectRadius: 0.1,
      })
      s.addImage({ path: app.icon, x: x + 0.55, y: y + 0.18, w: 0.55, h: 0.55 })
      s.addText(app.label, {
        x, y: y + 0.8, w: tileW, h: 0.3,
        fontFace: FONT, fontSize: 13, bold: true, color: C.dark, align: 'center',
      })
      s.addText(app.sub, {
        x, y: y + 1.1, w: tileW, h: 0.3,
        fontFace: FONT, fontSize: 10, color: C.muted, align: 'center',
      })
    })
    // Arrow
    s.addText('→', {
      x: 6.4, y: 4.0, w: 0.8, h: 0.8,
      fontFace: FONT_DISPLAY, fontSize: 56, bold: true, color: C.orange, align: 'center',
    })
    // Yulia memory card
    s.addShape('roundRect', {
      x: 7.7, y: 3.0, w: 5.0, h: 3.7,
      fill: { color: C.warm }, line: { color: C.orange, width: 2 }, rectRadius: 0.15,
    })
    s.addImage({ path: illus.pawOrange, x: 9.7, y: 3.2, w: 1.0, h: 1.0 })
    s.addText('Yulia\u2019s memory', {
      x: 7.7, y: 4.3, w: 5.0, h: 0.6,
      fontFace: FONT_DISPLAY, fontSize: 28, bold: true, color: C.dark, align: 'center',
    })
    s.addText('One person · 24/7.\nNo database. No filters.', {
      x: 7.7, y: 5.0, w: 5.0, h: 1.2,
      fontFace: FONT, fontSize: 16, color: C.muted, align: 'center', lineSpacingMultiple: 1.4,
    })
    addFooter(s, 7, TOTAL)
  }

  // --- Slide 8 — Requirements ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'Requirements', 0.85, 0.7)
    s.addText('What we needed.', {
      x: 0.85, y: 1.2, w: 12, h: 0.9,
      fontFace: FONT_DISPLAY, fontSize: 48, bold: true, color: C.dark,
    })
    addDash(s, 0.85, 2.2)
    const reqs = [
      { icon: illus.iconDatabase, title: 'Database', sub: 'Searchable profiles' },
      { icon: illus.iconFilter, title: 'Filters', sub: 'Browse without DMs' },
      { icon: illus.iconForm, title: 'Form', sub: 'Trackable requests' },
      { icon: illus.iconBell, title: 'Dashboard', sub: 'One place for admin' },
    ]
    const cardW = 2.85
    const gap = 0.25
    const totalW = reqs.length * cardW + (reqs.length - 1) * gap
    const startX = (W - totalW) / 2
    reqs.forEach((r, i) => {
      const x = startX + i * (cardW + gap)
      const y = 2.95
      s.addShape('roundRect', {
        x, y, w: cardW, h: 3.0,
        fill: { color: C.white }, line: { color: C.tealSoft, width: 1 }, rectRadius: 0.12,
      })
      s.addImage({ path: r.icon, x: x + (cardW - 0.9) / 2, y: y + 0.4, w: 0.9, h: 0.9 })
      s.addText(r.title, {
        x, y: y + 1.5, w: cardW, h: 0.6,
        fontFace: FONT_DISPLAY, fontSize: 26, bold: true, color: C.teal, align: 'center',
      })
      s.addText(r.sub, {
        x, y: y + 2.15, w: cardW, h: 0.5,
        fontFace: FONT, fontSize: 14, color: C.muted, align: 'center',
      })
    })
    // Drawn dog in bottom right corner
    s.addImage({ path: illus.dog, x: W - 1.6, y: H - 1.55, w: 1.1, h: 1.1, transparency: 25 })
    addFooter(s, 8, TOTAL)
  }

  // --- Slide 9 — New method (DFD-new) ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'New method · Data flow', 0.85, 0.7)
    s.addText('One platform. Clean roles.', {
      x: 0.85, y: 1.2, w: 12, h: 0.9,
      fontFace: FONT_DISPLAY, fontSize: 42, bold: true, color: C.dark,
    })
    addDash(s, 0.85, 2.2)
    // User box
    const ux = 0.6, uy = 3.4, uw = 1.9, uh = 2.2
    s.addShape('roundRect', { x: ux, y: uy, w: uw, h: uh, fill: { color: C.tealSoft }, line: { color: C.teal, width: 2, dashType: 'dash' }, rectRadius: 0.15 })
    s.addImage({ path: illus.iconUser, x: ux + (uw - 0.6) / 2, y: uy + 0.3, w: 0.6, h: 0.6 })
    s.addText('User', { x: ux, y: uy + 1.0, w: uw, h: 0.4, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: C.tealDark, align: 'center' })
    s.addText('Adopter', { x: ux, y: uy + 1.45, w: uw, h: 0.3, fontFace: FONT, fontSize: 12, color: C.muted, align: 'center' })
    // Arrow
    s.addText('→', { x: 2.55, y: 4.05, w: 0.6, h: 0.7, fontFace: FONT_DISPLAY, fontSize: 38, bold: true, color: C.teal, align: 'center' })
    // 4 process boxes (2x2)
    const procs = [
      { num: '1.0', title: 'Browse', sub: 'Shelter info', color: C.teal },
      { num: '2.0', title: 'Filter', sub: 'Type / age', color: C.teal },
      { num: '3.0', title: 'Profile', sub: 'Photos / story', color: C.teal },
      { num: '4.0', title: 'Apply', sub: 'Triggers alert', color: C.orange },
    ]
    const px = 3.3, py = 2.95, pw = 3.5, ph = 1.3, pgap = 0.15
    procs.forEach((p, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = px + col * (pw + pgap)
      const y = py + row * (ph + pgap)
      s.addShape('roundRect', { x, y, w: pw, h: ph, fill: { color: C.white }, line: { color: p.color, width: 2 }, rectRadius: 0.1 })
      s.addText(p.num, { x: x + 0.2, y: y + 0.15, w: 1, h: 0.4, fontFace: FONT_DISPLAY, fontSize: 18, bold: true, color: p.color })
      s.addText(p.title, { x: x + 0.2, y: y + 0.55, w: pw - 0.4, h: 0.45, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: C.dark })
      s.addText(p.sub, { x: x + 0.2, y: y + 0.95, w: pw - 0.4, h: 0.3, fontFace: FONT, fontSize: 13, color: C.muted })
    })
    // Arrow → admin
    s.addText('→', { x: 10.5, y: 4.05, w: 0.6, h: 0.7, fontFace: FONT_DISPLAY, fontSize: 38, bold: true, color: C.orange, align: 'center' })
    // Admin box
    const ax = 11.2, ay = 3.4, aw = 1.95, ah = 2.2
    s.addShape('roundRect', { x: ax, y: ay, w: aw, h: ah, fill: { color: 'FFF3E0' }, line: { color: C.orange, width: 2, dashType: 'dash' }, rectRadius: 0.15 })
    s.addImage({ path: illus.iconAdmin, x: ax + (aw - 0.6) / 2, y: ay + 0.3, w: 0.6, h: 0.6 })
    s.addText('Admin', { x: ax, y: ay + 1.0, w: aw, h: 0.4, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: C.orange, align: 'center' })
    s.addText('Yulia · Shelter', { x: ax, y: ay + 1.45, w: aw, h: 0.3, fontFace: FONT, fontSize: 12, color: C.muted, align: 'center' })
    // Data stores row
    const dbY = 6.05
    const dbs = ['D1 · Animals DB', 'D2 · Applications DB', 'D3 · Shelter Info DB']
    dbs.forEach((db, i) => {
      const x = 0.85 + i * 4.05
      s.addShape('roundRect', { x, y: dbY, w: 3.85, h: 0.65, fill: { color: C.warm }, line: { type: 'none' }, rectRadius: 0.1 })
      s.addImage({ path: illus.iconDatabase, x: x + 0.18, y: dbY + 0.13, w: 0.4, h: 0.4 })
      s.addText(db, {
        x: x + 0.7, y: dbY + 0.1, w: 3.0, h: 0.5,
        fontFace: FONT, fontSize: 14, bold: true, color: C.tealDark, valign: 'middle',
      })
    })
    addFooter(s, 9, TOTAL)
  }

  // --- Slides 10-13 — MVP features ---
  function mvpSlide(num, eyebrow, title, caption, screenshot) {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, eyebrow, 0.85, 0.7)
    s.addText(title, {
      x: 0.85, y: 1.2, w: 6, h: 1.8,
      fontFace: FONT_DISPLAY, fontSize: 44, bold: true, color: C.dark,
      lineSpacingMultiple: 1.05,
    })
    addDash(s, 0.85, 3.1)
    s.addText(caption, {
      x: 0.85, y: 3.45, w: 6, h: 1.5,
      fontFace: FONT, fontSize: 22, color: C.dark, lineSpacingMultiple: 1.4,
    })
    // Screenshot frame
    s.addShape('roundRect', {
      x: 7.0, y: 0.9, w: 5.85, h: 5.85,
      fill: { color: C.white }, line: { color: C.tealSoft, width: 1 }, rectRadius: 0.15,
    })
    s.addImage({
      path: screenshot, x: 7.1, y: 1.0, w: 5.65, h: 5.65,
      sizing: { type: 'cover', w: 5.65, h: 5.65 },
    })
    addFooter(s, num, TOTAL)
  }

  mvpSlide(10, 'MVP · Feature 1', 'Catalog\n+ filters', 'Browse without messaging Yulia.', shots.catalog)
  mvpSlide(11, 'MVP · Feature 2', 'Profile\n+ Q&A', 'Story and questions in one place.', shots.profile)
  mvpSlide(12, 'MVP · Feature 3', 'Adoption\nform', 'Replaces WhatsApp DMs.', shots.apply)
  mvpSlide(13, 'MVP · Feature 4', 'Donate,\ntransparent', '5 payment methods · 100% to the foundation.', shots.donate)

  // --- Slide 14 — Testing R1 ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'Testing · Round 1', 0.85, 0.7)
    s.addText('3 testers. 3 problems.', {
      x: 0.85, y: 1.2, w: 12, h: 0.9,
      fontFace: FONT_DISPLAY, fontSize: 44, bold: true, color: C.dark,
    })
    addDash(s, 0.85, 2.2)
    const r1 = [
      { name: 'Aidar', role: 'Student', issue: 'Unclear purpose', color: C.teal },
      { name: 'Amira', role: 'Student', issue: 'Form failed', color: C.orange },
      { name: 'Ayaulim', role: 'Student', issue: 'No success message', color: C.teal },
    ]
    const cardW = 3.5
    const gap = 0.35
    const totalW = r1.length * cardW + (r1.length - 1) * gap
    const startX = (W - totalW) / 2
    r1.forEach((t, i) => {
      const x = startX + i * (cardW + gap)
      const y = 3.0
      s.addShape('roundRect', { x, y, w: cardW, h: 3.6, fill: { color: C.white }, line: { color: C.tealSoft, width: 1 }, rectRadius: 0.12 })
      // avatar circle
      s.addShape('ellipse', { x: x + (cardW - 1.2) / 2, y: y + 0.3, w: 1.2, h: 1.2, fill: { color: t.color }, line: { type: 'none' } })
      s.addText(t.name[0], { x: x + (cardW - 1.2) / 2, y: y + 0.3, w: 1.2, h: 1.2, fontFace: FONT_DISPLAY, fontSize: 36, bold: true, color: C.white, align: 'center', valign: 'middle' })
      s.addText(t.name, { x, y: y + 1.65, w: cardW, h: 0.5, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: C.dark, align: 'center' })
      s.addText(t.role, { x, y: y + 2.1, w: cardW, h: 0.35, fontFace: FONT, fontSize: 13, color: C.muted, align: 'center' })
      // tag
      s.addShape('roundRect', { x: x + 0.4, y: y + 2.7, w: cardW - 0.8, h: 0.55, fill: { color: C.redSoft }, line: { type: 'none' }, rectRadius: 0.27 })
      s.addText(`× ${t.issue}`, { x: x + 0.4, y: y + 2.7, w: cardW - 0.8, h: 0.55, fontFace: FONT, fontSize: 13, bold: true, color: C.red, align: 'center', valign: 'middle' })
    })
    s.addText('3 / 3 failed TC-03 (adoption form).', {
      x: 0.85, y: 6.85, w: 12, h: 0.3,
      fontFace: FONT, fontSize: 14, italic: true, color: C.muted, align: 'center',
    })
    addFooter(s, 14, TOTAL)
  }

  // --- Slide 15 — Testing R2 ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'Testing · Round 2', 0.85, 0.7)
    s.addText('3 new testers. 100% pass.', {
      x: 0.85, y: 1.2, w: 12, h: 0.9,
      fontFace: FONT_DISPLAY, fontSize: 44, bold: true, color: C.dark,
    })
    addDash(s, 0.85, 2.2)
    const r2 = [
      { name: 'Rasul', role: 'Student', win: 'Liked the flow', color: C.teal },
      { name: 'Niyaz', role: 'CRE engineer', win: 'CTA placement tip', color: C.orange },
      { name: 'Nurdaulet', role: 'Math teacher', win: 'Cards intuitive', color: C.teal },
    ]
    const cardW = 3.5
    const gap = 0.35
    const totalW = r2.length * cardW + (r2.length - 1) * gap
    const startX = (W - totalW) / 2
    r2.forEach((t, i) => {
      const x = startX + i * (cardW + gap)
      const y = 3.0
      s.addShape('roundRect', { x, y, w: cardW, h: 3.6, fill: { color: C.white }, line: { color: C.tealSoft, width: 1 }, rectRadius: 0.12 })
      s.addShape('ellipse', { x: x + (cardW - 1.2) / 2, y: y + 0.3, w: 1.2, h: 1.2, fill: { color: t.color }, line: { type: 'none' } })
      s.addText(t.name[0], { x: x + (cardW - 1.2) / 2, y: y + 0.3, w: 1.2, h: 1.2, fontFace: FONT_DISPLAY, fontSize: 36, bold: true, color: C.white, align: 'center', valign: 'middle' })
      s.addText(t.name, { x, y: y + 1.65, w: cardW, h: 0.5, fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: C.dark, align: 'center' })
      s.addText(t.role, { x, y: y + 2.1, w: cardW, h: 0.35, fontFace: FONT, fontSize: 13, color: C.muted, align: 'center' })
      s.addShape('roundRect', { x: x + 0.4, y: y + 2.7, w: cardW - 0.8, h: 0.55, fill: { color: C.greenSoft }, line: { type: 'none' }, rectRadius: 0.27 })
      s.addText(`✓ ${t.win}`, { x: x + 0.4, y: y + 2.7, w: cardW - 0.8, h: 0.55, fontFace: FONT, fontSize: 13, bold: true, color: C.green, align: 'center', valign: 'middle' })
    })
    s.addText('Two rounds · two user groups · real product.', {
      x: 0.85, y: 6.85, w: 12, h: 0.3,
      fontFace: FONT, fontSize: 14, italic: true, color: C.muted, align: 'center',
    })
    addFooter(s, 15, TOTAL)
  }

  // --- Slide 16 — Future ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    addEyebrow(s, 'Evaluation · Future', 0.85, 0.7)
    s.addText('Done · Limits · Next.', {
      x: 0.85, y: 1.2, w: 12, h: 0.9,
      fontFace: FONT_DISPLAY, fontSize: 44, bold: true, color: C.dark,
    })
    addDash(s, 0.85, 2.2)
    const cols = [
      { title: 'Done', body: 'Live site · catalog · form · donations · two test rounds passed.', color: C.teal },
      { title: 'Limits', body: 'Manual data entry. English only. No native admin dashboard.', color: C.muted },
      { title: 'Next', body: 'Admin dashboard. Russian + Kazakh. Instagram bio link.', color: C.orange },
    ]
    const cardW = 3.7
    const gap = 0.4
    const totalW = cols.length * cardW + (cols.length - 1) * gap
    const startX = (W - totalW) / 2
    cols.forEach((c, i) => {
      const x = startX + i * (cardW + gap)
      const y = 3.05
      s.addShape('roundRect', { x, y, w: cardW, h: 3.5, fill: { color: C.white }, line: { color: c.color, width: 0 }, rectRadius: 0.12 })
      s.addShape('rect', { x, y, w: cardW, h: 0.18, fill: { color: c.color }, line: { type: 'none' } })
      s.addText(c.title, {
        x: x + 0.4, y: y + 0.55, w: cardW - 0.8, h: 0.6,
        fontFace: FONT_DISPLAY, fontSize: 28, bold: true, color: c.color,
      })
      s.addText(c.body, {
        x: x + 0.4, y: y + 1.4, w: cardW - 0.8, h: 1.9,
        fontFace: FONT, fontSize: 18, color: C.dark, lineSpacingMultiple: 1.4,
      })
    })
    addFooter(s, 16, TOTAL)
  }

  // --- Slide 17 — CTA / QR ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    // Soft tinted background half
    s.addShape('rect', { x: 0, y: 0, w: W * 0.55, h: H, fill: { color: C.green200, transparency: 60 }, line: { type: 'none' } })
    addEyebrow(s, 'Try it live', 0.85, 0.7)
    s.addText([
      { text: 'Scan,\n', options: { color: C.dark } },
      { text: 'browse,\n', options: { color: C.dark } },
      { text: 'adopt or donate.', options: { color: C.orange } },
    ], {
      x: 0.85, y: 1.2, w: 6.5, h: 4,
      fontFace: FONT_DISPLAY, fontSize: 56, bold: true,
      lineSpacingMultiple: 1.05,
    })
    addDash(s, 0.85, 5.4)
    s.addText('100% goes to the "Comes" Public Foundation. No intermediaries.', {
      x: 0.85, y: 5.6, w: 6.5, h: 0.8,
      fontFace: FONT, fontSize: 16, color: C.dark, lineSpacingMultiple: 1.4,
    })
    s.addText('@comes.kz.almaty   ·   +7 701 723 01 04', {
      x: 0.85, y: 6.6, w: 6.5, h: 0.4,
      fontFace: FONT, fontSize: 13, bold: true, color: C.tealDark,
    })
    // QR frame
    s.addShape('roundRect', {
      x: 8.0, y: 1.1, w: 4.6, h: 4.6,
      fill: { color: C.white }, line: { color: C.teal, width: 3 }, rectRadius: 0.18,
    })
    s.addImage({ path: path.join(ASSETS_DIR, 'qr.png'), x: 8.3, y: 1.4, w: 4.0, h: 4.0 })
    s.addText('Scan with your phone camera', {
      x: 7.5, y: 5.85, w: 5.6, h: 0.4,
      fontFace: FONT, fontSize: 14, bold: true, color: C.tealDark, align: 'center',
    })
    s.addText('invisionueducationplayful-paws.vercel.app', {
      x: 7.5, y: 6.25, w: 5.6, h: 0.4,
      fontFace: FONT, fontSize: 11, color: C.muted, align: 'center',
    })
    // Drawn dog corner accent
    s.addImage({ path: illus.dog, x: 6.4, y: 5.8, w: 1.3, h: 1.3 })
    addFooter(s, 17, TOTAL)
  }

  // --- Slide 18 — Thanks ---
  {
    const s = pres.addSlide()
    s.background = { color: C.bg }
    s.addImage({ path: illus.cat, x: 0.5, y: 0.3, w: 1.6, h: 1.6, transparency: 15 })
    s.addImage({ path: illus.dog, x: W - 2.1, y: H - 2.1, w: 1.6, h: 1.6, transparency: 15 })
    s.addImage({ path: illus.pawTeal, x: 0.5, y: H - 1.4, w: 0.7, h: 0.7, transparency: 75 })
    s.addImage({ path: illus.pawOrange, x: W - 1.2, y: 0.5, w: 0.7, h: 0.7, transparency: 75 })
    s.addText('THANK YOU', {
      x: 0, y: 1.6, w: W, h: 0.5,
      fontFace: FONT, fontSize: 16, bold: true, color: C.orange, align: 'center', charSpacing: 8,
    })
    s.addText([
      { text: 'PlayFul', options: { color: C.teal } },
      { text: ' Paws', options: { color: C.orange } },
    ], {
      x: 0, y: 2.4, w: W, h: 2.2,
      fontFace: FONT_DISPLAY, fontSize: 130, bold: true, align: 'center',
    })
    s.addText('A digital home for the animals nobody else would help.', {
      x: 0, y: 5.0, w: W, h: 0.5,
      fontFace: FONT, fontSize: 18, italic: true, color: C.muted, align: 'center',
    })
    s.addText(TEAM, {
      x: 0, y: 6.2, w: W, h: 0.4,
      fontFace: FONT, fontSize: 14, bold: true, color: C.dark, align: 'center',
    })
    s.addText(COURSE, {
      x: 0, y: 6.65, w: W, h: 0.35,
      fontFace: FONT, fontSize: 11, color: C.muted, align: 'center',
    })
  }

  return pres
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function main() {
  const startedAt = Date.now()
  await fs.mkdir(ILLUS_DIR, { recursive: true })

  console.log('\nLaunching headless Chromium...')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  })

  console.log('\nRendering illustrations to PNG:')
  const illus = {}
  const sizes = {
    pawTeal: 240, pawOrange: 240, cat: 600, dog: 600, pawPrintGroup: 480,
    iconInstagram: 240, iconWhatsApp: 240, iconFacebook: 240, iconExcel: 240, iconPhone: 240,
    iconDatabase: 240, iconFilter: 240, iconForm: 240, iconBell: 240,
    iconUser: 240, iconAdmin: 240,
  }
  for (const [key, svg] of Object.entries(SVG)) {
    const sz = sizes[key] || 240
    process.stdout.write(`  -> ${key.padEnd(18, ' ')} (${sz}x${sz})\n`)
    illus[key] = await svgToPng(context, svg, `${key}.png`, sz)
  }

  console.log('\nCapturing live screenshots:')
  const shots = await captureScreenshots(context)

  await browser.close()

  console.log('\nGenerating QR code...')
  const qrPath = path.join(ASSETS_DIR, 'qr.png')
  await QRCode.toFile(qrPath, BASE, {
    width: 800, margin: 1, errorCorrectionLevel: 'M',
    color: { dark: `#${C.tealDark}`, light: '#FFFFFF' },
  })

  console.log('\nBuilding presentation...')
  const pres = buildPresentation({ shots, illus })

  await pres.writeFile({ fileName: FINAL_PPTX })

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`\nDone in ${elapsed}s`)
  console.log(`  PowerPoint: ${FINAL_PPTX}`)
  console.log(`  Assets:     ${ASSETS_DIR}\\`)
}

main().catch(err => {
  console.error('\nDeck build failed:', err)
  process.exit(1)
})
