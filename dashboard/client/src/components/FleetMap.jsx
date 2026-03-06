import React, { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardHeader, CardTitle } from './ui/card'

const CITY_COORDS = {
    'Delhi': [28.6139, 77.2090],
    'Bangalore': [12.9716, 77.5946],
    'Chennai': [13.0827, 80.2707],
    'Hyderabad': [17.3850, 78.4867],
    'Mumbai': [19.0760, 72.8777],
    'Pune': [18.5204, 73.8567],
}

const STATUS_COLORS = {
    healthy: '#22c55e',
    warning: '#eab308',
    critical: '#ef4444',
}

export default function FleetMap({ vehicles = [] }) {
    const cityGroups = useMemo(() => {
        const groups = {}
        vehicles.forEach(v => {
            const city = v.city || 'Unknown'
            if (!groups[city]) groups[city] = []
            groups[city].push(v)
        })
        return groups
    }, [vehicles])

    const getCityStatus = (vehicleList) => {
        if (vehicleList.some(v => v.status === 'critical')) return 'critical'
        if (vehicleList.some(v => v.status === 'warning')) return 'warning'
        return 'healthy'
    }

    return (
        <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="px-6 pt-6 pb-2">
                <CardTitle className="text-base font-semibold text-foreground">Fleet Map</CardTitle>
            </CardHeader>
            <div className="h-[420px] w-full relative">
                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%', borderRadius: '0 0 0.75rem 0.75rem' }}
                    attributionControl={false}
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    {Object.entries(cityGroups).map(([city, vList]) => {
                        const coords = CITY_COORDS[city]
                        if (!coords) return null
                        const status = getCityStatus(vList)
                        const color = STATUS_COLORS[status]
                        const hasCritical = status === 'critical'

                        return (
                            <React.Fragment key={city}>
                                {/* Pulsing ring for critical cities */}
                                {hasCritical && (
                                    <CircleMarker
                                        center={coords}
                                        radius={Math.min(12 + vList.length * 3, 28)}
                                        pathOptions={{
                                            color: '#ef4444',
                                            fillColor: '#ef4444',
                                            fillOpacity: 0.15,
                                            weight: 1,
                                            opacity: 0.4,
                                            className: 'animate-pulse',
                                        }}
                                    />
                                )}
                                <CircleMarker
                                    center={coords}
                                    radius={Math.min(8 + vList.length * 3, 20)}
                                    pathOptions={{
                                        color: color,
                                        fillColor: color,
                                        fillOpacity: 0.6,
                                        weight: 2,
                                        opacity: 0.8,
                                    }}
                                >
                                    <Tooltip
                                        direction="top"
                                        offset={[0, -10]}
                                        className="!bg-gray-900 !border-gray-700 !text-white !text-xs !rounded-lg !px-3 !py-2 !shadow-xl"
                                    >
                                        <div>
                                            <strong className="text-sm">{city}</strong>
                                            <div className="text-[11px] opacity-70 mt-1">
                                                {vList.length} vehicle{vList.length > 1 ? 's' : ''}
                                            </div>
                                            <div className="mt-1 space-y-0.5">
                                                {vList.map(v => (
                                                    <div key={v.vehicle_id} className="flex items-center gap-1.5 text-[10px]">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[v.status] }} />
                                                        <span>{v.vehicle_id}</span>
                                                        <span className="opacity-50">{v.health_score}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </Tooltip>
                                </CircleMarker>
                            </React.Fragment>
                        )
                    })}
                </MapContainer>
            </div>
        </Card>
    )
}
