import { describe, expect, it } from 'vitest'
import type { DiffOp, DiffRow, Segment } from './text-diff'
import {
  MAX_LINE_GRAPHEMES,
  MAX_LINES,
  compareTexts,
  diffSequences,
} from './text-diff'

// 差分を順に適用して、元の2つの配列を作り直す
function rebuild<T>(a: T[], b: T[], ops: DiffOp[]) {
  const before: T[] = []
  const after: T[] = []
  for (const op of ops) {
    if (op.kind !== 'insert') before.push(a[op.a])
    if (op.kind !== 'delete') after.push(b[op.b])
    if (op.kind === 'equal') expect(a[op.a]).toBe(b[op.b])
  }
  return { before, after }
}

// 全探索の LCS の長さ（小さな例で最長かどうかを確かめる基準）
function lcsLength<T>(a: T[], b: T[]): number {
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

// 再現できる疑似乱数（テストの結果を毎回同じにする）
function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

function checkDiff<T>(a: T[], b: T[]) {
  const ops = diffSequences(a, b)
  const { before, after } = rebuild(a, b, ops)
  expect(before).toEqual(a)
  expect(after).toEqual(b)
  expect(ops.filter((op) => op.kind === 'equal')).toHaveLength(lcsLength(a, b))
}

const text = (segments: Segment[]) => segments.map((s) => s.text).join('')
const changedText = (segments: Segment[]) =>
  segments.filter((s) => s.changed).map((s) => s.text)

function rowsOf(before: string, after: string): DiffRow[] {
  const result = compareTexts(before, after)
  if (!result.ok) throw new Error(`比較できない: ${result.reason}`)
  return result.rows
}

describe('diffSequences', () => {
  it.each([
    ['空の配列どうし', [], []],
    ['変更前だけ空', [], ['a', 'b']],
    ['変更後だけ空', ['a', 'b'], []],
    ['同じ配列', ['a', 'b', 'c'], ['a', 'b', 'c']],
    ['先頭に追加', ['b', 'c'], ['a', 'b', 'c']],
    ['中間を削除', ['a', 'b', 'c'], ['a', 'c']],
    ['末尾に追加', ['a', 'b'], ['a', 'b', 'c']],
    ['すべて違う', ['a', 'b'], ['x', 'y', 'z']],
    ['入れ替え', ['a', 'b', 'c', 'd'], ['d', 'c', 'b', 'a']],
  ])('%s: 適用すると元に戻り、共通部分が最長になる', (_, a, b) => {
    checkDiff(a, b)
  })

  it('ランダムな配列でも、元に戻り共通部分が最長になる', () => {
    const next = random(42)
    for (let n = 0; n < 300; n++) {
      const a = Array.from({ length: Math.floor(next() * 12) }, () =>
        Math.floor(next() * 4),
      )
      const b = Array.from({ length: Math.floor(next() * 12) }, () =>
        Math.floor(next() * 4),
      )
      checkDiff(a, b)
    }
  })

  it('長い配列でも元に戻る', () => {
    const next = random(7)
    const a = Array.from({ length: 2000 }, () => Math.floor(next() * 50))
    const b = a.map((v) => (next() < 0.1 ? Math.floor(next() * 50) : v))
    const { before, after } = rebuild(a, b, diffSequences(a, b))
    expect(before).toEqual(a)
    expect(after).toEqual(b)
  })
})

describe('compareTexts', () => {
  it('両方空なら比較しない', () => {
    expect(compareTexts('', '')).toEqual({ ok: false, reason: 'empty' })
  })

  it('同じテキストなら差分なし', () => {
    const result = compareTexts('a\nb', 'a\nb')
    expect(result.ok && result.identical).toBe(true)
  })

  it('行数が上限を超えたら比較しない', () => {
    const tooMany = Array.from({ length: MAX_LINES + 1 }, () => 'x').join('\n')
    expect(compareTexts(tooMany, 'x')).toEqual({
      ok: false,
      reason: 'too-many-lines',
    })
    const justMax = Array.from({ length: MAX_LINES }, () => 'x').join('\n')
    expect(compareTexts(justMax, 'x').ok).toBe(true)
  })

  it('共通の行・削除・追加を示す', () => {
    const rows = rowsOf('りんご\nみかん\nぶどう', 'りんご\nぶどう\nもも')
    expect(
      rows.map((row) => [
        row.kind,
        'before' in row ? text(row.before.segments) : null,
        'after' in row ? text(row.after.segments) : null,
      ]),
    ).toEqual([
      ['equal', 'りんご', 'りんご'],
      ['removed', 'みかん', null],
      ['equal', 'ぶどう', 'ぶどう'],
      ['added', null, 'もも'],
    ])
  })

  it('末尾の改行だけが違うと、空の行の追加になる', () => {
    expect(rowsOf('a', 'a\n')).toEqual([
      {
        kind: 'equal',
        before: { lineNumber: 1, segments: [{ text: 'a', changed: false }] },
        after: { lineNumber: 1, segments: [{ text: 'a', changed: false }] },
      },
      { kind: 'added', after: { lineNumber: 2, segments: [] } },
    ])
  })

  it('片方が空なら、もう一方の行はすべて追加になる', () => {
    expect(rowsOf('', 'a\nb').map((row) => row.kind)).toEqual([
      'added',
      'added',
    ])
  })

  it('変更された行の組では、変わった文字だけを強調する', () => {
    const [row] = rowsOf('価格は100円です', '価格は120円です')
    expect(row.kind).toBe('changed')
    if (row.kind !== 'changed') return
    expect(changedText(row.before.segments)).toEqual(['0'])
    expect(changedText(row.after.segments)).toEqual(['2'])
    expect(text(row.before.segments)).toBe('価格は100円です')
    expect(text(row.after.segments)).toBe('価格は120円です')
  })

  it('絵文字は1文字として比べる', () => {
    const [row] = rowsOf('👨‍👩‍👧 あ', '👨‍👩‍👦 あ')
    if (row.kind !== 'changed') throw new Error('組にならない')
    expect(changedText(row.before.segments)).toEqual(['👨‍👩‍👧'])
    expect(changedText(row.after.segments)).toEqual(['👨‍👩‍👦'])
  })

  it('隣り合う変わった文字は1つにまとめる', () => {
    const [row] = rowsOf('abcdef', 'aXYZef')
    if (row.kind !== 'changed') throw new Error('組にならない')
    expect(row.before.segments).toEqual([
      { text: 'a', changed: false },
      { text: 'bcd', changed: true },
      { text: 'ef', changed: false },
    ])
    expect(row.after.segments).toEqual([
      { text: 'a', changed: false },
      { text: 'XYZ', changed: true },
      { text: 'ef', changed: false },
    ])
  })

  it('削除と追加の行数が違うと、余った行は組にならない', () => {
    const rows = rowsOf('x\n1\n2\ny', 'x\nA\ny')
    expect(rows.map((row) => row.kind)).toEqual([
      'equal',
      'changed',
      'removed',
      'equal',
    ])
    const changed = rows[1]
    if (changed.kind !== 'changed') return
    expect(text(changed.before.segments)).toBe('1')
    expect(text(changed.after.segments)).toBe('A')
  })

  it('左右の行番号は、それぞれ元のテキストでの番号になる', () => {
    const rows = rowsOf('a\nb', 'a\nB\nc')
    expect(
      rows.map((row) => [
        row.kind,
        'before' in row ? row.before.lineNumber : null,
        'after' in row ? row.after.lineNumber : null,
      ]),
    ).toEqual([
      ['equal', 1, 1],
      ['changed', 2, 2],
      ['added', null, 3],
    ])
  })

  it('長すぎる行の組は、文字単位で比べず行全体を変更とする', () => {
    const long = 'あ'.repeat(MAX_LINE_GRAPHEMES + 1)
    const [row] = rowsOf(long, `${long}い`)
    if (row.kind !== 'changed') throw new Error('組にならない')
    expect(row.before.segments).toEqual([{ text: long, changed: true }])
    expect(row.after.segments).toEqual([{ text: `${long}い`, changed: true }])
  })

  it('組にならない削除・追加の行は、文字単位の強調をしない', () => {
    const rows = rowsOf('a', 'a\nb')
    expect(rows[1]).toEqual({
      kind: 'added',
      after: { lineNumber: 2, segments: [{ text: 'b', changed: false }] },
    })
  })
})
