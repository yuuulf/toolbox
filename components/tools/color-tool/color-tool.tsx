'use client'

import { useState, useSyncExternalStore } from 'react'
import { formatHex, parseColor } from '@/lib/tools/color'
import type { Favorites } from '@/lib/tools/color-favorites'
import {
  canAddFavorite,
  isFavorite,
  loadFavorites,
  removeFavorite,
  saveFavorites,
  toggleFavorite,
} from '@/lib/tools/color-favorites'
import { ColorConverter } from './color-converter'
import { ContrastChecker } from './contrast-checker'
import { FavoriteColors } from './favorite-colors'

const EMPTY_FAVORITES: Favorites = []

// localStorage はプリレンダー時に読めないため、サーバーでは空の一覧を返し、
// ブラウザで初めて読むときに復元する（パスワード生成の設定と同じ仕組み）
const listeners = new Set<() => void>()
let currentFavorites: Favorites | undefined

const favoritesStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot(): Favorites {
    currentFavorites ??= loadFavorites()
    return currentFavorites
  },
  getServerSnapshot(): Favorites {
    return EMPTY_FAVORITES
  },
  set(next: Favorites) {
    // 保存に失敗しても、メモリ上の一覧でこのページ内の操作は続けられる
    currentFavorites = next
    saveFavorites(next)
    listeners.forEach((listener) => listener())
  },
}

function useFavoriteColors() {
  return useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot,
  )
}

export function ColorTool() {
  const [color, setColor] = useState('')
  const favorites = useFavoriteColors()
  const parsed = parseColor(color)
  const hex = parsed.ok ? formatHex(parsed.rgb) : null

  function handleToggleFavorite() {
    if (hex === null) return
    const result = toggleFavorite(favorites, hex)
    if (result.ok) favoritesStore.set(result.list)
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">カラー変換</h2>
        <ColorConverter
          value={color}
          onChange={setColor}
          isFavorite={hex !== null && isFavorite(favorites, hex)}
          canAddFavorite={canAddFavorite(favorites)}
          onToggleFavorite={handleToggleFavorite}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">お気に入り</h2>
        <FavoriteColors
          favorites={favorites}
          onSelect={setColor}
          onRemove={(target) =>
            favoritesStore.set(removeFavorite(favorites, target))
          }
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">コントラスト比</h2>
        <ContrastChecker />
      </section>
    </div>
  )
}
