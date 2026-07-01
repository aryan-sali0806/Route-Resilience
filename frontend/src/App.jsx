import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import Sidebar from './components/Sidebar'
import UploadScreen from './components/UploadScreen'
import ProcessingScreen from './components/ProcessingScreen'
import ResultsPanel from './components/ResultsPanel'
import ErrorScreen from './components/ErrorScreen'

// Screens: 'UPLOAD' | 'PROCESSING' | 'RESULTS' | 'ERROR'
const DEFAULT_CENTER = [20.5937, 78.9629] // India centre — adjust per project
const DEFAULT_ZOOM   = 5

export default function App() {
  const [screen,   setScreen]   = useState('UPLOAD')
  const [file,     setFile]     = useState(null)
  const [geojson,  setGeojson]  = useState(null)
  const [error,    setError]    = useState(null)

  const handleUpload = useCallback(async (selectedFile) => {
    setFile(selectedFile)
    setScreen('PROCESSING')
    setError(null)

    try {
      const form = new FormData()
      form.append('file', selectedFile)

      const res = await fetch('/api/analyze', { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const data = await res.json()
      setGeojson(data)
      setScreen('RESULTS')
    } catch (err) {
      setError(err.message)
      setScreen('ERROR')
    }
  }, [])

  const handleReset = useCallback(() => {
    setScreen('UPLOAD')
    setFile(null)
    setGeojson(null)
    setError(null)
  }, [])

  const sidebarContent = {
    UPLOAD:     <UploadScreen onUpload={handleUpload} />,
    PROCESSING: <ProcessingScreen filename={file?.name} />,
    RESULTS:    <ResultsPanel geojson={geojson} onReset={handleReset} />,
    ERROR:      <ErrorScreen message={error} onRetry={handleReset} />,
  }[screen]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B132B]">
      {/* ── Left Sidebar ── */}
      <Sidebar>{sidebarContent}</Sidebar>

      {/* ── Right Map Canvas ── */}
      <main className="flex-1 relative">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          zoomControl={false}
        >
          {/* Dark CartoDB basemap */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* Road graph overlay */}
          {geojson && (
            <GeoJSON
              key={JSON.stringify(geojson).length}
              data={geojson}
              style={{ color: '#48CAE4', weight: 2, opacity: 0.85 }}
            />
          )}
        </MapContainer>

        {/* Screen label badge (top-right) */}
        <div className="absolute top-3 right-4 z-[1000]
                        px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest
                        bg-[#1C2541]/80 border border-[#48CAE4]/30 text-[#48CAE4] backdrop-blur-sm">
          {screen}
        </div>
      </main>
    </div>
  )
}
