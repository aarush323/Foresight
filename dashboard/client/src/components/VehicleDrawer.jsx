import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronRight, MessageSquare, Wrench, ShieldCheck, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Badge } from './ui/badge'

const getSeverityColor = (severity) => {
    if (severity > 0.7) return 'bg-red-500';
    if (severity > 0.4) return 'bg-orange-500';
    return 'bg-green-500';
}

const getUrgencyClass = (urgency) => {
    switch (urgency) {
        case 'immediate': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'soon': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'monitor': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
}

export default function VehicleDrawer({ vehicle, onClose }) {
    const [expandedReasoning, setExpandedReasoning] = useState({})

    if (!vehicle) return null

    const toggleReasoning = (id) => {
        setExpandedReasoning(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="fixed right-0 top-0 h-screen w-full max-w-[480px] z-50 bg-card border-l border-border overflow-y-auto p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">{vehicle.vehicle_id}</h2>
                            <Badge variant="outline" className={`${vehicle.status === 'critical' ? 'bg-red-500/10 text-red-500' : vehicle.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'} border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                                {vehicle.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">{vehicle.model} · {vehicle.year} · {vehicle.city}</p>
                        <p className="text-xs text-muted-foreground mt-1.5 opacity-70">Owner: {vehicle.owner_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-10">
                    {/* Predictions Section */}
                    <section>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                            <AlertCircle size={14} /> Predicted Issues
                        </h3>
                        <div className="space-y-4">
                            {(vehicle.predictions || []).map((p, i) => (
                                <div key={i} className="p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-base font-semibold text-foreground">{p.component}</span>
                                        <Badge variant="outline" className={`${getUrgencyClass(p.urgency)} border uppercase font-bold text-[10px]`}>
                                            {p.urgency}
                                        </Badge>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-xs text-muted-foreground font-medium">Severity Intensity</span>
                                            <span className="text-xs font-bold text-foreground">{(p.severity * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${p.severity * 100}%` }}
                                                className={`h-full rounded-full ${getSeverityColor(p.severity)}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground opacity-70">Probability</span>
                                                <span className="font-bold text-foreground">{(p.probability * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleReasoning(i)}
                                            className="text-indigo-500 font-bold flex items-center gap-1 hover:text-indigo-400 transition-colors py-1 px-2 rounded-md hover:bg-indigo-500/5"
                                        >
                                            {expandedReasoning[i] ? 'Hide logic' : 'Reasoning'}
                                            {expandedReasoning[i] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {expandedReasoning[i] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 p-4 bg-muted/30 rounded-lg text-xs leading-relaxed text-foreground border border-border/50">
                                                    <span className="block font-bold text-muted-foreground mb-1">AI ANALYSIS</span>
                                                    {p.reasoning}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                            {(!vehicle.predictions || vehicle.predictions.length === 0) && (
                                <div className="p-6 rounded-xl border border-dashed border-border text-center">
                                    <ShieldCheck size={24} className="mx-auto text-green-500 mb-2 opacity-50" />
                                    <p className="text-sm text-muted-foreground font-medium">No immediate risks detected.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Appointment Section */}
                    {vehicle.appointment && (
                        <section>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Service Status</h3>
                            <div className="p-5 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-indigo-500/10">
                                        <Wrench size={18} className="text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-foreground truncate">{vehicle.appointment.center_name}</h4>
                                            <Badge className="bg-indigo-500 text-white border-none text-[10px] uppercase">{vehicle.appointment.status}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 truncate">{vehicle.appointment.technician_name} · {vehicle.appointment.specialization}</p>
                                        <div className="mt-4 text-xs font-bold text-indigo-500 flex items-center gap-1.5 uppercase tracking-tighter">
                                            Scheduled: {vehicle.appointment.slot_time}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Outreach Section */}
                    {vehicle.outreach && (
                        <section>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Communications</h3>
                            <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="secondary" className="bg-muted text-foreground text-[10px] flex items-center gap-1 px-2">
                                        <MessageSquare size={12} /> {vehicle.outreach.channel.toUpperCase()}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground font-medium">SENT VIA AI GATEWAY</span>
                                </div>
                                <p className="text-sm italic text-foreground leading-relaxed pl-4 border-l-2 border-indigo-500">
                                    "{vehicle.outreach.message}"
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Feedback Section */}
                    {vehicle.feedback && vehicle.feedback.status !== 'skipped' && (
                        <section>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Post-Service Feedback</h3>
                            <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-4xl font-bold text-foreground">{vehicle.feedback.satisfaction_score}</span>
                                    <span className="text-sm text-muted-foreground">/ 10</span>
                                    <div className="ml-auto h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <ShieldCheck size={18} className="text-green-500" />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground italic leading-relaxed">"{vehicle.feedback.notes}"</p>
                            </div>
                        </section>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
