import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowUpRight, Sparkles, Plus, Asterisk,
  Activity, Scan, Microscope, Brain, Stethoscope, CheckCircle2,
  Upload, FileText, Layers, BadgeCheck, MoveRight,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────────────────────────────────────────────────────
   Tokens (Expressive — refined)
   ───────────────────────────────────────────────────────────────────────── */

const ORANGE = '#F97316'
const BLUE   = '#2563eb'
const GREEN  = '#16A34A'
const AMBER  = '#D97706'
const BLACK  = '#111827'
const CREAM  = '#F1F0EC'

const MODULES = [
  { num: '01', icon: Scan,        name: 'Chest X-Ray',   stack: 'DenseNet · ResNet · ViT',           count: 6,  accent: ORANGE },
  { num: '02', icon: Activity,    name: 'ECG Signal',    stack: 'ResNet · Inception · Transformer',  count: 8,  accent: BLUE   },
  { num: '03', icon: Microscope,  name: 'CT Scan',       stack: 'Isolation Forest · PCA',            count: 2,  accent: GREEN  },
  { num: '04', icon: Brain,       name: 'Skin Lesion',   stack: 'Triple ResNet50 · Grad-CAM',        count: 7,  accent: AMBER  },
  { num: '05', icon: Stethoscope, name: 'Symptom Check', stack: 'XGBoost · LightGBM · Random Forest', count: 22, accent: ORANGE },
]

const MARQUEE_ITEMS = [
  '11 MODELS IN ENSEMBLE',
  '5 DIAGNOSTIC MODULES',
  '45+ CONDITIONS SCREENED',
  '30s TO AI VERDICT',
  'GRAD-CAM EXPLAINABILITY',
  'PHYSICIAN OVERSIGHT',
]

/* ─────────────────────────────────────────────────────────────────────────
   Text-splitting helpers
   ───────────────────────────────────────────────────────────────────────── */

function splitToChars(el) {
  if (!el || el.dataset.split) return []
  el.dataset.split = '1'
  const text = el.textContent || ''
  el.textContent = ''
  const spans = []
  for (const ch of text) {
    const s = document.createElement('span')
    s.className = 'exp-char'
    s.textContent = ch === ' ' ? ' ' : ch
    el.appendChild(s)
    spans.push(s)
  }
  return spans
}

function splitToWords(el) {
  if (!el || el.dataset.split) return []
  el.dataset.split = '1'
  const text = el.textContent || ''
  el.textContent = ''
  const tokens = text.split(/(\s+)/)
  const inners = []
  for (const tok of tokens) {
    if (/^\s+$/.test(tok)) {
      el.appendChild(document.createTextNode(tok))
      continue
    }
    const wrap = document.createElement('span')
    wrap.className = 'exp-word'
    const inner = document.createElement('span')
    inner.className = 'exp-word-inner'
    inner.textContent = tok
    wrap.appendChild(inner)
    el.appendChild(wrap)
    inners.push(inner)
  }
  return inners
}

/* ─────────────────────────────────────────────────────────────────────────
   Playful decorative shapes
   ───────────────────────────────────────────────────────────────────────── */

function PlayfulShapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="shape absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#F97316] opacity-[0.07] blur-2xl" />
      <div className="shape absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-[#2563eb] opacity-[0.05] blur-2xl" />
      <Plus className="shape absolute top-32 right-[15%] w-6 h-6 text-[#F97316] opacity-50" strokeWidth={3} />
      <Plus className="shape absolute top-[60%] left-[8%] w-8 h-8 text-[#2563eb] opacity-40" strokeWidth={3} />
      <Asterisk className="shape absolute top-[20%] left-[12%] w-7 h-7 text-[#111827] opacity-40" strokeWidth={2.5} />
      <Asterisk className="shape absolute bottom-32 right-[20%] w-6 h-6 text-[#F97316] opacity-50" strokeWidth={2.5} />
      <div className="shape absolute top-[40%] right-[8%] w-2 h-2 rounded-full bg-[#2563eb]" />
      <div className="shape absolute top-[75%] left-[40%] w-1.5 h-1.5 rounded-full bg-[#F97316]" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Nav
   ───────────────────────────────────────────────────────────────────────── */

function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-[#F1F0EC]/85 backdrop-blur-xl border-b border-black/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          <span className="font-bold text-lg text-[#111827] tracking-tight">UYECARE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold uppercase tracking-wider">
          {['Modules', 'How it works', 'Trust'].map(t => (
            <a
              key={t}
              href={`#${t.toLowerCase().replace(/\s+/g, '-')}`}
              className="relative text-[#111827] hover:text-[#F97316] transition-colors"
            >
              {t}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline text-[13px] font-bold uppercase tracking-wider text-[#111827] hover:text-[#F97316] px-3 py-2 transition-colors">
            Sign in
          </Link>
          <Link
            to="/register"
            className="group inline-flex items-center gap-1.5 bg-[#F97316] text-white px-4 py-2.5 rounded-full text-[13px] font-bold uppercase tracking-wider hover:bg-[#EA580C] transition-colors"
          >
            Get started
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Sticker — soft rounded pill
   ───────────────────────────────────────────────────────────────────────── */

function Sticker({ pos, rotate, bg = ORANGE, color = 'white', children }) {
  return (
    <div
      className={`exp-sticker absolute ${pos} ${rotate} font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-10 hidden md:inline-flex items-center gap-1.5`}
      style={{ background: bg, color }}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative px-6 pt-32 pb-24 overflow-hidden">
      <PlayfulShapes />

      <div className="relative max-w-7xl mx-auto">
        {/* Announcement pill — like the "New: Expressive + LLMs" reference */}
        <div className="hero-eyebrow inline-flex items-center gap-2 bg-white border border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 py-1.5 rounded-full text-xs font-medium mb-10">
          <span className="text-[#F97316] font-bold uppercase tracking-wider text-[10px]">New:</span>
          <span className="text-[#111827]/70">Infinity AI BuildFest · 2025</span>
          <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
        </div>

        {/* Massive headline */}
        <h1 className="font-extrabold leading-[0.92] tracking-tight text-[clamp(2.75rem,9vw,7.5rem)] mb-8 text-[#111827]">
          <span className="block">
            <Word>Screen</Word> <Word>smart.</Word>
          </span>
          <span className="block">
            <Word color={ORANGE}>Act</Word> <Word color={ORANGE}>fast.</Word>
          </span>
          <span className="block">
            <Word>Stay</Word> <Word>healthy.</Word>
          </span>
        </h1>

        {/* Subhead */}
        <p className="hero-sub max-w-2xl text-base md:text-lg text-[#111827]/70 leading-relaxed mb-10">
          UyeCare is a clinical decision-support platform. Upload medical images, analyze ECGs,
          or describe your symptoms — and get AI-assisted screening with a physician in the loop.
        </p>

        {/* CTAs — rounded pills */}
        <div className="hero-ctas flex flex-col sm:flex-row gap-3 mb-12">
          <Link
            to="/register?role=patient"
            className="group inline-flex items-center justify-center gap-2 bg-[#F97316] text-white px-7 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-[#EA580C] transition-colors"
          >
            I'm a patient
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link
            to="/register?role=doctor"
            className="group inline-flex items-center justify-center gap-2 bg-white text-[#111827] px-7 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs border border-[#111827]/15 hover:border-[#111827]/30 hover:bg-[#111827] hover:text-white transition-all"
          >
            I'm a doctor
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Trust row */}
        <div className="hero-trust flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          {['Ensemble of 11 models', 'Grad-CAM explainability', 'Physician oversight'].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-[#111827]/70 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> {t}
            </span>
          ))}
        </div>

        {/* Floating stickers */}
        <Sticker pos="top-44 right-[6%]"   rotate="-rotate-[8deg]" bg={ORANGE}>11 MODELS</Sticker>
        <Sticker pos="top-[55%] right-[3%]" rotate="rotate-[6deg]"  bg={BLUE}>GRAD-CAM</Sticker>
        <Sticker pos="bottom-32 right-[12%]" rotate="-rotate-[4deg]" bg={BLACK}>5 MODULES</Sticker>
      </div>
    </section>
  )
}

function Word({ children, color }) {
  return (
    <span className="exp-word">
      <span className="exp-word-inner" style={color ? { color } : undefined}>{children}</span>
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Marquee strip
   ───────────────────────────────────────────────────────────────────────── */

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="bg-[#111827] text-white overflow-hidden py-4">
      <div className="exp-marquee-track text-sm font-bold uppercase tracking-[0.15em]">
        {items.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-12">
            <span>{t}</span>
            <Asterisk className="w-4 h-4 text-[#F97316] shrink-0" strokeWidth={2.5} />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Modules — soft rounded cards
   ───────────────────────────────────────────────────────────────────────── */

function ModulesSection() {
  return (
    <section id="modules" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 max-w-4xl">
          <p className="font-caps text-xs text-[#F97316] mb-3">[ Modules / 01 ]</p>
          <h2 className="section-heading text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.02] tracking-tight text-[#111827]">
            Five clinical pipelines. One platform.
          </h2>
          <p className="mt-5 text-base md:text-lg text-[#111827]/70 max-w-2xl leading-relaxed">
            Each module runs an ensemble of specialist models — convolutional, transformer and classical —
            and surfaces disagreement so doctors know when to look closer.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map(({ num, icon: Icon, name, stack, count, accent }) => (
            <article
              key={name}
              className="module-card group bg-white rounded-2xl p-6 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_18px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
              style={{ '--accent': accent }}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-caps text-[11px] text-[#111827]/50">[ {num} ]</span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: `${accent}14`, color: accent }}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
              </div>

              <h3 className="text-2xl font-extrabold text-[#111827] leading-tight mb-2">{name}</h3>
              <p className="text-xs text-[#111827]/55 mb-6">{stack}</p>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-black/5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                  {count} classes
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-wider transition-colors"
                  style={{ color: accent }}
                >
                  <span className="inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Detect <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </span>
              </div>
            </article>
          ))}

          {/* Ensemble tile */}
          <article className="module-card relative bg-[#111827] text-white rounded-2xl p-6 flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between mb-6">
              <span className="font-caps text-[11px] text-white/50">[ ∞ ]</span>
              <div className="w-10 h-10 rounded-xl bg-[#F97316]/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#F97316]" strokeWidth={2} />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold leading-tight mb-2">All five, ensembled.</h3>
            <p className="text-xs text-white/55 mb-6">PyTorch · TensorFlow · scikit-learn</p>
            <Link
              to="/register"
              className="mt-auto inline-flex items-center justify-between pt-4 border-t border-white/15 text-xs font-bold uppercase tracking-wider group"
            >
              <span>Try a screening</span>
              <ArrowUpRight className="w-4 h-4 text-[#F97316] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   How it works — three large feature cards w/ embedded mockups
   ───────────────────────────────────────────────────────────────────────── */

function UploadMock() {
  return (
    <div className="bg-[#F8F7F4] rounded-xl p-5 border border-dashed border-black/15">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#F97316] flex items-center justify-center">
          <Upload className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#111827]">Drop file here</p>
          <p className="text-[10px] text-[#111827]/50 font-mono">.dcm  .jpg  .png  .csv</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['X-RAY', 'ECG', 'CT SCAN', 'SKIN', 'SYMPTOMS'].map((t, i) => (
          <span
            key={t}
            className="text-[9px] font-bold uppercase tracking-wider bg-white border border-black/10 px-2 py-1 rounded-full"
            style={i === 0 ? { background: '#F97316', color: 'white', borderColor: 'transparent' } : {}}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function EnsembleMock() {
  const rows = [
    { name: 'DenseNet121', pct: 91, color: ORANGE },
    { name: 'ResNet50',    pct: 87, color: BLUE   },
    { name: 'ViT-Base',    pct: 84, color: GREEN  },
  ]
  return (
    <div className="bg-[#F8F7F4] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#111827]/55">Pneumonia · Chest X-Ray</p>
        <span className="text-[10px] font-bold uppercase bg-white border border-black/10 px-1.5 py-0.5 rounded text-[#111827]/60">3 MODELS</span>
      </div>
      <div className="space-y-2.5">
        {rows.map(r => (
          <div key={r.name}>
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span className="text-[#111827]/80 font-bold">{r.name}</span>
              <span style={{ color: r.color }} className="font-bold">{r.pct}%</span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden border border-black/5">
              <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#111827]">Verdict</span>
        <span className="text-xs font-extrabold text-[#F97316]">87.3% Pneumonia</span>
      </div>
    </div>
  )
}

function ReportMock() {
  const items = [
    { label: 'Likely Pneumonia',    pct: 91, color: 'bg-[#F97316]' },
    { label: 'Consolidation',       pct: 58, color: 'bg-[#D97706]' },
    { label: 'Cardiomegaly',        pct: 18, color: 'bg-[#2563eb]' },
  ]
  return (
    <div className="bg-[#F8F7F4] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#111827]/55">Report · X-Ray</p>
        <span className="text-[9px] font-bold uppercase bg-[#DC2626] text-white px-1.5 py-0.5 rounded">HIGH RISK</span>
      </div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-3xl font-extrabold text-[#111827] leading-none">73</p>
          <p className="text-[10px] text-[#111827]/55 mt-0.5 font-mono">risk score · 0-100</p>
        </div>
        <BadgeCheck className="w-7 h-7 text-[#16A34A]" strokeWidth={1.75} />
      </div>
      <div className="space-y-2">
        {items.map(it => (
          <div key={it.label} className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#111827]/80 truncate font-mono">{it.label}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-14 h-1 bg-white rounded-full overflow-hidden border border-black/5">
                <div className={`h-full ${it.color}`} style={{ width: `${it.pct}%` }} />
              </div>
              <span className="text-[10px] font-bold font-mono w-7 text-right">{it.pct}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-black/10">
        <p className="text-[10px] text-[#111827]/55 font-mono">+ Grad-CAM heatmap · AI guidance</p>
      </div>
    </div>
  )
}

function HowSection() {
  const cards = [
    {
      num: '01',
      title: 'Drop your scan. We handle the rest.',
      desc:  'Upload a chest X-ray, ECG CSV, CT slice or skin photo — or answer the adaptive symptom questionnaire. Five intake paths, one inbox.',
      accent: ORANGE,
      mock: <UploadMock />,
    },
    {
      num: '02',
      title: 'Multiple specialist models. One verdict.',
      desc:  'Each diagnostic module averages 3+ networks in parallel. Disagreement is surfaced as "inconclusive" so doctors know when to look closer.',
      accent: BLUE,
      mock: <EnsembleMock />,
    },
    {
      num: '03',
      title: 'A clinician-ready report in seconds.',
      desc:  'Risk score, confidence, Grad-CAM heatmap and a plain-language AI recommendation — routed to a vetted doctor via the in-app messaging.',
      accent: GREEN,
      mock: <ReportMock />,
    },
  ]

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 max-w-4xl">
          <p className="font-caps text-xs text-[#2563eb] mb-3">[ How it works / 02 ]</p>
          <h2 className="section-heading text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.02] tracking-tight text-[#111827]">
            Upload, ensemble, guide. Under a minute.
          </h2>
        </div>

        {/* Step timeline — circles 01/02/03 connected by a dashed line */}
        <div className="hidden lg:grid grid-cols-3 gap-5 mb-10 relative">
          {/* Dashed connector line — spans col-1 center to col-3 center */}
          <div
            aria-hidden
            className="timeline-line absolute top-1/2 left-[16.66%] right-[16.66%] border-t-[2px] border-dashed border-black/20 -translate-y-1/2 pointer-events-none"
          />
          {cards.map((card) => (
            <div key={`tl-${card.num}`} className="flex items-center justify-center relative z-10">
              <div
                className="timeline-marker relative w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.15)] ring-[6px] ring-[#F1F0EC]"
                style={{ background: card.accent }}
              >
                {card.num}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {cards.map(({ num, title, desc, accent, mock }) => (
            <article
              key={num}
              className="how-card relative bg-white rounded-2xl p-7 border border-black/5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center justify-between mb-5">
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ background: `${accent}1A`, color: accent }}
                >
                  Step {num}
                </span>
                <span className="text-3xl font-extrabold leading-none" style={{ color: accent }}>
                  /{num}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-[#111827] leading-tight mb-3">{title}</h3>
              <p className="text-sm text-[#111827]/65 leading-relaxed mb-6">{desc}</p>

              <div className="mt-auto">{mock}</div>
            </article>
          ))}
        </div>

        {/* Sub-CTA strip like the green button in the reference */}
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <div>
            <p className="text-sm font-bold text-[#111827]">Need a single-module integration for your hospital?</p>
            <p className="text-xs text-[#111827]/60 mt-0.5">Embed the X-Ray or ECG ensemble via API. Same models, your UI.</p>
          </div>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-full font-bold uppercase tracking-wider text-[11px] hover:bg-[#15803D] transition-colors"
          >
            Talk to us
            <MoveRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Trust — soft cards
   ───────────────────────────────────────────────────────────────────────── */

function TrustSection() {
  const cards = [
    { title: 'Ensemble-first',         desc: 'Every diagnosis combines 3+ models. No single network gets the last word.' },
    { title: 'Physician oversight',    desc: 'Results route to your doctor portal with messaging, history and risk ranking.' },
    { title: 'Private by design',      desc: 'Reports scoped to your account. Images stored on Cloudinary with role-gated access.' },
    { title: 'Transparent confidence', desc: 'Results below 60% are flagged inconclusive. Grad-CAM shows what the model looked at.' },
  ]
  return (
    <section id="trust" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <p className="font-caps text-xs text-[#F97316] mb-6">[ Trust / 03 ]</p>
        <h2 className="trust-heading text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-[#111827] max-w-5xl">
          We don't replace doctors. We make every doctor more <span className="text-[#F97316]">powerful</span>.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {cards.map((c, i) => (
            <div
              key={c.title}
              className="trust-card bg-white rounded-2xl p-6 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_28px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all"
            >
              <p className="font-caps text-[11px] text-[#111827]/40 mb-3">[ 0{i+1} ]</p>
              <h3 className="font-extrabold text-lg text-[#111827] mb-2 leading-tight">{c.title}</h3>
              <p className="text-xs text-[#111827]/65 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Final CTA — orange block
   ───────────────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="py-16 md:py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative bg-[#F97316] text-white rounded-3xl px-7 md:px-12 py-10 md:py-12 overflow-hidden shadow-[0_20px_50px_-12px_rgba(249,115,22,0.45)]">
          {/* Decorative shapes */}
          <Plus      className="absolute top-6 left-7  w-6 h-6  text-white opacity-25" strokeWidth={3} />
          <Asterisk  className="absolute bottom-6 right-8 w-6 h-6 text-white opacity-25" strokeWidth={2.5} />
          <div aria-hidden className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid lg:grid-cols-5 gap-7 items-center">
            <div className="lg:col-span-3">
              <p className="font-caps text-[11px] text-white/70 mb-3">[ Ready when you are ]</p>
              <h2 className="cta-heading text-3xl md:text-4xl lg:text-5xl font-extrabold leading-[1.05] tracking-tight">
                Start your first screening <span className="italic">now</span>.
              </h2>
              <p className="cta-sub text-sm md:text-base text-white/85 mt-3 max-w-md leading-relaxed">
                Free account · physician-vetted doctors · results in under a minute.
              </p>
            </div>

            <div className="lg:col-span-2 flex flex-col sm:flex-row gap-3 lg:justify-end">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 bg-white text-[#111827] px-6 py-3 rounded-full font-bold uppercase tracking-wider text-[11px] hover:bg-[#111827] hover:text-white transition-colors"
              >
                Create account
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-[11px] border border-white/60 hover:bg-white hover:text-[#F97316] transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-[#111827] text-white py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[#F97316] flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">UyeCare</span>
          <span className="text-xs text-white/50 ml-2">
            © 2025 · IIT, Jahangirnagar University
          </span>
        </div>
        <p className="text-xs text-white/50 uppercase tracking-wider font-medium">
          Decision-support tool · Physician validation required
        </p>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Page root + GSAP
   ───────────────────────────────────────────────────────────────────────── */

export default function Landing() {
  const root = useRef(null)

  useEffect(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {

        /* ── HERO INTRO ───────────────────────────────────────────────── */

        gsap.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })

        gsap.from('h1 .exp-word-inner', {
          yPercent: 110, rotate: 6, duration: 0.9, stagger: 0.07,
          ease: 'power4.out', delay: 0.15,
        })

        const subEl = root.current.querySelector('.hero-sub')
        const subWords = splitToWords(subEl)
        gsap.from(subWords, {
          y: 14, opacity: 0, duration: 0.55, ease: 'power2.out',
          stagger: 0.018, delay: 1.0,
        })

        gsap.from('.hero-ctas, .hero-trust', {
          y: 18, opacity: 0, duration: 0.7, ease: 'power3.out',
          stagger: 0.1, delay: 1.4,
        })

        gsap.from('.exp-sticker', {
          scale: 0, rotate: 0, opacity: 0,
          duration: 0.7, ease: 'back.out(2.4)',
          stagger: 0.12, delay: 1.1,
        })
        gsap.utils.toArray('.exp-sticker').forEach((el, i) => {
          gsap.to(el, {
            y: gsap.utils.random(-6, 6),
            duration: gsap.utils.random(2, 3.5),
            ease: 'sine.inOut', yoyo: true, repeat: -1,
            delay: 1.5 + i * 0.2,
          })
        })

        gsap.utils.toArray('.shape').forEach((el, i) => {
          gsap.to(el, {
            y: gsap.utils.random(-25, 25),
            x: gsap.utils.random(-15, 15),
            rotation: gsap.utils.random(-15, 15),
            duration: gsap.utils.random(6, 10),
            ease: 'sine.inOut', yoyo: true, repeat: -1,
            delay: i * 0.3,
          })
        })

        /* ── MARQUEE ──────────────────────────────────────────────────── */

        gsap.to('.exp-marquee-track', {
          xPercent: -50, duration: 28, ease: 'none', repeat: -1,
        })

        /* ── SECTION HEADINGS (character drop-in) ─────────────────────── */

        gsap.utils.toArray('.section-heading, .trust-heading, .cta-heading').forEach((el) => {
          const chars = splitToChars(el)
          gsap.set(chars, { yPercent: 100, opacity: 0, rotate: 4 })
          ScrollTrigger.batch(chars, {
            start: 'top 90%', once: true,
            onEnter: (els) => gsap.to(els, {
              yPercent: 0, opacity: 1, rotate: 0,
              duration: 0.55, ease: 'power3.out', stagger: 0.012,
            }),
          })
        })

        /* ── CARD STAGGERS ────────────────────────────────────────────── */

        const groups = [
          { sel: '.module-card', y: 50, dur: 0.7, stagger: 0.07 },
          { sel: '.how-card',    y: 50, dur: 0.7, stagger: 0.10 },
          { sel: '.trust-card',  y: 30, dur: 0.6, stagger: 0.06 },
        ]
        groups.forEach(({ sel, y, dur, stagger }) => {
          gsap.set(sel, { y, opacity: 0 })
          ScrollTrigger.batch(sel, {
            start: 'top 88%', once: true,
            onEnter: (els) =>
              gsap.to(els, { y: 0, opacity: 1, duration: dur, ease: 'power3.out', stagger }),
          })
        })

        /* ── HOW-IT-WORKS TIMELINE ────────────────────────────────────── */

        // Connector line draws from the left
        const tlLine = root.current.querySelector('.timeline-line')
        if (tlLine) {
          gsap.set(tlLine, { scaleX: 0, transformOrigin: 'left center' })
          ScrollTrigger.create({
            trigger: tlLine, start: 'top 85%', once: true,
            onEnter: () => gsap.to(tlLine, { scaleX: 1, duration: 1.1, ease: 'power3.out' }),
          })
        }
        // Markers pop in with overshoot, staggered with the line draw
        const tlMarkers = gsap.utils.toArray('.timeline-marker')
        if (tlMarkers.length) {
          gsap.set(tlMarkers, { scale: 0, opacity: 0 })
          ScrollTrigger.batch(tlMarkers, {
            start: 'top 85%', once: true,
            onEnter: (els) =>
              gsap.to(els, {
                scale: 1, opacity: 1,
                duration: 0.6, ease: 'back.out(2.2)',
                stagger: 0.18, delay: 0.15,
              }),
          })
        }

        /* ── CTA SUB FADE ─────────────────────────────────────────────── */

        gsap.utils.toArray('.cta-sub').forEach((el) => {
          ScrollTrigger.create({
            trigger: el, start: 'top 90%', once: true,
            onEnter: () => gsap.from(el, { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' }),
          })
        })

        requestAnimationFrame(() => ScrollTrigger.refresh())
      }, root)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    <div
      ref={root}
      className="bg-[#F1F0EC] text-[#111827] font-plex antialiased selection:bg-[#F97316] selection:text-white"
    >
      <NavBar />
      <main className="min-h-screen bg-grid relative overflow-hidden">
        <Hero />
        <Marquee />
        <ModulesSection />
        <HowSection />
        <TrustSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
