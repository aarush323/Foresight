import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'

export default function ReportPage({ data }) {
    if (!data?.llm_report) {
        return <div className="h-full flex items-center justify-center text-[var(--text-3)]">No technical report generated yet. Run the pipeline to start.</div>
    }

    return (
        <div className="max-w-[800px] mx-auto py-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
            >
                <div className="text-center">
                    <h1 className="text-[20px] font-semibold text-[var(--text-1)] mb-2">Executive Engineering Report</h1>
                    <p className="text-[13px] text-[var(--text-3)]">Run {data.run_id} · {new Date(data.analysis_date).toLocaleDateString()}</p>
                </div>

                <div className="card p-10 bg-[var(--bg-card)]">
                    <div className="prose">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.llm_report}</ReactMarkdown>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
