'use client'

import { useEffect, useRef, useState } from 'react'

const MESSAGE_DURATION_MS = 2000

type Status = 'idle' | 'copied' | 'failed'

const MESSAGES: Record<Exclude<Status, 'idle'>, string> = {
  copied: 'コピーしました',
  failed: 'コピーできませんでした',
}

type Props = {
  text: string
  /** ボタンの文言。複数のコピーボタンを区別したいときに指定する */
  label?: string
}

export function CopyButton({ text, label = 'コピー' }: Props) {
  const [status, setStatus] = useState<Status>('idle')
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
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={text === ''}
        className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {label}
      </button>
      <span
        aria-live="polite"
        className={
          status === 'failed'
            ? 'text-sm text-red-700 dark:text-red-400'
            : 'text-sm text-zinc-600 dark:text-zinc-400'
        }
      >
        {status === 'idle' ? '' : MESSAGES[status]}
      </span>
    </span>
  )
}
