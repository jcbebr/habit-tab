import { Badge, Card, Group, Stack, Text } from '@mantine/core'
import { DatePicker } from '@mantine/dates'

interface DayMarker {
  color: string
  exerciseId: string
}

interface CalendarPanelProps {
  selectedDate: string
  selectedDateLabel: string
  lastCheckInLabel: string
  dayMarkers: Record<string, DayMarker[]>
  onSelectDate: (date: string) => void
}

export function CalendarPanel({
  selectedDate,
  selectedDateLabel,
  lastCheckInLabel,
  dayMarkers,
  onSelectDate,
}: CalendarPanelProps) {
  return (
    <Card className="glass-card" radius="xl" padding="lg" shadow="sm">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text fw={700} size="lg">
              Calendar
            </Text>
            <Text c="dimmed" size="sm">
              Pick any day to revisit your notes and workout wins.
            </Text>
          </Stack>
          <Badge color="grape" radius="xl" variant="light">
            {selectedDateLabel}
          </Badge>
        </Group>

        <DatePicker
          allowDeselect={false}
          className="calendar-shell"
          maxDate={new Date()}
          renderDay={(date) => {
            const dateKey = date
            const markers = dayMarkers[dateKey] ?? []
            const dayNumber = Number(date.split('-')[2] ?? '0')

            return (
              <div className="calendar-day">
                <span>{dayNumber}</span>
                {markers.length > 0 ? (
                  <div className="calendar-day-markers">
                    {markers.slice(0, 4).map((marker) => (
                      <span
                        key={`${dateKey}-${marker.exerciseId}`}
                        className="exercise-dot calendar-dot"
                        style={{ backgroundColor: marker.color }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )
          }}
          size="lg"
          value={selectedDate}
          onChange={(value) => {
            if (value) {
              onSelectDate(value)
            }
          }}
        />

        <Badge color="pink" radius="xl" size="lg" variant="dot">
          Last check-in: {lastCheckInLabel}
        </Badge>
      </Stack>
    </Card>
  )
}
