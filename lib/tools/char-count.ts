export type TextCounts = {
  /** 見た目の1文字（書記素クラスタ）単位の文字数。改行も1文字 */
  chars: number
  /** 空白文字（半角・全角スペース、タブ、改行）を除いた文字数 */
  charsNoSpace: number
  /** 空入力は 0、それ以外は改行の数 + 1 */
  lines: number
  /** UTF-8 でエンコードしたときのバイト数 */
  bytes: number
}

const WHITESPACE_ONLY = /^\s+$/u

export function countText(text: string): TextCounts {
  const graphemes = splitGraphemes(text)
  return {
    chars: graphemes.length,
    charsNoSpace: graphemes.filter((g) => !WHITESPACE_ONLY.test(g)).length,
    lines: text === '' ? 0 : text.split('\n').length,
    bytes: new TextEncoder().encode(text).length,
  }
}

function splitGraphemes(text: string): string[] {
  // Intl.Segmenter がない古いブラウザでは、コードポイント単位で数える（結合絵文字は複数文字になる）
  if (typeof Intl.Segmenter !== 'function') return Array.from(text)
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return Array.from(segmenter.segment(text), (s) => s.segment)
}
