"""
UyeCare - AI-Powered Healthcare Platform
Presentation Generator
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
from pptx.oxml.ns import qn
from pptx.oxml import parse_xml
from lxml import etree
import copy

# ── Colour palette ────────────────────────────────────────────────────────────
C_DARK       = RGBColor(0x0F, 0x17, 0x2A)   # near-black navy
C_PRIMARY    = RGBColor(0x36, 0x6E, 0xF4)   # vibrant blue
C_ACCENT     = RGBColor(0x06, 0xB6, 0xD4)   # cyan
C_ACCENT2    = RGBColor(0x8B, 0x5C, 0xF6)   # purple
C_GREEN      = RGBColor(0x10, 0xB9, 0x81)   # emerald
C_AMBER      = RGBColor(0xF5, 0x9E, 0x0B)   # amber
C_RED        = RGBColor(0xEF, 0x44, 0x44)   # red
C_WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
C_LIGHT      = RGBColor(0xF1, 0xF5, 0xF9)   # slate-100
C_SLATE      = RGBColor(0x64, 0x74, 0x8B)   # slate-500
C_CARD_BG    = RGBColor(0x1E, 0x29, 0x3B)   # dark card

SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

prs = Presentation()
prs.slide_width  = SLIDE_W
prs.slide_height = SLIDE_H

BLANK = prs.slide_layouts[6]   # completely blank layout


# ── Helpers ───────────────────────────────────────────────────────────────────

def rgb_hex(color: RGBColor) -> str:
    return f"{color[0]:02X}{color[1]:02X}{color[2]:02X}"


def add_rect(slide, x, y, w, h, fill_color=None, line_color=None,
             line_width=Pt(0), alpha=None, radius=None):
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        x, y, w, h
    )
    shape.line.width = line_width
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
    else:
        shape.line.fill.background()

    if radius:
        # round corners via XML
        sp = shape._element
        prstGeom = sp.find(qn('p:spPr') + '/' + qn('a:prstGeom'), sp.nsmap)
        if prstGeom is None:
            spPr = sp.find(qn('p:spPr'))
            if spPr is not None:
                prstGeom_el = etree.SubElement(spPr, qn('a:prstGeom'))
                prstGeom_el.set('prst', 'roundRect')
                avLst = etree.SubElement(prstGeom_el, qn('a:avLst'))
                gd = etree.SubElement(avLst, qn('a:gd'))
                gd.set('name', 'adj')
                gd.set('fmla', f'val {radius}')
    return shape


def add_textbox(slide, text, x, y, w, h,
                font_size=Pt(14), bold=False, italic=False,
                color=C_WHITE, align=PP_ALIGN.LEFT,
                font_name="Calibri", line_spacing=None, wrap=True):
    txBox = slide.shapes.add_textbox(x, y, w, h)
    tf    = txBox.text_frame
    tf.word_wrap = wrap
    p  = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size      = font_size
    run.font.bold      = bold
    run.font.italic    = italic
    run.font.color.rgb = color
    run.font.name      = font_name
    if line_spacing:
        from pptx.util import Pt as Pt2
        p.line_spacing = line_spacing
    return txBox


def add_multiline_textbox(slide, lines, x, y, w, h,
                          font_size=Pt(13), bold=False,
                          color=C_WHITE, align=PP_ALIGN.LEFT,
                          font_name="Calibri", line_spacing=1.15,
                          spacing_before=Pt(4)):
    txBox = slide.shapes.add_textbox(x, y, w, h)
    tf    = txBox.text_frame
    tf.word_wrap = True
    first = True
    for line in lines:
        if first:
            p = tf.paragraphs[0]
            first = False
        else:
            p = tf.add_paragraph()
        p.alignment = align
        if spacing_before:
            p.space_before = spacing_before
        run = p.add_run()
        run.text = line
        run.font.size      = font_size
        run.font.bold      = bold
        run.font.color.rgb = color
        run.font.name      = font_name
    return txBox


def gradient_bg(slide, color1=C_DARK, color2=C_CARD_BG):
    """Dark full-slide background rectangle."""
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, fill_color=color1)


def add_accent_bar(slide, y=Inches(0), h=Inches(0.06),
                   color=C_PRIMARY):
    add_rect(slide, 0, y, SLIDE_W, h, fill_color=color)


def chip(slide, text, x, y, bg=C_PRIMARY, fg=C_WHITE,
         fs=Pt(11), font_name="Calibri"):
    w = Inches(1.6)
    h = Inches(0.35)
    add_rect(slide, x, y, w, h, fill_color=bg, radius=20000)
    add_textbox(slide, text, x, y + Inches(0.03), w, h,
                font_size=fs, bold=True, color=fg,
                align=PP_ALIGN.CENTER, font_name=font_name)


def section_header_bar(slide, text, color=C_PRIMARY):
    add_rect(slide, 0, 0, SLIDE_W, Inches(1.1), fill_color=color)
    add_textbox(slide, text,
                Inches(0.5), Inches(0.22),
                Inches(12.3), Inches(0.75),
                font_size=Pt(30), bold=True, color=C_WHITE,
                font_name="Calibri Light")
    add_accent_bar(slide, y=Inches(1.1), h=Inches(0.05), color=C_ACCENT)


def card_box(slide, x, y, w, h, title, bullets,
             title_color=C_ACCENT, bg=C_CARD_BG,
             title_size=Pt(15), bullet_size=Pt(12)):
    add_rect(slide, x, y, w, h, fill_color=bg, radius=18000)
    add_textbox(slide, title,
                x + Inches(0.18), y + Inches(0.15),
                w - Inches(0.36), Inches(0.4),
                font_size=title_size, bold=True,
                color=title_color, font_name="Calibri")
    bullet_lines = [f"  {b}" for b in bullets]
    add_multiline_textbox(slide, bullet_lines,
                          x + Inches(0.18),
                          y + Inches(0.55),
                          w - Inches(0.36),
                          h - Inches(0.65),
                          font_size=bullet_size,
                          color=C_LIGHT,
                          spacing_before=Pt(3))


def divider_line(slide, y, color=C_SLATE, x=Inches(0.5), w=None):
    if w is None:
        w = SLIDE_W - Inches(1)
    add_rect(slide, x, y, w, Pt(1.5), fill_color=color)


# ── SLIDE 1: Title ────────────────────────────────────────────────────────────

def slide_title():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)

    # Left glow strip
    add_rect(sl, 0, 0, Inches(0.5), SLIDE_H, fill_color=C_PRIMARY)
    add_rect(sl, Inches(0.5), 0, Inches(0.08), SLIDE_H, fill_color=C_ACCENT)

    # Big logo circle
    add_rect(sl, Inches(9.8), Inches(1.2),
             Inches(2.8), Inches(2.8), fill_color=C_PRIMARY, radius=50000)
    add_textbox(sl, "U", Inches(9.8), Inches(1.55),
                Inches(2.8), Inches(2.1),
                font_size=Pt(96), bold=True, color=C_WHITE,
                align=PP_ALIGN.CENTER, font_name="Calibri Light")

    # Tagline strip
    add_rect(sl, Inches(0.8), Inches(1.4), Inches(8.2), Inches(0.45),
             fill_color=C_ACCENT2, radius=8000)
    add_textbox(sl, "  AI-POWERED HEALTHCARE PLATFORM",
                Inches(0.8), Inches(1.42), Inches(8.2), Inches(0.45),
                font_size=Pt(13), bold=True, color=C_WHITE,
                font_name="Calibri", align=PP_ALIGN.LEFT)

    # Main title
    add_textbox(sl, "UyeCare",
                Inches(0.8), Inches(1.95), Inches(8.5), Inches(1.5),
                font_size=Pt(72), bold=True, color=C_WHITE,
                font_name="Calibri Light")

    # Sub-title
    add_textbox(sl,
                "Intelligent Diagnostics  |  Clinical Decision Support  |  Patient Management",
                Inches(0.8), Inches(3.5), Inches(8.5), Inches(0.6),
                font_size=Pt(16), color=C_SLATE, font_name="Calibri")

    # Three stat chips
    stats = [("5 AI Models", C_PRIMARY), ("Groq LLaMA 3", C_ACCENT2), ("Real-time Results", C_GREEN)]
    for i, (t, c) in enumerate(stats):
        chip(sl, t, Inches(0.8) + i * Inches(2.05), Inches(4.5), bg=c)

    # Bottom bar
    add_rect(sl, 0, Inches(6.9), SLIDE_W, Inches(0.6), fill_color=C_CARD_BG)
    add_textbox(sl, "Built with FastAPI  •  React 18  •  MongoDB  •  XGBoost / LightGBM  •  ViT Transformer  •  Groq Cloud",
                Inches(0.5), Inches(6.93), Inches(12), Inches(0.5),
                font_size=Pt(11), color=C_SLATE, font_name="Calibri",
                align=PP_ALIGN.CENTER)


# ── SLIDE 2: Agenda ───────────────────────────────────────────────────────────

def slide_agenda():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Agenda", color=C_ACCENT2)

    items = [
        ("01", "Problem Statement",         C_RED),
        ("02", "Solution & Architecture",   C_PRIMARY),
        ("03", "AI Diagnostic Modules",     C_ACCENT),
        ("04", "Patient Portal",            C_GREEN),
        ("05", "Doctor Portal",             C_AMBER),
        ("06", "Admin Panel",               C_ACCENT2),
        ("07", "Tech Stack",                C_PRIMARY),
        ("08", "Impact & Conclusion",       C_GREEN),
    ]

    col_w  = Inches(5.9)
    row_h  = Inches(0.72)
    x_off  = [Inches(0.5), Inches(6.7)]
    y_start = Inches(1.35)

    for idx, (num, label, color) in enumerate(items):
        col = idx % 2
        row = idx // 2
        x = x_off[col]
        y = y_start + row * (row_h + Inches(0.12))

        add_rect(sl, x, y, col_w, row_h, fill_color=C_CARD_BG, radius=12000)
        # Number circle
        add_rect(sl, x + Inches(0.12), y + Inches(0.12),
                 Inches(0.48), Inches(0.48), fill_color=color, radius=50000)
        add_textbox(sl, num,
                    x + Inches(0.12), y + Inches(0.12),
                    Inches(0.48), Inches(0.48),
                    font_size=Pt(13), bold=True, color=C_WHITE,
                    align=PP_ALIGN.CENTER)
        add_textbox(sl, label,
                    x + Inches(0.72), y + Inches(0.18),
                    col_w - Inches(0.84), Inches(0.4),
                    font_size=Pt(16), bold=True, color=C_WHITE,
                    font_name="Calibri")


# ── SLIDE 3: Problem Statement ────────────────────────────────────────────────

def slide_problem():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Problem Statement", color=C_RED)

    problems = [
        ("Delayed Diagnostics",
         "Patients wait days or weeks for specialist review of X-rays, ECGs, and CT scans."),
        ("Limited Access",
         "Rural and semi-urban populations in Bangladesh lack access to specialist physicians."),
        ("High Error Rate",
         "Manual symptom interpretation is prone to missed diagnoses and human fatigue."),
        ("No Continuity of Care",
         "Disconnected records mean patients repeat tests and doctors lack prior context."),
        ("Communication Gap",
         "Patients cannot easily communicate findings with their doctor post-consultation."),
    ]

    y_start = Inches(1.35)
    for i, (title, desc) in enumerate(problems):
        y = y_start + i * Inches(1.06)
        add_rect(sl, Inches(0.5), y, Inches(12.3), Inches(0.92),
                 fill_color=C_CARD_BG, radius=10000)
        add_rect(sl, Inches(0.5), y, Inches(0.08), Inches(0.92),
                 fill_color=C_RED)
        add_textbox(sl, title,
                    Inches(0.75), y + Inches(0.06),
                    Inches(3.2), Inches(0.38),
                    font_size=Pt(14), bold=True, color=C_RED, font_name="Calibri")
        add_textbox(sl, desc,
                    Inches(0.75), y + Inches(0.44),
                    Inches(11.5), Inches(0.42),
                    font_size=Pt(12.5), color=C_LIGHT, font_name="Calibri")


# ── SLIDE 4: Solution Overview ────────────────────────────────────────────────

def slide_solution():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Our Solution — UyeCare", color=C_PRIMARY)

    add_textbox(sl,
                "A unified, AI-powered health platform that brings diagnostic intelligence to every patient.",
                Inches(0.5), Inches(1.2), Inches(12.3), Inches(0.5),
                font_size=Pt(15), color=C_SLATE, italic=True, font_name="Calibri")

    pillars = [
        ("AI Diagnostics",
         ["5 specialized ML/DL models", "X-Ray, ECG, CT, Skin, Symptoms",
          "Real-time results in seconds", "Grad-CAM visual explanations"],
         C_PRIMARY),
        ("Clinical Intelligence",
         ["Groq LLaMA 3 AI recommendations", "Personalized prescriptions",
          "Risk scoring (0–100)", "Follow-up test suggestions"],
         C_ACCENT),
        ("Unified Portal",
         ["Patient self-service portal", "Doctor review & messaging",
          "Admin approval workflow", "Full diagnostic history"],
         C_ACCENT2),
        ("Secure & Scalable",
         ["JWT authentication", "MongoDB + Cloudinary storage",
          "Role-based access control", "Email notifications"],
         C_GREEN),
    ]

    cw = Inches(2.95)
    for i, (title, bullets, color) in enumerate(pillars):
        x = Inches(0.5) + i * (cw + Inches(0.14))
        y = Inches(1.85)
        h = Inches(4.8)
        add_rect(sl, x, y, cw, h, fill_color=C_CARD_BG, radius=14000)
        add_rect(sl, x, y, cw, Inches(0.08), fill_color=color)
        # Icon number
        add_rect(sl, x + Inches(0.15), y + Inches(0.2),
                 Inches(0.5), Inches(0.5), fill_color=color, radius=50000)
        add_textbox(sl, str(i + 1),
                    x + Inches(0.15), y + Inches(0.2),
                    Inches(0.5), Inches(0.5),
                    font_size=Pt(16), bold=True, color=C_WHITE,
                    align=PP_ALIGN.CENTER)
        add_textbox(sl, title,
                    x + Inches(0.15), y + Inches(0.82),
                    cw - Inches(0.3), Inches(0.45),
                    font_size=Pt(15), bold=True, color=color, font_name="Calibri")
        add_multiline_textbox(sl, [f"• {b}" for b in bullets],
                              x + Inches(0.15), y + Inches(1.35),
                              cw - Inches(0.3), Inches(3.2),
                              font_size=Pt(12), color=C_LIGHT, spacing_before=Pt(5))


# ── SLIDE 5: System Architecture ──────────────────────────────────────────────

def slide_architecture():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "System Architecture", color=C_ACCENT)

    layers = [
        ("Frontend  —  React 18 + Vite + Tailwind CSS",
         ["Patient Portal  |  Doctor Portal  |  Admin Panel",
          "React Router v6  •  Zustand State  •  Recharts  •  Lucide Icons"],
         C_PRIMARY, Inches(1.25)),
        ("Backend  —  FastAPI (Python 3.12)",
         ["REST API  |  JWT Auth  |  Role-based Guards",
          "Analyze  •  History  •  Chat  •  Health Profile  •  Admin Routes"],
         C_ACCENT, Inches(2.6)),
        ("AI / ML Services",
         ["XGBoost + LightGBM + Random Forest  (All Disease)",
          "ViT Transformer (X-Ray)  •  CNN (ECG / Skin / CT)",
          "Grad-CAM Visualization  •  Groq LLaMA 3 (Prescriptions)"],
         C_ACCENT2, Inches(3.95)),
        ("Data & Infrastructure",
         ["MongoDB Atlas  •  Cloudinary CDN  •  Gmail SMTP",
          "Motor (async driver)  •  Pydantic v2  •  bcrypt"],
         C_GREEN, Inches(5.3)),
    ]

    arrow_x = Inches(6.2)
    for title, bullets, color, y in layers:
        lw = Inches(5.5)
        h  = Inches(1.1)
        # Left box
        add_rect(sl, Inches(0.4), y, lw, h, fill_color=C_CARD_BG, radius=10000)
        add_rect(sl, Inches(0.4), y, Inches(0.07), h, fill_color=color)
        add_textbox(sl, title,
                    Inches(0.6), y + Inches(0.07),
                    lw - Inches(0.3), Inches(0.38),
                    font_size=Pt(13), bold=True, color=color, font_name="Calibri")
        add_multiline_textbox(sl, bullets,
                              Inches(0.6), y + Inches(0.47),
                              lw - Inches(0.3), Inches(0.58),
                              font_size=Pt(11), color=C_LIGHT, spacing_before=Pt(2))

        # Down arrow between layers
        if y < Inches(5.3):
            add_rect(sl, Inches(3), y + h + Inches(0.04),
                     Inches(0.06), Inches(0.18), fill_color=color)

    # Right: flow diagram simplified
    add_rect(sl, Inches(6.5), Inches(1.25), Inches(6.3), Inches(5.4),
             fill_color=C_CARD_BG, radius=12000)
    add_textbox(sl, "Data Flow",
                Inches(6.6), Inches(1.35), Inches(6), Inches(0.4),
                font_size=Pt(14), bold=True, color=C_ACCENT, font_name="Calibri")

    steps = [
        ("1. Patient uploads image / answers symptoms", C_PRIMARY),
        ("2. FastAPI validates, runs ML inference", C_ACCENT),
        ("3. Risk score computed (0-100)", C_ACCENT2),
        ("4. Groq LLaMA 3 generates recommendation", C_ACCENT2),
        ("5. Results + Grad-CAM saved to MongoDB", C_GREEN),
        ("6. Cloudinary stores medical images", C_GREEN),
        ("7. Doctor reviews & sends messages", C_AMBER),
        ("8. Patient notified in real-time", C_RED),
    ]
    for i, (step, color) in enumerate(steps):
        y_s = Inches(1.88) + i * Inches(0.6)
        add_rect(sl, Inches(6.65), y_s + Inches(0.08),
                 Inches(0.22), Inches(0.22), fill_color=color, radius=50000)
        add_textbox(sl, step,
                    Inches(7.0), y_s + Inches(0.02),
                    Inches(5.6), Inches(0.35),
                    font_size=Pt(11.5), color=C_LIGHT, font_name="Calibri")


# ── SLIDE 6: AI Modules Overview ──────────────────────────────────────────────

def slide_ai_overview():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "AI Diagnostic Modules", color=C_ACCENT2)

    modules = [
        ("Chest X-Ray",    "ViT Base Transformer",
         ["14 pathology classes", "Grad-CAM heatmap", "Ensemble probabilities", "0.91 AUC"],
         C_PRIMARY),
        ("ECG Analysis",   "1-D CNN Classifier",
         ["5 rhythm classes", "Per-segment voting", "Class probabilities", "CSV upload"],
         C_GREEN),
        ("CT Scan",        "Isolation Forest + CNN",
         ["Anomaly scoring", "Normal vs Abnormal", "Anomaly score %", "DICOM-ready"],
         C_AMBER),
        ("Skin Disease",   "Dual CNN Ensemble",
         ["7 disease classes", "Grad-CAM overlay", "Model agreement", "Dermatology-grade"],
         C_RED),
        ("All Disease Checkup", "XGBoost + LightGBM + RF",
         ["22 disease classes", "28 binary features", "Top-3 predictions", "AI prescription"],
         C_ACCENT2),
    ]

    cw = Inches(2.38)
    y_top = Inches(1.35)
    for i, (name, model, bullets, color) in enumerate(modules):
        x = Inches(0.25) + i * (cw + Inches(0.14))
        h = Inches(5.4)
        add_rect(sl, x, y_top, cw, h, fill_color=C_CARD_BG, radius=14000)
        add_rect(sl, x, y_top, cw, Inches(0.07), fill_color=color)

        add_textbox(sl, name,
                    x + Inches(0.12), y_top + Inches(0.18),
                    cw - Inches(0.24), Inches(0.45),
                    font_size=Pt(13.5), bold=True, color=color, font_name="Calibri")
        add_textbox(sl, model,
                    x + Inches(0.12), y_top + Inches(0.68),
                    cw - Inches(0.24), Inches(0.38),
                    font_size=Pt(11), italic=True, color=C_SLATE, font_name="Calibri")
        divider_line(sl, y_top + Inches(1.12),
                     color=C_CARD_BG,
                     x=x + Inches(0.12),
                     w=cw - Inches(0.24))
        add_multiline_textbox(sl, [f"  {b}" for b in bullets],
                              x + Inches(0.12), y_top + Inches(1.2),
                              cw - Inches(0.24), Inches(3.8),
                              font_size=Pt(11.5), color=C_LIGHT, spacing_before=Pt(7))


# ── SLIDE 7: All Disease Checkup Deep-Dive ────────────────────────────────────

def slide_disease_checkup():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "All Disease Checkup — Deep Dive", color=C_ACCENT2)

    # Left explanation
    add_textbox(sl, "How the Model Works",
                Inches(0.5), Inches(1.25), Inches(5.8), Inches(0.45),
                font_size=Pt(17), bold=True, color=C_ACCENT2, font_name="Calibri")

    steps = [
        "Patient answers a guided questionnaire (binary symptom flags)",
        "28 clinical features constructed from answers",
        "XGBoost + LightGBM + Random Forest ensemble predicts",
        "Soft-voting across 3 models for final class",
        "Top-3 diagnoses with probabilities returned",
        "Groq LLaMA 3 generates a 5-section clinical prescription",
        "Risk score (0–100) computed and stored",
    ]
    for i, step in enumerate(steps):
        y_s = Inches(1.8) + i * Inches(0.62)
        add_rect(sl, Inches(0.5), y_s, Inches(0.36), Inches(0.36),
                 fill_color=C_ACCENT2, radius=50000)
        add_textbox(sl, str(i + 1),
                    Inches(0.5), y_s, Inches(0.36), Inches(0.36),
                    font_size=Pt(12), bold=True, color=C_WHITE,
                    align=PP_ALIGN.CENTER)
        add_textbox(sl, step,
                    Inches(1.0), y_s - Inches(0.02),
                    Inches(5.2), Inches(0.4),
                    font_size=Pt(12), color=C_LIGHT, font_name="Calibri")

    # Right: 22 diseases grid
    add_textbox(sl, "22 Diagnosable Conditions",
                Inches(6.6), Inches(1.25), Inches(6.2), Inches(0.45),
                font_size=Pt(17), bold=True, color=C_ACCENT, font_name="Calibri")

    diseases = [
        "Fungal Infection", "Allergy", "GERD", "Chronic Cholestasis",
        "Drug Reaction", "Peptic Ulcer", "AIDS", "Diabetes",
        "Gastroenteritis", "Bronchial Asthma", "Hypertension",
        "Migraine", "Cervical Spondylosis", "Paralysis", "Jaundice",
        "Malaria", "Chicken Pox", "Dengue", "Typhoid",
        "Hepatitis A/B/C/D/E", "Tuberculosis", "Common Cold",
    ]
    colors_d = [C_PRIMARY, C_ACCENT, C_ACCENT2, C_GREEN,
                C_AMBER, C_RED, C_SLATE, C_PRIMARY,
                C_ACCENT, C_ACCENT2, C_GREEN]

    chip_w = Inches(2.85)
    chip_h = Inches(0.38)
    cols   = 2
    y0     = Inches(1.82)
    for i, dis in enumerate(diseases[:20]):
        col = i % cols
        row = i // cols
        x = Inches(6.6) + col * (chip_w + Inches(0.12))
        y = y0 + row * (chip_h + Inches(0.1))
        bg = colors_d[i % len(colors_d)]
        add_rect(sl, x, y, chip_w, chip_h,
                 fill_color=RGBColor(
                     min(bg[0] + 120, 30),
                     min(bg[1] + 120, 40),
                     min(bg[2] + 120, 50)),
                 radius=8000)
        add_rect(sl, x, y, Inches(0.06), chip_h, fill_color=bg)
        add_textbox(sl, dis,
                    x + Inches(0.12), y + Inches(0.03),
                    chip_w - Inches(0.14), chip_h - Inches(0.06),
                    font_size=Pt(10.5), color=C_LIGHT, font_name="Calibri")


# ── SLIDE 8: Patient Portal ───────────────────────────────────────────────────

def slide_patient_portal():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Patient Portal", color=C_GREEN)

    features = [
        ("Dashboard",
         ["Risk score gauge (0-100)", "Recent 5 reports summary",
          "High-risk count", "Unread doctor message banner"],
         C_GREEN),
        ("Run Tests",
         ["5 AI diagnostic tests", "Drag-and-drop image upload",
          "CSV upload for ECG", "Instant results page"],
         C_PRIMARY),
        ("All Disease Checkup",
         ["Guided symptom questionnaire", "22-disease classification",
          "Top-3 differential diagnoses", "AI clinical prescription"],
         C_ACCENT2),
        ("Test History",
         ["All past reports listed", "Expand for Grad-CAM & details",
          "Stored prescriptions", "Delete reports"],
         C_AMBER),
        ("Health Assistant",
         ["Fill personal health profile", "BMI auto-calculator",
          "Groq AI chat with context", "Personalized advice"],
         C_ACCENT),
        ("Messages",
         ["Doctor-sent messages", "Report context tags",
          "Unread badge on sidebar", "Real-time notification banner"],
         C_RED),
    ]

    cw = Inches(3.95)
    rh = Inches(2.6)
    for i, (title, bullets, color) in enumerate(features):
        col = i % 3
        row = i // 3
        x = Inches(0.35) + col * (cw + Inches(0.14))
        y = Inches(1.35) + row * (rh + Inches(0.14))
        card_box(sl, x, y, cw, rh, title, bullets,
                 title_color=color, title_size=Pt(14), bullet_size=Pt(11.5))


# ── SLIDE 9: Doctor Portal ────────────────────────────────────────────────────

def slide_doctor_portal():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Doctor Portal", color=C_AMBER)

    features = [
        ("Patient Search",
         ["Search by name or Patient ID", "350ms debounce live search",
          "Blood group, DOB, sex displayed", "Direct link to patient detail"],
         C_AMBER),
        ("Patient Detail",
         ["Full profile: PAT-xxx ID, blood group", "Phone, DOB, emergency contact",
          "All diagnostic reports listed", "Expand any report for full details"],
         C_PRIMARY),
        ("Report Viewer",
         ["View Grad-CAM heatmaps", "Probability breakdowns",
          "CT anomaly scores", "Symptom prescriptions"],
         C_ACCENT),
        ("Send Messages",
         ["Message linked to specific report", "Context tag shown to patient",
          "General messages also supported", "Notification dispatched instantly"],
         C_GREEN),
        ("Doctor Dashboard",
         ["Overview of assigned patients", "Approval status visible",
          "Recent activity feed", "Quick navigation"],
         C_ACCENT2),
    ]

    cw = Inches(4.7)
    rh = Inches(2.5)
    positions = [
        (0, 0), (1, 0), (2, 0),
        (0, 1), (1, 1),
    ]
    for i, (title, bullets, color) in enumerate(features):
        col, row = positions[i]
        x = Inches(0.35) + col * (cw + Inches(0.14))
        y = Inches(1.35) + row * (rh + Inches(0.18))
        if i >= 3:
            cw2 = Inches(5.9)
            x   = Inches(0.35) + (i - 3) * (cw2 + Inches(0.14))
        else:
            cw2 = cw
        card_box(sl, x, y, cw2, rh, title, bullets,
                 title_color=color, title_size=Pt(14), bullet_size=Pt(11.5))


# ── SLIDE 10: Admin Panel ─────────────────────────────────────────────────────

def slide_admin():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Admin Panel", color=C_RED)

    # Left column
    add_textbox(sl, "Doctor Approval Workflow",
                Inches(0.5), Inches(1.3), Inches(5.8), Inches(0.45),
                font_size=Pt(17), bold=True, color=C_RED, font_name="Calibri")

    steps = [
        ("Doctor Registers", "Submits registration with specialty, license, hospital"),
        ("Pending Review",   "Admin sees pending list with full credentials"),
        ("Approve / Reject", "One-click decision with reason"),
        ("Email Sent",       "Automated Gmail via SMTP notifies doctor of outcome"),
        ("Portal Access",    "Approved doctors can log in to the Doctor Portal"),
    ]
    for i, (title, desc) in enumerate(steps):
        y_s = Inches(1.88) + i * Inches(0.98)
        # Step number circle
        add_rect(sl, Inches(0.5), y_s + Inches(0.1),
                 Inches(0.42), Inches(0.42), fill_color=C_RED, radius=50000)
        add_textbox(sl, str(i + 1),
                    Inches(0.5), y_s + Inches(0.1),
                    Inches(0.42), Inches(0.42),
                    font_size=Pt(13), bold=True, color=C_WHITE,
                    align=PP_ALIGN.CENTER)
        add_rect(sl, Inches(1.08), y_s, Inches(5.1), Inches(0.82),
                 fill_color=C_CARD_BG, radius=8000)
        add_textbox(sl, title,
                    Inches(1.2), y_s + Inches(0.04),
                    Inches(4.8), Inches(0.32),
                    font_size=Pt(13), bold=True, color=C_RED, font_name="Calibri")
        add_textbox(sl, desc,
                    Inches(1.2), y_s + Inches(0.38),
                    Inches(4.8), Inches(0.38),
                    font_size=Pt(11.5), color=C_LIGHT, font_name="Calibri")

    # Right column — ID System
    add_textbox(sl, "Auto-Generated ID System",
                Inches(6.8), Inches(1.3), Inches(5.9), Inches(0.45),
                font_size=Pt(17), bold=True, color=C_ACCENT, font_name="Calibri")

    id_items = [
        ("PAT-001, PAT-002 …", "Sequential patient IDs assigned at registration",   C_GREEN),
        ("DOC-001, DOC-002 …", "Sequential doctor IDs assigned on approval",         C_PRIMARY),
        ("Displayed in sidebar", "IDs visible in patient/doctor profile sidebar",    C_ACCENT),
        ("Searchable",          "Doctors can search patients by PAT-xxx ID",         C_AMBER),
    ]
    for i, (id_str, desc, color) in enumerate(id_items):
        y_s = Inches(1.88) + i * Inches(1.1)
        add_rect(sl, Inches(6.8), y_s, Inches(5.9), Inches(0.92),
                 fill_color=C_CARD_BG, radius=10000)
        add_rect(sl, Inches(6.8), y_s, Inches(0.07), Inches(0.92), fill_color=color)
        add_textbox(sl, id_str,
                    Inches(7.05), y_s + Inches(0.06),
                    Inches(5.5), Inches(0.35),
                    font_size=Pt(14), bold=True, color=color, font_name="Calibri")
        add_textbox(sl, desc,
                    Inches(7.05), y_s + Inches(0.44),
                    Inches(5.5), Inches(0.38),
                    font_size=Pt(11.5), color=C_LIGHT, font_name="Calibri")


# ── SLIDE 11: Tech Stack ──────────────────────────────────────────────────────

def slide_tech_stack():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Technology Stack", color=C_PRIMARY)

    categories = [
        ("Frontend", [
            "React 18 + Vite",
            "Tailwind CSS",
            "React Router v6",
            "Zustand (state)",
            "Recharts",
            "Lucide React",
            "react-dropzone",
        ], C_PRIMARY),
        ("Backend", [
            "FastAPI (Python 3.12)",
            "Pydantic v2",
            "Motor (async MongoDB)",
            "JWT + bcrypt",
            "smtplib (Gmail SMTP)",
            "Cloudinary SDK",
            "uvicorn",
        ], C_ACCENT),
        ("AI / ML", [
            "XGBoost + LightGBM",
            "Scikit-learn (RF)",
            "PyTorch (ViT, CNN)",
            "Grad-CAM",
            "Groq SDK (LLaMA 3)",
            "NumPy / Pandas",
            "OpenCV",
        ], C_ACCENT2),
        ("Infrastructure", [
            "MongoDB Atlas",
            "Cloudinary CDN",
            "Gmail App Password",
            "Git + GitHub",
            "Docker-ready",
            "VS Code",
            "Windows 11",
        ], C_GREEN),
    ]

    cw = Inches(2.95)
    for i, (cat, items, color) in enumerate(categories):
        x = Inches(0.35) + i * (cw + Inches(0.14))
        y = Inches(1.35)
        h = Inches(5.5)
        add_rect(sl, x, y, cw, h, fill_color=C_CARD_BG, radius=14000)
        add_rect(sl, x, y, cw, Inches(0.08), fill_color=color)
        add_textbox(sl, cat,
                    x + Inches(0.15), y + Inches(0.2),
                    cw - Inches(0.3), Inches(0.42),
                    font_size=Pt(16), bold=True, color=color, font_name="Calibri")
        add_multiline_textbox(sl, [f"  {item}" for item in items],
                              x + Inches(0.15), y + Inches(0.78),
                              cw - Inches(0.3), Inches(4.5),
                              font_size=Pt(12.5), color=C_LIGHT, spacing_before=Pt(6))


# ── SLIDE 12: Notifications & Communication ───────────────────────────────────

def slide_notifications():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Notifications & Communication", color=C_ACCENT)

    left_items = [
        ("Real-time Unread Badge",
         "Red badge on Messages sidebar item, polled every 30 seconds.",
         C_RED),
        ("Dashboard Banner",
         "Blue alert banner at top of patient dashboard when unread count > 0.",
         C_PRIMARY),
        ("Report-Linked Messages",
         "Doctor messages tagged with report type and prediction for context.",
         C_ACCENT),
        ("Auto-clear Badge",
         "Badge clears automatically when patient navigates to the Messages page.",
         C_GREEN),
    ]

    right_items = [
        ("Doctor Approved Email",
         "HTML email sent via Gmail SMTP notifying doctor of approval.",
         C_GREEN),
        ("Doctor Rejected Email",
         "Rejection email with professional message sent to the applicant.",
         C_RED),
        ("Background Threading",
         "Emails sent in daemon threads — API response not delayed.",
         C_AMBER),
        ("App Password Security",
         "Gmail App Password used (no OAuth needed), stored in backend .env.",
         C_ACCENT2),
    ]

    def render_list(items, x_start):
        for i, (title, desc, color) in enumerate(items):
            y_s = Inches(1.35) + i * Inches(1.35)
            add_rect(sl, x_start, y_s, Inches(5.9), Inches(1.18),
                     fill_color=C_CARD_BG, radius=10000)
            add_rect(sl, x_start, y_s, Inches(0.07), Inches(1.18), fill_color=color)
            add_textbox(sl, title,
                        x_start + Inches(0.2), y_s + Inches(0.1),
                        Inches(5.5), Inches(0.38),
                        font_size=Pt(14), bold=True, color=color, font_name="Calibri")
            add_textbox(sl, desc,
                        x_start + Inches(0.2), y_s + Inches(0.52),
                        Inches(5.5), Inches(0.56),
                        font_size=Pt(12), color=C_LIGHT, font_name="Calibri")

    render_list(left_items,  Inches(0.35))
    render_list(right_items, Inches(6.7))

    # Centre divider
    divider_line(sl, Inches(3.75), color=C_SLATE,
                 x=Inches(6.45), w=Inches(0.06))
    add_textbox(sl, "Patient\nNotifications",
                Inches(6.18), Inches(1.45), Inches(1.2), Inches(0.7),
                font_size=Pt(10), bold=True, color=C_ACCENT, align=PP_ALIGN.CENTER)
    add_textbox(sl, "Email\nNotifications",
                Inches(6.18), Inches(5.1), Inches(1.2), Inches(0.7),
                font_size=Pt(10), bold=True, color=C_AMBER, align=PP_ALIGN.CENTER)


# ── SLIDE 13: Groq AI Integration ────────────────────────────────────────────

def slide_groq():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Groq AI Integration — LLaMA 3", color=C_ACCENT2)

    # Model info
    add_rect(sl, Inches(0.4), Inches(1.3), Inches(12.5), Inches(0.72),
             fill_color=C_CARD_BG, radius=10000)
    add_textbox(sl, "Model:  llama-3.3-70b-versatile  via Groq Cloud API  —  Sub-second inference latency",
                Inches(0.65), Inches(1.45), Inches(12), Inches(0.45),
                font_size=Pt(14), color=C_ACCENT, bold=True, font_name="Calibri")

    use_cases = [
        ("Clinical Prescription",
         ["Triggered after All Disease Checkup", "5-section structured output:",
          "  1. What symptoms suggest",
          "  2. Recommended diagnostic tests (with reasons)",
          "  3. Urgency — Today / 3-7 days / Routine",
          "  4. Warning signs to watch for",
          "  5. Immediate steps",
          "Under 320 words, patient-friendly language"],
         C_ACCENT2, Inches(0.4)),
        ("AI Health Guidance",
         ["Generated after X-Ray, ECG, CT, Skin results",
          "Plain-language explanation of finding",
          "Lifestyle & monitoring advice",
          "Urgency level for doctor visit",
          "Under 200 words, empathetic tone"],
         C_GREEN, Inches(4.55)),
        ("Health Assistant Chat",
         ["Conversational QA with full chat history",
          "Patient health profile injected as context",
          "Height, weight, BMI, conditions, medications",
          "Open-ended health questions answered",
          "UyeCare AI persona with Bangladesh context"],
         C_PRIMARY, Inches(8.7)),
    ]

    for title, bullets, color, x in use_cases:
        w = Inches(3.9)
        y = Inches(2.2)
        h = Inches(4.5)
        add_rect(sl, x, y, w, h, fill_color=C_CARD_BG, radius=14000)
        add_rect(sl, x, y, w, Inches(0.07), fill_color=color)
        add_textbox(sl, title,
                    x + Inches(0.15), y + Inches(0.18),
                    w - Inches(0.3), Inches(0.42),
                    font_size=Pt(14), bold=True, color=color, font_name="Calibri")
        add_multiline_textbox(sl, [f"  {b}" for b in bullets],
                              x + Inches(0.15), y + Inches(0.72),
                              w - Inches(0.3), Inches(3.6),
                              font_size=Pt(11.5), color=C_LIGHT, spacing_before=Pt(6))


# ── SLIDE 14: Impact & Key Numbers ───────────────────────────────────────────

def slide_impact():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)
    section_header_bar(sl, "Impact & Key Numbers", color=C_GREEN)

    stats = [
        ("5",         "AI Diagnostic\nModels",          C_PRIMARY),
        ("22",        "Diagnosable\nDiseases",           C_ACCENT2),
        ("< 3s",      "Average\nInference Time",         C_GREEN),
        ("100%",      "Risk Score\nTransparency",        C_AMBER),
        ("3",         "User Roles\nPatient/Doctor/Admin", C_ACCENT),
        ("Real-time", "Doctor-Patient\nMessaging",       C_RED),
    ]

    sw = Inches(2.0)
    sh = Inches(2.2)
    y0 = Inches(1.4)
    for i, (val, label, color) in enumerate(stats):
        col = i % 3
        row = i // 3
        x = Inches(0.5) + col * (sw + Inches(1.55))
        y = y0 + row * (sh + Inches(0.2))
        add_rect(sl, x, y, sw, sh, fill_color=C_CARD_BG, radius=14000)
        add_rect(sl, x, y, sw, Inches(0.07), fill_color=color)
        add_textbox(sl, val,
                    x, y + Inches(0.28),
                    sw, Inches(0.85),
                    font_size=Pt(38), bold=True, color=color,
                    align=PP_ALIGN.CENTER, font_name="Calibri Light")
        add_textbox(sl, label,
                    x, y + Inches(1.18),
                    sw, Inches(0.9),
                    font_size=Pt(11), color=C_SLATE,
                    align=PP_ALIGN.CENTER, font_name="Calibri")

    # Bottom highlight box
    add_rect(sl, Inches(0.4), Inches(5.95), Inches(12.5), Inches(1.1),
             fill_color=C_CARD_BG, radius=10000)
    add_rect(sl, Inches(0.4), Inches(5.95), Inches(12.5), Inches(0.07),
             fill_color=C_PRIMARY)
    add_textbox(sl,
                "UyeCare bridges the gap between AI precision and compassionate patient care —\n"
                "delivering instant, explainable, and actionable health intelligence.",
                Inches(0.7), Inches(6.05), Inches(11.9), Inches(0.85),
                font_size=Pt(14), color=C_LIGHT, italic=True,
                align=PP_ALIGN.CENTER, font_name="Calibri")


# ── SLIDE 15: Thank You ────────────────────────────────────────────────────────

def slide_thankyou():
    sl = prs.slides.add_slide(BLANK)
    gradient_bg(sl)

    add_rect(sl, 0, 0, SLIDE_W, Inches(0.08), fill_color=C_PRIMARY)
    add_rect(sl, 0, SLIDE_H - Inches(0.08), SLIDE_W, Inches(0.08), fill_color=C_ACCENT)

    # Big circle
    add_rect(sl, Inches(5.0), Inches(0.7), Inches(3.33), Inches(3.33),
             fill_color=C_PRIMARY, radius=50000)
    add_textbox(sl, "U",
                Inches(5.0), Inches(1.1), Inches(3.33), Inches(2.6),
                font_size=Pt(108), bold=True, color=C_WHITE,
                align=PP_ALIGN.CENTER, font_name="Calibri Light")

    add_textbox(sl, "UyeCare",
                Inches(0.5), Inches(4.15), SLIDE_W - Inches(1), Inches(1.1),
                font_size=Pt(52), bold=True, color=C_WHITE,
                align=PP_ALIGN.CENTER, font_name="Calibri Light")

    add_textbox(sl, "AI-Powered Healthcare Platform",
                Inches(0.5), Inches(5.15), SLIDE_W - Inches(1), Inches(0.55),
                font_size=Pt(20), color=C_SLATE,
                align=PP_ALIGN.CENTER, font_name="Calibri")

    add_textbox(sl, "Thank You",
                Inches(0.5), Inches(5.72), SLIDE_W - Inches(1), Inches(0.6),
                font_size=Pt(22), bold=True, color=C_ACCENT,
                align=PP_ALIGN.CENTER, font_name="Calibri")

    add_textbox(sl,
                "FastAPI  •  React 18  •  MongoDB  •  XGBoost / LightGBM / ViT  •  Groq LLaMA 3",
                Inches(0.5), Inches(6.55), SLIDE_W - Inches(1), Inches(0.5),
                font_size=Pt(12), color=C_SLATE,
                align=PP_ALIGN.CENTER, font_name="Calibri")


# ── Build all slides ──────────────────────────────────────────────────────────

slide_title()
slide_agenda()
slide_problem()
slide_solution()
slide_architecture()
slide_ai_overview()
slide_disease_checkup()
slide_patient_portal()
slide_doctor_portal()
slide_admin()
slide_tech_stack()
slide_notifications()
slide_groq()
slide_impact()
slide_thankyou()

out = r"d:\Projects\UyeCare\UyeCare_Presentation.pptx"
prs.save(out)
print(f"Saved: {out}  ({prs.slides.__len__()} slides)")
