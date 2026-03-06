import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/apiClient'
import { X } from 'lucide-react'

export default function LiveFeed({ visible, onHide, isFullPage = false }) {
    const [logs, setLogs] = useState([])
    const [running, setRunning] = useState(false)
    const [complete, setComplete] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        if (!visible && !isFullPage) return

        if (visible && !isFullPage) setLogs([])

        setRunning(true)
        setComplete(false)

        const es = api.streamLogs()
        es.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data)
                if (msg.message === 'PIPELINE_COMPLETE') {
                    setRunning(false)
                    setComplete(true)
                    es.close()
                    if (!isFullPage) {
                        setTimeout(() => { if (onHide) onHide() }, 5000)
                    }
                } else if (msg.message === 'PIPELINE_RUNNING') {
                    // ignore status pings
                } else {
                    setLogs(prev => [...prev, msg])
                }
            } catch { /* ignore */ }
        }
        es.onerror = () => { es.close(); setRunning(false) }

        return () => es.close()
    }, [visible, isFullPage, onHide])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const getLogColor = (msg) => {
        const m = msg.toLowerCase()
        if (m.includes('✅') || m.includes('complete') || m.includes('done')) return '#4ade80' // green-400
        if (m.includes('🔴') || m.includes('critical') || m.includes('error') || m.includes('❌')) return '#f87171' // red-400
        if (m.includes('⚠') || m.includes('warning')) return '#fbbf24' // amber-400
        if (m.includes('🧠') || m.includes('llm') || m.includes('cerebras')) return '#818cf8' // indigo-400
        if (m.includes('📡') || m.includes('telemetry')) return '#f59e0b' // amber-500
        return '#e4e4e7' // zinc-200 (readable on black)
    }

    if (isFullPage) {
        return (
            <div className="flex flex-col h-[600px] border border-border bg-black rounded-xl overflow-hidden shadow-2xl relative">
                {/* Terminal Header */}
                <div className="h-10 flex items-center justify-between px-4 bg-zinc-900 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 mr-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Console</span>
                        <div className="h-3 w-[1px] bg-white/10 mx-1" />
                        <span className="text-[10px] font-mono text-zinc-500 lowercase">ai-fleet-intelligence:~</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded bg-black border border-white/5`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">{running ? 'Process Active' : 'Waiting'}</span>
                        </div>
                    </div>
                </div>

                {/* Scanline Effect Overlay (Optional but cool) */}
                <div className="absolute inset-x-0 top-10 bottom-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-10 bg-[length:100%_2px,3px_100%]" />
                <div className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed bg-black">
                    {logs.map((l, i) => (
                        <div key={i} className="flex gap-4 mb-1">
                            <span className="text-zinc-500 min-w-[72px] shrink-0">{l.time}</span>
                            <span style={{ color: getLogColor(l.message) }}>{l.message}</span>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-3)] gap-2">
                            <p>No pipeline runs yet.</p>
                            <p className="text-[11px]">Click Run Analysis to start.</p>
                        </div>
                    )}
                    {running && <span className="terminal-cursor">▌</span>}
                    <div ref={bottomRef} />
                </div>
            </div>
        )
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-6 right-6 w-[380px] h-[280px] glass border border-[var(--border)] shadow-[var(--shadow-lg)] rounded-[var(--radius-md)] z-[100] flex flex-col overflow-hidden"
                >
                    <div className="h-9 flex items-center justify-between px-3 border-b border-[var(--border)]">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-[var(--text-1)]">Pipeline Running</span>
                            {running && <div className="spinner !border-white/20 !border-t-white" style={{ width: 10, height: 10 }} />}
                        </div>
                        <button onClick={onHide} className="text-[var(--text-3)] hover:text-[var(--text-1)]">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
                        {logs.map((l, i) => (
                            <div key={i} className="flex gap-3 mb-1">
                                <span className="text-[var(--text-3)] w-[60px] shrink-0">{l.time}</span>
                                <span className="truncate" style={{ color: getLogColor(l.message) }}>{l.message}</span>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
