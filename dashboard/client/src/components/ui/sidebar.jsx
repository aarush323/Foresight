import React from 'react';
import {
    LayoutDashboard,
    Car,
    AlertTriangle,
    FlaskConical,
    Settings,
    Cpu
} from 'lucide-react';
import { cn } from "@/lib/utils";

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fleet', label: 'Fleet', icon: Car },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'insights', label: 'Manufacturing', icon: FlaskConical },
    { id: 'agent', label: 'Agent Control', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, setPage }) {
    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background transition-transform">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center border-b border-border px-6">
                    <div className="flex items-center gap-2.5 font-bold text-foreground">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Car size={20} />
                        </div>
                        <span className="text-lg tracking-tight">Fleet AI</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setPage(item.id)}
                                className={cn(
                                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    active
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon size={20} className={cn(
                                    "transition-colors shrink-0",
                                    active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer info */}
                <div className="border-t border-border p-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            System Health
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-xs text-foreground font-medium">Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
