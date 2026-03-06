import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, CheckCircle2, FileText, Activity } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    ResponsiveContainer, Tooltip as RechartsTooltip, Cell,
} from 'recharts'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

export default function ManufacturingPage({ data, loading }) {
    if (loading && !data) {
        return (
            <div className="space-y-12 max-w-7xl mx-auto pb-12 animate-pulse">
                <div className="h-64 bg-muted rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-muted rounded-lg" />
                    <div className="h-32 bg-muted rounded-lg" />
                </div>
                <div className="h-96 bg-muted rounded-xl" />
            </div>
        )
    }

    const manufacturing = data || {
        patterns: [],
        critical_design_issues: [],
        llm_analysis: '',
        recommendations: [],
        executive_summary: "No executive summary available for this batch.",
        risk_assessment: "Low"
    }

    const chartData = (manufacturing.patterns || []).map(p => ({
        name: p.component,
        rate: Math.round(p.failure_rate * 100),
        color: p.failure_rate > 0.7 ? '#ef4444' : p.failure_rate > 0.4 ? '#f59e0b' : '#22c55e',
    })).sort((a, b) => b.rate - a.rate)

    return (
        <div className="space-y-16 max-w-7xl mx-auto pb-24">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Reliability Report</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-foreground italic flex items-center gap-3">
                    Manufacturing Intelligence <div className="h-1 flex-1 bg-border/50 rounded-full" />
                </h1>
            </header>

            {/* 1. Executive Summary */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Activity size={20} className="text-indigo-500" /> 1. Executive Summary
                    </h2>
                    <Badge variant="outline" className={`px-3 py-1 text-xs font-bold ${manufacturing.risk_assessment?.toLowerCase() === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                        RISK LEVEL: {manufacturing.risk_assessment || 'LOW'}
                    </Badge>
                </div>
                <Card className="p-10 rounded-xl border border-border bg-card shadow-sm">
                    <div className="max-w-4xl">
                        <p className="text-lg leading-relaxed text-foreground/90 font-medium">
                            {manufacturing.executive_summary}
                        </p>
                        {manufacturing.llm_analysis && (
                            <div className="mt-8 pt-8 border-t border-border/50 text-sm italic text-muted-foreground leading-relaxed">
                                {manufacturing.llm_analysis.substring(0, 300)}...
                            </div>
                        )}
                    </div>
                </Card>
            </section>

            {/* 2. Critical Design Issues */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                    <AlertTriangle size={20} className="text-red-500" /> 2. Critical Design Issues
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(manufacturing.critical_design_issues || []).map((issue, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-xl border border-red-500/30 bg-red-500/5 flex gap-4"
                        >
                            <AlertTriangle size={20} className="text-red-500 shrink-0" />
                            <div className="space-y-1">
                                <span className="text-sm font-bold text-foreground">Defect {i + 1}</span>
                                <p className="text-sm text-foreground/80 leading-snug">{issue}</p>
                            </div>
                        </motion.div>
                    ))}
                    {(!manufacturing.critical_design_issues || manufacturing.critical_design_issues.length === 0) && (
                        <div className="col-span-2 text-sm text-muted-foreground p-8 border border-dashed border-border rounded-xl text-center">
                            No critical manufacturing flaws identified in current analysis.
                        </div>
                    )}
                </div>
            </section>

            {/* 3. Failure Rate Chart */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                    <TrendingUp size={20} className="text-indigo-500" /> 3. Failure Rate Analysis
                </h2>
                <Card className="rounded-xl border border-border bg-card p-10 shadow-sm">
                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} width={150} />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted)/.2)' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                                    formatter={(v) => [`${v}%`, 'Failure Probability']}
                                />
                                <Bar dataKey="rate" radius={[0, 8, 8, 0]} barSize={40}>
                                    {chartData.map((entry, idx) => (
                                        <Cell key={idx} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </section>

            {/* 4. Failure Pattern Cards */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                    <Activity size={20} className="text-orange-500" /> 4. Component Reliability Patterns
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(manufacturing.patterns || []).map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-muted/20 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                            <h4 className="text-base font-bold text-foreground mb-4 pr-10">{p.component}</h4>
                            <div className="mb-6">
                                <span className={`text-4xl font-black tracking-tighter ${p.failure_rate > 0.7 ? 'text-red-500' : p.failure_rate > 0.4 ? 'text-orange-500' : 'text-green-500'}`}>
                                    {(p.failure_rate * 100).toFixed(0)}%
                                </span>
                                <span className="text-xs text-muted-foreground ml-2 font-bold uppercase tracking-widest opacity-60">Fail Rate</span>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Root Cause</span>
                                    <p className="text-xs text-foreground/80 leading-relaxed italic">"{p.root_cause}"</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Recommendation</span>
                                    <p className="text-xs text-foreground/90 leading-relaxed font-medium">{p.recommendation}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 5. Engineering Recommendations */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                    <CheckCircle2 size={20} className="text-green-500" /> 5. Engineering Action Items
                </h2>
                <div className="grid grid-cols-1 gap-4 max-w-4xl">
                    {(manufacturing.recommendations || []).map((rec, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-5 rounded-xl bg-muted/30 border border-border flex gap-4 transition-colors hover:bg-muted/50"
                        >
                            <div className="mt-1 h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={14} className="text-green-500" />
                            </div>
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                                {typeof rec === 'string' ? rec : rec.text || rec.recommendation}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}
