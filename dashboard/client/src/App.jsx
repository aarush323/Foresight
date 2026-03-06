import { useState, useCallback } from 'react'
import { ThemeProvider } from 'next-themes'
import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'

// Layout Components
import Sidebar from './components/ui/sidebar'
import TopBar from './components/ui/topbar'
import VehicleDrawer from './components/VehicleDrawer'

// Pages
import DashboardPage from './pages/Dashboard'
import FleetPage from './pages/FleetPage'
import AlertsPage from './pages/AlertsPage'
import ManufacturingPage from './pages/ManufacturingPage'
import AgentControlPage from './pages/AgentControlPage'
import SettingsPage from './pages/SettingsPage'
import ReportPage from './pages/Report'
import LandingPage from './pages/LandingPage'

// Hooks & Services
import { api } from './services/apiClient'
import { usePolling, useApi } from './hooks/useApi'

// Styling
import './App.css'

// ─── Constants & Samples ───────────────────────────────────────────────────
const SAMPLE = {
  run_id: 'sample-101',
  analysis_date: new Date().toISOString(),
  oem_name: 'TataMotors',
  executive_summary: 'Fleet currently operating at 82% efficiency. Minor thermal drift detected in Model 3 battery packs across Delhi region. Immediate inspection recommended for VEH002.',
  summary: { fleet_size: 10, average_health_score: 82, critical_count: 2, warning_count: 3, healthy_count: 5, appointments_booked: 4, appointments_delayed: 1 },
  vehicles: [
    { vehicle_id: 'VEH001', model: 'Model 3', year: 2021, owner_name: 'Aarav Sharma', city: 'Delhi', health_score: 82, status: 'warning', predictions: [{ component: 'Battery Pack', severity: 0.62, probability: 0.62, urgency: 'soon', reasoning: 'High thermal cycles detected during fast charging.' }] },
    { vehicle_id: 'VEH002', model: 'Model X', year: 2022, owner_name: 'Ishita Kapoor', city: 'Mumbai', health_score: 45, status: 'critical', predictions: [{ component: 'Brake Pads', severity: 0.88, probability: 0.88, urgency: 'immediate', reasoning: 'Vibration patterns indicate severe wear.' }] },
    { vehicle_id: 'VEH003', model: 'Model 3', year: 2023, owner_name: 'Rahul Varma', city: 'Bangalore', health_score: 95, status: 'healthy', predictions: [] },
    { vehicle_id: 'VEH004', model: 'Model S', year: 2022, owner_name: 'Priya Reddy', city: 'Hyderabad', health_score: 38, status: 'critical', predictions: [{ component: 'Engine Cooling', severity: 0.92, probability: 0.85, urgency: 'immediate', reasoning: 'Coolant sensor readings critically high under load.' }] },
    { vehicle_id: 'VEH005', model: 'Model 3', year: 2021, owner_name: 'Arjun Nair', city: 'Chennai', health_score: 78, status: 'warning', predictions: [{ component: 'Oil Pressure', severity: 0.55, probability: 0.60, urgency: 'soon', reasoning: 'Gradual pressure drop over last 30 days.' }] },
    { vehicle_id: 'VEH006', model: 'Model X', year: 2023, owner_name: 'Sneha Joshi', city: 'Pune', health_score: 91, status: 'healthy', predictions: [] },
    { vehicle_id: 'VEH007', model: 'Model S', year: 2021, owner_name: 'Vikram Singh', city: 'Delhi', health_score: 88, status: 'healthy', predictions: [] },
    { vehicle_id: 'VEH008', model: 'Model 3', year: 2022, owner_name: 'Ananya Gupta', city: 'Mumbai', health_score: 72, status: 'warning', predictions: [{ component: 'Drive Unit', severity: 0.48, probability: 0.45, urgency: 'monitor', reasoning: 'Minor vibration anomaly detected during acceleration.' }] },
    { vehicle_id: 'VEH009', model: 'Model X', year: 2023, owner_name: 'Karthik Iyer', city: 'Bangalore', health_score: 93, status: 'healthy', predictions: [] },
    { vehicle_id: 'VEH010', model: 'Model S', year: 2022, owner_name: 'Meera Patel', city: 'Chennai', health_score: 85, status: 'healthy', predictions: [] },
  ],
  llm_report: '# Executive Summary\n\nOverall fleet status is **Stable** with identified anomalies in thermal management systems.',
}

// ─── Landing Wrapper ───────────────────────────────────────────────────
function LandingWrapper() {
  const navigate = useNavigate()
  return (
    <LandingPage
      onRunAnalysis={() => navigate('/dashboard?run=true')}
      onViewDemo={() => navigate('/dashboard?demo=true')}
    />
  )
}

// ─── App Shell (Dashboard + all sub-pages) ─────────────────────────────
function AppShell() {
  // Check for mode from URL
  const urlParams = new URLSearchParams(window.location.search)
  const [page, setPage] = useState(urlParams.get('run') === 'true' ? 'agent' : 'dashboard')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const navigate = useNavigate()

  const [showDemo, setShowDemo] = useState(urlParams.get('demo') === 'true')
  const [autoStartRun, setAutoStartRun] = useState(urlParams.get('run') === 'true')

  // API Data
  const fetchDashboard = useCallback(() => api.getDashboard(), [])
  const { data: dashData, loading: dashLoading } = usePolling(fetchDashboard, 30000)
  const { data: mfgData, loading: mfgLoading } = useApi(api.getManufacturing)

  const isLiveData = !!(dashData && !dashData._is_sample)
  const displayData = (isLiveData || showDemo) ? (dashData || SAMPLE) : SAMPLE

  // UI States
  const pageTitles = {
    dashboard: 'Dashboard',
    fleet: 'Fleet Overview',
    alerts: 'System Alerts',
    insights: 'Manufacturing Insights',
    agent: 'Agent Control',
    report: 'Executive Report',
    settings: 'Settings'
  }

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar
        currentPage={page}
        setPage={setPage}
        isLiveData={isLiveData}
      />

      <div className="flex-1 flex flex-col pl-64">
        <TopBar
          title={pageTitles[page]}
          onHome={() => navigate('/')}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {page === 'dashboard' && (
            <DashboardPage
              data={displayData}
              onSelectVehicle={setSelectedVehicle}
              loading={dashLoading}
            />
          )}

          {page === 'fleet' && (
            <FleetPage
              data={displayData}
              onSelectVehicle={setSelectedVehicle}
            />
          )}

          {page === 'alerts' && (
            <AlertsPage data={displayData} />
          )}

          {page === 'insights' && (
            <ManufacturingPage data={mfgData} loading={mfgLoading} />
          )}

          {page === 'agent' && (
            <AgentControlPage
              data={displayData}
              autoStart={autoStartRun}
              onRunStarted={() => setAutoStartRun(false)}
            />
          )}

          {page === 'report' && (
            <ReportPage data={displayData} />
          )}

          {page === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Vehicle Drawer Overlay */}
      <AnimatePresence>
        {selectedVehicle && (
          <VehicleDrawer
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingWrapper />} />
          <Route path="/dashboard" element={<AppShell />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
