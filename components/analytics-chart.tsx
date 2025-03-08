"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Jan", shipments: 120 },
  { month: "Feb", shipments: 150 },
  { month: "Mar", shipments: 180 },
  { month: "Apr", shipments: 220 },
  { month: "May", shipments: 250 },
  { month: "Jun", shipments: 280 },
  { month: "Jul", shipments: 310 },
]

export function AnalyticsChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Line type="monotone" dataKey="shipments" stroke="#1e40af" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

