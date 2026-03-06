import { motion } from 'framer-motion'
import { Car, Activity, AlertTriangle, CalendarCheck, MessageSquare, Cpu } from 'lucide-react'

const metrics = [
    { key: 'vehiclesProcessed', label: 'Vehicles Processed', icon: Car, color: 'text-blue-400' },
    { key: 'failuresDetected', label: 'Failures Detected', icon: AlertTriangle, color: 'text-red-400' },
    { key: 'appointmentsScheduled', label: 'Appointments Scheduled', icon: CalendarCheck, color: 'text-green-400' },
    { key: 'messagesSent', label: 'Messages Sent', icon: MessageSquare, color: 'text-purple-400' },
]

export default function RunMetrics({ data }) {
    const values = {
        vehiclesProcessed: data?.summary?.fleet_size || 0,
        failuresDetected: data?.summary?.critical_count + (data?.summary?.warning_count || 0) || 0,
        appointmentsScheduled: data?.summary?.appointments_booked || 0,
        messagesSent: data?.vehicles?.filter(v => v.outreach)?.length || 0,
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m, i) => {
                const Icon = m.icon
                return (
                    <motion.div
                        key={m.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-xl border border-border bg-card p-4 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Icon size={16} className={m.color} />
                            <span className="text-xs text-muted-foreground">{m.label}</span>
                        </div>
                        <span className="text-2xl font-bold text-foreground">{values[m.key]}</span>
                    </motion.div>
                )
            })}
        </div>
    )
}
