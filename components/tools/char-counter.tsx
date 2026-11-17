'use client'

import { useId, useState } from 'react'
import type { TextCounts } from '@/lib/tools/char-count'
import { countText } from '@/lib/tools/char-count'

const COUNT_LABELS: { key: keyof TextCounts; label: string }[] = [
  { key: 'chars', label: '文字数' },
  { key: 'charsNoSpace', label: '空白を除いた文字数' },
  { key: 'lines', label: '行数' },
  { key: 'bytes', label: 'バイト数（UTF-8）' },
]

export function CharCounter() {
  const inputId = useId()
  const [text, setText] = useState('')
  const counts = countText(text)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium">
          テキスト
        </label>
        <textarea
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="w-full rounded-md border border-zinc-300 bg-transparent p-2 text-sm dark:border-zinc-700"
        />
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COUNT_LABELS.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <dt className="text-xs text-zinc-600 dark:text-zinc-400">
              {label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {counts[key].toLocaleString('ja-JP')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
