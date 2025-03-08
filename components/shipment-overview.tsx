import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const recentShipments = [
  { id: "SH001", destination: "New York", status: "In Transit", eta: "2023-06-15" },
  { id: "SH002", destination: "Los Angeles", status: "Delivered", eta: "2023-06-12" },
  { id: "SH003", destination: "Chicago", status: "Processing", eta: "2023-06-18" },
  { id: "SH004", destination: "Houston", status: "In Transit", eta: "2023-06-16" },
  { id: "SH005", destination: "Phoenix", status: "Delayed", eta: "2023-06-17" },
];

export function ShipmentOverview() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Destination</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>ETA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentShipments.map((shipment) => (
          <TableRow key={shipment.id}>
            <TableCell className="font-medium">{shipment.id}</TableCell>
            <TableCell>{shipment.destination}</TableCell>
            <TableCell>
              <Badge
                variant={
                  shipment.status === "Delivered"
                    ? "outline"
                    : shipment.status === "In Transit"
                    ? "default"
                    : shipment.status === "Processing"
                    ? "secondary"
                    : "destructive"
                }
              >
                {shipment.status}
              </Badge>
            </TableCell>
            <TableCell>{shipment.eta}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
