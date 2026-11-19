import { readJson, writeJson } from '@/lib/storage'

export const MARKDOWN_DRAFT_KEY = 'toolbox:markdown-preview:draft'

const isString = (value: unknown): value is string => typeof value === 'string'

/** 保存した Markdown を読む。保存がない・壊れている・読めないときは空文字列 */
export function loadDraft(): string {
  return readJson(MARKDOWN_DRAFT_KEY, isString, '')
}

/** Markdown を1件だけ保存する（前の内容は置き換える）。保存できたら true */
export function saveDraft(markdown: string): boolean {
  return writeJson(MARKDOWN_DRAFT_KEY, markdown)
}

// Mermaid は id を SVG の要素 id と CSS セレクタに使うため、英数字と - だけにする
// （React の useId は「:」や「«»」を含むことがある）
export function toMermaidId(reactId: string): string {
  return `mermaid-${reactId.replace(/[^a-zA-Z0-9-]/g, '')}`
}

/** react-markdown が安全でない URL（javascript: など）を空にしたリンクかどうか */
export function isEmptyHref(href: string | undefined): boolean {
  return href === undefined || href.trim() === ''
}
