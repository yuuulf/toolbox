'use client'

import { CopyButton } from '@/components/copy-button'
import { formatHex, formatHsl, formatRgb, parseColor } from '@/lib/tools/color'
import { ColorField } from './color-field'

const FORMATS = [
  { name: 'HEX', format: formatHex },
  { name: 'RGB', format: formatRgb },
  { name: 'HSL', format: formatHsl },
] as const

const INVALID_MESSAGE =
  'エラー: 色として解釈できません。#ff0000、rgb(255, 0, 0)、hsl(0, 100%, 50%) のような形式で入力してください。'

type Props = {
  value: string
  onChange: (value: string) => void
  /** 変換中の色がお気に入りに登録済みか */
  isFavorite: boolean
  canAddFavorite: boolean
  onToggleFavorite: () => void
  /** 上限のときに星ボタンの説明として結びつける、お気に入りの件数（読み上げ用）の id */
  favoritesCountId: string
}

export function ColorConverter({
  value,
  onChange,
  isFavorite,
  canAddFavorite,
  onToggleFavorite,
  favoritesCountId,
}: Props) {
  const parsed = parseColor(value)
  const rgb = parsed.ok ? parsed.rgb : null
  const hex = rgb ? formatHex(rgb) : null
  const isEmpty = !parsed.ok && parsed.kind === 'empty'
  const isFull = hex !== null && !isFavorite && !canAddFavorite

  return (
    <div className="flex flex-col gap-4">
      <ColorField
        label="色"
        value={value}
        onChange={onChange}
        invalidMessage={INVALID_MESSAGE}
        allowEmpty
      />

      <div className="flex items-center gap-3">
        {hex ? (
          <div
            role="img"
            aria-label={`${hex} のプレビュー`}
            style={{ backgroundColor: hex }}
            className="h-16 w-full rounded-md border border-zinc-300 dark:border-zinc-700"
          />
        ) : (
          // 案内のために1行を使わないよう、空のプレビュー枠の中に出す（空入力はエラーではない）
          <div className="flex h-16 w-full items-center justify-center rounded-md border border-dashed border-zinc-300 px-3 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            {isEmpty ? 'HEX・RGB・HSL のどれかで色を入力してください。' : ''}
          </div>
        )}
        <button
          type="button"
          aria-pressed={isFavorite}
          title="お気に入り"
          onClick={onToggleFavorite}
          disabled={hex === null || isFull}
          aria-describedby={isFull ? favoritesCountId : undefined}
          className="shrink-0 rounded-md border border-zinc-300 p-2 text-amber-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-amber-400 dark:hover:bg-zinc-800"
        >
          <StarIcon filled={isFavorite} />
          <span className="sr-only">お気に入り</span>
        </button>
      </div>
      <dl className="flex flex-col gap-2">
        {FORMATS.map(({ name, format }) => (
          <div key={name} className="flex items-center gap-3">
            <dt className="w-10 shrink-0 text-sm font-medium">{name}</dt>
            <dd className="min-w-0 flex-1 truncate font-mono text-sm">
              {rgb ? format(rgb) : ''}
            </dd>
            <CopyButton
              text={rgb ? format(rgb) : ''}
              label={`${name} をコピー`}
            />
          </div>
        ))}
      </dl>
    </div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  // 押された状態を色だけでなく形（塗り／線）でも区別する
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon={filled ? 'star-filled' : 'star'}
      className="size-5"
    >
      <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
    </svg>
  )
}
