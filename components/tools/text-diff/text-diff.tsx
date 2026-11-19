'use client'

import { useDeferredValue, useId, useMemo, useState } from 'react'
import type { CompareResult } from '@/lib/tools/text-diff'
import { MAX_LINES, compareTexts } from '@/lib/tools/text-diff'
import { DiffView } from './diff-view'

export function TextDiff() {
  const beforeId = useId()
  const afterId = useId()
  const [before, setBefore] = useState('')
  const [after, setAfter] = useState('')
  // 入力欄への反映は即時にし、差分の計算と描画は後回しにできるようにする（大きな入力でも打鍵を止めない）
  const deferredBefore = useDeferredValue(before)
  const deferredAfter = useDeferredValue(after)
  const result = useMemo(
    () => compareTexts(deferredBefore, deferredAfter),
    [deferredBefore, deferredAfter],
  )
  const message = resultMessage(result)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-x-6">
        <TextInput
          id={beforeId}
          label="変更前"
          value={before}
          onChange={setBefore}
        />
        <TextInput
          id={afterId}
          label="変更後"
          value={after}
          onChange={setAfter}
        />
      </div>
      <div className="flex flex-col gap-2">
        {/* 案内は見出しと同じ行に出し、結果欄の上に空の行を作らない */}
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-sm font-medium">比較結果</h2>
          <p
            aria-live="polite"
            className="text-sm text-zinc-600 dark:text-zinc-400"
          >
            {message}
          </p>
        </div>
        {result.ok && !result.identical && (
          // 結果が長いときはページではなくこの欄の中でスクロールする（1470×800 に収めるため）。
          // キーボードでもスクロールできるようフォーカス可能にする。
          // relative は、読み上げ用の sr-only（position: absolute）がこの欄の外へはみ出してページを伸ばさないため
          <div
            role="region"
            aria-label="比較結果"
            tabIndex={0}
            className="relative max-h-88 overflow-y-auto rounded-md border border-zinc-300 dark:border-zinc-700"
          >
            <DiffView rows={result.rows} />
          </div>
        )}
      </div>
    </div>
  )
}

function resultMessage(result: CompareResult): string {
  if (!result.ok) {
    return result.reason === 'empty'
      ? '比較するテキストを入力してください。'
      : `比較できるのは ${MAX_LINES.toLocaleString('ja-JP')} 行までです。`
  }
  return result.identical ? '差分はありません。' : ''
}

type TextInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

function TextInput({ id, label, value, onChange }: TextInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        spellCheck={false}
        className="w-full rounded-md border border-zinc-300 bg-transparent p-2 font-mono text-sm dark:border-zinc-700"
      />
    </div>
  )
}
