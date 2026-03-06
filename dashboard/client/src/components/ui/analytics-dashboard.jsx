import React from 'react';
import { motion } from 'framer-motion';
import {
    Car, Activity, AlertTriangle, CalendarCheck
} from 'lucide-react';
import { Badge } from "./badge";
import DashboardStatCard from './stat-card';
import { HealthTrendChart, FailureDistChart } from './charts';
import VehiclesTable from './vehicles-table';
import FleetMap from '../FleetMap';
import { Button } from './button';
import { api } from '../../services/apiClient';
import { useApi } from '../../hooks/useApi';

export default function AnalyticsDashboard({ data, onSelectVehicle, loading }) {
    const summary = data?.summary || {};
    const vehicles = data?.vehicles || [];

    const { data: cumulativeData } = useApi(api.getCumulative);
    const { data: failureTrendData } = useApi(api.getFailureTrends);

    // Format cumulative data for HealthTrendChart
    const healthTrendData = React.useMemo(() => {
        if (!cumulativeData?.runs || cumulativeData.runs.length === 0) return [
            { name: 'Mon', score: 82 }, { name: 'Tue', score: 84 }, { name: 'Wed', score: 83 },
            { name: 'Thu', score: 85 }, { name: 'Fri', score: 87 }, { name: 'Sat', score: 86 }, { name: 'Sun', score: 88 },
        ];
        return cumulativeData.runs.map(run => ({
            name: run.run_id.split('_').pop() || run.run_id,
            score: run.average_health_score,
            original: run
        }));
    }, [cumulativeData]);

    // Format failure trends for FailureDistChart
    const failureDistData = React.useMemo(() => {
        if (!failureTrendData?.components || failureTrendData.components.length === 0) return [
            { name: 'Brake System', value: 40, color: '#ef4444' },
            { name: 'Battery Thermal', value: 30, color: '#f59e0b' },
            { name: 'Oil Pressure', value: 25, color: '#3b82f6' },
            { name: 'Engine Cooling', value: 20, color: '#8b5cf6' },
            { name: 'Drive Unit', value: 15, color: '#64748b' },
        ];
        const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b', '#ec4899', '#10b981'];
        return failureTrendData.components.map((comp, i) => ({
            name: comp.component,
            value: comp.occurrences,
            color: colors[i % colors.length]
        }));
    }, [failureTrendData]);

    if (loading && !data) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-muted rounded-xl" />)}
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="h-80 bg-muted rounded-xl" />
                    <div className="h-80 bg-muted rounded-xl" />
                </div>
                <div className="h-96 bg-muted rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Welcome back! Here's your performance summary.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-none px-3 py-1">
                        System Live
                    </Badge>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm transition-colors">
                        Generate Report
                    </Button>
                </div>
            </header>

            {/* Stat Cards — gap-8 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <DashboardStatCard title="Fleet Size" value={summary.fleet_size || 0} change="+12% from last month" changeType="positive" icon={Car} />
                <DashboardStatCard title="Fleet Health" value={`${summary.average_health_score || 0}%`} change="+2.4% vs baseline" changeType="positive" icon={Activity} />
                <DashboardStatCard title="Critical Alerts" value={summary.critical_count || 0} change="-4 since yesterday" changeType="positive" icon={AlertTriangle} />
                <DashboardStatCard title="Upcoming Appts" value={summary.appointments_booked || 0} change="+8 scheduled today" changeType="positive" icon={CalendarCheck} />
            </div>

            {/* Map + Chart — gap-8 */}
            <div className="grid lg:grid-cols-2 gap-8">
                <FleetMap vehicles={vehicles} />
                <FailureDistChart data={failureDistData} />
            </div>

            {/* Health Trend */}
            <HealthTrendChart data={healthTrendData} />

            {/* Vehicles Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">Vehicles List</h2>
                    <Button variant="outline" size="sm">Export CSV</Button>
                </div>
                <VehiclesTable vehicles={vehicles} onSelectVehicle={onSelectVehicle} />
            </div>
        </div>
    );
}
