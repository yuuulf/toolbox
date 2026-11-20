import type { Components } from 'react-markdown'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { isEmptyHref } from '@/lib/tools/markdown-preview'
import { MermaidDiagram } from './mermaid-diagram'

type Props = {
  markdown: string
}

const MERMAID_CLASS = 'language-mermaid'

// react-markdown は各要素に構文木（node）を渡す。そのまま DOM に渡すと属性として出てしまうので外す
function withoutNode<P extends { node?: unknown }>(props: P): Omit<P, 'node'> {
  const rest = { ...props }
  delete rest.node
  return rest
}

// 要素ごとの見た目を Tailwind のクラスで付ける（typography などの依存は増やさない）
const components: Components = {
  h1: (props) => (
    <h1
      className="mt-6 mb-3 text-2xl font-bold first:mt-0"
      {...withoutNode(props)}
    />
  ),
  h2: (props) => (
    <h2
      className="mt-6 mb-3 border-b border-zinc-200 pb-1 text-xl font-bold first:mt-0 dark:border-zinc-800"
      {...withoutNode(props)}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-5 mb-2 text-lg font-semibold first:mt-0"
      {...withoutNode(props)}
    />
  ),
  h4: (props) => (
    <h4
      className="mt-4 mb-2 font-semibold first:mt-0"
      {...withoutNode(props)}
    />
  ),
  h5: (props) => (
    <h5
      className="mt-4 mb-2 text-sm font-semibold first:mt-0"
      {...withoutNode(props)}
    />
  ),
  h6: (props) => (
    <h6
      className="mt-4 mb-2 text-sm font-semibold text-zinc-600 first:mt-0 dark:text-zinc-400"
      {...withoutNode(props)}
    />
  ),
  p: (props) => <p className="my-3 first:mt-0" {...withoutNode(props)} />,
  ul: ({ className, ...props }) => (
    <ul
      className={
        // タスクリストは行頭の点を付けず、チェックボックスを行頭に置く
        className?.includes('contains-task-list')
          ? 'my-3 list-none pl-1'
          : 'my-3 list-disc pl-6'
      }
      {...withoutNode(props)}
    />
  ),
  ol: (props) => (
    <ol className="my-3 list-decimal pl-6" {...withoutNode(props)} />
  ),
  li: (props) => <li className="my-1" {...withoutNode(props)} />,
  input: (props) => (
    // remark-gfm のタスクリストは disabled のチェックボックス（プレビュー上では変更できない）
    <input className="mr-2 align-middle" {...withoutNode(props)} />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-3 border-l-4 border-zinc-300 pl-4 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
      {...withoutNode(props)}
    />
  ),
  hr: () => <hr className="my-6 border-zinc-200 dark:border-zinc-800" />,
  table: (props) => (
    <div className="my-3 overflow-x-auto">
      <table className="border-collapse text-sm" {...withoutNode(props)} />
    </div>
  ),
  th: (props) => (
    <th
      className="border border-zinc-300 bg-zinc-50 px-3 py-1 text-left font-semibold dark:border-zinc-700 dark:bg-zinc-900"
      {...withoutNode(props)}
    />
  ),
  td: (props) => (
    <td
      className="border border-zinc-300 px-3 py-1 dark:border-zinc-700"
      {...withoutNode(props)}
    />
  ),
  a: ({ href, children, ...props }) =>
    // javascript: など安全でない URL は react-markdown が空にするので、リンクにせず文字だけを出す
    isEmptyHref(href) ? (
      <span>{children}</span>
    ) : (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-700 underline dark:text-accent-300"
        {...withoutNode(props)}
      >
        {children}
      </a>
    ),
  // 画像は読み込まない（外部のサーバーへ通信が発生するため）。代わりに代替テキストと URL を出す
  img: ({ alt, src }) => (
    <span className="rounded bg-zinc-100 px-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {alt ? `画像: ${alt}` : '画像'}
      {typeof src === 'string' && src !== '' ? `（${src}）` : ''}
    </span>
  ),
  code: (props) => (
    <code
      className="rounded bg-zinc-100 px-1 font-mono text-sm dark:bg-zinc-800"
      {...withoutNode(props)}
    />
  ),
  pre: ({ children, ...props }) => {
    const code = mermaidCode(props.node)
    if (code !== null) return <MermaidDiagram code={code} />
    return (
      <pre
        className="my-3 overflow-x-auto rounded-md bg-zinc-100 p-3 font-mono text-sm dark:bg-zinc-900 *:bg-transparent *:p-0"
        {...withoutNode(props)}
      >
        {children}
      </pre>
    )
  },
}

// react-markdown が渡す構文木（hast）のうち、ここで読む部分だけの型。
// hast の型は react-markdown の間接的な依存なので、直接 import しない
type PreNode = {
  children?: {
    type: string
    tagName?: string
    properties?: { className?: unknown }
    children?: { type: string; value?: string }[]
  }[]
}

// ```mermaid のコードブロックなら、その中身の文字列を返す
function mermaidCode(node: PreNode | undefined): string | null {
  const code = node?.children?.[0]
  if (code?.type !== 'element' || code.tagName !== 'code') return null
  const className = code.properties?.className
  if (!Array.isArray(className) || !className.includes(MERMAID_CLASS)) {
    return null
  }
  return (code.children ?? [])
    .map((child) => (child.type === 'text' ? (child.value ?? '') : ''))
    .join('')
}

export function MarkdownView({ markdown }: Props) {
  if (markdown.trim() === '') {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Markdown を入力するとここに表示されます。
      </p>
    )
  }
  return (
    <div className="text-sm leading-relaxed break-words">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </Markdown>
    </div>
  )
}
