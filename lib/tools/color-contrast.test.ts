import { describe, expect, it } from 'vitest'
import type { Rgb } from './color'
import {
  contrastRatio,
  evaluateWcag,
  formatContrastRatio,
  relativeLuminance,
} from './color-contrast'

const BLACK: Rgb = { r: 0, g: 0, b: 0 }
const WHITE: Rgb = { r: 255, g: 255, b: 255 }
const GRAY_77: Rgb = { r: 0x77, g: 0x77, b: 0x77 }
const GRAY_76: Rgb = { r: 0x76, g: 0x76, b: 0x76 }

function passes(ratio: number) {
  return Object.fromEntries(
    evaluateWcag(ratio).map((r) => [`${r.level}-${r.size}`, r.pass]),
  )
}

describe('relativeLuminance', () => {
  it('黒は 0、白は 1', () => {
    expect(relativeLuminance(BLACK)).toBe(0)
    expect(relativeLuminance(WHITE)).toBeCloseTo(1)
  })
})

describe('contrastRatio と formatContrastRatio', () => {
  it('黒と白は 21.00:1', () => {
    expect(formatContrastRatio(contrastRatio(BLACK, WHITE))).toBe('21.00:1')
  })

  it('同じ色どうしは 1.00:1', () => {
    expect(formatContrastRatio(contrastRatio(GRAY_77, GRAY_77))).toBe('1.00:1')
  })

  it('#777777 と白は 4.47:1（4.478 を切り上げない）', () => {
    expect(formatContrastRatio(contrastRatio(GRAY_77, WHITE))).toBe('4.47:1')
  })

  it('#767676 と白は 4.54:1', () => {
    expect(formatContrastRatio(contrastRatio(GRAY_76, WHITE))).toBe('4.54:1')
  })

  it('文字色と背景色を入れ替えても比は同じ', () => {
    expect(contrastRatio(WHITE, GRAY_77)).toBe(contrastRatio(GRAY_77, WHITE))
  })
})

describe('evaluateWcag', () => {
  it('#767676 と白は AAA・通常の文字だけ不合格', () => {
    expect(passes(contrastRatio(GRAY_76, WHITE))).toEqual({
      'AA-normal': true,
      'AA-large': true,
      'AAA-normal': false,
      'AAA-large': true,
    })
  })

  it('#777777 と白は AA・通常の文字が不合格、AA・大きな文字は合格', () => {
    const result = passes(contrastRatio(GRAY_77, WHITE))
    expect(result['AA-normal']).toBe(false)
    expect(result['AA-large']).toBe(true)
  })

  it('閾値ちょうどは合格', () => {
    expect(passes(4.5)['AA-normal']).toBe(true)
    expect(passes(3)['AA-large']).toBe(true)
  })

  it('黒と白はすべて合格', () => {
    expect(evaluateWcag(contrastRatio(BLACK, WHITE)).every((r) => r.pass)).toBe(
      true,
    )
  })
})
