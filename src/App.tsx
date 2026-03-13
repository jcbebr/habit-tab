import {
  Alert,
  Badge,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import {
  IconCalendarHeart,
  IconChartHistogram,
  IconDeviceFloppy,
  IconFlame,
  IconSparkles,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarPanel } from './components/CalendarPanel'
import { ExerciseChecklist } from './components/ExerciseChecklist'
import { NotesEditor } from './components/NotesEditor'
import { ProgressCharts } from './components/ProgressCharts'
import { formatFriendlyDate, getCompletionRate, isToday, todayKey } from './lib/date'
import { getDailyQuote } from './lib/quotes'
import {
  addExerciseTemplate,
  buildChartData,
  getExerciseSuggestions,
  getCurrentStreak,
  getLastSevenDayTotal,
  loadAppData,
  removeExerciseTemplate,
  saveAppData,
  toggleExerciseCompletion,
  updateExerciseColor,
  updateNote,
  updatePreferences,
} from './lib/storage'
import type { AppData, ChartRange, ChartType } from './lib/types'

function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => todayKey())
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const saveTimeoutRef = useRef<number | null>(null)

  const persistData = useCallback(async (nextData: AppData) => {
    try {
      await saveAppData(nextData)
      setSaveState('saved')
    } catch (error) {
      console.error(error)
      setSaveState('error')
      notifications.show({
        color: 'red',
        message: 'Could not save your update locally. Please try again.',
        title: 'Save failed',
      })
    }
  }, [])

  const applyUpdate = useCallback(
    (updater: (current: AppData) => AppData, debounced = false) => {
      setData((current) => {
        if (!current) {
          return current
        }

        const nextData = updater(current)
        setSaveState('saving')

        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }

        if (debounced) {
          saveTimeoutRef.current = window.setTimeout(() => {
            void persistData(nextData)
          }, 450)
        } else {
          void persistData(nextData)
        }

        return nextData
      })
    },
    [persistData],
  )

  useEffect(() => {
    void (async () => {
      try {
        const nextData = await loadAppData()
        setData(nextData)
      } catch (error) {
        console.error(error)
        notifications.show({
          color: 'red',
          message: 'The dashboard could not load your local data.',
          title: 'Load failed',
        })
      }
    })()

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!data) {
      return
    }

    if (data.dailyQuote?.dateKey === todayKey()) {
      return
    }

    void (async () => {
      const nextQuote = await getDailyQuote(data.dailyQuote)

      setData((current) => {
        if (!current || current.dailyQuote?.dateKey === nextQuote.dateKey) {
          return current
        }

        const nextData = {
          ...current,
          dailyQuote: nextQuote,
        }

        void saveAppData(nextData)

        return nextData
      })
    })()
  }, [data])

  const selectedDateKey = selectedDate
  const viewingToday = isToday(selectedDateKey)

  const selectedLog = data?.dailyLogs[selectedDateKey]
  const todayLog = data?.dailyLogs[todayKey()]

  const selectedExercises = useMemo(
    () => selectedLog?.snapshotExercises ?? (viewingToday ? data?.exerciseTemplates ?? [] : []),
    [data?.exerciseTemplates, selectedLog?.snapshotExercises, viewingToday],
  )
  const selectedCompletedIds = selectedLog?.completedIds ?? []
  const exerciseSuggestions = useMemo(() => {
    if (!data || !viewingToday) {
      return []
    }

    return getExerciseSuggestions(
      data,
      '',
      undefined,
      selectedExercises.map((exercise) => exercise.name),
    )
  }, [data, selectedExercises, viewingToday])
  const todayProgress = getCompletionRate(
    todayLog?.completedIds.length ?? 0,
    todayLog?.snapshotExercises.length ?? 0,
  )

  const chartData = useMemo(() => {
    if (!data) {
      return []
    }

    return buildChartData(data, data.preferences.chartRange)
  }, [data])

  const streak = data ? getCurrentStreak(data) : 0
  const sevenDayTotal = data ? getLastSevenDayTotal(data) : 0

  const latestLoggedDay = useMemo(() => {
    if (!data) {
      return todayKey()
    }

    return (
      Object.values(data.dailyLogs)
        .filter((log) => log.note.trim().length > 0 || log.completedIds.length > 0)
        .sort((left, right) => right.dateKey.localeCompare(left.dateKey))[0]?.dateKey ?? todayKey()
    )
  }, [data])

  const calendarMarkers = useMemo(() => {
    if (!data) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(data.dailyLogs).map(([dateKey, log]) => [
        dateKey,
        log.snapshotExercises
          .filter((exercise) => log.completedIds.includes(exercise.id))
          .map((exercise) => ({
            exerciseId: exercise.id,
            color: exercise.color,
          })),
      ]),
    )
  }, [data])

  if (!data) {
    return (
      <div className="loading-shell">
        <Loader color="violet" size="lg" />
      </div>
    )
  }

  const noteHelperText = viewingToday
    ? saveState === 'saving'
      ? 'Saving locally...'
      : saveState === 'error'
        ? 'Local save failed. Try again.'
        : 'Saved automatically on this device.'
    : selectedLog
      ? 'History view is locked so your past check-ins stay intact.'
      : 'No note was saved for this date.'

  return (
    <Container className="page-shell" size="xl">
      <Stack gap="xl">
        {!viewingToday ? (
          <Alert color="grape" radius="xl" title="History mode" variant="light">
            You are viewing {formatFriendlyDate(selectedDateKey)}. Checklists and notes are shown
            as history only.
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Card className="metric-card" radius="xl" padding="lg">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm">
                  Today&apos;s completion
                </Text>
                <Text fw={800} size="2rem">
                  {todayProgress}%
                </Text>
              </div>
              <ThemeIcon color="violet" radius="xl" size={48} variant="light">
                <IconDeviceFloppy size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card className="metric-card" radius="xl" padding="lg">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm">
                  Current streak
                </Text>
                <Text fw={800} size="2rem">
                  {streak} day{streak === 1 ? '' : 's'}
                </Text>
              </div>
              <ThemeIcon color="pink" radius="xl" size={48} variant="light">
                <IconFlame size={24} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card className="metric-card" radius="xl" padding="lg">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm">
                  Last 7 days
                </Text>
                <Text fw={800} size="2rem">
                  {sevenDayTotal} check-ins
                </Text>
              </div>
              <ThemeIcon color="grape" radius="xl" size={48} variant="light">
                <IconChartHistogram size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <ExerciseChecklist
              canEdit={viewingToday}
              completedIds={selectedCompletedIds}
              dateLabel={viewingToday ? 'Today' : formatFriendlyDate(selectedDateKey)}
              exercises={selectedExercises}
              suggestions={exerciseSuggestions}
              onAddExercise={(name) => applyUpdate((current) => addExerciseTemplate(current, name))}
              onRemoveExercise={(exerciseId) =>
                applyUpdate((current) => removeExerciseTemplate(current, exerciseId))
              }
              onToggle={(exerciseId) =>
                applyUpdate((current) => toggleExerciseCompletion(current, selectedDateKey, exerciseId))
              }
              onUpdateExerciseColor={(exerciseId, color) =>
                applyUpdate((current) => updateExerciseColor(current, exerciseId, color))
              }
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Stack gap="md">
              <CalendarPanel
                dayMarkers={calendarMarkers}
                lastCheckInLabel={formatFriendlyDate(latestLoggedDay)}
                selectedDate={selectedDate}
                selectedDateLabel={viewingToday ? 'Today' : formatFriendlyDate(selectedDateKey)}
                onSelectDate={setSelectedDate}
              />

              <Card className="glass-card accent-card" radius="xl" padding="lg" shadow="sm">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={700} size="lg">
                      Daily quote
                    </Text>
                    <ThemeIcon color="pink" radius="xl" variant="light">
                      <IconSparkles size={18} />
                    </ThemeIcon>
                  </Group>
                  <Text c="dimmed" className="quote-text" size="sm">
                    “{data.dailyQuote?.text ?? 'Loading today’s encouragement...'}”
                  </Text>
                  <Text fw={600} size="sm">
                    {data.dailyQuote?.author ?? 'Move & Note'}
                  </Text>
                  <Group gap="sm">
                    <Badge color="violet" radius="xl" variant="light">
                      {data.dailyQuote?.source === 'zenquotes' ? 'ZenQuotes' : 'Offline fallback'}
                    </Badge>
                    <Badge color="grape" radius="xl" variant="light">
                      Last check-in {formatFriendlyDate(latestLoggedDay)}
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 7 }}>
            <NotesEditor
              canEdit={viewingToday}
              helperText={noteHelperText}
              note={selectedLog?.note ?? ''}
              onChange={(nextValue) =>
                applyUpdate((current) => updateNote(current, selectedDateKey, nextValue), true)
              }
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Card className="glass-card accent-card" radius="xl" padding="lg" shadow="sm">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={700} size="lg">
                    Snapshot
                  </Text>
                  <ThemeIcon color="grape" radius="xl" variant="light">
                    <IconCalendarHeart size={18} />
                  </ThemeIcon>
                </Group>
                <Text c="dimmed" size="sm">
                  {selectedLog
                    ? `On ${formatFriendlyDate(selectedDateKey)}, you completed ${selectedCompletedIds.length} of ${selectedExercises.length} planned exercises.`
                    : 'No workout or note was recorded for this day yet.'}
                </Text>
                <Badge color="pink" radius="xl" size="lg" variant="light">
                  {selectedLog?.note.trim()
                    ? 'A note was saved for this day'
                    : 'No note saved for this day'}
                </Badge>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <ProgressCharts
          chartData={chartData}
          chartType={data.preferences.chartType}
          range={data.preferences.chartRange}
          onChartTypeChange={(nextChartType: ChartType) =>
            applyUpdate((current) => updatePreferences(current, { chartType: nextChartType }))
          }
          onRangeChange={(nextRange: ChartRange) =>
            applyUpdate((current) => updatePreferences(current, { chartRange: nextRange }))
          }
        />
      </Stack>
    </Container>
  )
}

export default App
