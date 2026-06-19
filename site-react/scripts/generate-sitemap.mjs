#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

try {
  const mod = await import('../src/data/portfolio.js')
  const items = mod.items || []

  const domain = 'https://shop.linghux.com'
  const pages = [
    '/',
    '/about',
    '/contact',
    '/shipping',
    '/cart',
    '/success',
    '/cancel',
    '/artwork',
    '/artwork/originals',
    '/artwork/limited-edition-prints',
    '/artwork/open-edition-prints',
  ]

  const artworkUrls = items
    .filter(Boolean)
    .map((item) => `/artwork/work/${item.slug || item.id}`)

  const urls = Array.from(new Set([...pages, ...artworkUrls]))

  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ]

  for (const u of urls) {
    xmlLines.push('  <url>')
    xmlLines.push(`    <loc>${domain}${u}</loc>`)
    xmlLines.push('  </url>')
  }

  xmlLines.push('</urlset>')

  const xml = xmlLines.join('\n') + '\n'

  const outPath = path.join(__dirname, '../public/sitemap.xml')
  await fs.writeFile(outPath, xml, 'utf8')
  console.log('Generated sitemap:', outPath, 'with', urls.length, 'entries')
} catch (err) {
  console.error('Failed to generate sitemap:', err)
  process.exit(1)
}
