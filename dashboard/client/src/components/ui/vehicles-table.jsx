import React from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./table";
import { Badge } from "./badge";
import { Button } from "./button";

const statusColors = {
    healthy: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    warning: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
    critical: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

const getHealthColor = (score) => {
    if (score > 70) return 'bg-green-500';
    if (score > 40) return 'bg-amber-500';
    return 'bg-red-500';
};

export default function VehiclesTable({ vehicles = [], onSelectVehicle }) {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Vehicle ID</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Model</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Location</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Health Score</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Prediction</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {vehicles.map((v) => (
                        <TableRow
                            key={v.vehicle_id}
                            className="border-border hover:bg-muted transition-colors cursor-pointer"
                            onClick={() => onSelectVehicle(v)}
                        >
                            <TableCell className="font-medium text-foreground">{v.vehicle_id}</TableCell>
                            <TableCell className="text-muted-foreground">{v.model}</TableCell>
                            <TableCell className="text-muted-foreground">{v.city || 'Unknown'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${getHealthColor(v.health_score)}`}
                                            style={{ width: `${v.health_score}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">{v.health_score}%</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                                {v.predictions?.[0]?.component || <span className="text-muted-foreground">No data</span>}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`${statusColors[v.status] || 'text-muted-foreground'} border-none`}>
                                    {v.status?.charAt(0).toUpperCase() + v.status?.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                                    onClick={(e) => { e.stopPropagation(); onSelectVehicle(v) }}
                                >
                                    Details
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {vehicles.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No vehicles found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
