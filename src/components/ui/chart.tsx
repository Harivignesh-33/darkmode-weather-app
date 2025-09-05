"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type ChartData = {
  name: string
  value: number
}

const data: ChartData[] = [
  { name: "Jan", value: 40 },
  { name: "Feb", value: 30 },
  { name: "Mar", value: 20 },
  { name: "Apr", value: 27 },
  { name: "May", value: 18 },
  { name: "Jun", value: 23 },
  { name: "Jul", value: 34 },
]

// Custom tooltip props type from Recharts
interface CustomTooltipProps {
  active?: boolean
  payload?: {
    value: number
    name: string
  }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-2 shadow-md">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          Value: <span className="font-bold">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export default function Chart() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Monthly Data</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
