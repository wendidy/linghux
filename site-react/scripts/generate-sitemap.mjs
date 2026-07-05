#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

try {
  const [{ items = [] }, { getCanonicalArtworkPath }, { buildImageAlt, toAbsoluteUrl }] = await Promise.all([
    import('../src/data/portfolio.js'),
    import('../src/utils/artwork.js'),
    import('../src/utils/seo.js'),
  ])

  const pages = [
    '/',
    '/about',
    '/contact',
    '/shipping',
    '/artwork',
    '/artwork/originals',
    '/artwork/limited-edition-prints',
    '/artwork/open-edition-prints',
  ]

  const pageEntries = pages.map((url) => ({ url }))
  const artworkEntries = items
    .filter(Boolean)
    .map((item) => ({
      url: getCanonicalArtworkPath(item),
      images: (Array.isArray(item.images) ? item.images : [item.image])
        .filter(Boolean)
        .map((src) => ({
          loc: toAbsoluteUrl(src),
          title: `${item.title} by Wendy Zhang`,
          caption: buildImageAlt(item),
        })),
    }))

  const seenUrls = new Set()
  const urls = [...pageEntries, ...artworkEntries].filter((entry) => {
    const absoluteUrl = toAbsoluteUrl(entry.url)
    if (seenUrls.has(absoluteUrl)) return false
    seenUrls.add(absoluteUrl)
    return true
  })

  const escapeXml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ]

  for (const entry of urls) {
    xmlLines.push('  <url>')
    xmlLines.push(`    <loc>${escapeXml(toAbsoluteUrl(entry.url))}</loc>`)
    for (const image of entry.images || []) {
      xmlLines.push('    <image:image>')
      xmlLines.push(`      <image:loc>${escapeXml(image.loc)}</image:loc>`)
      if (image.title) xmlLines.push(`      <image:title>${escapeXml(image.title)}</image:title>`)
      if (image.caption) xmlLines.push(`      <image:caption>${escapeXml(image.caption)}</image:caption>`)
      xmlLines.push('    </image:image>')
    }
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
