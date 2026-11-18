import { describe, expect, it } from 'vitest'
import {
  formatHex,
  formatHsl,
  formatRgb,
  hslToRgb,
  parseColor,
  rgbToHsl,
} from './color'

function hexOf(input: string) {
  const result = parseColor(input)
  return result.ok ? formatHex(result.rgb) : null
}

describe('parseColor', () => {
  it('3桁の HEX を6桁と同じ色として解釈する', () => {
    expect(hexOf('#F00')).toBe('#ff0000')
  })

  it('# を省略した HEX を解釈する', () => {
    expect(hexOf('F00')).toBe('#ff0000')
    expect(hexOf('336699')).toBe('#336699')
  })

  it('前後の空白と大文字・小文字を無視する', () => {
    expect(hexOf('  #AbCdEf ')).toBe('#abcdef')
    expect(hexOf('RGB(1, 2, 3)')).toBe('#010203')
  })

  it('カンマ区切りとスペース区切りの rgb() を解釈する', () => {
    expect(hexOf('rgb(0, 128, 255)')).toBe('#0080ff')
    expect(hexOf('rgb(0 128 255)')).toBe('#0080ff')
  })

  it('カンマ区切りとスペース区切りの hsl() を解釈する', () => {
    expect(hexOf('hsl(120, 100%, 25%)')).toBe('#008000')
    expect(hexOf('hsl(120 100% 25%)')).toBe('#008000')
  })

  it('h=360 は h=0 と同じ色になる', () => {
    expect(hexOf('hsl(360, 100%, 50%)')).toBe(hexOf('hsl(0, 100%, 50%)'))
  })

  it('空または空白のみの入力は empty として扱う', () => {
    expect(parseColor('')).toEqual({ ok: false, kind: 'empty' })
    expect(parseColor('   ')).toEqual({ ok: false, kind: 'empty' })
  })

  it.each([
    ['範囲外の RGB', 'rgb(300, 0, 0)'],
    ['小数の RGB', 'rgb(1.5, 0, 0)'],
    ['範囲外の色相', 'hsl(361, 50%, 50%)'],
    ['範囲外の彩度', 'hsl(0, 101%, 50%)'],
    ['% のない彩度', 'hsl(0, 50, 50%)'],
    ['カンマとスペースの混在', 'rgb(0, 128 255)'],
    ['値の個数違い', 'rgb(0, 0)'],
    ['透明度付きの HEX', '#ff000080'],
    ['rgba()', 'rgba(255, 0, 0, 0.5)'],
    ['スラッシュでの透明度', 'rgb(255 0 0 / 0.5)'],
    ['色名', 'red'],
    ['4桁の HEX', '#f00f'],
    ['でたらめな文字列', 'abc-xyz'],
  ])('%s（%s）は invalid として扱う', (_, input) => {
    expect(parseColor(input)).toEqual({ ok: false, kind: 'invalid' })
  })
})

describe('書式化', () => {
  const orange = { r: 255, g: 128, b: 0 }

  it('HEX は小文字の #rrggbb にする', () => {
    expect(formatHex({ r: 10, g: 171, b: 255 })).toBe('#0aabff')
  })

  it('RGB は rgb(r, g, b) にする', () => {
    expect(formatRgb(orange)).toBe('rgb(255, 128, 0)')
  })

  it('HSL は整数に丸めた hsl(h, s%, l%) にする', () => {
    expect(formatHsl(orange)).toBe('hsl(30, 100%, 50%)')
  })

  it('無彩色の HSL は色相・彩度を 0 にする', () => {
    expect(formatHsl({ r: 128, g: 128, b: 128 })).toBe('hsl(0, 0%, 50%)')
  })

  it('丸めで 360 になる色相は 0 として表示する', () => {
    expect(formatHsl({ r: 255, g: 0, b: 1 })).toBe('hsl(0, 100%, 50%)')
  })
})

describe('RGB と HSL の変換', () => {
  it.each([
    [{ r: 255, g: 0, b: 0 }],
    [{ r: 0, g: 128, b: 0 }],
    [{ r: 51, g: 102, b: 153 }],
    [{ r: 255, g: 255, b: 255 }],
  ])('RGB → HSL → RGB で元の色に戻る（%o）', (rgb) => {
    expect(hslToRgb(rgbToHsl(rgb))).toEqual(rgb)
  })
})
