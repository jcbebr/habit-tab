import {
  ActionIcon,
  Autocomplete,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Progress,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { useState } from 'react'
import { IconPalette, IconPlus, IconSearch, IconSparkles, IconTrash } from '@tabler/icons-react'
import type { ExerciseTemplate } from '../lib/types'

interface ExerciseSuggestion {
  name: string
  color: string
  usageCount: number
}

interface ExerciseChecklistProps {
  exercises: ExerciseTemplate[]
  completedIds: string[]
  canEdit: boolean
  dateLabel: string
  suggestions: ExerciseSuggestion[]
  onToggle: (exerciseId: string) => void
  onAddExercise: (name: string) => void
  onRemoveExercise: (exerciseId: string) => void
  onUpdateExerciseColor: (exerciseId: string, color: string) => void
}

export function ExerciseChecklist({
  exercises,
  completedIds,
  canEdit,
  dateLabel,
  suggestions,
  onToggle,
  onAddExercise,
  onRemoveExercise,
  onUpdateExerciseColor,
}: ExerciseChecklistProps) {
  const [newExerciseName, setNewExerciseName] = useState('')
  const completedCount = completedIds.length
  const progressValue = exercises.length === 0 ? 0 : Math.round((completedCount / exercises.length) * 100)

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) {
      return
    }

    onAddExercise(newExerciseName)
    setNewExerciseName('')
  }

  const quickAddSuggestions = suggestions.slice(0, 7)

  const autocompleteData = suggestions.slice(0, 12).map((suggestion) => suggestion.name)

  const renderExerciseDot = (color: string) => (
    <span
      aria-hidden="true"
      className="exercise-dot"
      style={{ backgroundColor: color }}
    />
  )

  return (
    <Card className="glass-card" radius="xl" padding="lg" shadow="sm">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text fw={700} size="lg">
              Daily gym check-in
            </Text>
            <Text c="dimmed" size="sm">
              {dateLabel}
            </Text>
          </Stack>
          <Badge color="violet" radius="xl" size="lg" variant="light">
            {completedCount}/{exercises.length || 0} done
          </Badge>
        </Group>

        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={600} size="sm">
              Progress today
            </Text>
            <Text c="dimmed" size="sm">
              {progressValue}%
            </Text>
          </Group>
          <Progress color="violet" radius="xl" size="lg" value={progressValue} />
        </Stack>

        {canEdit ? (
          <Stack gap="sm">
            {quickAddSuggestions.length > 0 ? (
              <Stack gap="xs">
                <Group gap="xs">
                  <ThemeIcon color="pink" radius="xl" size={28} variant="light">
                    <IconSparkles size={16} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    Quick add
                  </Text>
                </Group>
                <Group gap="sm">
                  {quickAddSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion.name}
                      leftSection={renderExerciseDot(suggestion.color)}
                      radius="xl"
                      variant="light"
                      onClick={() => onAddExercise(suggestion.name)}
                    >
                      {suggestion.name}
                    </Button>
                  ))}
                </Group>
              </Stack>
            ) : null}

            <Group align="end" wrap="nowrap">
              <Autocomplete
                className="soft-input"
                data={autocompleteData}
                flex={1}
                label="Search or add exercise"
                leftSection={<IconSearch size={16} />}
                limit={12}
                placeholder="Ex: Romanian deadlift"
                value={newExerciseName}
                onChange={setNewExerciseName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleAddExercise()
                  }
                }}
              />
              <Button
                leftSection={<IconPlus size={16} />}
                radius="xl"
                variant="gradient"
                gradient={{ from: 'violet', to: 'pink' }}
                onClick={handleAddExercise}
              >
                Add
              </Button>
            </Group>
          </Stack>
        ) : null}

        <Stack gap="sm">
          {exercises.length === 0 ? (
            <Card className="empty-card" radius="lg" padding="lg">
              <Text fw={600}>No exercises yet</Text>
              <Text c="dimmed" size="sm">
                Add your go-to movements and they will appear here every day.
              </Text>
            </Card>
          ) : null}

          {exercises.map((exercise) => {
            const checked = completedIds.includes(exercise.id)

            return (
              <Card
                key={exercise.id}
                className="list-row"
                radius="lg"
                padding="sm"
                style={{
                  background: `color-mix(in srgb, ${exercise.color} 18%, rgba(255, 255, 255, 0.88))`,
                  borderColor: `color-mix(in srgb, ${exercise.color} 42%, rgba(120, 88, 168, 0.12))`,
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Checkbox
                    checked={checked}
                    color="violet"
                    disabled={!canEdit}
                    label={exercise.name}
                    onChange={() => onToggle(exercise.id)}
                  />
                  {canEdit ? (
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        aria-label={`Change color for ${exercise.name}`}
                        color="gray"
                        component="label"
                        radius="xl"
                        variant="subtle"
                      >
                        <IconPalette size={16} />
                        <input
                          aria-label={`Pick color for ${exercise.name}`}
                          className="color-picker-input"
                          type="color"
                          value={exercise.color}
                          onChange={(event) =>
                            onUpdateExerciseColor(exercise.id, event.currentTarget.value)
                          }
                        />
                      </ActionIcon>
                      <ActionIcon
                        aria-label={`Remove ${exercise.name}`}
                        color="gray"
                        radius="xl"
                        variant="subtle"
                        onClick={() => onRemoveExercise(exercise.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  ) : null}
                </Group>
              </Card>
            )
          })}
        </Stack>
      </Stack>
    </Card>
  )
}
