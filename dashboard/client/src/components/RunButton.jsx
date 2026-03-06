import { useState, useEffect } from 'react'
import { api } from '../services/apiClient'

export default function RunButton({ onComplete }) {
    const [state, setState] = useState('idle') // idle | running | complete | error

    async function handleRun() {
        if (state === 'running') return

        try {
            const res = await api.startRun()
            if (!res) { setState('error'); setTimeout(() => setState('idle'), 3000); return }
            if (res.status === 409) { setState('running'); return }
            if (!res.ok) { setState('error'); setTimeout(() => setState('idle'), 3000); return }
            setState('running')

            // Open SSE stream
            const es = api.streamLogs()
            es.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data)
                    if (msg.message === 'PIPELINE_COMPLETE') {
                        setState('complete')
                        es.close()
                        if (onComplete) onComplete()
                        setTimeout(() => setState('idle'), 3000)
                    }
                } catch { /* ignore parse errors */ }
            }
            es.onerror = () => {
                es.close()
                setState('error')
                setTimeout(() => setState('idle'), 3000)
            }
        } catch {
            setState('error')
            setTimeout(() => setState('idle'), 3000)
        }
    }

    const cfg = {
        idle: { label: 'Run Analysis', cls: 'bg-[var(--accent)] text-white hover:opacity-85 active:scale-[0.98]' },
        running: {
            label: (
                <>
                    <div className="spinner" />
                    Running...
                </>
            ),
            cls: 'bg-[var(--bg-elevated)] text-[var(--text-2)] cursor-not-allowed',
            disabled: true
        },
        complete: { label: 'Complete ✓', cls: 'bg-[rgba(52,199,89,0.15)] text-[var(--healthy)] border border-[rgba(52,199,89,0.2)]', disabled: true },
        error: { label: 'Failed', cls: 'bg-[rgba(255,59,48,0.15)] text-[var(--critical)] border border-[rgba(255,59,48,0.2)]', disabled: true },
    }[state]

    return (
        <button
            className={`w-full h-9 flex items-center justify-center gap-2 text-[13px] font-medium rounded-[var(--radius-sm)] transition-all duration-100 ${cfg.cls}`}
            onClick={handleRun}
            disabled={cfg.disabled}
        >
            {cfg.label}
        </button>
    )
}
