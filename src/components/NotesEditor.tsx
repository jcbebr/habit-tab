import { Badge, Card, Stack, Text, Textarea } from '@mantine/core'

interface NotesEditorProps {
  note: string
  canEdit: boolean
  helperText: string
  onChange: (nextValue: string) => void
}

export function NotesEditor({ note, canEdit, helperText, onChange }: NotesEditorProps) {
  return (
    <Card className="glass-card" radius="xl" padding="lg" shadow="sm">
      <Stack gap="md">
        <Stack gap={4}>
          <Text fw={700} size="lg">
            Notes
          </Text>
          <Text c="dimmed" size="sm">
            Capture how you felt, what worked, or what you want to remember tomorrow.
          </Text>
        </Stack>

        <Textarea
          autosize
          className="soft-textarea"
          disabled={!canEdit}
          minRows={10}
          placeholder="Ex: Energy was great today. Increase weight next session."
          radius="lg"
          value={note}
          onChange={(event) => onChange(event.currentTarget.value)}
        />

        <Badge color={canEdit ? 'green' : 'gray'} radius="xl" size="lg" variant="light">
          {helperText}
        </Badge>
      </Stack>
    </Card>
  )
}
