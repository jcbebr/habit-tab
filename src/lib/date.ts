import dayjs from 'dayjs'
import type { ChartRange } from './types'

export const DATE_KEY_FORMAT = 'YYYY-MM-DD'

export function toDateKey(date: Date) {
  return dayjs(date).format(DATE_KEY_FORMAT)
}

export function todayKey() {
  return toDateKey(new Date())
}

export function fromDateKey(dateKey: string) {
  return dayjs(dateKey, DATE_KEY_FORMAT).toDate()
}

export function isToday(dateKey: string) {
  return dateKey === todayKey()
}

export function getRangeLength(range: ChartRange) {
  switch (range) {
    case '7d':
      return 7
    case '1m':
      return 30
    case '3m':
      return 90
    case '6m':
      return 180
    case '1y':
      return 365
  }
}

export function listDateKeys(range: ChartRange, endDate = new Date()) {
  const totalDays = getRangeLength(range)
  const end = dayjs(endDate)

  return Array.from({ length: totalDays }, (_, index) =>
    end.subtract(totalDays - index - 1, 'day').format(DATE_KEY_FORMAT),
  )
}

export function formatFriendlyDate(dateKey: string) {
  return dayjs(dateKey, DATE_KEY_FORMAT).format('dddd, MMMM D')
}

export function formatChartLabel(dateKey: string, range: ChartRange) {
  const parsed = dayjs(dateKey, DATE_KEY_FORMAT)

  if (range === '7d') {
    return parsed.format('ddd')
  }

  if (range === '1y') {
    return parsed.format('MMM')
  }

  return parsed.format('MMM D')
}

export function getCompletionRate(completedCount: number, totalExercises: number) {
  if (totalExercises === 0) {
    return 0
  }

  return Math.round((completedCount / totalExercises) * 100)
}
