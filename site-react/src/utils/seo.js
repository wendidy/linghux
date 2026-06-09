export const DEFAULT_SEO = {
  title: 'Linghux | Original watercolor paintings for sale',
  description:
    'Original plein air watercolor art for sale by a Canadian artist, including Newfoundland and Colorado landscape watercolor paintings, original framed art, and affordable watercolor prints.',
}

export function buildImageAlt(item) {
  if (!item) return 'Original watercolor painting'
  const parts = [item.title, item.location, item.medium].filter(Boolean)
  return parts.length > 0 ? parts.join(' — ') : 'Original watercolor painting'
}

export function buildProductPageDescription(item) {
  if (!item) return DEFAULT_SEO.description
  const base = item.description || `Original watercolor painting from ${item.location || 'a memorable landscape'}.`
  const maxLength = 160
  if (base.length <= maxLength) return base
  return `${base.slice(0, maxLength - 3).trim()}...`
}
