'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ICON_BUTTON_STYLES } from './icon-button'
import { CheckIcon, CrossIcon, SaveIcon } from './icons'

// コピーボタンと同じ時間だけ結果のアイコンを見せる
const RESULT_DURATION_MS = 2000

type Status = 'idle' | 'saved' | 'failed'

const MESSAGES: Record<Exclude<Status, 'idle'>, string> = {
  saved: '保存しました',
  failed: '保存できませんでした',
}

// 失敗は × の形でも区別できるので、色は補助として付ける
const STATUS_COLORS: Record<Status, string> = {
  idle: '',
  saved: 'text-green-300 dark:text-green-700',
  failed: 'text-red-300 dark:text-red-700',
}

const STATUS_ICONS: Record<Status, ReactNode> = {
  idle: <SaveIcon />,
  saved: <CheckIcon />,
  failed: <CrossIcon />,
}

type Props = {
  /** 保存する。保存できたら true */
  onSave: () => boolean
  disabled?: boolean
}

// 保存のアイコンボタン。結果はコピーボタンと同じく、アイコンの一時的な切り替えと読み上げで伝え、画面に文字は出さない
export function SaveButton({ onSave, disabled }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleClick() {
    setStatus(onSave() ? 'saved' : 'failed')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setStatus('idle'), RESULT_DURATION_MS)
  }

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="保存"
        title="保存"
        className={`shrink-0 ${ICON_BUTTON_STYLES.primary} ${STATUS_COLORS[status]}`}
      >
        {STATUS_ICONS[status]}
      </button>
      <span aria-live="polite" className="sr-only">
        {status === 'idle' ? '' : MESSAGES[status]}
      </span>
    </span>
  )
}
