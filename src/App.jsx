import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

// ─── Particle Canvas ───────────────────────────────────────────────────────────
function ParticleBackground() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const pts = []
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    for (let i = 0; i < 70; i++) {
      pts.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.3,
        dx: (Math.random() - 0.5) * 0.35, dy: (Math.random() - 0.5) * 0.35,
        a: Math.random() * 0.45 + 0.1,
        c: Math.random() > 0.5 ? '124,58,237' : '59,130,246',
      })
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.c},${p.a})`; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 110) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
          ctx.strokeStyle = `rgba(124,58,237,${0.07 * (1 - d / 110)})`
          ctx.lineWidth = 0.5; ctx.stroke()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.55 }} />
}

// ─── Before/After Slider ───────────────────────────────────────────────────────
function BeforeAfterSlider({ originalSrc, enhancedSrc }) {
  const [pos, setPos] = useState(50)
  const [isPlaying, setIsPlaying] = useState(false)
  const ref = useRef(null)
  const dragging = useRef(false)
  const origVideoRef = useRef(null)
  const enhVideoRef = useRef(null)

  const move = useCallback((cx) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((cx - r.left) / r.width) * 100)))
  }, [])

  useEffect(() => {
    const up = () => { dragging.current = false }
    window.addEventListener('mouseup', up); window.addEventListener('touchend', up)
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up) }
  }, [])

  const togglePlay = () => {
    if (!origVideoRef.current || !enhVideoRef.current) return
    if (isPlaying) {
      origVideoRef.current.pause()
      enhVideoRef.current.pause()
    } else {
      // Sync times before playing
      enhVideoRef.current.currentTime = origVideoRef.current.currentTime
      origVideoRef.current.play()
      enhVideoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="relative group rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)]">
      <div ref={ref} className="relative w-full overflow-hidden select-none cursor-col-resize"
        style={{ aspectRatio: '16/9', background: '#111' }}
        onMouseMove={e => dragging.current && move(e.clientX)}
        onTouchMove={e => move(e.touches[0].clientX)}>
        
        {/* Enhanced BG */}
        <div className="absolute inset-0">
          {enhancedSrc
            ? <video ref={enhVideoRef} src={enhancedSrc} className="w-full h-full object-cover" loop playsInline muted />
            : <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center"><span className="text-purple-300 text-sm font-semibold">Enhanced</span></div>}
          <span className="absolute top-3 right-3 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm tracking-wide">ENHANCED</span>
        </div>
        
        {/* Original clipped */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          {originalSrc
            ? <video ref={origVideoRef} src={originalSrc} className="h-full object-cover" style={{ width: `${10000 / pos}%`, maxWidth: 'none' }} loop playsInline muted />
            : <div className="w-full h-full bg-gradient-to-br from-gray-900/90 to-gray-800/90 flex items-center justify-center"><span className="text-gray-300 text-sm font-semibold">Original</span></div>}
          <span className="absolute top-3 left-3 bg-gray-800/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm tracking-wide">ORIGINAL</span>
        </div>
        
        {/* Handle */}
        <div className="absolute top-0 bottom-0 z-10 flex flex-col items-center"
          style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
          onMouseDown={() => { dragging.current = true }}
          onTouchStart={() => { dragging.current = true }}>
          <div className="w-px h-full bg-white/80" />
          <div className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center border-2 border-purple-500 cursor-grab active:cursor-grabbing">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Play/Pause Button Overlay */}
      {originalSrc && enhancedSrc && (
        <button 
          onClick={togglePlay}
          className="absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/80 hover:scale-105 transition-all duration-300 shadow-lg"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

// ─── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ id, label, checked, onChange, badge }) {
  return (
    <label htmlFor={id}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border transition-all duration-300 select-none min-w-0
        ${checked ? 'border-purple-500/60 bg-purple-500/10 shadow-[0_0_20px_rgba(124,58,237,0.12)]' : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/6'}`}>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} className="sr-only" />
      <div className="relative shrink-0">
        <div className={`w-10 h-[22px] rounded-full transition-colors duration-300 ${checked ? 'bg-purple-600' : 'bg-gray-700'}`} />
        <div className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${checked ? 'translate-x-[18px]' : ''}`} />
      </div>
      <span className="text-sm font-medium text-gray-200 truncate">{label}</span>
      {badge && <span className="ml-auto shrink-0 text-[10px] text-gray-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">{badge}</span>}
    </label>
  )
}

// ─── Progress ─────────────────────────────────────────────────────────────────
const STEPS = ['Uploading', 'Analyzing', 'Face Detect', 'Upscaling', 'Finalizing']

function ProgressBar({ currentStep }) {
  const pct = Math.round((currentStep / STEPS.length) * 100)
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-purple-300">{STEPS[Math.min(currentStep, STEPS.length - 1)]}</span>
        <span className="text-gray-400 font-mono">{pct}%</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/8 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-white/20 blur-sm transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-start gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full transition-all duration-500
              ${i < currentStep ? 'bg-purple-500' : i === currentStep ? 'bg-purple-400 animate-pulse ring-2 ring-purple-400/30' : 'bg-white/10'}`} />
            <span className={`text-[9px] text-center leading-tight transition-colors duration-300 hidden xs:block
              ${i < currentStep ? 'text-purple-400' : i === currentStep ? 'text-purple-300' : 'text-gray-600'}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, tag, color }) {
  return (
    <div className="group glass-card p-5 sm:p-6 rounded-2xl border border-white/8 hover:border-purple-500/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(124,58,237,0.12)] flex flex-col gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border ${color || 'bg-purple-500/10 border-purple-500/20'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white text-sm sm:text-base">{title}</h3>
          {tag && <span className="shrink-0 text-[10px] bg-purple-900/50 text-purple-300 border border-purple-500/30 rounded-full px-2 py-0.5">{tag}</span>}
        </div>
        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Step Card ─────────────────────────────────────────────────────────────────
function StepCard({ number, title, desc, icon }) {
  return (
    <div className="group flex flex-col items-center text-center gap-5 p-6 sm:p-8 glass-card rounded-2xl border border-white/8 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-1">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-[0_0_32px_rgba(124,58,237,0.35)] group-hover:shadow-[0_0_52px_rgba(124,58,237,0.55)] transition-shadow duration-300">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-[#0a0a0f]">
          {number}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-white text-base sm:text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Ad Banner ─────────────────────────────────────────────────────────────────
function AdBanner({ id, width, height }) {
  return (
    <div id={id}
      className="w-full flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/2 select-none"
      style={{ maxWidth: width, height, margin: '0 auto' }}>
      <div className="flex flex-col items-center gap-1 text-gray-600">
        <svg className="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        <span className="text-[10px] uppercase tracking-widest opacity-40 font-medium">Advertisement</span>
        <span className="text-[9px] opacity-20">{width}×{height}</span>
      </div>
    </div>
  )
}

// ─── Mobile Menu ───────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose, onTryFree }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute top-16 left-0 right-0 bg-[#111118] border-b border-white/10 px-4 py-4 space-y-1" onClick={e => e.stopPropagation()}>
        {['Home', 'How It Works', 'Features'].map(item => (
          <a key={item}
            href={item === 'Home' ? '#' : `#${item.toLowerCase().replace(/ /g, '-')}`}
            onClick={onClose}
            className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/6 transition-all duration-200">
            {item}
          </a>
        ))}
        <button onClick={() => { onClose(); onTryFree() }}
          className="w-full mt-2 btn-primary py-3 rounded-xl text-sm font-semibold">
          Try Free Now
        </button>
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [upscale4k, setUpscale4k] = useState(true)
  const [faceEnhance, setFaceEnhance] = useState(true)
  const [colorGrade, setColorGrade] = useState(false)
  const [status, setStatus] = useState('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toolRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleFile = (f) => {
    const ok = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!ok.includes(f.type)) { alert('Please upload MP4, MOV, AVI, or WebM.'); return }
    if (f.size > 100 * 1024 * 1024) { alert('File must be under 100MB.'); return }
    setFile(f); setPreview(URL.createObjectURL(f))
    setStatus('idle'); setDownloadUrl(null); setCurrentStep(0)
  }

  const onDrop = e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }
  const onFileChange = e => { const f = e.target.files[0]; if (f) handleFile(f) }
  const clearFile = e => { e?.stopPropagation(); setFile(null); setPreview(null); setStatus('idle'); setDownloadUrl(null) }

  const runFakeProgress = () => new Promise(resolve => {
    const delays = [700, 1100, 1400, 900]
    let step = 0
    setCurrentStep(0)
    const next = () => { step++; setCurrentStep(step); if (step < STEPS.length - 1) setTimeout(next, delays[step] || 1000); else resolve() }
    setTimeout(next, delays[0])
  })

  const handleEnhance = async () => {
    if (!file) return
    setStatus('processing'); setCurrentStep(0); setDownloadUrl(null)
    const fakeP = runFakeProgress()
    try {
      const fd = new FormData(); fd.append('video', file)
      const [res] = await Promise.all([
        fetch('https://nonoptional-handwritten-wen.ngrok-free.dev/enhance', { method: 'POST', body: fd }),
        fakeP,
      ])
      if (!res.ok) throw new Error(res.status)
      const blob = await res.blob()
      setDownloadUrl(URL.createObjectURL(blob))
      setCurrentStep(STEPS.length); setStatus('done')
    } catch (e) { console.error(e); setStatus('error') }
  }

  const scrollToTool = () => toolRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-x-hidden">
      <ParticleBackground />
      {/* Orbs */}
      <div className="fixed top-[-10%] left-[15%] w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/8 shadow-[0_1px_24px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.5)]">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              VidEnhance AI
            </span>
          </a>
          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {['Home', 'How It Works', 'Features'].map(item => (
              <a key={item}
                href={item === 'Home' ? '#' : `#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200 font-medium relative group whitespace-nowrap">
                {item}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={scrollToTool} className="hidden sm:block btn-primary text-sm px-4 py-2 rounded-lg font-semibold whitespace-nowrap">
              Try Free
            </button>
            {/* Hamburger */}
            <button onClick={() => setMobileOpen(v => !v)} className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/8 transition-colors">
              <span className={`w-5 h-px bg-white transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
              <span className={`w-5 h-px bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-px bg-white transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} onTryFree={scrollToTool} />

      <main className="relative z-10">
        {/* ── HERO ── */}
        <section className="pt-28 sm:pt-36 pb-14 sm:pb-20 px-4 sm:px-6 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/25 rounded-full px-3.5 py-1.5 text-purple-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              AI-Powered • Real-ESRGAN + GFPGAN
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-5">
              Enhance Any Video{' '}
              <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-blue-400 bg-clip-text text-transparent block sm:inline">
                to 4K for Free
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              AI-powered face restoration, 4K upscaling &amp; cinematic color enhancement — right in your browser, completely free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button onClick={scrollToTool}
                className="w-full sm:w-auto btn-primary px-7 py-3.5 rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:shadow-[0_0_56px_rgba(124,58,237,0.5)] transition-shadow duration-300 group">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Enhance Your Video Now
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No sign-up required
              </div>
            </div>
            {/* Stats row */}
            <div className="mt-10 flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
              {[['4K', 'Output Quality'], ['100%', 'Free Forever'], ['AI', 'GPU Enhanced']].map(([val, lbl]) => (
                <div key={lbl} className="text-center">
                  <div className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{val}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AD TOP ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-10">
          <AdBanner id="ad-top" width={728} height={90} />
        </div>

        {/* ── TOOL SECTION ── */}
        <section ref={toolRef} id="tool" className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
          {/* Section header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Start <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Enhancing</span>
            </h2>
            <p className="text-gray-500 text-sm">Upload your video and let AI do the rest</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* ── Main tool card ── */}
            <div className="w-full lg:flex-1 min-w-0">
              <div className="glass-card rounded-2xl border border-white/8 overflow-hidden">
                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`relative border-b border-white/6 transition-all duration-300
                    ${!file ? 'cursor-pointer' : ''}
                    ${dragging ? 'bg-purple-500/10' : !file ? 'hover:bg-white/3' : ''}`}>
                  <input ref={fileInputRef} type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm"
                    className="hidden" onChange={onFileChange} />

                  {file && preview ? (
                    <div className="relative">
                      <video src={preview} className="w-full max-h-72 sm:max-h-80 object-cover" controls />
                      {/* File info bar */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-purple-500/30 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                            </svg>
                          </div>
                          <span className="text-xs text-white font-medium truncate">{file.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">· {(file.size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <button onClick={clearFile}
                          className="shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-red-500/40 border border-white/10 flex items-center justify-center transition-colors duration-200">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-14 sm:py-16 px-6 flex flex-col items-center gap-4 text-center">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300
                        ${dragging ? 'scale-110 bg-purple-500/20 border-purple-500/50' : 'bg-white/4 border-white/8'}`}>
                        <svg className={`w-8 h-8 transition-colors duration-300 ${dragging ? 'text-purple-400' : 'text-gray-500'}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-base sm:text-lg">
                          {dragging ? '🎬 Drop to upload!' : 'Drag & drop your video here'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">MP4, MOV, AVI, WebM · Max 100 MB</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                        className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-medium">
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Toggles */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Enhancement Options</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <Toggle id="t-4k" label="4K Upscale" checked={upscale4k} onChange={() => setUpscale4k(v => !v)} />
                      <Toggle id="t-face" label="Face Enhance" checked={faceEnhance} onChange={() => setFaceEnhance(v => !v)} />
                      <Toggle id="t-color" label="Color Grade" checked={colorGrade} onChange={() => setColorGrade(v => !v)} badge="Optional" />
                    </div>
                  </div>

                  {/* Enhance button */}
                  {status !== 'processing' && (
                    <button onClick={handleEnhance} disabled={!file}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300
                        ${file
                          ? 'btn-primary shadow-[0_0_32px_rgba(124,58,237,0.35)] hover:shadow-[0_0_52px_rgba(124,58,237,0.55)] hover:scale-[1.01] active:scale-[0.99]'
                          : 'bg-white/4 text-gray-600 cursor-not-allowed border border-white/8'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {file ? 'Enhance Now' : 'Select a Video First'}
                    </button>
                  )}

                  {/* Processing */}
                  {status === 'processing' && (
                    <div className="space-y-5 animate-fade-in py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0" />
                        <span className="text-purple-300 font-semibold text-sm">AI Enhancement in Progress…</span>
                      </div>
                      <ProgressBar currentStep={currentStep} />
                      <p className="text-xs text-gray-600 text-center">This may take 30–120 seconds depending on video length</p>
                    </div>
                  )}

                  {/* Error */}
                  {status === 'error' && (
                    <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-4 flex items-start gap-3 animate-fade-in">
                      <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-red-300 font-semibold text-sm">Enhancement Failed</p>
                        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Enhancement failed, please try again. Check your connection and ensure the server is running.</p>
                        <button onClick={handleEnhance} className="mt-2.5 text-xs text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2 transition-colors">
                          Retry →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Done */}
                  {status === 'done' && downloadUrl && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center gap-3 bg-green-500/8 border border-green-500/25 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-green-300 font-semibold text-sm">Enhancement Complete!</p>
                          <p className="text-gray-500 text-xs">Your video is ready to download</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2.5">Before / After Comparison</p>
                        <BeforeAfterSlider originalSrc={preview} enhancedSrc={downloadUrl} />
                      </div>
                      <a href={downloadUrl} download="enhanced-video.mp4"
                        className="w-full py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white transition-all duration-300 shadow-[0_0_28px_rgba(16,185,129,0.25)] hover:shadow-[0_0_44px_rgba(16,185,129,0.4)] hover:scale-[1.01] active:scale-[0.99]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Enhanced Video
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sidebar ad ── */}
            <div className="hidden lg:block w-[300px] shrink-0 sticky top-24">
              <div className="glass-card rounded-2xl border border-white/8 p-4">
                <AdBanner id="ad-sidebar" width={300} height={250} />
              </div>
              {/* Tip card */}
              <div className="mt-4 glass-card rounded-2xl border border-white/8 p-4 space-y-3">
                <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">💡 Pro Tips</p>
                {[
                  ['Best results', 'Use 720p or higher source videos'],
                  ['Face Enhance', 'Enable for talking-head or vlog content'],
                  ['Color Grade', 'Great for travel or cinematic footage'],
                ].map(([t, d]) => (
                  <div key={t}>
                    <p className="text-xs font-semibold text-white">{t}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          {/* Divider line */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
            <div className="text-center">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
                How It <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-gray-500 text-sm sm:text-base">Three steps to transform your footage</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <StepCard number={1} title="Upload Your Video"
              desc="Drag & drop or browse. Supports MP4, MOV, AVI, WebM up to 100MB."
              icon={<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>} />
            <StepCard number={2} title="AI Enhances on GPU"
              desc="Real-ESRGAN upscales every frame. GFPGAN restores faces. Color AI adds cinematic look."
              icon={<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>} />
            <StepCard number={3} title="Download in 4K"
              desc="Your enhanced video is ready instantly. Use the before/after slider to compare quality."
              icon={<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>} />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
              Powered by{' '}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                State-of-the-Art AI
              </span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">Professional-grade enhancement tools — completely free, no watermarks</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <FeatureCard tag="Real-ESRGAN" title="4K Upscaling"
              desc="AI super-resolution upscales every frame from HD to crystal-clear 4K detail."
              color="bg-purple-500/10 border-purple-500/20"
              icon={<svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>} />
            <FeatureCard tag="GFPGAN" title="Face Enhancement"
              desc="Restores blurry or degraded faces with high-fidelity detail using generative AI."
              color="bg-blue-500/10 border-blue-500/20"
              icon={<svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <FeatureCard tag="Cinematic" title="Color Grading"
              desc="Boost vibrance, contrast and apply a cinematic color grade for a Hollywood look."
              color="bg-violet-500/10 border-violet-500/20"
              icon={<svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>} />
            <FeatureCard tag="Always Free" title="100% Free"
              desc="No account, no subscription, no watermarks. Enhance unlimited videos at no cost."
              color="bg-green-500/10 border-green-500/20"
              icon={<svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/8 mt-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8">
            <AdBanner id="ad-footer" width={728} height={90} />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
              <a href="#" className="flex items-center gap-2 shrink-0">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                </div>
                <span className="text-gray-400 font-semibold text-sm">VidEnhance AI</span>
              </a>
              <p className="text-xs sm:text-sm text-center order-last sm:order-none">© 2025 VidEnhance AI — Free for everyone</p>
              <div className="flex gap-5 text-xs">
                {['Privacy', 'Terms', 'Contact'].map(l => (
                  <a key={l} href="#" className="hover:text-gray-400 transition-colors">{l}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
