import React from 'react'
import { motion } from 'framer-motion'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

const statusColors = {
    healthy: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
    warning: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
    critical: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
}

const getHealthColor = (score) => {
    if (score > 70) return 'bg-green-500';
    if (score > 40) return 'bg-amber-500';
    return 'bg-red-500';
};

export default function FleetPage({ data, onSelectVehicle }) {
    const vehicles = data?.vehicles || []

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground italic flex items-center gap-3">
                        Fleet Status <div className="h-0.5 w-12 bg-border rounded-full" />
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">{vehicles.length} active units across all regions</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="font-semibold">Export Fleet Data</Button>
                </div>
            </header>

            <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
            >
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent px-4">
                            <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest pl-6">Unit ID</TableHead>
                            <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Model</TableHead>
                            <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Owner</TableHead>
                            <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Region</TableHead>
                            <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Health</TableHead>
                            <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                            <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Primary Risk</TableHead>
                            <TableHead className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest pr-6">Management</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vehicles.map((v) => (
                            <TableRow
                                key={v.vehicle_id}
                                className="border-border hover:bg-muted transition-colors cursor-pointer group"
                                onClick={() => onSelectVehicle?.(v)}
                            >
                                <TableCell className="font-bold text-foreground pl-6">{v.vehicle_id}</TableCell>
                                <TableCell className="text-muted-foreground font-medium">{v.model}</TableCell>
                                <TableCell className="text-muted-foreground font-medium">{v.owner_name || '—'}</TableCell>
                                <TableCell className="text-muted-foreground font-medium">{v.city || 'Unknown'}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${getHealthColor(v.health_score)}`}
                                                style={{ width: `${v.health_score}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-foreground opacity-60">{v.health_score}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`${statusColors[v.status] || 'text-muted-foreground'} border-none px-2 font-black text-[10px] uppercase tracking-tighter`}>
                                        {v.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-foreground text-sm font-semibold">
                                    {v.predictions?.[0]?.component || <span className="text-muted-foreground font-normal opacity-40 italic">Nominal</span>}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-indigo-500 hover:text-indigo-400 font-bold text-xs"
                                        onClick={(e) => { e.stopPropagation(); onSelectVehicle?.(v) }}
                                    >
                                        Inspect
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {vehicles.length === 0 && (
                    <div className="h-48 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <p className="text-sm font-medium">No units detected in active range.</p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
