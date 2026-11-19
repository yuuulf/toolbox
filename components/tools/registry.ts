import type { ComponentType } from 'react'
import { CharCounter } from './char-counter'
import { Checklist } from './checklist/checklist'
import { ColorTool } from './color-tool/color-tool'
import { IdGenerator } from './id-generator'
import { JsonFormatter } from './json-formatter'
import { MarkdownPreview } from './markdown-preview/markdown-preview'
import { TextDiff } from './text-diff/text-diff'

export type ToolDefinition = {
  /** URL に使う識別子（`/tools/<slug>`）。kebab-case */
  slug: string
  name: string
  description: string
  /** ツールがブラウザに保存するデータの有無 */
  storage: 'none' | 'localStorage'
  component: ComponentType
}

// トップの一覧・ナビゲーション・`/tools/<slug>` のルートはすべてこの配列から作る。
// ツールを追加するときはここに1エントリ足すだけにする
export const tools: ToolDefinition[] = [
  {
    slug: 'json-formatter',
    name: 'JSON整形/検証',
    description: 'JSON を整形・圧縮し、構文エラーの位置を表示します。',
    storage: 'none',
    component: JsonFormatter,
  },
  {
    slug: 'char-counter',
    name: '文字数カウント',
    description: '文字数・空白を除いた文字数・行数・バイト数を数えます。',
    storage: 'none',
    component: CharCounter,
  },
  {
    slug: 'id-generator',
    name: 'UUID/パスワード生成',
    description: 'UUID v4 とランダムなパスワードを生成します。',
    storage: 'localStorage',
    component: IdGenerator,
  },
  {
    slug: 'color-tool',
    name: 'カラー変換/コントラスト',
    description:
      'HEX・RGB・HSL を相互に変換し、文字色と背景色のコントラスト比を確かめます。',
    storage: 'localStorage',
    component: ColorTool,
  },
  {
    slug: 'checklist',
    name: 'チェックリスト',
    description:
      '月次・週次・日次の繰り返しのチェックリストと、一時的なチェックリストを使えます。',
    storage: 'localStorage',
    component: Checklist,
  },
  {
    slug: 'text-diff',
    name: 'テキスト差分比較',
    description:
      '2つのテキストを行ごとに比べ、追加・削除された行と変わった文字を左右に並べて表示します。',
    storage: 'none',
    component: TextDiff,
  },
  {
    slug: 'markdown-preview',
    name: 'Markdownプレビュー',
    description:
      'Markdown を入力と同時にプレビューします。表・タスクリストと Mermaid の図に対応しています。',
    storage: 'localStorage',
    component: MarkdownPreview,
  },
]

export function getTool(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug)
}
