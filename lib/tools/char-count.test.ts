import { afterEach, describe, expect, it, vi } from 'vitest'
import { countText } from './char-count'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('countText', () => {
  it('日本語と結合絵文字を見た目の1文字ずつ数える', () => {
    expect(countText('あいう👨‍👩‍👧').chars).toBe(4)
  })

  it('改行も1文字として数える', () => {
    expect(countText('a\nb').chars).toBe(3)
  })

  it('空白（半角・全角スペース、タブ、改行）を除いた文字数を数える', () => {
    expect(countText('a b　c\n').charsNoSpace).toBe(3)
    expect(countText('\tx\r\n').charsNoSpace).toBe(1)
  })

  it('行数は改行の数 + 1', () => {
    expect(countText('1行目\n2行目\n3行目').lines).toBe(3)
    expect(countText('末尾に改行\n').lines).toBe(2)
  })

  it('UTF-8 のバイト数を数える', () => {
    expect(countText('aあ').bytes).toBe(4)
    expect(countText('👨‍👩‍👧').bytes).toBe(18)
  })

  it('空入力はすべて 0', () => {
    expect(countText('')).toEqual({
      chars: 0,
      charsNoSpace: 0,
      lines: 0,
      bytes: 0,
    })
  })

  it('Intl.Segmenter がない環境ではコードポイント単位で数える', () => {
    vi.stubGlobal('Intl', { ...Intl, Segmenter: undefined })
    expect(countText('あいう').chars).toBe(3)
    // 👨‍👩‍👧 は 👨 ZWJ 👩 ZWJ 👧 の5コードポイント
    expect(countText('👨‍👩‍👧').chars).toBe(5)
  })
})
