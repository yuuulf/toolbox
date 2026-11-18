'use client'

import { useState } from 'react'
import { formatHex, parseColor } from '@/lib/tools/color'
import type { TextSize, WcagResult } from '@/lib/tools/color-contrast'
import {
  contrastRatio,
  evaluateWcag,
  formatContrastRatio,
} from '@/lib/tools/color-contrast'
import { ColorField } from './color-field'

const DEFAULT_FOREGROUND = '#000000'
const DEFAULT_BACKGROUND = '#ffffff'

const SIZE_LABELS: Record<TextSize, string> = {
  normal: '通常の文字',
  large: '大きな文字',
}

export function ContrastChecker() {
  const [foreground, setForeground] = useState(DEFAULT_FOREGROUND)
  const [background, setBackground] = useState(DEFAULT_BACKGROUND)
  const fg = parseColor(foreground)
  const bg = parseColor(background)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField
          label="文字色"
          value={foreground}
          onChange={setForeground}
          invalidMessage="エラー: 文字色を色として解釈できません。"
        />
        <ColorField
          label="背景色"
          value={background}
          onChange={setBackground}
          invalidMessage="エラー: 背景色を色として解釈できません。"
        />
      </div>

      {fg.ok && bg.ok && (
        <ContrastResult
          foreground={formatHex(fg.rgb)}
          background={formatHex(bg.rgb)}
          ratio={contrastRatio(fg.rgb, bg.rgb)}
        />
      )}
    </div>
  )
}

function ContrastResult({
  foreground,
  background,
  ratio,
}: {
  foreground: string
  background: string
  ratio: number
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-baseline gap-3">
        <span className="text-sm font-medium">コントラスト比</span>
        <span className="font-mono text-2xl font-bold">
          {formatContrastRatio(ratio)}
        </span>
      </p>
      <div
        style={{ color: foreground, backgroundColor: background }}
        className="flex flex-col gap-1 rounded-md border border-zinc-300 p-4 dark:border-zinc-700"
      >
        <p className="text-base">通常の文字の見本です。The quick brown fox.</p>
        <p className="text-2xl font-bold">大きな文字の見本です。</p>
      </div>
      {/* 広い画面ではツールが2列になり列幅が狭くなるため、1列に戻す */}
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {evaluateWcag(ratio).map((result) => (
          <WcagItem key={`${result.level}-${result.size}`} result={result} />
        ))}
      </ul>
    </div>
  )
}

function WcagItem({ result }: { result: WcagResult }) {
  // 合否を色だけでなく記号と文言でも示す
  return (
    <li className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
      <span>
        {result.level}・{SIZE_LABELS[result.size]}
        <span className="text-zinc-600 dark:text-zinc-400">
          （{result.threshold}:1 以上）
        </span>
      </span>
      <span
        className={
          result.pass
            ? 'shrink-0 font-semibold whitespace-nowrap text-green-700 dark:text-green-400'
            : 'shrink-0 font-semibold whitespace-nowrap text-red-700 dark:text-red-400'
        }
      >
        {result.pass ? '✓ 合格' : '✗ 不合格'}
      </span>
    </li>
  )
}
