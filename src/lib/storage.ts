import { formatChartLabel, getCompletionRate, listDateKeys, todayKey } from './date'
import type {
  AppData,
  AppPreferences,
  ChartPoint,
  ChartRange,
  DailyLog,
  ExerciseCatalogItem,
  ExerciseTemplate,
} from './types'

const STORAGE_KEY = 'move-and-note-data'

const defaultPreferences: AppPreferences = {
  chartRange: '7d',
  chartType: 'line',
}

const exerciseColors = [
  'bisque',
  'cadetblue',
  'darkkhaki',
  'goldenrod',
  'khaki',
  'lightblue',
  'lightskyblue',
  'lightsteelblue',
  'mediumpurple',
  'lime',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
]

function createDailyLog(dateKey: string, exercises: ExerciseTemplate[]): DailyLog {
  return {
    dateKey,
    note: '',
    completedIds: [],
    snapshotExercises: exercises,
    updatedAt: new Date().toISOString(),
  }
}

function cloneExercises(exercises: ExerciseTemplate[]) {
  return exercises.map((exercise) => ({ ...exercise }))
}

function normalizeExerciseName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeExerciseLabel(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

function getColorIndexFromName(name: string) {
  const normalizedName = normalizeExerciseName(name)

  return normalizedName
    .split('')
    .reduce((hash, character) => hash + character.charCodeAt(0), 0) % exerciseColors.length
}

function getExerciseColor(name: string) {
  return exerciseColors[getColorIndexFromName(name)]
}

function incrementCatalogEntry(
  catalog: Record<string, ExerciseCatalogItem>,
  exerciseName: string,
  amount = 1,
) {
  const normalizedName = normalizeExerciseName(exerciseName)

  if (!normalizedName) {
    return catalog
  }

  const existingEntry = catalog[normalizedName]

  return {
    ...catalog,
    [normalizedName]: {
      name: existingEntry?.name ?? normalizeExerciseLabel(exerciseName),
      color: existingEntry?.color ?? getExerciseColor(exerciseName),
      usageCount: (existingEntry?.usageCount ?? 0) + amount,
    },
  }
}

function buildCatalogFromData(
  exerciseTemplates: ExerciseTemplate[],
  dailyLogs: Record<string, DailyLog>,
) {
  let nextCatalog: Record<string, ExerciseCatalogItem> = {}

  for (const exercise of exerciseTemplates) {
    nextCatalog = incrementCatalogEntry(nextCatalog, exercise.name)
  }

  for (const log of Object.values(dailyLogs)) {
    for (const exercise of log.snapshotExercises) {
      nextCatalog = incrementCatalogEntry(nextCatalog, exercise.name)
    }
  }

  return nextCatalog
}

function isChromeStorageAvailable() {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local)
}

function createDefaultData(): AppData {
  return {
    exerciseTemplates: [],
    exerciseCatalog: {},
    dailyLogs: {},
    dailyQuote: null,
    preferences: defaultPreferences,
  }
}

function normalizeDailyLog(
  dateKey: string,
  rawLog: Partial<DailyLog> | undefined,
): DailyLog {
  return {
    dateKey,
    note: rawLog?.note ?? '',
    completedIds: Array.isArray(rawLog?.completedIds) ? rawLog.completedIds : [],
    snapshotExercises: Array.isArray(rawLog?.snapshotExercises)
      ? rawLog.snapshotExercises.map((exercise) => ({
          id: exercise.id,
          name: normalizeExerciseLabel(exercise.name),
          color: exercise.color ?? getExerciseColor(exercise.name),
        }))
      : [],
    updatedAt: rawLog?.updatedAt ?? new Date().toISOString(),
  }
}

function normalizeData(raw: Partial<AppData> | undefined): AppData {
  const exerciseTemplates = Array.isArray(raw?.exerciseTemplates)
    ? raw.exerciseTemplates.map((exercise) => ({
        id: exercise.id,
        name: normalizeExerciseLabel(exercise.name),
        color: exercise.color ?? getExerciseColor(exercise.name),
      }))
    : []

  const dailyLogs = Object.fromEntries(
    Object.entries(raw?.dailyLogs ?? {}).map(([dateKey, log]) => [
      dateKey,
      normalizeDailyLog(dateKey, log),
    ]),
  )

  const exerciseCatalog = raw?.exerciseCatalog
    ? Object.fromEntries(
        Object.entries(raw.exerciseCatalog).flatMap(([key, value]) => {
          const normalizedKey = normalizeExerciseName(key)

          if (!normalizedKey) {
            return []
          }

          return [
            [
              normalizedKey,
              {
                name: normalizeExerciseLabel(value.name),
                color: value.color ?? getExerciseColor(value.name),
                usageCount: Math.max(1, value.usageCount || 0),
              },
            ],
          ]
        }),
      )
    : buildCatalogFromData(exerciseTemplates, dailyLogs)

  return {
    exerciseTemplates,
    exerciseCatalog,
    dailyLogs,
    dailyQuote:
      raw?.dailyQuote &&
      raw.dailyQuote.dateKey &&
      raw.dailyQuote.text &&
      raw.dailyQuote.author &&
      (raw.dailyQuote.source === 'zenquotes' || raw.dailyQuote.source === 'fallback')
        ? raw.dailyQuote
        : null,
    preferences: {
      chartRange: raw?.preferences?.chartRange ?? defaultPreferences.chartRange,
      chartType: raw?.preferences?.chartType ?? defaultPreferences.chartType,
    },
  }
}

export async function loadAppData() {
  if (isChromeStorageAvailable()) {
    const stored = await chrome.storage.local.get(STORAGE_KEY)
    return ensureTodayLog(normalizeData(stored[STORAGE_KEY] as Partial<AppData> | undefined))
  }

  const raw = globalThis.localStorage.getItem(STORAGE_KEY)

  return ensureTodayLog(raw ? normalizeData(JSON.parse(raw) as Partial<AppData>) : createDefaultData())
}

export async function saveAppData(data: AppData) {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [STORAGE_KEY]: data })
    return
  }

  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function ensureTodayLog(data: AppData) {
  const key = todayKey()

  if (data.dailyLogs[key]) {
    return data
  }

  return {
    ...data,
    dailyLogs: {
      ...data.dailyLogs,
      [key]: createDailyLog(key, cloneExercises(data.exerciseTemplates)),
    },
  }
}

export function addExerciseTemplate(data: AppData, name: string) {
  const trimmedName = normalizeExerciseLabel(name)
  const normalizedName = normalizeExerciseName(name)

  if (!trimmedName || !normalizedName) {
    return data
  }

  const alreadyExists = data.exerciseTemplates.some(
    (exercise) => normalizeExerciseName(exercise.name) === normalizedName,
  )

  if (alreadyExists) {
    return data
  }

  const nextExercise: ExerciseTemplate = {
    id: crypto.randomUUID(),
    name: trimmedName,
    color: data.exerciseCatalog[normalizedName]?.color ?? getExerciseColor(trimmedName),
  }

  const nextData = ensureTodayLog({
    ...data,
    exerciseTemplates: [...data.exerciseTemplates, nextExercise],
    exerciseCatalog: incrementCatalogEntry(data.exerciseCatalog, trimmedName),
  })

  const key = todayKey()
  const todayLog = nextData.dailyLogs[key]

  return {
    ...nextData,
    dailyLogs: {
      ...nextData.dailyLogs,
      [key]: {
        ...todayLog,
        snapshotExercises: [...todayLog.snapshotExercises, nextExercise],
        updatedAt: new Date().toISOString(),
      },
    },
  }
}

export function removeExerciseTemplate(data: AppData, exerciseId: string) {
  const nextTemplates = data.exerciseTemplates.filter((exercise) => exercise.id !== exerciseId)
  const key = todayKey()
  const nextLogs = { ...data.dailyLogs }
  const todayLog = nextLogs[key]

  if (todayLog) {
    nextLogs[key] = {
      ...todayLog,
      snapshotExercises: todayLog.snapshotExercises.filter((exercise) => exercise.id !== exerciseId),
      completedIds: todayLog.completedIds.filter((id) => id !== exerciseId),
      updatedAt: new Date().toISOString(),
    }
  }

  return {
    ...data,
    exerciseTemplates: nextTemplates,
    dailyLogs: nextLogs,
  }
}

export function updateExerciseColor(data: AppData, exerciseId: string, color: string) {
  const trimmedColor = color.trim()

  if (!trimmedColor) {
    return data
  }

  const targetExercise = data.exerciseTemplates.find((exercise) => exercise.id === exerciseId)

  if (!targetExercise) {
    return data
  }

  const normalizedName = normalizeExerciseName(targetExercise.name)

  return {
    ...data,
    exerciseTemplates: data.exerciseTemplates.map((exercise) =>
      normalizeExerciseName(exercise.name) === normalizedName
        ? { ...exercise, color: trimmedColor }
        : exercise,
    ),
    exerciseCatalog: {
      ...data.exerciseCatalog,
      [normalizedName]: data.exerciseCatalog[normalizedName]
        ? {
            ...data.exerciseCatalog[normalizedName],
            color: trimmedColor,
          }
        : {
            name: targetExercise.name,
            color: trimmedColor,
            usageCount: 1,
          },
    },
    dailyLogs: Object.fromEntries(
      Object.entries(data.dailyLogs).map(([dateKey, log]) => [
        dateKey,
        {
          ...log,
          snapshotExercises: log.snapshotExercises.map((exercise) =>
            normalizeExerciseName(exercise.name) === normalizedName
              ? { ...exercise, color: trimmedColor }
              : exercise,
          ),
        },
      ]),
    ),
  }
}

export function getExerciseSuggestions(
  data: AppData,
  query = '',
  limit?: number,
  excludedNames: string[] = [],
) {
  const normalizedQuery = normalizeExerciseName(query)
  const excludedSet = new Set(excludedNames.map((name) => normalizeExerciseName(name)))

  const suggestions = Object.entries(data.exerciseCatalog)
    .filter(([normalizedName]) => !excludedSet.has(normalizedName))
    .map(([normalizedName, entry]) => ({
      normalizedName,
      name: entry.name,
      color: entry.color,
      usageCount: entry.usageCount,
    }))
    .filter((entry) => {
      if (!normalizedQuery) {
        return true
      }

      return entry.normalizedName.includes(normalizedQuery)
    })
    .sort((left, right) => {
      if (right.usageCount !== left.usageCount) {
        return right.usageCount - left.usageCount
      }

      return left.name.localeCompare(right.name)
    })

  return typeof limit === 'number' ? suggestions.slice(0, limit) : suggestions
}

export function updateDailyLog(
  data: AppData,
  dateKey: string,
  updater: (log: DailyLog) => DailyLog,
) {
  const existingLog =
    data.dailyLogs[dateKey] ??
    createDailyLog(dateKey, dateKey === todayKey() ? cloneExercises(data.exerciseTemplates) : [])

  return {
    ...data,
    dailyLogs: {
      ...data.dailyLogs,
      [dateKey]: {
        ...updater(existingLog),
        updatedAt: new Date().toISOString(),
      },
    },
  }
}

export function toggleExerciseCompletion(data: AppData, dateKey: string, exerciseId: string) {
  return updateDailyLog(data, dateKey, (log) => {
    const isCompleted = log.completedIds.includes(exerciseId)

    return {
      ...log,
      completedIds: isCompleted
        ? log.completedIds.filter((id) => id !== exerciseId)
        : [...log.completedIds, exerciseId],
    }
  })
}

export function updateNote(data: AppData, dateKey: string, note: string) {
  return updateDailyLog(data, dateKey, (log) => ({
    ...log,
    note,
  }))
}

export function updatePreferences(data: AppData, preferences: Partial<AppPreferences>) {
  return {
    ...data,
    preferences: {
      ...data.preferences,
      ...preferences,
    },
  }
}

export function buildChartData(data: AppData, range: ChartRange): ChartPoint[] {
  return listDateKeys(range).map((dateKey) => {
    const log = data.dailyLogs[dateKey]
    const totalExercises = log?.snapshotExercises.length ?? 0
    const completedCount = log?.completedIds.length ?? 0

    return {
      dateKey,
      label: formatChartLabel(dateKey, range),
      completionRate: getCompletionRate(completedCount, totalExercises),
      completedCount,
      totalExercises,
    }
  })
}

export function getCurrentStreak(data: AppData) {
  const sortedKeys = Object.keys(data.dailyLogs).sort().reverse()
  let streak = 0

  for (const dateKey of sortedKeys) {
    const log = data.dailyLogs[dateKey]
    const completedCount = log?.completedIds.length ?? 0

    if (completedCount > 0) {
      streak += 1
      continue
    }

    if (dateKey === todayKey()) {
      continue
    }

    break
  }

  return streak
}

export function getLastSevenDayTotal(data: AppData) {
  return buildChartData(data, '7d').reduce((sum, point) => sum + point.completedCount, 0)
}
