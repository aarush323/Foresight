import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function StatCard({ title, value, sub, icon: Icon, color, sparklineData, index }) {
    const isPositive = typeof value === 'string' && value.includes('%') && parseInt(value) > 80

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`card p-5 relative overflow-hidden ${color === 'var(--critical)' ? 'card-critical' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-[13px] text-[var(--text-2)]">{title}</span>
                <Icon size={16} className="text-[var(--text-3)]" />
            </div>

            <div className="flex flex-col">
                <span className="text-[32px] font-bold tracking-tight text-[var(--text-1)]" style={{ color }}>
                    {value}
                </span>
                <span className="text-[12px] text-[var(--text-2)] mt-1">{sub}</span>
            </div>

            {sparklineData && (
                <div className="absolute bottom-4 right-4 w-[100px] h-[40px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                            <Line
                                type="monotone"
                                dataKey="val"
                                stroke={color || 'var(--accent)'}
                                strokeWidth={1.5}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    )
}
