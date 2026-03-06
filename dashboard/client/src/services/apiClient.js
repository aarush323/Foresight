const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, options)
        if (!res.ok) return null
        return res
    } catch {
        return null
    }
}

export const api = {
    getDashboard: () => safeFetch(`${BASE_URL}/api/dashboard`).then(r => r?.json()),
    getSummary: () => safeFetch(`${BASE_URL}/api/summary`).then(r => r?.json()),
    getStatus: () => safeFetch(`${BASE_URL}/api/status`).then(r => r?.json()),
    getVehicle: (id) => safeFetch(`${BASE_URL}/api/vehicles/${id}`).then(r => r?.json()),
    getManufacturing: () => safeFetch(`${BASE_URL}/api/manufacturing`).then(r => r?.json()),
    startRun: () => safeFetch(`${BASE_URL}/api/run`, { method: 'POST' }),
    getRunStatus: () => safeFetch(`${BASE_URL}/api/run/status`).then(r => r?.json()),
    streamLogs: () => new EventSource(`${BASE_URL}/api/run/stream`),
    getCumulative: () => safeFetch(`${BASE_URL}/api/cumulative`).then(r => r?.json()),
    getFailureTrends: () => safeFetch(`${BASE_URL}/api/cumulative/failures`).then(r => r?.json()),
    getSatisfactionTrend: () => safeFetch(`${BASE_URL}/api/cumulative/satisfaction`).then(r => r?.json()),
}
