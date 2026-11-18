'use client'

import { useId, useState } from 'react'
import { formatHex, parseColor } from '@/lib/tools/color'

// 入力がまだ一度も解釈できていないときにピッカーが示す色
const DEFAULT_PICKER_HEX = '#000000'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  /** 入力を解釈できないときに、フォーカスが外れた後で表示するエラー */
  invalidMessage: string
  /** true なら空の入力をエラーにしない（空のときの案内は親が出す） */
  allowEmpty?: boolean
}

export function ColorField({
  label,
  value,
  onChange,
  invalidMessage,
  allowEmpty = false,
}: Props) {
  const textId = useId()
  const pickerId = useId()
  const errorId = useId()
  const parsed = parseColor(value)
  const hex = parsed.ok ? formatHex(parsed.rgb) : null
  const isInvalid = !parsed.ok && !(allowEmpty && parsed.kind === 'empty')

  // 書きかけの値（`rgb(` など）でエラーが出続けないよう、フォーカスが外れるまでは出さない
  const [showError, setShowError] = useState(false)
  const errorVisible = showError && isInvalid

  // ピッカーは #rrggbb しか受け付けないため、入力が解釈できない間は直前に解釈できた色を示す
  const [lastHex, setLastHex] = useState(DEFAULT_PICKER_HEX)
  if (hex !== null && hex !== lastHex) setLastHex(hex)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={textId} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={textId}
          type="text"
          value={value}
          onChange={(e) => {
            setShowError(false)
            onChange(e.target.value)
          }}
          onBlur={() => setShowError(true)}
          aria-invalid={errorVisible}
          aria-describedby={errorId}
          spellCheck={false}
          autoComplete="off"
          className="w-full min-w-0 rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 font-mono text-sm aria-invalid:border-red-700 dark:border-zinc-700 dark:aria-invalid:border-red-400"
        />
        <label htmlFor={pickerId} className="sr-only">
          {label}をカラーピッカーで選ぶ
        </label>
        <input
          id={pickerId}
          type="color"
          value={hex ?? lastHex}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-zinc-300 bg-transparent dark:border-zinc-700"
        />
      </div>
      <p
        id={errorId}
        aria-live="polite"
        className="text-sm text-red-700 dark:text-red-400"
      >
        {errorVisible ? invalidMessage : ''}
      </p>
    </div>
  )
}
