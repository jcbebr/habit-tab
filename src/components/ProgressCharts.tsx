import {
  Badge,
  Card,
  Group,
  SegmentedControl,
  Stack,
  Text,
} from '@mantine/core'
import { BarChart, LineChart } from '@mantine/charts'
import type { ChartPoint, ChartRange, ChartType } from '../lib/types'

const rangeOptions: { label: string; value: ChartRange }[] = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
]

interface ProgressChartsProps {
  chartData: ChartPoint[]
  range: ChartRange
  chartType: ChartType
  onRangeChange: (nextRange: ChartRange) => void
  onChartTypeChange: (nextChartType: ChartType) => void
}

export function ProgressCharts({
  chartData,
  range,
  chartType,
  onRangeChange,
  onChartTypeChange,
}: ProgressChartsProps) {
  const totalCompleted = chartData.reduce((sum, point) => sum + point.completedCount, 0)
  const averageRate = chartData.length
    ? Math.round(
        chartData.reduce((sum, point) => sum + point.completionRate, 0) / chartData.length,
      )
    : 0

  return (
    <Card className="glass-card" radius="xl" padding="lg" shadow="sm">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text fw={700} size="lg">
              Progress
            </Text>
            <Text c="dimmed" size="sm">
              Track how often you show up and how complete each day feels.
            </Text>
          </Stack>
          <Group gap="xs">
            <Badge color="violet" radius="xl" variant="light">
              {totalCompleted} check marks
            </Badge>
            <Badge color="pink" radius="xl" variant="light">
              Avg {averageRate}%
            </Badge>
          </Group>
        </Group>

        <Group justify="space-between" gap="md" grow>
          <SegmentedControl
            color="grape"
            data={rangeOptions}
            radius="xl"
            value={range}
            onChange={(value) => onRangeChange(value as ChartRange)}
          />
          <SegmentedControl
            color="violet"
            data={[
              { label: 'Line', value: 'line' },
              { label: 'Bar', value: 'bar' },
            ]}
            radius="xl"
            value={chartType}
            onChange={(value) => onChartTypeChange(value as ChartType)}
          />
        </Group>

        {chartType === 'line' ? (
          <LineChart
            className="chart-shell"
            connectNulls
            curveType="bump"
            data={chartData}
            dataKey="label"
            h={320}
            series={[{ color: 'violet.5', label: 'Completion %', name: 'completionRate' }]}
            strokeWidth={3}
            tickLine="none"
            unit="%"
            valueFormatter={(value) => `${value}%`}
            withDots={false}
            withLegend={false}
            yAxisProps={{ domain: [0, 100] }}
          />
        ) : (
          <BarChart
            className="chart-shell"
            data={chartData}
            dataKey="label"
            h={320}
            series={[{ color: 'pink.4', label: 'Completed exercises', name: 'completedCount' }]}
            tickLine="none"
            valueFormatter={(value) => `${value} done`}
            withLegend={false}
          />
        )}
      </Stack>
    </Card>
  )
}
