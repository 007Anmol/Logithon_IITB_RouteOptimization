import { Progress } from "@/components/ui/progress"

const fleetStatus = [
  { type: "Trucks", total: 50, active: 42 },
  { type: "Vans", total: 30, active: 28 },
  { type: "Cars", total: 20, active: 19 },
]

export function FleetStatus() {
  return (
    <div className="space-y-4">
      {fleetStatus.map((vehicle) => (
        <div key={vehicle.type} className="flex items-center">
          <div className="w-24 font-medium">{vehicle.type}</div>
          <div className="flex-1">
            <Progress value={(vehicle.active / vehicle.total) * 100} className="h-2" />
          </div>
          <div className="w-24 text-right text-sm text-muted-foreground">
            {vehicle.active}/{vehicle.total}
          </div>
        </div>
      ))}
    </div>
  )
}

