import { addDays, addMonths, differenceInCalendarDays, format, getDaysInMonth, isToday, isYesterday, parseISO } from "date-fns"

/** All scheduling runs on local calendar days stored as yyyy-mm-dd strings. */
export const toDay = (d: Date) => format(d, "yyyy-MM-dd")
export const fromDay = (s: string) => parseISO(s)
export const today = () => toDay(new Date())
export const monthOf = (day: string) => day.slice(0, 7)
export const shiftDay = (day: string, n: number) => toDay(addDays(fromDay(day), n))
export const shiftMonth = (day: string, n: number) => toDay(addMonths(fromDay(day), n))
export const daysBetween = (a: string, b: string) => differenceInCalendarDays(fromDay(b), fromDay(a))
export const daysInMonth = (month: string) => getDaysInMonth(fromDay(`${month}-01`))
export const prevMonth = (month: string) => monthOf(shiftMonth(`${month}-01`, -1))

export function monthLabel(month: string) {
  return format(fromDay(`${month}-01`), "MMMM")
}

export function friendlyDay(day: string) {
  const d = fromDay(day)
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  const diff = daysBetween(today(), day)
  if (diff === 1) return "Tomorrow"
  if (diff > 1 && diff < 7) return format(d, "EEEE")
  return format(d, "EEE d MMM")
}

export function shortDay(day: string) {
  return format(fromDay(day), "d MMM")
}

export function lateLabel(due: string) {
  const late = daysBetween(due, today())
  if (late <= 0) return null
  if (late === 1) return "From yesterday"
  return `${late} days late`
}

export function inRange(day: string, r: { from: string; to: string }) {
  return day >= r.from && day <= r.to
}
