import React from 'react'
import { motion } from 'framer-motion'
import { Settings, Monitor, Moon, Sun, Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="space-y-8 max-w-3xl mx-auto pb-12">
            <header className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-500/10">
                    <Settings size={20} className="text-gray-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Configure your dashboard preferences</p>
                </div>
            </header>

            {/* Appearance */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="p-6 rounded-xl border border-border">
                    <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Monitor size={16} /> Appearance
                    </h2>
                    <div className="flex gap-3">
                        <Button
                            variant={theme === 'dark' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTheme('dark')}
                            className="flex items-center gap-2"
                        >
                            <Moon size={14} /> Dark
                        </Button>
                        <Button
                            variant={theme === 'light' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTheme('light')}
                            className="flex items-center gap-2"
                        >
                            <Sun size={14} /> Light
                        </Button>
                        <Button
                            variant={theme === 'system' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTheme('system')}
                            className="flex items-center gap-2"
                        >
                            <Monitor size={14} /> System
                        </Button>
                    </div>
                </Card>
            </motion.div>

            {/* System Info */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="p-6 rounded-xl border border-border">
                    <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Info size={16} /> System Information
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-muted-foreground">Platform</span>
                            <span className="text-foreground font-medium">Autonomous Fleet Intelligence</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-muted-foreground">Version</span>
                            <span className="text-foreground font-medium">v4.0</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-muted-foreground">AI Engine</span>
                            <span className="text-foreground font-medium">Cerebras + LLM Pipeline</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">Data Refresh</span>
                            <span className="text-foreground font-medium">30s polling</span>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
