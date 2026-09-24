#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const siteUrl = 'https://linghux.com'

const [{ items = [] }, { getArtworkPath }] = await Promise.all([
  import('../src/data/portfolio.js'),
  import('../src/utils/artwork.js'),
])

const pages = [
  '/',
  '/about',
  '/contact',
  '/shipping',
  '/mail-club',
  '/artwork',
  '/artwork/originals',
  '/artwork/limited-edition-prints',
  '/artwork/open-edition-prints',
  ...items
    .filter(Boolean)
    .map((item) => getArtworkPath(item.slug || item.id, item.category)),
]

const normalizePath = (pagePath) => pagePath === '/'
  ? '/'
  : `/${pagePath.replace(/^\/+|\/+$/g, '')}`

const outputRoot = path.join(__dirname, '../dist')
const template = await fs.readFile(path.join(outputRoot, 'index.html'), 'utf8')
const generated = new Set()

for (const page of pages) {
  const normalizedPath = normalizePath(page)
  if (generated.has(normalizedPath)) continue
  generated.add(normalizedPath)

  const canonicalUrl = `${siteUrl}${normalizedPath}`
  const routeHtml = template.replace(
    '<link rel="canonical" href="https://linghux.com/" />',
    `<link rel="canonical" href="${canonicalUrl}" />`,
  )

  if (normalizedPath === '/') {
    await fs.writeFile(path.join(outputRoot, 'index.html'), routeHtml, 'utf8')
    continue
  }

  const routeDirectory = path.join(outputRoot, normalizedPath.slice(1))
  await fs.mkdir(routeDirectory, { recursive: true })
  await fs.writeFile(path.join(routeDirectory, 'index.html'), routeHtml, 'utf8')
}

console.log(`Generated ${generated.size} route HTML files with canonical URLs`)
