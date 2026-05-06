// Generate a 16:9 PowerPoint deck (.pptx) that mirrors the website's design
// with shortened, scannable copy and cute drawn-animal decorations. Run with:
//
//     npm run pitch-pptx
//
// Output:
//     ./pitch-deck.pptx        (the editable PowerPoint file)
//
// The script reuses the screenshots captured by the PDF deck script if present
// (deck-assets/screenshots/*.png) and re-captures them automatically if missing,
// so the .pptx always reflects the live site.

import PptxGenJS from 'pptxgenjs'
import { chromium } from 'playwright'
import QRCode from 'qrcode'
import fs from 'node:fs/promises'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE = 'https://invisionueducationplayful-paws.vercel.app'
const HERO_IMAGE_URL =
  'https://i.pinimg.com/736x/16/bd/d9/16bdd92a5093b8166b4b31f322536220.jpg'

const ASSETS = path.resolve('./assets/deck')
const SHOTS_DIR = path.resolve('./deck-assets/screenshots')
const FINAL_PPTX = path.resolve('./pitch-deck.pptx')
const HERO_FILE = path.join(ASSETS, 'hero.jpg')

// Palette (hex without #, as pptxgenjs expects)
const C = {
  bg: 'FAF6F0',
  teal: '1A5C52',
  tealDark: '134A42',
  tealSoft: 'CFE3C9',
  orange: 'C8773A',
  orangeSoft: 'F4D5BA',
  dark: '1F1F1F',
  muted: '5A5A5A',
  warm: 'F4EBE0',
  border: 'D9D0C2',
  redSoft: 'FFEBEE',
  redText: 'C62828',
  greenSoft: 'E8F5E9',
  greenText: '2E7D32',
  white: 'FFFFFF',
}

const FONT = 'Inter'
const FONT_DISPLAY = 'Plus Jakarta Sans'

// 16:9 widescreen: 13.333 x 7.5 inches
const SLIDE_W = 13.333
const SLIDE_H = 7.5
const TOTAL = 18

// ---------------------------------------------------------------------------
// Asset prep (live screenshots, hero, drawn animals)
// ---------------------------------------------------------------------------

async function ensureHero() {
  try {
    await fs.access(HERO_FILE)
    return
  } catch {
    /* fetch below */
  }
  console.log('  downloading hero image...')
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const res = await ctx.request.get(HERO_IMAGE_URL)
  const buf = await res.body()
  await fs.mkdir(ASSETS, { recursive: true })
  await fs.writeFile(HERO_FILE, buf)
  await browser.close()
}

async function ensureScreenshots() {
  const required = ['animals.png', 'profile.png', 'apply.png', 'donate.png']
  let allExist = true
  for (const f of required) {
    try {
      await fs.access(path.join(SHOTS_DIR, f))
    } catch {
      allExist = false
      break
    }
  }
  if (allExist) {
    console.log('  reusing existing screenshots')
    return
  }
  console.log('  capturing fresh screenshots from live site...')
  await fs.mkdir(SHOTS_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  })

  async function capture(routePath, selector, fileName) {
    const page = await context.newPage()
    await page.goto(BASE + routePath, { waitUntil: 'domcontentloaded' })
    if (selector) {
      try {
        await page.waitForSelector(selector, { timeout: 12000 })
      } catch {
        /* fall through */
      }
    }
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(SHOTS_DIR, fileName), fullPage: true })
    await page.close()
  }

  await capture('/animals', 'div[role="button"]', 'animals.png')

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
    await capture(`/animal/${animalId}`, 'h1', 'profile.png')
    await capture(`/apply/${animalId}`, 'form, h1', 'apply.png')
  }
  await capture('/', '.charity-strip', 'donate.png')
  await browser.close()
}

// ---------------------------------------------------------------------------
// pptxgenjs helpers
// ---------------------------------------------------------------------------

/** Add a full-bleed cream background rectangle to a slide. */
function bg(slide, color = C.bg) {
  slide.addShape('rect', {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { color },
    line: { type: 'none' },
  })
}

/** Add the small footer with brand mark + page number. */
function footer(slide, num) {
  slide.addText('PlayFul Paws', {
    x: 0.5, y: 7.05, w: 3, h: 0.3,
    fontFace: FONT, fontSize: 10, color: C.teal, bold: true,
    valign: 'middle', align: 'left',
  })
  slide.addText(`${num} / ${TOTAL}`, {
    x: SLIDE_W - 3.5, y: 7.05, w: 3, h: 0.3,
    fontFace: FONT, fontSize: 10, color: C.muted,
    valign: 'middle', align: 'right',
  })
}

/** Eyebrow tag (uppercase orange). */
function eyebrow(slide, text, x, y) {
  slide.addText(text, {
    x, y, w: 8, h: 0.35,
    fontFace: FONT, fontSize: 12, color: C.orange, bold: true,
    charSpacing: 5,
  })
}

/** Short orange dash separator. */
function dash(slide, x, y) {
  slide.addShape('rect', {
    x, y, w: 0.55, h: 0.05,
    fill: { color: C.orange },
    line: { type: 'none' },
  })
}

/** Add a paw illustration in a corner (uses drawn-paws.png with low opacity via stretch + transparency). */
function pawDeco(slide, opts) {
  const { x, y, w, h, rotate = 0 } = opts
  slide.addImage({
    path: path.join(ASSETS, 'drawn-paws.png'),
    x, y, w, h,
    transparency: opts.transparency ?? 70,
    rotate,
  })
}

// ---------------------------------------------------------------------------
// Slide builders
// ---------------------------------------------------------------------------

function slide01_cover(p) {
  const s = p.addSlide()
  bg(s)

  // Drawn cat+dog illustration, big, on the right
  s.addImage({
    path: path.join(ASSETS, 'drawn-cat-dog.png'),
    x: 6.6, y: 1.3, w: 6.4, h: 4.3,
  })

  s.addText('Final Project · Pitch Deck', {
    x: 0.7, y: 0.7, w: 6, h: 0.4,
    fontFace: FONT, fontSize: 14, color: C.orange, bold: true, charSpacing: 5,
  })
  s.addText([
    { text: 'PlayFul', options: { color: C.teal } },
    { text: '\nPaws', options: { color: C.orange } },
  ], {
    x: 0.7, y: 1.4, w: 6.5, h: 3.6,
    fontFace: FONT_DISPLAY, fontSize: 110, bold: true,
  })
  s.addText('A digital home for the “Comes” Animal Shelter.', {
    x: 0.7, y: 5.2, w: 6.5, h: 0.6,
    fontFace: FONT, fontSize: 18, color: C.muted, italic: true,
  })

  s.addText('Balaussa Satymbek · Milena Gukengeimer · Zarina Doszhanova · Aruzhan Yerkinova', {
    x: 0.7, y: 6.5, w: 12, h: 0.35,
    fontFace: FONT, fontSize: 13, color: C.dark, bold: true,
  })
  s.addText('Foundations of Computational Thinking · Foundation Year 2025-2026', {
    x: 0.7, y: 6.85, w: 12, h: 0.35,
    fontFace: FONT, fontSize: 11, color: C.muted,
  })
}

function slide02_hook(p) {
  const s = p.addSlide()
  bg(s)
  s.addImage({ path: HERO_FILE, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H, sizing: { type: 'cover', w: SLIDE_W, h: SLIDE_H } })
  // Dark overlay
  s.addShape('rect', {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { color: '000000', transparency: 35 },
    line: { type: 'none' },
  })

  s.addText('A QUICK QUESTION', {
    x: 0.9, y: 2.2, w: 8, h: 0.4,
    fontFace: FONT, fontSize: 16, color: C.orange, bold: true, charSpacing: 8,
  })
  s.addText([
    { text: 'Have you ever seen a ' },
    { text: 'stray', options: { color: C.orange, bold: true } },
    { text: '\nand wished you could ' },
    { text: 'help?', options: { color: C.orange, bold: true } },
  ], {
    x: 0.9, y: 2.8, w: 11, h: 3,
    fontFace: FONT_DISPLAY, fontSize: 56, bold: true, color: C.white,
    valign: 'top',
  })
}

function slide03_client(p) {
  const s = p.addSlide()
  bg(s)
  pawDeco(s, { x: 11.4, y: 0.3, w: 1.5, h: 1.5, rotate: 18, transparency: 78 })

  // Photo on the right
  s.addImage({ path: HERO_FILE, x: 7.6, y: 0.6, w: 5.2, h: 6, sizing: { type: 'cover', w: 5.2, h: 6 } })
  // Border on photo
  s.addShape('rect', {
    x: 7.6, y: 0.6, w: 5.2, h: 6,
    fill: { type: 'none' }, line: { color: C.teal, width: 3 },
  })

  eyebrow(s, 'OUR CLIENT', 0.7, 0.7)
  s.addText([
    { text: 'Yulia\n', options: { color: C.teal } },
    { text: 'Snegireva', options: { color: C.dark } },
  ], {
    x: 0.7, y: 1.2, w: 7, h: 2.6,
    fontFace: FONT_DISPLAY, fontSize: 80, bold: true,
  })
  dash(s, 0.7, 4)

  s.addText('Founder · “Comes” Shelter', {
    x: 0.7, y: 4.3, w: 7, h: 0.5,
    fontFace: FONT, fontSize: 22, color: C.dark, bold: true,
  })
  s.addText('📍  Kainar village · 37 km from Almaty', {
    x: 0.7, y: 4.95, w: 7, h: 0.4,
    fontFace: FONT, fontSize: 16, color: C.muted,
  })
  s.addText('17 years of rescues · with her brother Sergei.', {
    x: 0.7, y: 5.4, w: 7, h: 0.4,
    fontFace: FONT, fontSize: 16, color: C.muted,
  })
  footer(s, 3)
}

function slide04_scale(p) {
  const s = p.addSlide()
  bg(s)
  eyebrow(s, 'COMES SHELTER · AT A GLANCE', 0.7, 0.6)
  s.addText('Two people. One mission.', {
    x: 0.7, y: 1, w: 12, h: 1.2,
    fontFace: FONT_DISPLAY, fontSize: 56, bold: true, color: C.dark,
  })
  dash(s, 0.7, 2.3)

  // 4 stat cards
  const tiles = [
    { num: '17+', label: 'YEARS OF RESCUE', color: C.teal },
    { num: '350', label: 'DOGS', color: C.teal },
    { num: '40+', label: 'CATS', color: C.teal },
    { num: '2', label: 'PEOPLE RUNNING IT', color: C.orange },
  ]
  const tileW = 2.7
  const tileH = 3
  const startX = 0.7
  const gap = 0.3
  tiles.forEach((t, i) => {
    const x = startX + i * (tileW + gap)
    const y = 3
    s.addShape('roundRect', {
      x, y, w: tileW, h: tileH,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.2,
    })
    s.addText(t.num, {
      x, y: y + 0.35, w: tileW, h: 1.7,
      fontFace: FONT_DISPLAY, fontSize: 90, bold: true,
      color: t.color, align: 'center', valign: 'middle',
    })
    s.addText(t.label, {
      x, y: y + 2.15, w: tileW, h: 0.6,
      fontFace: FONT, fontSize: 12, color: C.muted, bold: true,
      align: 'center', valign: 'middle', charSpacing: 5,
    })
  })

  pawDeco(s, { x: 11.5, y: 0.3, w: 1.4, h: 1.4, rotate: -14, transparency: 80 })
  footer(s, 4)
}

function slide05_viktoria(p) {
  const s = p.addSlide()
  bg(s)
  pawDeco(s, { x: 0.4, y: 6, w: 1.2, h: 1.2, rotate: -22, transparency: 80 })

  eyebrow(s, 'WHY THIS MATTERS', 0.7, 0.6)
  s.addText([
    { text: 'Viktoria.', options: { color: C.orange } },
  ], {
    x: 0.7, y: 1, w: 12, h: 1.4,
    fontFace: FONT_DISPLAY, fontSize: 96, bold: true,
  })
  dash(s, 0.7, 2.55)

  s.addText('A stray cat. A neighbor. A chemical solvent.', {
    x: 0.7, y: 2.85, w: 12, h: 0.6,
    fontFace: FONT, fontSize: 24, color: C.dark, italic: true,
  })

  // 3 fact cards
  const facts = [
    { kicker: 'CONDITION', body: 'Critical' },
    { kicker: 'TREATMENT', body: '3 skin-graft surgeries' },
    { kicker: 'FUNDED BY', body: 'Instagram followers' },
  ]
  const cardW = 4
  const cardH = 2.6
  const startX = 0.7
  const gap = 0.3
  facts.forEach((f, i) => {
    const x = startX + i * (cardW + gap)
    const y = 3.9
    s.addShape('roundRect', {
      x, y, w: cardW, h: cardH,
      fill: { color: C.warm },
      line: { color: C.orangeSoft, width: 1.5 },
      rectRadius: 0.2,
    })
    s.addText(f.kicker, {
      x: x + 0.3, y: y + 0.4, w: cardW - 0.6, h: 0.4,
      fontFace: FONT, fontSize: 12, color: C.muted, bold: true, charSpacing: 6,
    })
    s.addText(f.body, {
      x: x + 0.3, y: y + 0.9, w: cardW - 0.6, h: 1.5,
      fontFace: FONT_DISPLAY, fontSize: 30, bold: true, color: C.dark,
      valign: 'top',
    })
  })

  footer(s, 5)
}

function slide06_problem(p) {
  const s = p.addSlide()
  bg(s)
  eyebrow(s, 'THE PROBLEM', 0.7, 0.6)
  s.addText('Many strays.\nOne person.', {
    x: 0.7, y: 1, w: 12, h: 2.4,
    fontFace: FONT_DISPLAY, fontSize: 64, bold: true, color: C.dark, lineSpacingMultiple: 0.95,
  })
  dash(s, 0.7, 3.5)

  // Two side-by-side cards
  const cards = [
    { title: 'In Kazakhstan', body: 'Few official shelters.\n5-day euthanasia limit at many.', color: C.orange },
    { title: 'At Comes', body: '5-10 rescues / month.\n50 inquiries in March alone.', color: C.teal },
  ]
  const cardW = 6
  const cardH = 2.7
  const startX = 0.7
  const gap = 0.4
  cards.forEach((c, i) => {
    const x = startX + i * (cardW + gap)
    const y = 4
    s.addShape('roundRect', {
      x, y, w: cardW, h: cardH,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.15,
    })
    // Left accent bar
    s.addShape('rect', {
      x, y, w: 0.12, h: cardH,
      fill: { color: c.color }, line: { type: 'none' },
    })
    s.addText(c.title, {
      x: x + 0.4, y: y + 0.4, w: cardW - 0.6, h: 0.6,
      fontFace: FONT_DISPLAY, fontSize: 26, bold: true, color: c.color,
    })
    s.addText(c.body, {
      x: x + 0.4, y: y + 1.05, w: cardW - 0.6, h: 1.5,
      fontFace: FONT, fontSize: 18, color: C.dark, lineSpacingMultiple: 1.4,
    })
  })

  footer(s, 6)
}

function slide07_dfdOld(p) {
  const s = p.addSlide()
  bg(s)
  eyebrow(s, 'CURRENT METHOD · DFD', 0.7, 0.6)
  s.addText('Today: scattered everywhere.', {
    x: 0.7, y: 1, w: 12, h: 0.9,
    fontFace: FONT_DISPLAY, fontSize: 40, bold: true, color: C.dark,
  })
  dash(s, 0.7, 2.05)

  // 6 app cards on the left, big arrow, "Yulia" on the right
  const apps = [
    { label: 'Instagram', sub: 'DMs + posts' },
    { label: 'WhatsApp #1', sub: 'Questions' },
    { label: 'WhatsApp #2', sub: 'Adoptions' },
    { label: 'Facebook', sub: 'Posts' },
    { label: 'Excel', sub: 'Rarely updated' },
    { label: 'Two phones', sub: '24/7' },
  ]
  const startX = 0.7
  const startY = 2.6
  const cardW = 1.95
  const cardH = 1.7
  const gapX = 0.15
  const gapY = 0.15
  apps.forEach((a, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = startX + col * (cardW + gapX)
    const y = startY + row * (cardH + gapY)
    s.addShape('roundRect', {
      x, y, w: cardW, h: cardH,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.12,
    })
    s.addText(a.label, {
      x: x + 0.1, y: y + 0.35, w: cardW - 0.2, h: 0.6,
      fontFace: FONT, fontSize: 14, color: C.dark, bold: true, align: 'center',
    })
    s.addText(a.sub, {
      x: x + 0.1, y: y + 0.95, w: cardW - 0.2, h: 0.5,
      fontFace: FONT, fontSize: 10, color: C.muted, align: 'center',
    })
  })

  // Arrow
  s.addText('→', {
    x: 6.7, y: 3.5, w: 1, h: 1,
    fontFace: FONT_DISPLAY, fontSize: 60, color: C.orange, align: 'center', valign: 'middle', bold: true,
  })

  // Yulia card (right)
  s.addShape('roundRect', {
    x: 8.1, y: 2.6, w: 4.5, h: 3.7,
    fill: { color: C.warm },
    line: { color: C.orange, width: 2 },
    rectRadius: 0.15,
  })
  s.addImage({
    path: path.join(ASSETS, 'drawn-paws.png'),
    x: 9.55, y: 2.85, w: 1.6, h: 1.6,
    transparency: 0,
  })
  s.addText('Yulia', {
    x: 8.1, y: 4.6, w: 4.5, h: 0.8,
    fontFace: FONT_DISPLAY, fontSize: 38, bold: true, color: C.dark, align: 'center',
  })
  s.addText('One person. 24/7.', {
    x: 8.1, y: 5.5, w: 4.5, h: 0.5,
    fontFace: FONT, fontSize: 14, color: C.muted, align: 'center', italic: true,
  })

  footer(s, 7)
}

function slide08_requirements(p) {
  const s = p.addSlide()
  bg(s)
  eyebrow(s, 'WHAT WE NEEDED', 0.7, 0.6)
  s.addText('Four building blocks.', {
    x: 0.7, y: 1, w: 12, h: 0.9,
    fontFace: FONT_DISPLAY, fontSize: 44, bold: true, color: C.dark,
  })
  dash(s, 0.7, 2.05)

  const tiles = [
    { icon: '🗂️', title: 'Database', sub: 'Searchable profiles' },
    { icon: '🔍', title: 'Filters', sub: 'Self-serve browsing' },
    { icon: '📋', title: 'Form', sub: 'Trackable applications' },
    { icon: '🔔', title: 'Dashboard', sub: 'One place for the admin' },
  ]
  const cardW = 2.85
  const cardH = 3.4
  const startX = 0.7
  const gap = 0.3
  tiles.forEach((t, i) => {
    const x = startX + i * (cardW + gap)
    const y = 2.7
    s.addShape('roundRect', {
      x, y, w: cardW, h: cardH,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.15,
    })
    s.addText(t.icon, {
      x, y: y + 0.4, w: cardW, h: 1.2,
      fontFace: FONT_DISPLAY, fontSize: 64, align: 'center', valign: 'middle',
    })
    s.addText(t.title, {
      x, y: y + 1.7, w: cardW, h: 0.6,
      fontFace: FONT_DISPLAY, fontSize: 26, bold: true, color: C.teal, align: 'center',
    })
    s.addText(t.sub, {
      x: x + 0.2, y: y + 2.4, w: cardW - 0.4, h: 0.7,
      fontFace: FONT, fontSize: 14, color: C.muted, align: 'center',
    })
  })

  footer(s, 8)
}

function slide09_dfdNew(p) {
  const s = p.addSlide()
  bg(s)
  eyebrow(s, 'NEW METHOD · DFD', 0.7, 0.6)
  s.addText('One platform. Clean roles.', {
    x: 0.7, y: 1, w: 12, h: 0.9,
    fontFace: FONT_DISPLAY, fontSize: 40, bold: true, color: C.dark,
  })
  dash(s, 0.7, 2.05)

  // User box (left)
  s.addShape('roundRect', {
    x: 0.7, y: 3, w: 2.4, h: 2.2,
    fill: { color: C.tealSoft },
    line: { color: C.teal, width: 2, dashType: 'dash' },
    rectRadius: 0.15,
  })
  s.addText('User', {
    x: 0.7, y: 3.4, w: 2.4, h: 0.7,
    fontFace: FONT_DISPLAY, fontSize: 28, bold: true, color: C.tealDark, align: 'center',
  })
  s.addText('Adopter', {
    x: 0.7, y: 4.1, w: 2.4, h: 0.5,
    fontFace: FONT, fontSize: 14, color: C.muted, align: 'center',
  })

  // Arrow
  s.addText('→', {
    x: 3.15, y: 3.85, w: 0.6, h: 0.5,
    fontFace: FONT_DISPLAY, fontSize: 32, color: C.teal, align: 'center', valign: 'middle', bold: true,
  })

  // 4 process boxes (center 2x2 grid)
  const procs = [
    { num: '1.0', title: 'Browse' },
    { num: '2.0', title: 'Filter' },
    { num: '3.0', title: 'Profile' },
    { num: '4.0', title: 'Apply', accent: true },
  ]
  const procW = 2.5
  const procH = 1.05
  const procStartX = 3.85
  const procStartY = 2.95
  const procGapX = 0.15
  const procGapY = 0.1
  procs.forEach((p, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = procStartX + col * (procW + procGapX)
    const y = procStartY + row * (procH + procGapY)
    s.addShape('roundRect', {
      x, y, w: procW, h: procH,
      fill: { color: C.white },
      line: { color: p.accent ? C.orange : C.teal, width: 2 },
      rectRadius: 0.1,
    })
    s.addText(p.num, {
      x, y: y + 0.1, w: procW, h: 0.4,
      fontFace: FONT_DISPLAY, fontSize: 16, bold: true, color: p.accent ? C.orange : C.teal, align: 'center',
    })
    s.addText(p.title, {
      x, y: y + 0.5, w: procW, h: 0.5,
      fontFace: FONT_DISPLAY, fontSize: 20, bold: true, color: C.dark, align: 'center',
    })
  })

  // Arrow
  s.addText('→', {
    x: 9.25, y: 3.85, w: 0.6, h: 0.5,
    fontFace: FONT_DISPLAY, fontSize: 32, color: C.orange, align: 'center', valign: 'middle', bold: true,
  })

  // Admin box (right)
  s.addShape('roundRect', {
    x: 9.95, y: 3, w: 2.4, h: 2.2,
    fill: { color: 'FFF3E0' },
    line: { color: C.orange, width: 2, dashType: 'dash' },
    rectRadius: 0.15,
  })
  s.addText('Admin', {
    x: 9.95, y: 3.4, w: 2.4, h: 0.7,
    fontFace: FONT_DISPLAY, fontSize: 28, bold: true, color: C.orange, align: 'center',
  })
  s.addText('Yulia · Shelter', {
    x: 9.95, y: 4.1, w: 2.4, h: 0.5,
    fontFace: FONT, fontSize: 14, color: C.muted, align: 'center',
  })

  // Data stores below (3 strips)
  const stores = ['D1 · Animals DB', 'D2 · Applications DB', 'D3 · Shelter Info DB']
  stores.forEach((label, i) => {
    const x = 0.7 + i * 4.05
    const w = 3.85
    s.addShape('roundRect', {
      x, y: 5.6, w, h: 0.7,
      fill: { color: C.warm },
      line: { type: 'none' },
      rectRadius: 0.1,
    })
    s.addText(label, {
      x, y: 5.6, w, h: 0.7,
      fontFace: FONT, fontSize: 14, color: C.dark, bold: true,
      align: 'center', valign: 'middle',
    })
  })

  footer(s, 9)
}

function featureSlide(p, num, label, title, screenshot, slideNum) {
  const s = p.addSlide()
  bg(s)
  pawDeco(s, { x: 11.5, y: 0.3, w: 1.3, h: 1.3, rotate: 18, transparency: 82 })

  eyebrow(s, `MVP · FEATURE ${num}`, 0.7, 0.6)
  s.addText(title, {
    x: 0.7, y: 1, w: 5.5, h: 1.6,
    fontFace: FONT_DISPLAY, fontSize: 50, bold: true, color: C.dark, lineSpacingMultiple: 0.95,
  })
  dash(s, 0.7, 2.8)
  s.addText(label, {
    x: 0.7, y: 3.1, w: 5.5, h: 1.5,
    fontFace: FONT, fontSize: 18, color: C.muted, italic: true, lineSpacingMultiple: 1.4,
  })

  // Screenshot on the right
  s.addImage({
    path: screenshot,
    x: 6.6, y: 0.6, w: 6.2, h: 6.2,
    sizing: { type: 'cover', w: 6.2, h: 6.2 },
  })
  s.addShape('rect', {
    x: 6.6, y: 0.6, w: 6.2, h: 6.2,
    fill: { type: 'none' }, line: { color: C.border, width: 1 },
  })

  footer(s, slideNum)
}

function slide14_testingR1(p) {
  const s = p.addSlide()
  bg(s)
  eyebrow(s, 'TESTING · ROUND 1', 0.7, 0.6)
  s.addText([
    { text: '3 students. ' },
    { text: '3 problems.', options: { color: C.orange } },
  ], {
    x: 0.7, y: 1, w: 12, h: 1.1,
    fontFace: FONT_DISPLAY, fontSize: 50, bold: true, color: C.dark,
  })
  dash(s, 0.7, 2.3)

  const testers = [
    { name: 'Aidar', issue: 'Site purpose unclear' },
    { name: 'Amira', issue: 'Form did not submit' },
    { name: 'Ayaulim', issue: 'No success message' },
  ]
  const cardW = 3.85
  const cardH = 3.6
  const startX = 0.7
  const gap = 0.3
  testers.forEach((t, i) => {
    const x = startX + i * (cardW + gap)
    const y = 2.85
    s.addShape('roundRect', {
      x, y, w: cardW, h: cardH,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.15,
    })
    // Avatar
    s.addShape('ellipse', {
      x: x + (cardW - 1.4) / 2, y: y + 0.4, w: 1.4, h: 1.4,
      fill: { color: C.teal }, line: { type: 'none' },
    })
    s.addText(t.name[0], {
      x: x + (cardW - 1.4) / 2, y: y + 0.4, w: 1.4, h: 1.4,
      fontFace: FONT_DISPLAY, fontSize: 36, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    })
    s.addText(t.name, {
      x, y: y + 1.95, w: cardW, h: 0.5,
      fontFace: FONT_DISPLAY, fontSize: 24, bold: true, color: C.dark, align: 'center',
    })
    // Issue tag (pill)
    s.addShape('roundRect', {
      x: x + 0.4, y: y + 2.7, w: cardW - 0.8, h: 0.55,
      fill: { color: C.redSoft }, line: { type: 'none' }, rectRadius: 0.275,
    })
    s.addText('✗  ' + t.issue, {
      x: x + 0.4, y: y + 2.7, w: cardW - 0.8, h: 0.55,
      fontFace: FONT, fontSize: 13, bold: true, color: C.redText,
      align: 'center', valign: 'middle',
    })
  })

  footer(s, 14)
}

function slide15_testingR2(p) {
  const s = p.addSlide()
  bg(s)
  eyebrow(s, 'TESTING · ROUND 2', 0.7, 0.6)
  s.addText([
    { text: 'Fixed. ' },
    { text: '100% pass.', options: { color: C.teal } },
  ], {
    x: 0.7, y: 1, w: 12, h: 1.1,
    fontFace: FONT_DISPLAY, fontSize: 50, bold: true, color: C.dark,
  })
  dash(s, 0.7, 2.3)

  const testers = [
    { name: 'Rasul', role: 'Student' },
    { name: 'Niyaz', role: 'CRE engineer' },
    { name: 'Nurdaulet', role: 'Math teacher' },
  ]
  const cardW = 3.85
  const cardH = 3.6
  const startX = 0.7
  const gap = 0.3
  testers.forEach((t, i) => {
    const x = startX + i * (cardW + gap)
    const y = 2.85
    s.addShape('roundRect', {
      x, y, w: cardW, h: cardH,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.15,
    })
    s.addShape('ellipse', {
      x: x + (cardW - 1.4) / 2, y: y + 0.4, w: 1.4, h: 1.4,
      fill: { color: C.teal }, line: { type: 'none' },
    })
    s.addText(t.name[0], {
      x: x + (cardW - 1.4) / 2, y: y + 0.4, w: 1.4, h: 1.4,
      fontFace: FONT_DISPLAY, fontSize: 36, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    })
    s.addText(t.name, {
      x, y: y + 1.95, w: cardW, h: 0.5,
      fontFace: FONT_DISPLAY, fontSize: 22, bold: true, color: C.dark, align: 'center',
    })
    s.addText(t.role, {
      x, y: y + 2.4, w: cardW, h: 0.4,
      fontFace: FONT, fontSize: 13, color: C.muted, align: 'center',
    })
    s.addShape('roundRect', {
      x: x + 0.4, y: y + 2.85, w: cardW - 0.8, h: 0.55,
      fill: { color: C.greenSoft }, line: { type: 'none' }, rectRadius: 0.275,
    })
    s.addText('✓  Passed', {
      x: x + 0.4, y: y + 2.85, w: cardW - 0.8, h: 0.55,
      fontFace: FONT, fontSize: 13, bold: true, color: C.greenText,
      align: 'center', valign: 'middle',
    })
  })

  footer(s, 15)
}

function slide16_future(p) {
  const s = p.addSlide()
  bg(s)
  eyebrow(s, 'EVALUATION & FUTURE', 0.7, 0.6)
  s.addText("What's next.", {
    x: 0.7, y: 1, w: 12, h: 0.9,
    fontFace: FONT_DISPLAY, fontSize: 50, bold: true, color: C.dark,
  })
  dash(s, 0.7, 2.05)

  const cards = [
    { title: 'Now', body: 'Live on Vercel.\nTwo testing rounds passed.', color: C.teal },
    { title: 'Limits', body: 'Manual data entry.\nNo i18n yet.\nNo native admin UI.', color: C.muted },
    { title: 'Next', body: 'Admin dashboard.\nRussian + Kazakh.\nIG bio link.', color: C.orange },
  ]
  const cardW = 3.95
  const cardH = 3.5
  const startX = 0.7
  const gap = 0.3
  cards.forEach((c, i) => {
    const x = startX + i * (cardW + gap)
    const y = 2.7
    s.addShape('roundRect', {
      x, y, w: cardW, h: cardH,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.15,
    })
    s.addShape('rect', {
      x, y, w: cardW, h: 0.18,
      fill: { color: c.color }, line: { type: 'none' },
    })
    s.addText(c.title, {
      x: x + 0.4, y: y + 0.5, w: cardW - 0.6, h: 0.7,
      fontFace: FONT_DISPLAY, fontSize: 28, bold: true, color: c.color,
    })
    s.addText(c.body, {
      x: x + 0.4, y: y + 1.3, w: cardW - 0.6, h: 2,
      fontFace: FONT, fontSize: 17, color: C.dark, lineSpacingMultiple: 1.5,
    })
  })

  footer(s, 16)
}

function slide17_cta(p, qrDataUri) {
  const s = p.addSlide()
  bg(s)

  // Big QR on the right
  // White card behind QR
  s.addShape('roundRect', {
    x: 7.4, y: 1.4, w: 5.2, h: 5.2,
    fill: { color: C.white },
    line: { color: C.teal, width: 4 },
    rectRadius: 0.25,
  })
  s.addImage({
    data: qrDataUri,
    x: 7.7, y: 1.7, w: 4.6, h: 4.6,
  })
  s.addText('Scan to visit', {
    x: 7.4, y: 6.7, w: 5.2, h: 0.4,
    fontFace: FONT, fontSize: 14, color: C.tealDark, bold: true, align: 'center',
  })

  // Left side text
  eyebrow(s, 'TRY IT LIVE', 0.7, 0.7)
  s.addText([
    { text: 'Scan,\nbrowse,\n' },
    { text: 'adopt or donate.', options: { color: C.orange } },
  ], {
    x: 0.7, y: 1.2, w: 6.5, h: 4,
    fontFace: FONT_DISPLAY, fontSize: 64, bold: true, color: C.dark, lineSpacingMultiple: 0.95,
  })
  dash(s, 0.7, 5.4)
  s.addText('100% to the “Comes” Public Foundation. No intermediaries.', {
    x: 0.7, y: 5.7, w: 6.5, h: 0.6,
    fontFace: FONT, fontSize: 14, color: C.muted, italic: true,
  })
  s.addText('@comes.kz.almaty   ·   +7 701 723 01 04', {
    x: 0.7, y: 6.3, w: 6.5, h: 0.4,
    fontFace: FONT, fontSize: 13, color: C.dark, bold: true,
  })

  footer(s, 17)
}

function slide18_thanks(p) {
  const s = p.addSlide()
  bg(s)

  // Drawn cat-dog illustration centered
  s.addImage({
    path: path.join(ASSETS, 'drawn-cat-dog.png'),
    x: 4.2, y: 2.7, w: 5, h: 3.4,
  })

  s.addText('THANK YOU', {
    x: 0, y: 0.9, w: SLIDE_W, h: 0.5,
    fontFace: FONT, fontSize: 16, color: C.orange, bold: true,
    charSpacing: 12, align: 'center',
  })
  s.addText([
    { text: 'PlayFul ', options: { color: C.teal } },
    { text: 'Paws', options: { color: C.orange } },
  ], {
    x: 0, y: 1.45, w: SLIDE_W, h: 1.4,
    fontFace: FONT_DISPLAY, fontSize: 90, bold: true, align: 'center',
  })
  s.addText('Balaussa Satymbek · Milena Gukengeimer · Zarina Doszhanova · Aruzhan Yerkinova', {
    x: 0, y: 6.3, w: SLIDE_W, h: 0.4,
    fontFace: FONT, fontSize: 13, color: C.dark, bold: true, align: 'center',
  })
  s.addText('Foundations of Computational Thinking · Foundation Year 2025-2026', {
    x: 0, y: 6.7, w: SLIDE_W, h: 0.35,
    fontFace: FONT, fontSize: 11, color: C.muted, align: 'center',
  })
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function main() {
  const startedAt = Date.now()

  console.log('\nPreparing assets:')
  await ensureHero()
  await ensureScreenshots()

  console.log('\nGenerating QR code...')
  const qrDataUri = await QRCode.toDataURL(BASE, {
    width: 1040,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: `#${C.tealDark}`, light: '#FFFFFF' },
  })

  console.log('\nBuilding PowerPoint deck...')
  const pres = new PptxGenJS()
  pres.layout = 'LAYOUT_WIDE' // 13.333 x 7.5 inches
  pres.author = 'PlayFul Paws team'
  pres.company = 'inVision U'
  pres.title = 'PlayFul Paws - Pitch Deck'
  pres.subject = 'Final project pitch for Comes Animal Shelter'

  slide01_cover(pres);          process.stdout.write('  ✓ 01 cover\n')
  slide02_hook(pres);           process.stdout.write('  ✓ 02 hook\n')
  slide03_client(pres);         process.stdout.write('  ✓ 03 client\n')
  slide04_scale(pres);          process.stdout.write('  ✓ 04 scale\n')
  slide05_viktoria(pres);       process.stdout.write('  ✓ 05 viktoria\n')
  slide06_problem(pres);        process.stdout.write('  ✓ 06 problem\n')
  slide07_dfdOld(pres);         process.stdout.write('  ✓ 07 dfd-old\n')
  slide08_requirements(pres);   process.stdout.write('  ✓ 08 requirements\n')
  slide09_dfdNew(pres);         process.stdout.write('  ✓ 09 dfd-new\n')

  featureSlide(pres, 1, 'Browse the live catalog at /animals.', 'Catalog\n+ filters', path.join(SHOTS_DIR, 'animals.png'), 10)
  process.stdout.write('  ✓ 10 mvp catalog\n')
  featureSlide(pres, 2, 'Tap a card to open the full profile.', 'Profile pages', path.join(SHOTS_DIR, 'profile.png'), 11)
  process.stdout.write('  ✓ 11 mvp profile\n')
  featureSlide(pres, 3, 'Replaces WhatsApp DMs.', 'Adoption form', path.join(SHOTS_DIR, 'apply.png'), 12)
  process.stdout.write('  ✓ 12 mvp apply\n')
  featureSlide(pres, 4, 'QR + 5 payment methods. 100% to the foundation.', 'Donations', path.join(SHOTS_DIR, 'donate.png'), 13)
  process.stdout.write('  ✓ 13 mvp donate\n')

  slide14_testingR1(pres);      process.stdout.write('  ✓ 14 testing R1\n')
  slide15_testingR2(pres);      process.stdout.write('  ✓ 15 testing R2\n')
  slide16_future(pres);         process.stdout.write('  ✓ 16 future\n')
  slide17_cta(pres, qrDataUri); process.stdout.write('  ✓ 17 CTA\n')
  slide18_thanks(pres);         process.stdout.write('  ✓ 18 thanks\n')

  await pres.writeFile({ fileName: FINAL_PPTX })
  const stats = await fs.stat(FINAL_PPTX)
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`\nDone in ${elapsed}s`)
  console.log(`  ${FINAL_PPTX} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
}

main().catch(err => {
  console.error('\nDeck build failed:', err)
  process.exit(1)
})
