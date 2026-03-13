# EV Charging Station Simulation Platform

A real-time AI-powered EV charging station simulation with smart routing recommendations.

## Features

- 🗺️ Interactive Map & Graph Views
- 🤖 AI-Powered Station Recommendations
- 🔌 Real-time Charging Station Status
- 🚦 Live Traffic Simulation
- 💬 AI Chat Assistant
- 📱 Responsive Design

## Tech Stack

### Backend
- FastAPI
- WebSockets
- Python 3.9+

### Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide Icons

## Deployment (Backend on Render, Frontend on Vercel)

Add these in each dashboard so the frontend can call the backend and CORS allows it.

### Render (backend)

| Key | Value |
|-----|--------|
| `ALLOWED_ORIGINS` | Your Vercel app URL, e.g. `https://your-app.vercel.app`. Multiple origins: `https://your-app.vercel.app,http://localhost:3000` |

Then redeploy the service.

### Vercel (frontend)

| Key | Value |
|-----|--------|
| `VITE_API_BASE_URL` | Only if your backend URL is different from the default. Example: `https://your-backend.onrender.com/api` |

If you use the default backend (`ev-charging-simulator-1.onrender.com`), you don’t need to set anything. Redeploy after changing env vars.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone and setup:**
```bash
git clone <repository-url>
cd ev-charging-simulator