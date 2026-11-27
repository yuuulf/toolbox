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

/** ダウンロードするファイル名（拡張子を除く）の上限。長すぎる名前は OS やブラウザで扱えないことがあるため */
export const MAX_FILE_NAME_LENGTH = 100

/** 見出しがない・使える文字が残らないときのファイル名（拡張子を除く） */
export const DEFAULT_FILE_NAME = 'markdown'

const FENCE_PATTERN = /^ {0,3}(```|~~~)/
const HEADING_PATTERN = /^ {0,3}#(?:[ \t]+(.*))?$/
// 閉じの #（「# 見出し ##」の末尾）。前に空白がない # は見出しの文字の一部
const CLOSING_HASHES_PATTERN = /(?:^|[ \t]+)#+[ \t]*$/
// Windows・macOS でファイル名に使えない文字と制御文字
const INVALID_FILE_NAME_CHARS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g

/** 前後の空白と末尾のピリオドを除く（末尾のピリオドは Windows で取り除かれるため） */
function trimFileName(name: string): string {
  return name.trim().replace(/[.\s]+$/, '')
}

// コードブロックの外で最初のレベル1見出しの文字を返す。見つからなければ null
function firstHeading(markdown: string): string | null {
  let fence: string | null = null
  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = FENCE_PATTERN.exec(line)
    if (fenceMatch) {
      // 開いたときと同じ記号で閉じる（``` の中の ~~~ は中身として扱う）
      if (fence === null) fence = fenceMatch[1]
      else if (fence === fenceMatch[1]) fence = null
      continue
    }
    if (fence !== null) continue
    const headingMatch = HEADING_PATTERN.exec(line)
    if (headingMatch) {
      return (headingMatch[1] ?? '').replace(CLOSING_HASHES_PATTERN, '')
    }
  }
  return null
}

/** ダウンロードする .md のファイル名。最初のレベル1見出しから作り、なければ markdown.md */
export function toMarkdownFileName(markdown: string): string {
  const heading = firstHeading(markdown) ?? ''
  const cleaned = trimFileName(heading.replace(INVALID_FILE_NAME_CHARS, ''))
  // 絵文字などのサロゲートペアを途中で切らないよう、コードポイント単位で数える
  const truncated = trimFileName(
    Array.from(cleaned).slice(0, MAX_FILE_NAME_LENGTH).join(''),
  )
  return `${truncated === '' ? DEFAULT_FILE_NAME : truncated}.md`
}
