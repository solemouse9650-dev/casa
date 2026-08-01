export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function matchesQuery(haystack: string, query: string) {
  if (!query.trim()) return true
  return normalize(haystack).includes(normalize(query))
}
