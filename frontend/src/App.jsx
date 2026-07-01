import { useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import Navbar          from './components/Navbar'
import Sidebar         from './components/Sidebar'
import UploadScreen    from './components/UploadScreen'
import ProcessingScreen from './components/ProcessingScreen'
import ResultsPanel    from './components/ResultsPanel'
import ErrorScreen     from './components/ErrorScreen'
import HomePage        from './pages/HomePage'
import AboutPage       from './pages/AboutPage'

// Top-level pages driven by the landing navbar
// Portal pages (UPLOAD → PROCESSING → RESULTS | ERROR) are inside the console flow
const NAV_PAGES = new Set(['home', 'about'])

const DEFAULT_CENTER = [20.5937, 78.9629]
const DEFAULT_ZOOM   = 5

export default function App() {
  // 'home' | 'about' | 'UPLOAD' | 'PROCESSING' | 'RESULTS' | 'ERROR'
  const [page,    setPage]    = useState('home')
  const [file,    setFile]    = useState(null)
  const [geojson, setGeojson] = useState(null)
  const [error,   setError]   = useState(null)

  const goToConsole = useCallback(() => {
    setFile(null); setGeojson(null); setError(null)
    setPage('UPLOAD')
  }, [])

  // Holds the API result while the checklist animation is still running
  const pendingResult = useRef(null)
  const checklistDone = useRef(false)

  const handleUpload = useCallback(async (selectedFile) => {
    setFile(selectedFile)
    setPage('PROCESSING')
    setError(null)
    pendingResult.current = null
    checklistDone.current = false

    try {
      const form = new FormData()
      form.append('file', selectedFile)

      const res = await fetch('/api/analyze', { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const data = await res.json()
      pendingResult.current = { ok: true, data }
    } catch (err) {
      pendingResult.current = { ok: false, message: err.message }
    }

    // If the checklist already finished before the API returned, resolve now
    if (checklistDone.current) resolveProcessing()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const resolveProcessing = useCallback(() => {
    const result = pendingResult.current
    if (!result) return // API not back yet — will be called again when it arrives
    if (result.ok) {
      setGeojson(result.data)
      setPage('RESULTS')
    } else {
      setError(result.message)
      setPage('ERROR')
    }
  }, [])

  // Called by ProcessingScreen when its checklist animation finishes
  const handleChecklistComplete = useCallback(() => {
    checklistDone.current = true
    resolveProcessing()
  }, [resolveProcessing])

  const handleReset = useCallback(() => {
    setPage('UPLOAD')
    setFile(null)
    setGeojson(null)
    setError(null)
  }, [])

  /* ── Landing pages (home / about) ── */
  if (NAV_PAGES.has(page)) {
    return (
      <>
        <Navbar
          page={page}
          onNavigate={setPage}
          onLaunch={goToConsole}
        />
        {page === 'home'
          ? <HomePage onLaunchMission={goToConsole} onLaunchStress={goToConsole} />
          : <AboutPage />}
      </>
    )
  }

  /* ── Full-viewport console pages (UPLOAD / ERROR) ── */
  if (page === 'UPLOAD') return <UploadScreen onUpload={handleUpload} />
  if (page === 'ERROR')  return <ErrorScreen  message={error} onRetry={handleReset} />

  /* ── Map console (PROCESSING / RESULTS) ── */
  const sidebarContent = page === 'PROCESSING'
    ? <ProcessingScreen filename={file?.name} onComplete={handleChecklistComplete} />
    : <ResultsPanel geojson={geojson} onReset={handleReset} />

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712]">
      <Sidebar>{sidebarContent}</Sidebar>

      <main className="flex-1 relative">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {geojson && (
            <GeoJSON
              key={JSON.stringify(geojson).length}
              data={geojson}
              style={{ color: '#22d3ee', weight: 2, opacity: 0.85 }}
            />
          )}
        </MapContainer>

        {/* Status badge */}
        <div className="absolute top-3 right-4 z-[1000]
                        px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest
                        bg-black/60 border border-white/10 text-slate-400 backdrop-blur-sm">
          {page}
        </div>
      </main>
    </div>
  )
}
