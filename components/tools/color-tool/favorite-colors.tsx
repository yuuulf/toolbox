import { CopyButton } from '@/components/copy-button'
import { IconButton } from '@/components/icon-button'
import { TrashIcon } from '@/components/icons'
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
              {/* 色見本のボタンと1つのまとまりに見えるよう、境界線は外側に付ける。
                  コピーは読み込まずに1回で HEX を取り出すため。押し間違えの影響が大きい削除を端に置く */}
              <span className="flex items-center gap-0.5 self-stretch border-l border-zinc-300 px-1 dark:border-zinc-700">
                <CopyButton
                  text={hex}
                  label={`${hex} をコピー`}
                  variant="subtle"
                />
                <IconButton
                  label={`${hex} を削除`}
                  icon={<TrashIcon />}
                  onClick={() => onRemove(hex)}
                  variant="subtle"
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
