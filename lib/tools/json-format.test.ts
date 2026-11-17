import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatJson, minifyJson } from './json-format'

const SAMPLE = '{"a":1,"b":[true,null]}'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('formatJson', () => {
  it('2スペースで整形する', () => {
    expect(formatJson(SAMPLE, 2)).toEqual({
      ok: true,
      output: '{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}',
    })
  })

  it('4スペースで整形する', () => {
    const result = formatJson(SAMPLE, 4)
    expect(result.ok && result.output.split('\n')[1]).toBe('    "a": 1,')
  })

  it('タブで整形する', () => {
    const result = formatJson(SAMPLE, 'tab')
    expect(result.ok && result.output.split('\n')[1]).toBe('\t"a": 1,')
    expect(result.ok && result.output.split('\n')[3]).toBe('\t\ttrue,')
  })
})

describe('minifyJson', () => {
  it('空白と改行を除いた1行にする', () => {
    expect(minifyJson('{\n  "a": 1,\n  "b": [ true, null ]\n}\n')).toEqual({
      ok: true,
      output: SAMPLE,
    })
  })
})

describe('不正な入力', () => {
  it('構文エラーではエラーと位置を返す', () => {
    const result = formatJson('{"a":1,}', 2)
    expect(result).toMatchObject({
      ok: false,
      kind: 'syntax',
      line: 1,
      column: 8,
    })
    expect(
      result.ok === false && result.kind === 'syntax' && result.error,
    ).not.toBe('')
  })

  it('複数行の入力では行と列を返す', () => {
    expect(minifyJson('{\n  "a": 1,\n}')).toMatchObject({
      ok: false,
      kind: 'syntax',
      line: 3,
      column: 1,
    })
  })

  it('position だけのメッセージ（古い V8）からも行と列を求める', () => {
    vi.spyOn(JSON, 'parse').mockImplementation(() => {
      throw new SyntaxError('Unexpected token } in JSON at position 12')
    })
    expect(formatJson('{\n  "a": 1,\n}', 2)).toMatchObject({
      line: 3,
      column: 1,
    })
  })

  it('位置が取れないメッセージ（Safari など）では行と列を返さない', () => {
    vi.spyOn(JSON, 'parse').mockImplementation(() => {
      throw new SyntaxError("JSON Parse error: Expected '}'")
    })
    const result = formatJson('{"a":1,}', 2)
    expect(result).toMatchObject({ ok: false, kind: 'syntax' })
    expect(result).not.toHaveProperty('line')
  })

  it('空入力はエラーではなく empty として返す', () => {
    expect(formatJson('', 2)).toEqual({ ok: false, kind: 'empty' })
    expect(minifyJson('  \n\t ')).toEqual({ ok: false, kind: 'empty' })
  })
})
