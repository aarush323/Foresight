import React from 'react';
import {
    AreaChart, Area, BarChart, Bar, Cell,
    ResponsiveContainer, Tooltip as RechartsTooltip,
    XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Card, CardHeader, CardTitle } from "./card";

export function HealthTrendChart({ data }) {
    return (
        <Card className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <CardHeader className="px-0 pt-0 pb-6">
                <CardTitle className="text-base font-semibold text-foreground">Fleet Health Trend</CardTitle>
            </CardHeader>
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[70, 100]} />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#healthGradient)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function FailureDistChart({ data }) {
    return (
        <Card className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <CardHeader className="px-0 pt-0 pb-6">
                <CardTitle className="text-base font-semibold text-foreground">Failure Distribution</CardTitle>
            </CardHeader>
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={120} />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        />
                        <Bar dataKey="value" barSize={30} radius={[0, 6, 6, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
