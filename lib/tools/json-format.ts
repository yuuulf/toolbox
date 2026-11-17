export type JsonIndent = 2 | 4 | 'tab'

export type JsonResult =
  | { ok: true; output: string }
  | { ok: false; kind: 'empty' }
  | {
      ok: false
      kind: 'syntax'
      /** ブラウザ（JS エンジン）が返したエラーメッセージ */
      error: string
      /** 1 始まり。エラーメッセージから位置が取れたときだけ入る */
      line?: number
      column?: number
    }

export function formatJson(input: string, indent: JsonIndent): JsonResult {
  return transform(input, (value) =>
    JSON.stringify(value, null, indent === 'tab' ? '\t' : indent),
  )
}

export function minifyJson(input: string): JsonResult {
  return transform(input, (value) => JSON.stringify(value))
}

function transform(
  input: string,
  stringify: (value: unknown) => string,
): JsonResult {
  if (input.trim() === '') return { ok: false, kind: 'empty' }
  try {
    const value: unknown = JSON.parse(input)
    return { ok: true, output: stringify(value) }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    return { ok: false, kind: 'syntax', error, ...findPosition(error, input) }
  }
}

// JSON.parse のエラーメッセージはエンジンごとに形式が違うため、取れる場合だけ位置を返す。
//   V8:      "... at position 7 (line 1 column 8)"（古い版は position のみ）
//   Firefox: "... at line 1 column 8 of the JSON data"
//   Safari:  位置情報なし
function findPosition(
  message: string,
  input: string,
): { line?: number; column?: number } {
  const lineColumn = /line (\d+) column (\d+)/.exec(message)
  if (lineColumn) {
    return { line: Number(lineColumn[1]), column: Number(lineColumn[2]) }
  }
  const position = /position (\d+)/.exec(message)
  if (position) {
    return toLineColumn(input, Number(position[1]))
  }
  return {}
}

function toLineColumn(
  input: string,
  offset: number,
): { line: number; column: number } {
  const before = input.slice(0, offset).split('\n')
  return { line: before.length, column: before[before.length - 1].length + 1 }
}
