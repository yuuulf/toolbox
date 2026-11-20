'use client'

import { useId, useState } from 'react'
import { CopyButton } from '@/components/copy-button'
import { OutputView } from '@/components/output-view'
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

  // 広い画面では入力を左の列、出力を右の列に並べ、どちらの欄も画面の下端まで広げる。
  // 操作（インデント・整形・圧縮）は入力欄の見出しの行に置き、その分だけ欄を縦に広く使う（Markdownプレビューと同じ置き方）
  return (
    <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:gap-x-8">
      {/* 結果の文がないときは高さ 0 にして、入力欄と出力欄の下端をそろえる（間隔は文のほうに付ける） */}
      <div className="flex min-w-0 flex-col lg:flex-1 lg:basis-0">
        <div className="flex flex-col gap-1 lg:flex-1">
          {/* 出力欄の見出し行（コピーボタンあり）と高さをそろえ、2列のとき欄の上端を合わせる */}
          <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <label htmlFor={inputId} className="text-sm font-medium">
              入力
            </label>
            <div className="flex flex-wrap items-center gap-2">
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

        <div aria-live="polite">
          <ResultMessage result={result} />
        </div>
      </div>

      {/* contain-size で、出力が長くても列の高さが中身に引っ張られないようにする（高さは入力欄の列に合わせる） */}
      <div className="flex min-w-0 flex-col gap-1 lg:flex-1 lg:basis-0 lg:contain-size">
        <div className="flex min-h-9 items-center justify-between gap-2">
          <h2 id={outputId} className="text-sm font-medium">
            出力
          </h2>
          <CopyButton text={output} />
        </div>
        {/* 狭い画面の高さは、入力欄（rows={24}）と同じにする */}
        <OutputView
          value={output}
          labelId={outputId}
          className="h-124.5 lg:h-auto lg:flex-1"
        />
      </div>
    </div>
  )
}

function ResultMessage({ result }: { result: JsonResult | null }) {
  if (result === null || result.ok) return null
  if (result.kind === 'empty') {
    return (
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        JSON を入力してください。
      </p>
    )
  }
  const position =
    result.line !== undefined && result.column !== undefined
      ? `（${result.line}行目 ${result.column}列目）`
      : ''
  return (
    <p className="mt-3 text-sm text-red-700 dark:text-red-400">
      エラー: JSON の構文が正しくありません{position}。
      <span className="block font-mono text-xs">{result.error}</span>
    </p>
  )
}
