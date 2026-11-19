'use client'

import { useId, useState } from 'react'
import { CopyButton } from '@/components/copy-button'
import type { JsonIndent, JsonResult } from '@/lib/tools/json-format'
import { formatJson, minifyJson } from '@/lib/tools/json-format'

const INDENT_OPTIONS: { value: string; label: string; indent: JsonIndent }[] = [
  { value: '2', label: '2スペース', indent: 2 },
  { value: '4', label: '4スペース', indent: 4 },
  { value: 'tab', label: 'タブ', indent: 'tab' },
]

const DEFAULT_INDENT = INDENT_OPTIONS[0]

export function JsonFormatter() {
  const inputId = useId()
  const indentId = useId()
  const outputId = useId()
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState(DEFAULT_INDENT)
  const [result, setResult] = useState<JsonResult | null>(null)

  const output = result?.ok ? result.output : ''

  // 広い画面では入力（と操作）を左の列、出力を右の列に並べ、どちらの欄も画面の下端まで広げる。
  // DOM の順序（入力 → 操作 → 出力）は変えず、Tab の順を保つ
  return (
    <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:gap-x-8">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-1 lg:basis-0">
        <div className="flex flex-col gap-1 lg:flex-1">
          {/* 出力欄の見出し行（コピーボタンあり）と高さをそろえ、2列のとき欄の上端を合わせる */}
          <div className="flex min-h-9 items-center">
            <label htmlFor={inputId} className="text-sm font-medium">
              入力
            </label>
          </div>
          <textarea
            id={inputId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={24}
            spellCheck={false}
            // rows の高さを最低にして、残りの高さを埋める
            className="w-full rounded-md border border-zinc-300 bg-transparent p-2 font-mono text-sm lg:flex-1 dark:border-zinc-700"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={indentId} className="text-sm font-medium">
              インデント
            </label>
            <select
              id={indentId}
              value={indent.value}
              onChange={(e) =>
                setIndent(
                  INDENT_OPTIONS.find((o) => o.value === e.target.value) ??
                    DEFAULT_INDENT,
                )
              }
              className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
            >
              {INDENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setResult(formatJson(input, indent.indent))}
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            整形
          </button>
          <button
            type="button"
            onClick={() => setResult(minifyJson(input))}
            className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            圧縮
          </button>
        </div>

        <div aria-live="polite">
          <ResultMessage result={result} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1 lg:flex-1 lg:basis-0">
        <div className="flex min-h-9 items-center justify-between gap-2">
          <label htmlFor={outputId} className="text-sm font-medium">
            出力
          </label>
          <CopyButton text={output} />
        </div>
        <textarea
          id={outputId}
          value={output}
          readOnly
          rows={24}
          spellCheck={false}
          className="w-full rounded-md border border-zinc-300 bg-zinc-50 p-2 font-mono text-sm lg:flex-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
    </div>
  )
}

function ResultMessage({ result }: { result: JsonResult | null }) {
  if (result === null || result.ok) return null
  if (result.kind === 'empty') {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        JSON を入力してください。
      </p>
    )
  }
  const position =
    result.line !== undefined && result.column !== undefined
      ? `（${result.line}行目 ${result.column}列目）`
      : ''
  return (
    <p className="text-sm text-red-700 dark:text-red-400">
      エラー: JSON の構文が正しくありません{position}。
      <span className="block font-mono text-xs">{result.error}</span>
    </p>
  )
}
