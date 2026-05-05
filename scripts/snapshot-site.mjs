// Headless-browser snapshot of the live site, exported as a single PDF.
// Run with: npm run snapshot
//
// Output:
//   ./website-snapshot.pdf   - all pages combined, in reading order
//   ./snapshots/*.pdf        - one PDF per page (in case you want them separately)
//
// The script renders the LIVE Vercel deployment so it shows what users actually see.
// Each route is captured at desktop width (1280px) at 2x device pixel ratio for crisp text.
// Pages are emitted as a single tall PDF page, not paginated A4, so the layout reads
// continuously the way it does in a browser.

import { chromium } from 'playwright'
import { PDFDocument } from 'pdf-lib'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE = 'https://invisionueducationplayful-paws.vercel.app'
const OUT_DIR = path.resolve('./snapshots')
const FINAL_PDF = path.resolve('./website-snapshot.pdf')

const VIEWPORT_WIDTH = 1280
const SETTLE_MS = 1800

async function snapshotRoute(context, route, label) {
  process.stdout.write(`  -> ${route.padEnd(28, ' ')}`)
  const page = await context.newPage()

  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 90000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(SETTLE_MS)

  // Force any lazy stuff to render by scrolling to bottom and back up
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let y = 0
      const step = () => {
        window.scrollTo(0, y)
        y += 600
        if (y < document.documentElement.scrollHeight) {
          requestAnimationFrame(step)
        } else {
          window.scrollTo(0, 0)
          setTimeout(resolve, 400)
        }
      }
      step()
    })
  })

  const height = await page.evaluate(() =>
    Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      1024,
    ),
  )

  const buffer = await page.pdf({
    width: `${VIEWPORT_WIDTH}px`,
    height: `${height}px`,
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  })

  const filePath = path.join(OUT_DIR, `${label}.pdf`)
  await fs.writeFile(filePath, buffer)
  await page.close()

  process.stdout.write(` (${(buffer.length / 1024).toFixed(0)} KB)\n`)
  return buffer
}

async function main() {
  const startedAt = Date.now()
  await fs.mkdir(OUT_DIR, { recursive: true })

  console.log(`\nLaunching headless Chromium...`)
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: 800 },
    deviceScaleFactor: 2,
  })

  const routes = [
    { path: '/', label: '01-home' },
    { path: '/animals', label: '02-animals-catalog' },
    { path: '/story', label: '03-shelter-story' },
  ]

  // Discover a real animal id so we can also snapshot animal detail + adoption form.
  // The catalog cards are <div role="button"> with onClick={navigate(...)} - not <a href> -
  // so we click the first card and capture the resulting URL after client-side navigation.
  console.log(`Discovering an animal id from /animals...`)
  const probe = await context.newPage()
  let firstHref = null
  try {
    await probe.goto(BASE + '/animals', { waitUntil: 'domcontentloaded' })
    await probe.waitForSelector('div[role="button"]', { timeout: 15000 })
    await probe.locator('div[role="button"]').first().click()
    await probe.waitForURL(/\/animal\/.+/, { timeout: 10000 })
    firstHref = new URL(probe.url()).pathname
  } catch (err) {
    console.log(`  (could not extract an animal id: ${err.message.split('\n')[0]})`)
  }
  await probe.close()

  if (firstHref) {
    routes.push({ path: firstHref, label: '04-animal-detail' })
    const id = firstHref.split('/').pop()
    if (id) routes.push({ path: `/apply/${id}`, label: '05-adoption-form' })
    console.log(`Found ${firstHref} - will also snapshot detail + apply pages.\n`)
  } else {
    console.log(`Skipping detail + apply pages.\n`)
  }

  console.log(`Snapshotting ${routes.length} routes:`)
  const merged = await PDFDocument.create()

  for (const r of routes) {
    const buf = await snapshotRoute(context, r.path, r.label)
    const sub = await PDFDocument.load(buf)
    const pages = await merged.copyPages(sub, sub.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }

  merged.setTitle('Comes Animal Shelter (PlayFul Paws) - Live Site Snapshot')
  merged.setAuthor('PlayFul Paws team')
  merged.setSubject('Visual snapshot of the deployed site')
  merged.setProducer('Playwright + pdf-lib')

  const finalBytes = await merged.save()
  await fs.writeFile(FINAL_PDF, finalBytes)
  await browser.close()

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`\nDone in ${elapsed}s`)
  console.log(`  Combined: ${FINAL_PDF}`)
  console.log(`  Per-page: ${OUT_DIR}\\`)
}

main().catch(err => {
  console.error('\nSnapshot failed:', err)
  process.exit(1)
})
