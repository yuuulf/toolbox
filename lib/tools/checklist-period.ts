// 期間のキーはすべて端末のローカル時刻の年・月・日から作る。
// toISOString は UTC になり、日本時間の朝などで日付がずれるため使わない

export type RecurringKind = 'monthly' | 'weekly' | 'daily'

/** 今日を含む直近の日数・週数・月数だけチェックの記録を残す */
export const DAILY_RETENTION_DAYS = 90
export const WEEKLY_RETENTION_WEEKS = 52
export const MONTHLY_RETENTION_MONTHS = 24

const DAYS_PER_WEEK = 7
const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/
const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** 'YYYY-MM' */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

/** 'YYYY-MM-DD' */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** その日を含む週（月曜始まり）の月曜の 'YYYY-MM-DD' */
export function weekKey(date: Date): string {
  return dayKey(mondayOf(date))
}

export function periodKey(kind: RecurringKind, date: Date): string {
  if (kind === 'monthly') return monthKey(date)
  if (kind === 'weekly') return weekKey(date)
  return dayKey(date)
}

function mondayOf(date: Date): Date {
  // getDay は日曜が 0。月曜からの経過日数にする
  const offset = (date.getDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset)
}

/** `<input type="month">` の値。不正なら null */
export function parseMonthInput(value: string): string | null {
  const match = MONTH_KEY_PATTERN.exec(value)
  if (!match) return null
  const month = Number(match[2])
  return month >= 1 && month <= 12 ? value : null
}

/** `<input type="date">` の値をローカル時刻の日付にする。存在しない日付などは null */
export function parseDateInput(value: string): Date | null {
  const match = DAY_KEY_PATTERN.exec(value)
  if (!match) return null
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ]
  const date = new Date(year, month - 1, day)
  // 2026-02-30 のような値は Date が翌月に繰り上げるので、元の値と一致するかで判定する
  return dayKey(date) === value ? date : null
}

export function isMonthKey(value: string): boolean {
  return parseMonthInput(value) !== null
}

export function isDayKey(value: string): boolean {
  return parseDateInput(value) !== null
}

/** 週の月曜のキーから「11/16（月）〜11/22（日）」を作る */
export function formatWeekRange(mondayKey: string): string {
  const monday = parseDateInput(mondayKey)
  if (!monday) return ''
  const sunday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + DAYS_PER_WEEK - 1,
  )
  const label = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAY_LABELS[d.getDay()]}）`
  return `${label(monday)}〜${label(sunday)}`
}

/** 残す範囲の最も古い期間のキー。キーは同じ桁数の数字なので文字列の大小で比べられる */
function oldestRetainedKey(kind: RecurringKind, today: Date): string {
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  if (kind === 'daily') {
    return dayKey(new Date(y, m, d - (DAILY_RETENTION_DAYS - 1)))
  }
  if (kind === 'weekly') {
    const monday = mondayOf(today)
    return dayKey(
      new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() - (WEEKLY_RETENTION_WEEKS - 1) * DAYS_PER_WEEK,
      ),
    )
  }
  return monthKey(new Date(y, m - (MONTHLY_RETENTION_MONTHS - 1), 1))
}

/** 今日から見て残す範囲の期間か。今日より後の期間も残す */
export function isRetained(
  kind: RecurringKind,
  key: string,
  today: Date,
): boolean {
  return key >= oldestRetainedKey(kind, today)
}
