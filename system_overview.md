# Automotive Predictive Maintenance AI System - Architecture & Design Overview

This document provides a comprehensive technical breakdown of the system for the Lead UI/UX Engineer to facilitate a full-scale overhaul and review.

## 1. Data Flow Architecture

### Backend to Frontend Pipeline
The system utilizes a semi-real-time data delivery model involving static reports and live streaming.

1.  **Data Generation (Backend)**: The analysis pipeline (triggered via `POST /api/run`) processes automotive telemetry and generates a comprehensive report stored in `data/crew_report.json`.
2.  **API Serving (FastAPI)**:
    *   **Dashboard Data**: `GET /api/dashboard` serves the master report. It includes vehicle status, health scores, and AI-generated insights.
    *   **Live Updates**: `GET /api/run/stream` uses Server-Sent Events (SSE) to stream execution logs directly to the frontend during active analysis.
3.  **Frontend Consumption (React)**:
    *   **Data Fetching**: Custom hooks `useApi` and `usePolling` (located in `src/hooks/useApi.js`) manage data fetching and periodic synchronization (30s interval for the dashboard).
    *   **Centralized API Client**: `src/services/apiClient.js` provides a clean abstraction for all HTTP and SSE operations.

## 2. Frontend Architecture & State Management

### Component Hierarchy
The UI follows a structured layout pattern:
- **`AppContent`**: Root controller managing routing (`dashboard`, `insights`, `report`, `live`) and global UI states (vehicle selection, drawers).
- **`Sidebar` & `TopBar`**: Consistent navigation and page-level metadata.
- **Page Components**: Functional views like `DashboardPage` and `InsightsPage` that receive data via props.
- **Overlays**: `VehicleDrawer` and `LiveFeed` handle contextual details and real-time logs.

### State Handling
- **Routing**: Internal state-based navigation (`page` state) for seamless transitions without full page reloads.
- **Sample Data Fallback**: The frontend includes a comprehensive `SAMPLE` object (in `App.jsx`) and a `showDemo` state to ensure the UI is functional even before the first backend run or in development environments.

## 3. Detail Design & Aesthetic Tokens

### Design System (Tailwind CSS)
The system uses a variable-driven design system in `tailwind.config.cjs`, making it highly themeable and ready for overhaul.

- **Theme**: Supports both `light` and `dark` modes via `next-themes`.
- **Aesthetic Philosophy**: Current design utilizes "glassmorphism" tendencies with card-based layouts.
- **Color Palette (HSL)**:
    *   `primary`, `secondary`, `accent`: Core brand colors.
    *   **Functional Colors**: `critical` (Red/High Danger), `warning` (Amber/Alert), `healthy` (Green/Optimal).
- **Animation**: System-wide use of `framer-motion` for smooth layout transitions and drawer entries.

## 4. Key Areas for UI/UX Review
- **Data Density**: Transition from card-heavy dashboard to a more dense, list-based or "SaaS-native" layout.
- **Interaction Model**: Standardize the drawer and overlay patterns for vehicle details.
- **Live Feedback**: Improve the visual representation of the `LiveFeed` pipeline logs to provide more meaningful visual progress beyond raw text.
- **Typography Standard**: Define a clearer hierarchy for headers and data points using modern sans-serif fonts.

---
*Prepared by Antigravity AI for the Lead UI/UX Engineering Review.*
