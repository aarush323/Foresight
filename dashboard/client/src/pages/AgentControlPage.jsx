import React, { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Cpu, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import LiveFeed from '../components/LiveFeed'
import RunMetrics from '../components/RunMetrics'
import { api } from '../services/apiClient'

const pipelineStages = [
    { id: 'telemetry', label: 'Telemetry Ingestion', icon: '📡' },
    { id: 'prediction', label: 'Failure Prediction', icon: '🧠' },
    { id: 'risk', label: 'Risk Assessment', icon: '⚠️' },
    { id: 'scheduling', label: 'Service Scheduling', icon: '📅' },
    { id: 'outreach', label: 'Customer Outreach', icon: '💬' },
    { id: 'manufacturing', label: 'Manufacturing Insights', icon: '🏭' },
]

export default function AgentControlPage({ data, autoStart, onRunStarted }) {
    const [running, setRunning] = useState(false)
    const [activeStage, setActiveStage] = useState(-1)
    const [complete, setComplete] = useState(false)
    const [showFeed, setShowFeed] = useState(false)
    const hasTriggeredRun = useRef(false)

    const handleRun = useCallback(async () => {
        if (running) return
        setRunning(true)
        setComplete(false)
        setActiveStage(0)
        setShowFeed(true)
        if (onRunStarted) onRunStarted()

        try {
            const res = await api.startRun()
            if (!res || res.status === 409) {
                // Already running, just show feed
                return
            }

            const es = api.streamLogs()
            let stageIndex = 0

            es.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data)
                    if (msg.message === 'PIPELINE_COMPLETE') {
                        setActiveStage(pipelineStages.length)
                        setComplete(true)
                        setRunning(false)
                        es.close()
                    } else if (msg.message !== 'PIPELINE_RUNNING') {
                        // Advance stage based on keywords
                        const m = msg.message?.toLowerCase() || ''
                        if (m.includes('telemetry') || m.includes('fetching')) stageIndex = Math.max(stageIndex, 0)
                        if (m.includes('predict') || m.includes('model')) stageIndex = Math.max(stageIndex, 1)
                        if (m.includes('risk') || m.includes('assess')) stageIndex = Math.max(stageIndex, 2)
                        if (m.includes('schedul') || m.includes('appointment')) stageIndex = Math.max(stageIndex, 3)
                        if (m.includes('outreach') || m.includes('message') || m.includes('sms')) stageIndex = Math.max(stageIndex, 4)
                        if (m.includes('manufactur') || m.includes('insight')) stageIndex = Math.max(stageIndex, 5)
                        setActiveStage(stageIndex)
                    }
                } catch { /* ignore */ }
            }

            es.onerror = () => {
                es.close()
                setRunning(false)
            }
        } catch {
            setRunning(false)
        }
    }, [running, onRunStarted])

    // Auto-start logic removed as per user request
    // Pipeline now only runs on explicit button click

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                        <Cpu size={20} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Agent Control</h1>
                        <p className="text-muted-foreground mt-1 text-sm">AI pipeline orchestration and monitoring</p>
                    </div>
                </div>
                <Button
                    onClick={handleRun}
                    disabled={running}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm transition-colors px-6"
                >
                    {running ? (
                        <><Loader2 size={16} className="animate-spin mr-2" /> Running...</>
                    ) : (
                        <><Play size={16} className="mr-2" /> Run Fleet Analysis</>
                    )}
                </Button>
            </header>

            {/* Pipeline Visualization */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">
                    Pipeline Stages
                </h2>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0">
                    {pipelineStages.map((stage, i) => {
                        const isActive = i === activeStage
                        const isDone = i < activeStage || complete
                        const isPending = i > activeStage && !complete

                        return (
                            <React.Fragment key={stage.id}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.08 }}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 flex-1 min-w-0
                                        ${isDone ? 'border-green-500/30 bg-green-500/5' : ''}
                                        ${isActive ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' : ''}
                                        ${isPending ? 'border-border bg-card opacity-50' : ''}
                                    `}
                                >
                                    <div className="text-lg shrink-0">
                                        {isDone ? (
                                            <CheckCircle2 size={20} className="text-green-400" />
                                        ) : isActive ? (
                                            <Loader2 size={20} className="text-indigo-400 animate-spin" />
                                        ) : (
                                            <Circle size={20} className="text-gray-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs text-muted-foreground block">{stage.icon}</span>
                                        <span className={`text-xs font-medium block truncate ${isDone ? 'text-green-400' : isActive ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                                            {stage.label}
                                        </span>
                                    </div>
                                </motion.div>
                                {i < pipelineStages.length - 1 && (
                                    <div className={`hidden md:block w-6 h-0.5 shrink-0 transition-colors duration-300 ${isDone ? 'bg-green-500/40' : 'bg-border'}`} />
                                )}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>

            {/* Run Metrics */}
            <RunMetrics data={data} />

            {/* Live Feed */}
            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                <LiveFeed visible={true} isFullPage={true} />
            </div>
        </div>
    )
}
