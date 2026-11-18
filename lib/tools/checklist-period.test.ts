import { describe, expect, it } from 'vitest'
import {
  dayKey,
  formatWeekRange,
  isDayKey,
  isMonthKey,
  isRetained,
  monthKey,
  parseDateInput,
  parseMonthInput,
  periodKey,
  weekKey,
} from './checklist-period'

// 2026-11-18 は水曜日
const TODAY = new Date(2026, 10, 18, 9, 0)

describe('期間のキー', () => {
  it('ローカル時刻の年・月・日からキーを作る', () => {
    expect(monthKey(TODAY)).toBe('2026-11')
    expect(dayKey(TODAY)).toBe('2026-11-18')
  })

  it('日付が変わる直前・直後でも端末の日付のままにする', () => {
    expect(dayKey(new Date(2026, 10, 18, 0, 0))).toBe('2026-11-18')
    expect(dayKey(new Date(2026, 10, 18, 23, 59))).toBe('2026-11-18')
  })

  it('週のキーはその日を含む週の月曜', () => {
    expect(weekKey(TODAY)).toBe('2026-11-16')
    expect(weekKey(new Date(2026, 10, 16))).toBe('2026-11-16') // 月曜
    expect(weekKey(new Date(2026, 10, 22))).toBe('2026-11-16') // 日曜
    expect(weekKey(new Date(2026, 10, 23))).toBe('2026-11-23') // 次の月曜
  })

  it('年をまたぐ週の月曜を求める', () => {
    // 2027-01-01 は金曜日
    expect(weekKey(new Date(2027, 0, 1))).toBe('2026-12-28')
  })

  it('種類に応じたキーを返す', () => {
    expect(periodKey('monthly', TODAY)).toBe('2026-11')
    expect(periodKey('weekly', TODAY)).toBe('2026-11-16')
    expect(periodKey('daily', TODAY)).toBe('2026-11-18')
  })
})

describe('入力値の検証', () => {
  it('正しい年月を受け付ける', () => {
    expect(parseMonthInput('2026-11')).toBe('2026-11')
  })

  it.each(['', '2026-13', '2026-00', '2026/11', '26-11', 'abc'])(
    '不正な年月（%s）は null',
    (value) => {
      expect(parseMonthInput(value)).toBeNull()
    },
  )

  it('正しい日付をローカル時刻の日付にする', () => {
    const date = parseDateInput('2026-11-18')
    expect(date && dayKey(date)).toBe('2026-11-18')
  })

  it.each(['', '2026-02-30', '2026-11-31', '2026-11', '2026/11/18'])(
    '不正な日付（%s）は null',
    (value) => {
      expect(parseDateInput(value)).toBeNull()
    },
  )

  it('保存値のキーの書式を判定する', () => {
    expect(isMonthKey('2026-11')).toBe(true)
    expect(isMonthKey('2026-11-01')).toBe(false)
    expect(isDayKey('2026-11-16')).toBe(true)
    expect(isDayKey('2026-11')).toBe(false)
  })
})

describe('formatWeekRange', () => {
  it('月曜から日曜の範囲を表示する', () => {
    expect(formatWeekRange('2026-11-16')).toBe('11/16（月）〜11/22（日）')
  })

  it('年をまたぐ週も月/日で表示する', () => {
    expect(formatWeekRange('2026-12-28')).toBe('12/28（月）〜1/3（日）')
  })
})

describe('isRetained', () => {
  it('日次は今日を含む直近 90 日を残す', () => {
    expect(isRetained('daily', '2026-08-21', TODAY)).toBe(true) // 90 日目
    expect(isRetained('daily', '2026-08-20', TODAY)).toBe(false) // 91 日目
    expect(isRetained('daily', '2026-08-19', TODAY)).toBe(false)
  })

  it('週次は今週を含む直近 52 週を残す', () => {
    // 今週の月曜 2026-11-16 から 51 週前の月曜は 2025-11-24
    expect(isRetained('weekly', '2025-11-24', TODAY)).toBe(true)
    expect(isRetained('weekly', '2025-11-17', TODAY)).toBe(false)
  })

  it('月次は今月を含む直近 24 か月を残す', () => {
    expect(isRetained('monthly', '2024-12', TODAY)).toBe(true)
    expect(isRetained('monthly', '2024-11', TODAY)).toBe(false)
  })

  it('今日より後の期間は残す', () => {
    expect(isRetained('daily', '2026-12-31', TODAY)).toBe(true)
    expect(isRetained('weekly', '2027-01-04', TODAY)).toBe(true)
    expect(isRetained('monthly', '2027-03', TODAY)).toBe(true)
  })
})
