import { motion } from 'framer-motion'
import { AlertTriangle, ChevronRight } from 'lucide-react'

const COLORS = {
    healthy: 'var(--healthy)',
    warning: 'var(--warning)',
    critical: 'var(--critical)',
}

export default function InsightsPage({ data, loading }) {
    if (loading && !data) {
        return <div className="space-y-6"><div className="h-[400px] skeleton w-full" /></div>
    }

    const manufacturing = data || { patterns: [], critical_design_issues: [], llm_analysis: '' }

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <h2 className="text-[18px] font-semibold text-[var(--text-1)]">Manufacturing Quality Insights</h2>
                <p className="text-[13px] text-[var(--text-2)]">Cross-fleet failure pattern analysis via recursive LLM reasoning</p>
            </div>

            {/* Critical Issues */}
            <section className="space-y-4">
                <label className="text-[11px] text-[var(--text-3)] font-bold uppercase tracking-[0.08em] block">
                    Critical Design Issues
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {(manufacturing.critical_design_issues || []).map((issue, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 bg-[var(--critical)]/5 border-l-2 border-[var(--critical)] rounded-r-[var(--radius-sm)] flex gap-3 bg-[rgba(255,59,48,0.04)]"
                        >
                            <AlertTriangle size={14} className="text-[var(--critical)] shrink-0 mt-1" />
                            <span className="text-[13px] font-medium text-[var(--text-1)] leading-snug">{issue}</span>
                        </motion.div>
                    ))}
                    {(!manufacturing.critical_design_issues || manufacturing.critical_design_issues.length === 0) && (
                        <div className="col-span-3 text-[13px] text-[var(--text-3)] p-4 border border-dashed border-[var(--border)] rounded-[var(--radius-md)] text-center">
                            No critical manufacturing flaws identified in the current batch.
                        </div>
                    )}
                </div>
            </section>

            {/* Failure Patterns */}
            <section className="space-y-4">
                <label className="text-[11px] text-[var(--text-3)] font-bold uppercase tracking-[0.08em] block">
                    Failure Patterns ({manufacturing.patterns?.length || 0} identified)
                </label>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hidden">
                    {(manufacturing.patterns || []).map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="card p-5 w-[260px] shrink-0"
                        >
                            <h4 className="text-[13px] font-semibold h-10 line-clamp-2 mb-3 text-[var(--text-1)]">{p.component}</h4>

                            <div className="mb-4">
                                <div
                                    className="text-[24px] font-bold mb-1"
                                    style={{ color: p.failure_rate > 0.7 ? COLORS.critical : p.failure_rate > 0.4 ? COLORS.warning : COLORS.healthy }}
                                >
                                    {(p.failure_rate * 100).toFixed(0)}%
                                </div>
                                <div className="h-[6px] w-full bg-[var(--border)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${p.failure_rate * 100}%`,
                                            background: p.failure_rate > 0.7 ? COLORS.critical : p.failure_rate > 0.4 ? COLORS.warning : COLORS.healthy
                                        }}
                                    />
                                </div>
                            </div>

                            <p className="text-[12px] text-[var(--text-2)] line-clamp-3 mb-2 leading-relaxed">
                                <span className="font-semibold">Root Cause:</span> {p.root_cause}
                            </p>
                            <p className="text-[12px] text-[var(--text-3)] line-clamp-2 leading-relaxed mb-4">
                                <span className="font-semibold">Action:</span> {p.recommendation}
                            </p>

                            <div className="inline-block px-2 py-0.5 bg-[var(--bg-elevated)] rounded text-[10px] text-[var(--text-3)] font-medium">
                                {p.model || 'All Models'}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* AI Analysis */}
            {manufacturing.llm_analysis && (
                <section className="space-y-4">
                    <label className="text-[11px] text-[var(--text-3)] font-bold uppercase tracking-[0.08em] block">
                        AI Engineering Analysis
                    </label>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card p-6"
                    >
                        <div className="space-y-4 text-[14px] leading-[1.85] text-[var(--text-1)]">
                            {manufacturing.llm_analysis.split('\n\n').map((para, i) => (
                                <p key={i}>{para}</p>
                            ))}
                        </div>
                    </motion.div>
                </section>
            )}
        </div>
    )
}
