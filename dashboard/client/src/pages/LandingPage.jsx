import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import LaserFlow from '../components/ui/laser-flow'
import RunButton from '../components/RunButton'
import { Button } from '../components/ui/button'
import { ChevronDown } from 'lucide-react'

const pipelineStages = [
    'Telemetry Ingestion',
    'Failure Prediction',
    'Risk Assessment',
    'Service Scheduling',
    'Customer Outreach',
    'Manufacturing Insights',
]

const laserProps = {
    color: '#ffffff',
    wispDensity: 1.5,
    flowSpeed: 0.35,
    verticalSizing: 2.7,
    horizontalSizing: 3,
    fogIntensity: 0.45,
    fogScale: 0.3,
    wispSpeed: 15,
    wispIntensity: 5,
    flowStrength: 0.6,
    decay: 1.1,
}

export default function LandingPage({ onRunAnalysis, onViewDemo }) {
    const navigate = useNavigate()

    const handleRunAnalysis = () => {
        if (onRunAnalysis) onRunAnalysis()
        else navigate('/dashboard?run=true')
    }

    const handleViewDemo = () => {
        if (onViewDemo) onViewDemo()
        else navigate('/dashboard?demo=true')
    }

    return (
        <div className="relative w-[100vw] h-[100vh] overflow-hidden bg-[#080d1a]">
            {/* Dual LaserFlow Layers */}
            <div className="absolute inset-0">
                <LaserFlow {...laserProps} horizontalBeamOffset={0.25} />
                <LaserFlow {...laserProps} horizontalBeamOffset={-0.25} />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="max-w-3xl text-center"
                >
                    {/* Hero Title */}
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.7 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-6"
                    >
                        Autonomous Fleet Intelligence
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-xl md:text-2xl text-white/60 font-medium tracking-tight mb-4"
                    >
                        Predict failures before they happen
                    </motion.p>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                        className="text-sm md:text-base text-white/35 leading-relaxed max-w-xl mx-auto mb-12"
                    >
                        Autonomous fleet diagnostics, predictive maintenance,
                        and manufacturing intelligence powered by AI.
                    </motion.p>

                    {/* Divider */}
                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent mb-10" />

                    {/* Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                    >
                        <Button
                            onClick={handleRunAnalysis}
                            className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-3 text-sm tracking-wide rounded-lg shadow-lg shadow-white/10"
                        >
                            Run Analysis
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleViewDemo}
                            className="border-white/20 text-white/70 hover:text-white hover:bg-white/5 hover:border-white/30 transition-all duration-200 px-8 py-3 text-sm tracking-wide rounded-lg"
                        >
                            Explore Demo Fleet
                        </Button>
                    </motion.div>

                    {/* Pipeline Visual */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                    >
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold mb-6">
                            AI Pipeline Architecture
                        </p>
                        <div className="flex flex-col items-center gap-0">
                            {pipelineStages.map((stage, i) => (
                                <motion.div
                                    key={stage}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.4 + i * 0.15, duration: 0.4 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-white/25 border border-white/15" />
                                        <span className="text-[11px] text-white/40 font-medium tracking-wider uppercase">
                                            {stage}
                                        </span>
                                    </div>
                                    {i < pipelineStages.length - 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, scaleY: 0 }}
                                            animate={{ opacity: 1, scaleY: 1 }}
                                            transition={{ delay: 1.5 + i * 0.15, duration: 0.3 }}
                                        >
                                            <ChevronDown size={12} className="text-white/15 my-0.5" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 right-8 z-10 hidden md:block">
                <p className="text-[10px] text-white/15 tracking-[0.4em] uppercase">
                    Edge Intelligence System v4.0
                </p>
            </div>
        </div>
    )
}
