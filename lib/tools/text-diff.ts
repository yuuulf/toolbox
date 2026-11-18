import { splitGraphemes } from './char-count'

/** 比較できる行数の上限（どちらか一方でも超えたら比較しない） */
export const MAX_LINES = 5000
/** 変更された行の組で、文字単位の差分を取る1行の長さの上限（書記素の数） */
export const MAX_LINE_GRAPHEMES = 1000

export type DiffOp =
  | { kind: 'equal'; a: number; b: number }
  | { kind: 'delete'; a: number }
  | { kind: 'insert'; b: number }

/**
 * 2つの配列の差分を、共通部分が最長になるよう「共通・削除・追加」の並びで返す。
 * Myers の O(ND) のアルゴリズムを、中央で分割して再帰する線形メモリの形で使う
 * （差分の経路をすべて覚える形だと、5,000 行どうしで数百 MB を使うため）
 */
export function diffSequences<T>(a: readonly T[], b: readonly T[]): DiffOp[] {
  const ops: DiffOp[] = []
  diffRange(a, 0, a.length, b, 0, b.length, ops)
  return ops
}

function diffRange<T>(
  a: readonly T[],
  aStart: number,
  aEnd: number,
  b: readonly T[],
  bStart: number,
  bEnd: number,
  ops: DiffOp[],
): void {
  // 共通の先頭と末尾は探索せずに共通とする
  while (aStart < aEnd && bStart < bEnd && a[aStart] === b[bStart]) {
    ops.push({ kind: 'equal', a: aStart++, b: bStart++ })
  }
  let suffix = 0
  while (
    aStart < aEnd - suffix &&
    bStart < bEnd - suffix &&
    a[aEnd - 1 - suffix] === b[bEnd - 1 - suffix]
  ) {
    suffix++
  }
  aEnd -= suffix
  bEnd -= suffix

  if (aStart === aEnd) {
    for (let j = bStart; j < bEnd; j++) ops.push({ kind: 'insert', b: j })
  } else if (bStart === bEnd) {
    for (let i = aStart; i < aEnd; i++) ops.push({ kind: 'delete', a: i })
  } else {
    const split = findSplit(a, aStart, aEnd, b, bStart, bEnd)
    if (split) {
      diffRange(a, aStart, split.x, b, bStart, split.y, ops)
      diffRange(a, split.x, aEnd, b, split.y, bEnd, ops)
    } else {
      // 共通の要素が1つもない
      for (let i = aStart; i < aEnd; i++) ops.push({ kind: 'delete', a: i })
      for (let j = bStart; j < bEnd; j++) ops.push({ kind: 'insert', b: j })
    }
  }

  for (let k = suffix; k > 0; k--) {
    ops.push({ kind: 'equal', a: aEnd + suffix - k, b: bEnd + suffix - k })
  }
}

/**
 * 前と後ろの両方から最短経路を伸ばし、重なった点（最短経路上の中央の点）を返す。
 * 両方の範囲は空でなく、先頭と末尾は異なっている前提
 */
function findSplit<T>(
  a: readonly T[],
  aStart: number,
  aEnd: number,
  b: readonly T[],
  bStart: number,
  bEnd: number,
): { x: number; y: number } | null {
  const n = aEnd - aStart
  const m = bEnd - bStart
  const maxD = Math.ceil((n + m) / 2)
  const offset = maxD + 1
  const size = 2 * maxD + 3
  const forward = new Int32Array(size).fill(-1)
  const backward = new Int32Array(size).fill(-1)
  forward[offset + 1] = 0
  backward[offset + 1] = 0
  const delta = n - m
  // 差分の長さの偶奇で、重なりを前側・後ろ側のどちらで確かめるかが決まる
  const checkOnForward = delta % 2 !== 0
  let fStart = 0
  let fEnd = 0
  let bStartTrim = 0
  let bEndTrim = 0

  for (let d = 0; d < maxD; d++) {
    for (let k = -d + fStart; k <= d - fEnd; k += 2) {
      const ki = offset + k
      let x =
        k === -d || (k !== d && forward[ki - 1] < forward[ki + 1])
          ? forward[ki + 1]
          : forward[ki - 1] + 1
      let y = x - k
      while (x < n && y < m && a[aStart + x] === b[bStart + y]) {
        x++
        y++
      }
      forward[ki] = x
      if (x > n) {
        fEnd += 2
      } else if (y > m) {
        fStart += 2
      } else if (checkOnForward) {
        const bi = offset + delta - k
        if (bi >= 0 && bi < size && backward[bi] !== -1) {
          if (x >= n - backward[bi]) return { x: aStart + x, y: bStart + y }
        }
      }
    }

    for (let k = -d + bStartTrim; k <= d - bEndTrim; k += 2) {
      const ki = offset + k
      let x =
        k === -d || (k !== d && backward[ki - 1] < backward[ki + 1])
          ? backward[ki + 1]
          : backward[ki - 1] + 1
      let y = x - k
      while (
        x < n &&
        y < m &&
        a[aStart + n - x - 1] === b[bStart + m - y - 1]
      ) {
        x++
        y++
      }
      backward[ki] = x
      if (x > n) {
        bEndTrim += 2
      } else if (y > m) {
        bStartTrim += 2
      } else if (!checkOnForward) {
        const fi = offset + delta - k
        if (fi >= 0 && fi < size && forward[fi] !== -1) {
          const fx = forward[fi]
          const fy = fx - (fi - offset)
          if (fx >= n - x) return { x: aStart + fx, y: bStart + fy }
        }
      }
    }
  }
  return null
}

export type Segment = { text: string; changed: boolean }
export type Side = { lineNumber: number; segments: Segment[] }
export type DiffRow =
  | { kind: 'equal'; before: Side; after: Side }
  | { kind: 'changed'; before: Side; after: Side }
  | { kind: 'removed'; before: Side }
  | { kind: 'added'; after: Side }
export type CompareResult =
  | { ok: true; rows: DiffRow[]; identical: boolean }
  | { ok: false; reason: 'empty' | 'too-many-lines' }

/** 2つのテキストを行単位で比べ、左右に並べて表示するための行の並びを返す */
export function compareTexts(before: string, after: string): CompareResult {
  if (before === '' && after === '') return { ok: false, reason: 'empty' }
  const beforeLines = splitLines(before)
  const afterLines = splitLines(after)
  if (beforeLines.length > MAX_LINES || afterLines.length > MAX_LINES) {
    return { ok: false, reason: 'too-many-lines' }
  }

  // 行の比較を数値の比較にして速くする（同じ内容の行は同じ番号）
  const ids = new Map<string, number>()
  const toId = (line: string) => {
    let id = ids.get(line)
    if (id === undefined) {
      id = ids.size
      ids.set(line, id)
    }
    return id
  }
  const ops = diffSequences(beforeLines.map(toId), afterLines.map(toId))

  const rows: DiffRow[] = []
  let removed: number[] = []
  let added: number[] = []
  const flush = () => {
    // 連続した削除と追加の塊は、先頭から同じ数だけ「変更された行の組」にする
    const pairs = Math.min(removed.length, added.length)
    for (let i = 0; i < pairs; i++) {
      const [beforeSegments, afterSegments] = diffLine(
        beforeLines[removed[i]],
        afterLines[added[i]],
      )
      rows.push({
        kind: 'changed',
        before: { lineNumber: removed[i] + 1, segments: beforeSegments },
        after: { lineNumber: added[i] + 1, segments: afterSegments },
      })
    }
    for (const i of removed.slice(pairs)) {
      rows.push({ kind: 'removed', before: side(i, beforeLines[i]) })
    }
    for (const j of added.slice(pairs)) {
      rows.push({ kind: 'added', after: side(j, afterLines[j]) })
    }
    removed = []
    added = []
  }

  for (const op of ops) {
    if (op.kind === 'delete') {
      removed.push(op.a)
    } else if (op.kind === 'insert') {
      added.push(op.b)
    } else {
      flush()
      rows.push({
        kind: 'equal',
        before: side(op.a, beforeLines[op.a]),
        after: side(op.b, afterLines[op.b]),
      })
    }
  }
  flush()

  return {
    ok: true,
    rows,
    identical: rows.every((row) => row.kind === 'equal'),
  }
}

// 空のテキストは0行とする（[''] の1行にすると、空との比較で空行の変更が出てしまう）
function splitLines(text: string): string[] {
  return text === '' ? [] : text.split('\n')
}

function side(index: number, line: string): Side {
  return { lineNumber: index + 1, segments: plain(line, false) }
}

function plain(text: string, changed: boolean): Segment[] {
  return text === '' ? [] : [{ text, changed }]
}

/** 変更された行の組の中で、変わった書記素の連なりを changed にした Segment を返す */
function diffLine(before: string, after: string): [Segment[], Segment[]] {
  const a = splitGraphemes(before)
  const b = splitGraphemes(after)
  if (a.length > MAX_LINE_GRAPHEMES || b.length > MAX_LINE_GRAPHEMES) {
    return [plain(before, true), plain(after, true)]
  }
  const beforeSegments: Segment[] = []
  const afterSegments: Segment[] = []
  for (const op of diffSequences(a, b)) {
    if (op.kind === 'equal') {
      appendSegment(beforeSegments, a[op.a], false)
      appendSegment(afterSegments, b[op.b], false)
    } else if (op.kind === 'delete') {
      appendSegment(beforeSegments, a[op.a], true)
    } else {
      appendSegment(afterSegments, b[op.b], true)
    }
  }
  return [beforeSegments, afterSegments]
}

// 同じ種類（変わった・変わっていない）の書記素が続くときは1つの Segment にまとめる
function appendSegment(segments: Segment[], text: string, changed: boolean) {
  const last = segments.at(-1)
  if (last && last.changed === changed) {
    last.text += text
  } else {
    segments.push({ text, changed })
  }
}
