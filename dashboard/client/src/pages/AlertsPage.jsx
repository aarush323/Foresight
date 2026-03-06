import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table'
import { Badge } from '../components/ui/badge'

const getSeverityColor = (severity) => {
    if (severity > 0.7) return 'bg-red-500';
    if (severity > 0.4) return 'bg-orange-500';
    return 'bg-green-500';
}

const urgencyClasses = {
    immediate: 'bg-red-500/10 text-red-500 border-red-500/20',
    soon: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    monitor: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

export default function AlertsPage({ data }) {
    const vehicles = data?.vehicles || []

    const alerts = useMemo(() => {
        const result = []
        vehicles.forEach(v => {
            if (v.status === 'critical') {
                (v.predictions || []).forEach(p => {
                    result.push({
                        vehicle_id: v.vehicle_id,
                        model: v.model,
                        city: v.city,
                        component: p.component,
                        severity: p.severity,
                        urgency: p.urgency,
                        appointment: v.appointment,
                    })
                })
                if (!v.predictions || v.predictions.length === 0) {
                    result.push({
                        vehicle_id: v.vehicle_id,
                        model: v.model,
                        city: v.city,
                        component: 'System Integrity',
                        severity: 0.9,
                        urgency: 'immediate',
                        appointment: v.appointment,
                    })
                }
            } else {
                (v.predictions || []).filter(p => p.urgency === 'immediate').forEach(p => {
                    result.push({
                        vehicle_id: v.vehicle_id,
                        model: v.model,
                        city: v.city,
                        component: p.component,
                        severity: p.severity,
                        urgency: p.urgency,
                        appointment: v.appointment,
                    })
                })
            }
        })
        return result.sort((a, b) => b.severity - a.severity)
    }, [vehicles])

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 shadow-inner">
                        <ShieldAlert size={24} className="text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">System Alerts</h1>
                        <p className="text-muted-foreground mt-0.5 text-sm font-semibold">
                            {alerts.length} critical anomalies detected in fleet telemetry
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 px-4 py-1.5 text-xs font-black uppercase tracking-widest">
                        <AlertTriangle size={14} className="mr-1.5" />
                        {alerts.filter(a => a.urgency === 'immediate').length} Immediate Action
                    </Badge>
                </div>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
            >
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground font-black uppercase text-[10px] tracking-widest pl-8">Vehicle</TableHead>
                            <TableHead className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Failure Component</TableHead>
                            <TableHead className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Severity Index</TableHead>
                            <TableHead className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Urgency</TableHead>
                            <TableHead className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Region</TableHead>
                            <TableHead className="text-right text-muted-foreground font-black uppercase text-[10px] tracking-widest pr-8">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alerts.map((a, i) => (
                            <TableRow key={`${a.vehicle_id}-${a.component}-${i}`} className="border-border hover:bg-muted transition-colors">
                                <TableCell className="font-black text-foreground pl-8 underline underline-offset-4 decoration-border">{a.vehicle_id}</TableCell>
                                <TableCell className="text-foreground font-bold">{a.component}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full rounded-full ${getSeverityColor(a.severity)} transition-all`}
                                                style={{ width: `${a.severity * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-black text-foreground opacity-60">{(a.severity * 100).toFixed(0)}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`${urgencyClasses[a.urgency] || urgencyClasses.monitor} border px-2.5 py-0.5 text-[10px] uppercase font-black tracking-wider`}>
                                        {a.urgency}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground font-medium text-xs">{a.city || 'Unknown'}</TableCell>
                                <TableCell className="text-right pr-8">
                                    {a.appointment ? (
                                        <Badge className="bg-green-500/10 text-green-500 border-none font-bold text-[10px] uppercase">
                                            Handled: {a.appointment.status}
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-500 text-white border-none font-bold text-[10px] uppercase animate-pulse">
                                            Unscheduled
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {alerts.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ShieldAlert size={32} className="text-green-500 opacity-50" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No priority anomalies detected</p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
