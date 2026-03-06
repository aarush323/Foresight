import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Card } from "./card";

export default function DashboardStatCard({ title, value, change, changeType, icon: Icon }) {
    const isPositive = changeType === 'positive';

    return (
        <Card className="p-8 rounded-xl shadow-sm border border-border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon size={20} className="text-muted-foreground" />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        <ArrowUpRight size={12} />
                        {change}
                    </div>
                )}
            </div>
            <div className="text-4xl font-bold text-foreground tracking-tight mb-1">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
        </Card>
    );
}
