export type ChartRange = '7d' | '1m' | '3m' | '6m' | '1y'
export type ChartType = 'line' | 'bar'

export interface ExerciseTemplate {
  id: string
  name: string
  color: string
}

export interface ExerciseCatalogItem {
  name: string
  usageCount: number
  color: string
}

export interface DailyLog {
  dateKey: string
  note: string
  completedIds: string[]
  snapshotExercises: ExerciseTemplate[]
  updatedAt: string
}

export interface DailyQuote {
  dateKey: string
  text: string
  author: string
  source: 'zenquotes' | 'fallback'
}

export interface AppPreferences {
  chartRange: ChartRange
  chartType: ChartType
}

export interface AppData {
  exerciseTemplates: ExerciseTemplate[]
  exerciseCatalog: Record<string, ExerciseCatalogItem>
  dailyLogs: Record<string, DailyLog>
  dailyQuote: DailyQuote | null
  preferences: AppPreferences
}

export interface ChartPoint {
  dateKey: string
  label: string
  completionRate: number
  completedCount: number
  totalExercises: number
}
