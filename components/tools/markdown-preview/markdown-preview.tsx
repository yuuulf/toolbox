'use client'

import type { ReactNode } from 'react'
import { useDeferredValue, useId, useState, useSyncExternalStore } from 'react'
import { IconButton } from '@/components/icon-button'
import { DownloadIcon } from '@/components/icons'
import {
  loadDraft,
  saveDraft,
  toMarkdownFileName,
} from '@/lib/tools/markdown-preview'
import { MarkdownView } from './markdown-view'
import type { ViewMode } from './view-mode-switch'
import { ViewModeSwitch } from './view-mode-switch'
import { useAutoSave } from './use-auto-save'

const AUTOSAVE_FAILED_MESSAGE =
  '自動保存できません。再読み込みすると入力が消えます。'

const noopSubscribe = () => () => {}

const MARKDOWN_MIME_TYPE = 'text/markdown;charset=utf-8'

// ブラウザ内で .md ファイルを作って保存させる（どこにも送信しない）
function downloadMarkdown(markdown: string) {
  const url = URL.createObjectURL(
    new Blob([markdown], { type: MARKDOWN_MIME_TYPE }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = toMarkdownFileName(markdown)
  link.click()
  URL.revokeObjectURL(url)
}

// 保存した Markdown はブラウザでだけ読める（ページはビルド時にプリレンダーされる）。
// サーバーとハイドレーション中は null を返し、読めるようになったら入力欄を保存値で作り直す
export function MarkdownPreview() {
  const saved = useSyncExternalStore(noopSubscribe, loadDraft, () => null)
  return (
    <Editor
      key={saved === null ? 'server' : 'client'}
      initialMarkdown={saved ?? ''}
      ready={saved !== null}
    />
  )
}

type EditorProps = {
  initialMarkdown: string
  /** 保存値を読み終えたか。読み終えるまでは入力と自動保存をしない */
  ready: boolean
}

function Editor({ initialMarkdown, ready }: EditorProps) {
  const inputId = useId()
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [mode, setMode] = useState<ViewMode>('split')
  // 入力欄への反映は即時にし、プレビューの描画は後回しにできるようにする
  const deferredMarkdown = useDeferredValue(markdown)
  const saveFailed = useAutoSave(markdown, ready, saveDraft)

  const showEditor = mode !== 'preview'
  const showPreview = mode !== 'editor'

  // ボタン用の行は作らず、各欄の見出しの行に操作を置く（その分、欄を縦に広く使う）。
  // 自動保存できないときの文言は入力欄の見出しに、表示の切り替えはプレビューの見出しに置き、片方だけのときは見えている欄に両方を置く。
  // 文言の領域は、後から文字が入ったときに読み上げられるよう、失敗していないときも空のまま置く
  const saveStatus = (
    <p aria-live="polite" className="text-sm text-red-700 dark:text-red-400">
      {saveFailed ? AUTOSAVE_FAILED_MESSAGE : ''}
    </p>
  )
  const modeSwitch = <ViewModeSwitch value={mode} onChange={setMode} />
  // ダウンロードは自動保存の文言と同じく、見えている欄のうち入力欄を優先して1つだけ置く（同じ名前のボタンを重ねないため）
  const downloadButton = (
    <IconButton
      label="Markdown をダウンロード"
      icon={<DownloadIcon />}
      variant="subtle"
      onClick={() => downloadMarkdown(markdown)}
      disabled={!ready || markdown.trim() === ''}
    />
  )

  return (
    // 並べて表示は lg 以上で左右に、それ未満では縦に並べる。片方だけのときは幅いっぱいに使う。
    // lg 以上では欄を画面の下端まで広げる。プレビューは中身に合わせて伸びる箱なので、各欄の枠に contain-size と
    // 最低の高さ（見出しの行 36px + 間隔 4px + h-150 の 600px = 640px）を付け、中身の高さで枠が伸びないようにする
    <div
      className={
        mode === 'split'
          ? 'flex flex-col gap-4 lg:grid lg:flex-1 lg:grid-cols-2 lg:gap-x-6'
          : 'flex flex-col lg:flex-1'
      }
    >
      {showEditor && (
        <div className="flex min-w-0 flex-col gap-1 lg:min-h-160 lg:flex-1 lg:contain-size">
          <PaneHeader>
            <label htmlFor={inputId} className="text-sm font-medium">
              Markdown
            </label>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {saveStatus}
              {mode === 'editor' && modeSwitch}
              {downloadButton}
            </div>
          </PaneHeader>
          <textarea
            id={inputId}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            disabled={!ready}
            spellCheck={false}
            className="h-150 w-full resize-none lg:h-auto lg:min-h-0 lg:flex-1 rounded-md border border-zinc-300 bg-transparent p-2 font-mono text-sm dark:border-zinc-700"
          />
        </div>
      )}
      {showPreview && (
        <div className="flex min-w-0 flex-col gap-1 lg:min-h-160 lg:flex-1 lg:contain-size">
          <PaneHeader>
            <h2 className="text-sm font-medium">プレビュー</h2>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {mode === 'preview' && saveStatus}
              {modeSwitch}
              {mode === 'preview' && downloadButton}
            </div>
          </PaneHeader>
          {/* 長いプレビューはこの欄の中でスクロールする。キーボードでもスクロールできるようフォーカス可能にする。
              relative は、中の sr-only などの絶対配置がこの欄の外へはみ出してページを伸ばさないため */}
          <div
            role="region"
            aria-label="プレビュー"
            tabIndex={0}
            className="relative h-150 overflow-y-auto lg:h-auto lg:min-h-0 lg:flex-1 rounded-md border border-zinc-300 p-3 dark:border-zinc-700"
          >
            <MarkdownView markdown={deferredMarkdown} />
          </div>
        </div>
      )}
    </div>
  )
}

function PaneHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1">
      {children}
    </div>
  )
}
