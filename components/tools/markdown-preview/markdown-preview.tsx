'use client'

import type { ReactNode } from 'react'
import { useDeferredValue, useId, useState, useSyncExternalStore } from 'react'
import { loadDraft, saveDraft } from '@/lib/tools/markdown-preview'
import { MarkdownView } from './markdown-view'
import type { ViewMode } from './view-mode-switch'
import { ViewModeSwitch } from './view-mode-switch'

type SaveStatus = 'saved' | 'failed' | null

const noopSubscribe = () => () => {}

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
  /** 保存値を読み終えたか。読み終えるまでは入力と保存をできなくする */
  ready: boolean
}

function Editor({ initialMarkdown, ready }: EditorProps) {
  const inputId = useId()
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [mode, setMode] = useState<ViewMode>('split')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null)
  // 入力欄への反映は即時にし、プレビューの描画は後回しにできるようにする
  const deferredMarkdown = useDeferredValue(markdown)

  function handleChange(value: string) {
    setMarkdown(value)
    setSaveStatus(null)
  }

  function handleSave() {
    setSaveStatus(saveDraft(markdown) ? 'saved' : 'failed')
  }

  const showEditor = mode !== 'preview'
  const showPreview = mode !== 'editor'

  // ボタン用の行は作らず、各欄の見出しの行に操作を置く（その分、欄を縦に広く使う）。
  // 保存は入力欄の見出しに、表示の切り替えはプレビューの見出しに置き、片方だけのときは見えている欄に両方を置く
  const saveControls = (
    <>
      <p
        aria-live="polite"
        className="text-sm text-zinc-600 dark:text-zinc-400"
      >
        {saveStatus === 'saved' && '保存しました。'}
        {saveStatus === 'failed' && '保存できませんでした。'}
      </p>
      <button
        type="button"
        onClick={handleSave}
        disabled={!ready}
        className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        保存
      </button>
    </>
  )
  const modeSwitch = <ViewModeSwitch value={mode} onChange={setMode} />

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
              {saveControls}
              {mode === 'editor' && modeSwitch}
            </div>
          </PaneHeader>
          <textarea
            id={inputId}
            value={markdown}
            onChange={(e) => handleChange(e.target.value)}
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
              {mode === 'preview' && saveControls}
              {modeSwitch}
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
