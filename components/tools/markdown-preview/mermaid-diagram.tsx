'use client'

import type { Mermaid } from 'mermaid'
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { toMermaidId } from '@/lib/tools/markdown-preview'

type Props = {
  code: string
}

type RenderResult =
  { ok: true; svg: string } | { ok: false; message: string; code: string }

// mermaid は大きいので、図を描くときに初めて読み込み、以後は同じものを使い回す
let mermaidPromise: Promise<Mermaid> | undefined

function loadMermaid(): Promise<Mermaid> {
  mermaidPromise ??= import('mermaid').then((module) => module.default)
  return mermaidPromise
}

const MERMAID_SECURE_KEYS = [
  'secure',
  'securityLevel',
  'startOnLoad',
  'maxTextSize',
  'suppressErrorRendering',
  'maxEdges',
  'htmlLabels',
  'themeCSS',
]

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeColorScheme(onChange: () => void) {
  if (typeof matchMedia !== 'function') return () => {}
  const query = matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useDarkMode(): boolean {
  return useSyncExternalStore(
    subscribeColorScheme,
    () => typeof matchMedia === 'function' && matchMedia(DARK_QUERY).matches,
    () => false,
  )
}

export function MermaidDiagram({ code }: Props) {
  const id = toMermaidId(useId())
  const dark = useDarkMode()
  const [result, setResult] = useState<RenderResult | null>(null)
  const workRef = useRef<HTMLDivElement>(null)

  // 描き直すのはコードか配色が変わったときだけ。古い描画の結果が後から届いたら捨てる
  useEffect(() => {
    let cancelled = false
    loadMermaid()
      .then(async (mermaid) => {
        // initialize はグローバルな設定なので、描く直前に毎回テーマを指定する。
        // strict は、図の中のクリック操作や HTML の埋め込みを無効にするため
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          // ラベルの HTML を解釈せず、SVG の文字として描く（<img> などで外部へ通信させないため）
          htmlLabels: false,
          // 図の中の %%{init}%% や先頭の config で上の設定を変えられないようにする
          // （Mermaid の既定の secure に、htmlLabels と themeCSS を加えたもの）
          secure: MERMAID_SECURE_KEYS,
          theme: dark ? 'dark' : 'default',
        })
        // 先に構文を確かめる。render は失敗するとエラーの図を body に残すことがあるため
        await mermaid.parse(code)
        // render は描画中の一時的な要素を作る。既定の body だとその間ページが伸びるので、
        // ページの高さに影響しない fixed の作業用の要素の中で描かせる
        const { svg } = await mermaid.render(
          id,
          code,
          workRef.current ?? undefined,
        )
        if (!cancelled) setResult({ ok: true, svg })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setResult({
          ok: false,
          message: error instanceof Error ? error.message : String(error),
          code,
        })
      })
    return () => {
      cancelled = true
    }
  }, [code, dark, id])

  return (
    <>
      <div
        ref={workRef}
        aria-hidden="true"
        className="pointer-events-none invisible fixed top-0 left-0"
      />
      <DiagramResult result={result} />
    </>
  )
}

function DiagramResult({ result }: { result: RenderResult | null }) {
  if (result === null) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        図を描いています…
      </p>
    )
  }
  if (!result.ok) {
    return (
      <div className="rounded-md border border-red-300 p-3 text-sm dark:border-red-800">
        <p className="font-semibold text-red-700 dark:text-red-400">
          図を描けませんでした。
        </p>
        <p className="mt-1 break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
          {result.message}
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-zinc-100 p-2 font-mono text-xs dark:bg-zinc-900">
          <code>{result.code}</code>
        </pre>
      </div>
    )
  }
  // SVG は securityLevel: 'strict' の Mermaid がサニタイズしたもので、入力の HTML はそのまま入らない
  return (
    <div
      className="flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: result.svg }}
    />
  )
}
