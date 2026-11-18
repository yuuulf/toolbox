import type { Favorites } from '@/lib/tools/color-favorites'
import { MAX_FAVORITES } from '@/lib/tools/color-favorites'

type Props = {
  favorites: Favorites
  onSelect: (hex: string) => void
  onRemove: (hex: string) => void
  /** 読み上げ用の件数の id。上限のとき、変換欄の星ボタンが押せない理由として参照する */
  countId: string
}

export function FavoriteColors({
  favorites,
  onSelect,
  onRemove,
  countId,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* 件数は見出しの行に置き、それだけで1行を使わない。10/10 で上限とわかるので、上限を知らせる文は出さない */}
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-lg font-semibold">お気に入り</h2>
        {/* 「3/10」は「3スラッシュ10」と読まれるため、読み上げ用の文言を別に置く */}
        <span
          aria-hidden="true"
          className="text-sm text-zinc-600 dark:text-zinc-400"
        >
          {favorites.length}/{MAX_FAVORITES}
        </span>
        <span id={countId} aria-live="polite" className="sr-only">
          {MAX_FAVORITES}件中{favorites.length}件
        </span>
      </div>

      {favorites.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          お気に入りはまだありません。カラー変換の星のボタンで登録できます。
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {favorites.map((hex) => (
            <li
              key={hex}
              className="flex items-center rounded-md border border-zinc-300 dark:border-zinc-700"
            >
              <button
                type="button"
                onClick={() => onSelect(hex)}
                title="変換欄に読み込む"
                className="flex items-center gap-2 rounded-l-md py-1 pr-2 pl-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: hex }}
                  className="size-6 rounded border border-zinc-300 dark:border-zinc-700"
                />
                <span className="font-mono text-sm">{hex}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(hex)}
                aria-label={`${hex} を削除`}
                title={`${hex} を削除`}
                className="rounded-r-md border-l border-zinc-300 p-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  aria-hidden="true"
                  focusable="false"
                  className="size-4"
                >
                  <path d="M6 6l12 12 M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
