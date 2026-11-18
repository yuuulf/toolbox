import { readJson, writeJson } from '@/lib/storage'

export const FAVORITES_KEY = 'toolbox:color-tool:favorites'
export const MAX_FAVORITES = 10

/** 登録した順に並んだ、小文字の `#rrggbb` の配列 */
export type Favorites = readonly string[]

export type ToggleResult =
  { ok: true; list: Favorites } | { ok: false; reason: 'full' }

const HEX_PATTERN = /^#[0-9a-f]{6}$/

export function isFavorites(value: unknown): value is Favorites {
  return (
    Array.isArray(value) &&
    value.length <= MAX_FAVORITES &&
    value.every((item) => typeof item === 'string' && HEX_PATTERN.test(item)) &&
    new Set(value).size === value.length
  )
}

export function isFavorite(list: Favorites, hex: string): boolean {
  return list.includes(hex)
}

export function canAddFavorite(list: Favorites): boolean {
  return list.length < MAX_FAVORITES
}

/** 登録済みなら外し、未登録なら末尾に加える（履歴のように並びが変わらないよう、先頭には入れない） */
export function toggleFavorite(list: Favorites, hex: string): ToggleResult {
  if (isFavorite(list, hex))
    return { ok: true, list: removeFavorite(list, hex) }
  if (!canAddFavorite(list)) return { ok: false, reason: 'full' }
  return { ok: true, list: [...list, hex] }
}

export function removeFavorite(list: Favorites, hex: string): Favorites {
  return list.filter((item) => item !== hex)
}

export function loadFavorites(): Favorites {
  return readJson(FAVORITES_KEY, isFavorites, [])
}

export function saveFavorites(list: Favorites): void {
  writeJson(FAVORITES_KEY, list)
}
