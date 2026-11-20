'use client'

import { useEffect, useRef, useState } from 'react'

const MESSAGE_DURATION_MS = 2000

type Status = 'idle' | 'copied' | 'failed'

const MESSAGES: Record<Exclude<Status, 'idle'>, string> = {
  copied: 'コピーしました',
  failed: 'コピーできませんでした',
}

// 失敗は × の形でも区別できるので、色は補助として付ける
const STATUS_COLORS: Record<Status, string> = {
  idle: '',
  copied: 'text-green-700 dark:text-green-400',
  failed: 'text-red-700 dark:text-red-400',
}

type Variant = 'default' | 'subtle'

// subtle は一覧の項目の中で使う枠なしの見た目。隣に並ぶ IconButton の subtle（削除など）とそろえる
const VARIANT_STYLES: Record<Variant, string> = {
  default:
    'rounded-md border border-zinc-300 p-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800',
  subtle: 'rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800',
}

// subtle の通常時の文字色（ホバー時を含む）。結果の色（緑・赤）と同時に付けると、押した直後にポインタが
// 乗ったままのときに結果の色が上書きされるため、通常時だけ付ける
const SUBTLE_IDLE_COLOR =
  'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'

type Props = {
  text: string
  /** ボタンのアクセシブルな名前とツールチップ。複数のコピーボタンを区別したいときに指定する */
  label?: string
  /** default: 枠あり。subtle: 枠なしの薄い色（一覧の項目の中） */
  variant?: Variant
}

export function CopyButton({
  text,
  label = 'コピー',
  variant = 'default',
}: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const statusColor =
    variant === 'subtle' && status === 'idle'
      ? SUBTLE_IDLE_COLOR
      : STATUS_COLORS[status]
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      // クリップボード API が使えない・拒否された環境。出力欄は選択できるので手動コピーで代替できる
      setStatus('failed')
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setStatus('idle'), MESSAGE_DURATION_MS)
  }

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={text === ''}
        aria-label={label}
        title={label}
        className={`${VARIANT_STYLES[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${statusColor}`}
      >
        <StatusIcon status={status} />
      </button>
      {/* 結果は画面に出さず、読み上げだけで伝える（見た目はアイコンの切り替えで示す） */}
      <span aria-live="polite" className="sr-only">
        {status === 'idle' ? '' : MESSAGES[status]}
      </span>
    </span>
  )
}

const ICON_PATHS: Record<Status, string> = {
  idle: 'M8 8h11v13H8z M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1',
  copied: 'M5 12l5 5L20 7',
  failed: 'M6 6l12 12 M18 6L6 18',
}

const ICON_NAMES: Record<Status, string> = {
  idle: 'copy',
  copied: 'check',
  failed: 'x',
}

function StatusIcon({ status }: { status: Status }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon={ICON_NAMES[status]}
      className="size-4"
    >
      <path d={ICON_PATHS[status]} />
    </svg>
  )
}
