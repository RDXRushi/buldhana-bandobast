#!/usr/bin/env python3
"""
Generate a polished, fully-illustrated user manual for the Buldhana Bandobast
Staff Android App as a PDF.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, NextPageTemplate, PageBreak,
    Paragraph, Spacer, Table, TableStyle, Image, ListFlowable, ListItem,
    KeepTogether,
)
from reportlab.pdfgen import canvas

OUT = "/app/docs/Buldhana_Bandobast_Staff_App_User_Manual.pdf"

# ----- colour palette (matches the app) -------------------------------------
SAFFRON      = colors.HexColor("#FF9933")
SAFFRON_DARK = colors.HexColor("#E68A2E")
GREEN        = colors.HexColor("#138808")
NAVY         = colors.HexColor("#1E40AF")
GRAY_50      = colors.HexColor("#F9FAFB")
GRAY_100     = colors.HexColor("#F3F4F6")
GRAY_200     = colors.HexColor("#E5E7EB")
GRAY_500     = colors.HexColor("#6B7280")
GRAY_700     = colors.HexColor("#374151")
GRAY_900     = colors.HexColor("#111827")
RED          = colors.HexColor("#DC2626")
WHITE        = colors.white

# ----- styles ----------------------------------------------------------------
ss = getSampleStyleSheet()

H1 = ParagraphStyle("H1", parent=ss["Heading1"],
    fontName="Helvetica-Bold", fontSize=24, leading=28,
    textColor=GRAY_900, spaceAfter=10)

H2 = ParagraphStyle("H2", parent=ss["Heading2"],
    fontName="Helvetica-Bold", fontSize=16, leading=20,
    textColor=SAFFRON_DARK, spaceBefore=14, spaceAfter=6)

H3 = ParagraphStyle("H3", parent=ss["Heading3"],
    fontName="Helvetica-Bold", fontSize=12, leading=15,
    textColor=NAVY, spaceBefore=10, spaceAfter=4)

BODY = ParagraphStyle("Body", parent=ss["BodyText"],
    fontName="Helvetica", fontSize=10.5, leading=14,
    textColor=GRAY_700, alignment=TA_JUSTIFY, spaceAfter=4)

SMALL = ParagraphStyle("Small", parent=BODY, fontSize=9, leading=11,
    textColor=GRAY_500)

NOTE = ParagraphStyle("Note", parent=BODY, fontSize=10,
    leftIndent=10, rightIndent=10, spaceBefore=4, spaceAfter=8,
    textColor=GRAY_700, backColor=colors.HexColor("#FFF7E6"),
    borderColor=SAFFRON, borderWidth=0, borderPadding=8)

TIP = ParagraphStyle("Tip", parent=BODY, fontSize=10,
    leftIndent=10, rightIndent=10, spaceBefore=4, spaceAfter=8,
    textColor=GRAY_700, backColor=colors.HexColor("#ECFDF5"),
    borderColor=GREEN, borderWidth=0, borderPadding=8)

WARN = ParagraphStyle("Warn", parent=BODY, fontSize=10,
    leftIndent=10, rightIndent=10, spaceBefore=4, spaceAfter=8,
    textColor=GRAY_700, backColor=colors.HexColor("#FEE2E2"),
    borderColor=RED, borderWidth=0, borderPadding=8)

CAPTION = ParagraphStyle("Caption", parent=SMALL, alignment=TA_CENTER,
    textColor=GRAY_500, spaceBefore=2)

CENTER = ParagraphStyle("Center", parent=BODY, alignment=TA_CENTER)

def hr():
    t = Table([[""]], colWidths=[170 * mm])
    t.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, -1), 0.5, GRAY_200)]))
    return t

# ----- page templates --------------------------------------------------------
def cover_page(canv, doc):
    canv.saveState()
    canv.setFillColor(SAFFRON)
    canv.rect(0, A4[1] - 200 * mm, A4[0], 200 * mm, fill=1, stroke=0)
    # Maharashtra Police logo (white circle)
    logo_path = "/app/frontend/src/assets/maharashtra-police-logo.png"
    try:
        from reportlab.lib.utils import ImageReader
        canv.setFillColor(WHITE)
        canv.circle(A4[0] / 2, A4[1] - 55 * mm, 18 * mm, fill=1, stroke=0)
        canv.drawImage(ImageReader(logo_path),
                       A4[0] / 2 - 16 * mm, A4[1] - 71 * mm,
                       width=32 * mm, height=32 * mm,
                       mask="auto", preserveAspectRatio=True)
    except Exception:
        pass
    canv.setFillColor(WHITE)
    canv.setFont("Helvetica-Bold", 32)
    canv.drawCentredString(A4[0] / 2, A4[1] - 100 * mm, "Buldhana Bandobast")
    canv.setFont("Helvetica-Bold", 20)
    canv.drawCentredString(A4[0] / 2, A4[1] - 113 * mm, "Staff App")
    canv.setFont("Helvetica", 13)
    canv.drawCentredString(A4[0] / 2, A4[1] - 126 * mm, "बुलढाणा बंदोबस्त — स्टाफ अ‍ॅप")
    canv.setFillColor(WHITE)
    canv.setFont("Helvetica", 12)
    canv.drawCentredString(A4[0] / 2, A4[1] - 150 * mm, "Complete User Manual — A to Z")
    canv.setFont("Helvetica", 10)
    canv.drawCentredString(A4[0] / 2, A4[1] - 162 * mm, "(Bilingual: English + मराठी)")

    # Footer block
    canv.setFillColor(GRAY_900)
    canv.rect(0, 0, A4[0], 35 * mm, fill=1, stroke=0)
    canv.setFillColor(WHITE)
    canv.setFont("Helvetica-Bold", 13)
    canv.drawCentredString(A4[0] / 2, 22 * mm, "Buldhana District Police")
    canv.setFont("Helvetica", 10)
    canv.drawCentredString(A4[0] / 2, 14 * mm, "Digital Police Bandobast Management System")
    canv.setFont("Helvetica", 8)
    canv.drawCentredString(A4[0] / 2, 8 * mm, "Version 1.0   ·   © 2026 Buldhana District Police")
    canv.restoreState()


def content_page(canv, doc):
    canv.saveState()
    # Header strip
    canv.setFillColor(SAFFRON)
    canv.rect(0, A4[1] - 18 * mm, A4[0], 18 * mm, fill=1, stroke=0)
    canv.setFillColor(WHITE)
    canv.setFont("Helvetica-Bold", 11)
    canv.drawString(15 * mm, A4[1] - 11 * mm, "Buldhana Bandobast — Staff App Manual")
    canv.setFont("Helvetica", 9)
    canv.drawRightString(A4[0] - 15 * mm, A4[1] - 11 * mm, "v1.0 · Buldhana District Police")
    # Footer
    canv.setStrokeColor(GRAY_200)
    canv.line(15 * mm, 15 * mm, A4[0] - 15 * mm, 15 * mm)
    canv.setFillColor(GRAY_500)
    canv.setFont("Helvetica", 8)
    canv.drawCentredString(A4[0] / 2, 9 * mm, f"Page {doc.page}  ·  Buldhana Bandobast Staff App User Manual")
    canv.restoreState()


# ----- "screen mockup" widget ------------------------------------------------
def phone_mockup(title_top, title_sub, body_widgets, header_color=SAFFRON, height=130 * mm):
    """Renders a stylised phone-like card representing a screen."""
    width = 75 * mm
    # Header row
    header = Table(
        [[Paragraph(f"<b><font color='white'>{title_top}</font></b>", BODY),
          Paragraph(f"<font size='8' color='white'>{title_sub}</font>", BODY)]],
        colWidths=[width * 0.55, width * 0.45],
    )
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), header_color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    body = Table([[w] for w in body_widgets], colWidths=[width - 8])
    body.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    outer = Table([[header], [body]], colWidths=[width])
    outer.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, GRAY_200),
        ("ROUNDEDCORNERS", [10, 10, 10, 10]),
        ("BACKGROUND", (0, 1), (-1, 1), WHITE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


def card_block(rows, bg=GRAY_50):
    """Small rounded card holding label/value rows."""
    data = [[Paragraph(f"<font size='7' color='#6B7280'><b>{lbl.upper()}</b></font>",
                       SMALL),
             Paragraph(f"<font size='9' color='#111827'>{val}</font>", BODY)]
            for lbl, val in rows]
    t = Table(data, colWidths=[26 * mm, 37 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def pill(text, fill=SAFFRON, fg=WHITE):
    t = Table([[Paragraph(f"<font size='8' color='{fg.hexval()}'><b>{text}</b></font>", SMALL)]],
              colWidths=[40 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def big_btn(text, fill=GREEN):
    t = Table([[Paragraph(f"<font size='10' color='white'><b>{text}</b></font>", CENTER)]],
              colWidths=[63 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def labeled_input(label, placeholder=""):
    t = Table([
        [Paragraph(f"<font size='7' color='#6B7280'><b>{label.upper()}</b></font>", SMALL)],
        [Paragraph(f"<font size='9' color='#9CA3AF'>{placeholder}</font>", BODY)],
    ], colWidths=[63 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 1), (-1, 1), WHITE),
        ("BOX", (0, 1), (-1, 1), 0.5, GRAY_200),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (0, 0), 0),
        ("BOTTOMPADDING", (0, 0), (0, 0), 2),
        ("TOPPADDING", (0, 1), (0, 1), 8),
        ("BOTTOMPADDING", (0, 1), (0, 1), 8),
    ]))
    return t


# =============================================================================
# Build the document
# =============================================================================
import os
os.makedirs(os.path.dirname(OUT), exist_ok=True)

doc = BaseDocTemplate(OUT, pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm,
    topMargin=25 * mm, bottomMargin=20 * mm)

frame = Frame(doc.leftMargin, doc.bottomMargin,
              doc.width, doc.height, id="content")

doc.addPageTemplates([
    PageTemplate(id="cover", frames=[frame], onPage=cover_page),
    PageTemplate(id="content", frames=[frame], onPage=content_page),
])

story = []

# ---- Cover (uses 'cover' template; first page is auto cover) ----
# Force everything below to use 'content' template:
story.append(NextPageTemplate("content"))
story.append(PageBreak())

# =============================================================================
# Table of Contents
# =============================================================================
story.append(Paragraph("Contents", H1))
story.append(hr())
story.append(Spacer(1, 6))
toc_rows = [
    ("1.",  "Welcome — what this app does",                   "3"),
    ("2.",  "Before you begin (one-time setup)",              "3"),
    ("3.",  "Installing the app",                             "4"),
    ("4.",  "Page 1 — Settings (set the server URL)",         "5"),
    ("5.",  "Page 2 — Login screen",                          "6"),
    ("6.",  "Page 3 — Alerts list",                           "7"),
    ("7.",  "Page 4 — Bandobast Detail (your duty briefing)", "8"),
    ("8.",  "Page 5 — Profile (view & edit your info)",       "10"),
    ("9.",  "Notifications — how alerts reach you",            "11"),
    ("10.", "Admin's role — sending an alert",                "12"),
    ("11.", "Troubleshooting / FAQ",                          "13"),
    ("12.", "Glossary (English ⇄ मराठी)",                       "14"),
]
toc_table = Table(toc_rows, colWidths=[12 * mm, 130 * mm, 25 * mm])
toc_table.setStyle(TableStyle([
    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 11),
    ("TEXTCOLOR", (0, 0), (-1, -1), GRAY_700),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
]))
story.append(toc_table)
story.append(PageBreak())

# =============================================================================
# 1. Welcome
# =============================================================================
story.append(Paragraph("1. Welcome — what this app does", H1))
story.append(Paragraph(
    "<b>Buldhana Bandobast Staff</b> is the official mobile companion for "
    "every police officer, amaldar (पोलीस अंमलदार) and home-guard (होमगार्ड) "
    "deployed by the Buldhana District Police. Whenever your in-charge "
    "officer creates a duty (बंदोबस्त) and presses <b>Send Alert</b> in the "
    "admin portal, this app is how that duty arrives in your hand.",
    BODY))
story.append(Spacer(1, 6))
story.append(Paragraph("In one place you get:", BODY))
story.append(ListFlowable([
    ListItem(Paragraph("🔔 A notification the moment your duty is dispatched.", BODY)),
    ListItem(Paragraph("📍 Your assigned point with a one-tap Google Maps link.", BODY)),
    ListItem(Paragraph("🎒 Your personal equipment (Lathi / Wireless / etc.).", BODY)),
    ListItem(Paragraph("👥 The names &amp; mobiles of fellow staff at your point.", BODY)),
    ListItem(Paragraph("🆔 Your digital ID Card and Duty-Pass QR for checkpoints.", BODY)),
    ListItem(Paragraph("✏️ A profile you can keep up-to-date yourself (mobile is locked — only admin can change it).", BODY)),
], bulletType="bullet"))

story.append(Paragraph("2. Before you begin", H1))
story.append(Paragraph(
    "You only need three things to use this app:", BODY))
story.append(ListFlowable([
    ListItem(Paragraph("An Android phone (Android 7.0 / Nougat or newer).", BODY)),
    ListItem(Paragraph("Your <b>10-digit mobile number</b> as recorded by the duty in-charge.", BODY)),
    ListItem(Paragraph("The <b>backend server URL</b> from your station (one-time entry).", BODY)),
], bulletType="bullet"))
story.append(Paragraph(
    "<b>Important:</b> The mobile number you enter at login <i>must</i> match "
    "exactly what is in the staff master list. If you cannot log in, contact "
    "your in-charge officer to verify your number.",
    NOTE))
story.append(PageBreak())

# =============================================================================
# 3. Installation
# =============================================================================
story.append(Paragraph("3. Installing the app", H1))
story.append(Paragraph(
    "The app is distributed as an <b>Android Package (.apk)</b> file. "
    "It is not on the Play Store yet — your station will share the file via "
    "WhatsApp / USB / Drive / a download link.", BODY))
story.append(Spacer(1, 6))

install_steps = [
    ("1", "Receive the file", "You will get a file named <b>BuldhanaBandobastStaff.apk</b> "
                              "(roughly 8–10 MB). Save it to your phone's Downloads folder."),
    ("2", "Open the file",   "Tap the file. Android will ask if you want to install. If it warns "
                             "“For your security…”, tap <b>Settings</b> and turn on "
                             "<b>Allow installation from this source</b>, then go back."),
    ("3", "Play Protect warning", "Google Play Protect may show <b>“App not scanned”</b>. "
                                  "This is normal because the app is not yet listed on Play Store. "
                                  "Tap <b>Install anyway</b>."),
    ("4", "Allow permissions", "On first launch, the app will ask for three permissions:"),
]
for num, title, desc in install_steps:
    row = Table([[
        Paragraph(f"<font color='{SAFFRON.hexval()}' size='18'><b>{num}</b></font>", BODY),
        Paragraph(f"<b>{title}</b><br/>{desc}", BODY)]],
        colWidths=[10 * mm, 160 * mm])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(row)

story.append(ListFlowable([
    ListItem(Paragraph("<b>Notifications</b> — needed so we can alert you about new duties.", BODY)),
    ListItem(Paragraph("<b>Camera</b> — needed to capture your photo for the ID card.", BODY)),
    ListItem(Paragraph("<b>Storage / Photos</b> — needed to read the photo you take.", BODY)),
], bulletType="bullet"))
story.append(Paragraph(
    "Tap <b>Allow</b> for each. If you accidentally deny, you can re-enable them later in "
    "<i>Phone Settings → Apps → Buldhana Bandobast Staff → Permissions</i>.",
    TIP))
story.append(PageBreak())

# =============================================================================
# 4. Settings page
# =============================================================================
story.append(Paragraph("4. Page 1 — Settings (set the server URL)", H1))
story.append(Paragraph(
    "On the very first launch, before you can log in, the app needs to know the "
    "address of your station's admin server. This is a one-time step.",
    BODY))

# layout: mockup left, instructions right
mock = phone_mockup(
    "‹  Settings", "",
    [
        Spacer(1, 6),
        Paragraph("<font size='9' color='#6B7280'><b>BACKEND SERVER URL</b></font>", SMALL),
        labeled_input("URL", "https://your-admin.example.com"),
        Spacer(1, 6),
        Paragraph(
            "<font size='8' color='#6B7280'>Ask your station in-charge for the "
            "correct URL of the Buldhana Bandobast admin server.</font>", SMALL),
        Spacer(1, 8),
        big_btn("Save", GREEN),
        Spacer(1, 12),
        Paragraph("<font size='7' color='#9CA3AF'>v1.0.0 · Buldhana Police</font>",
                  CAPTION),
    ],
    height=120 * mm,
)
instr = [
    Paragraph("How to use", H3),
    Paragraph(
        "<b>1.</b> Open the app. If you have not set a URL yet, you'll see "
        "<b>Settings</b> automatically. Otherwise tap the <b>⚙ Settings</b> "
        "button at the bottom of the Login screen.", BODY),
    Paragraph(
        "<b>2.</b> Type the URL exactly as your in-charge gave it (it must "
        "begin with <b>https://</b> or <b>http://</b>).", BODY),
    Paragraph("<b>3.</b> Tap the green <b>Save</b> button.", BODY),
    Paragraph(
        "<b>4.</b> The app will respond with “✓ Saved”. Tap the back arrow "
        "(‹) at the top to return to Login.", BODY),
    Spacer(1, 6),
    Paragraph(
        "You will only do this once per phone. The URL stays saved even "
        "after restart.",
        TIP),
]
two_col = Table([[mock, instr]], colWidths=[82 * mm, 88 * mm])
two_col.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(two_col)
story.append(PageBreak())

# =============================================================================
# 5. Login page
# =============================================================================
story.append(Paragraph("5. Page 2 — Login screen", H1))
story.append(Paragraph(
    "Authentication is simple and uses only your <b>10-digit mobile number</b>. "
    "There is no password; the app verifies that your number exists in the "
    "staff master list managed by your in-charge officer.",
    BODY))

mock = phone_mockup(
    "Buldhana Police", "Staff App",
    [
        Spacer(1, 6),
        Paragraph("<b>Sign in</b>", H3),
        Paragraph(
            "<font size='9' color='#6B7280'>Enter the mobile number that "
            "your in-charge officer has on record.<br/><i>आपल्या नोंदीतील "
            "मोबाईल क्रमांक टाका.</i></font>", SMALL),
        Spacer(1, 6),
        labeled_input("Mobile / मोबाईल", "9999999999"),
        Spacer(1, 8),
        big_btn("Login / प्रवेश", GREEN),
        Spacer(1, 6),
        big_btn("⚙ Settings", GRAY_500),
        Spacer(1, 10),
        Paragraph("<font size='7' color='#9CA3AF'>© 2026 Buldhana District Police</font>", CAPTION),
    ],
    height=120 * mm,
)
instr = [
    Paragraph("How to log in", H3),
    Paragraph(
        "<b>1.</b> Tap inside the <b>Mobile / मोबाईल</b> field and type your "
        "10-digit number. Country code is not needed.", BODY),
    Paragraph("<b>2.</b> Tap the green <b>Login / प्रवेश</b> button.", BODY),
    Paragraph(
        "<b>3.</b> If the number is recognised, the app jumps to the "
        "<b>Alerts</b> page. If not, you'll see the message "
        "<i>“No staff found with this mobile number.”</i> — contact your "
        "in-charge to verify.", BODY),
    Spacer(1, 6),
    Paragraph(
        "<b>Why no password?</b> So that even staff who are not phone-savvy "
        "can sign in with one tap. Your data is still safe — only the admin "
        "can add or change which mobile numbers are valid.",
        NOTE),
]
two_col = Table([[mock, instr]], colWidths=[82 * mm, 88 * mm])
two_col.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(two_col)
story.append(PageBreak())

# =============================================================================
# 6. Alerts list
# =============================================================================
story.append(Paragraph("6. Page 3 — Alerts list", H1))
story.append(Paragraph(
    "This is the home screen of the app. Every active and past bandobast you "
    "have been allotted to appears here as a card, newest first.",
    BODY))

alerts_card = lambda name, date, isnew: Table(
    [[Paragraph(f"<b>{name}</b><br/><font size='8' color='#6B7280'>📅 {date}</font>"
                f"<br/><font size='7' color='#9CA3AF'>Sent: just now</font>", BODY),
      Paragraph("<font size='8' color='white'><b>NEW</b></font>" if isnew else "›", CENTER)]],
    colWidths=[55 * mm, 12 * mm])

alerts_card_style = TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
    ("BACKGROUND", (1, 0), (1, 0), SAFFRON if True else WHITE),
    ("BACKGROUND", (0, 0), (0, 0), WHITE),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
])

c1 = alerts_card("Republic Day Parade", "26 Jan 2026", True);  c1.setStyle(alerts_card_style)
c2 = alerts_card("Election Bandobast — Mehkar", "12 Mar 2026", False)
c2.setStyle(TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
    ("BACKGROUND", (0, 0), (-1, -1), WHITE),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
]))

mock = phone_mockup("Bandobast Alerts", "बंदोबस्त सूचना",
    [c1, Spacer(1, 6), c2, Spacer(1, 6),
     Paragraph("<font size='8' color='#6B7280'>Pull-to-refresh, or tap ↻ in the top bar.</font>", CAPTION)],
    height=110 * mm,
)

instr = [
    Paragraph("Reading an alert card", H3),
    Paragraph("Each card shows three pieces of information:", BODY),
    ListFlowable([
        ListItem(Paragraph("<b>Bandobast name</b> — the duty title.", BODY)),
        ListItem(Paragraph("<b>Date</b> — when the duty takes place.", BODY)),
        ListItem(Paragraph("<b>Sent</b> — when admin dispatched the alert.", BODY)),
    ], bulletType="bullet"),
    Paragraph(
        "A bright orange <b>NEW</b> pill on the right means you haven't opened "
        "this duty yet. Once you tap it, the pill disappears and your station "
        "in-charge sees a ✓ next to your name in their portal.", BODY),
    Spacer(1, 4),
    Paragraph("Refreshing", H3),
    Paragraph(
        "Tap the circular <b>↻</b> button in the orange top bar to pull the "
        "latest list. The app also refreshes automatically every 30 seconds "
        "while it is open.", BODY),
    Paragraph(
        "If you see <i>“No alerts yet”</i>, you have not been allotted to any "
        "bandobast yet, or the admin has not pressed <b>Send Alert</b>.",
        NOTE),
]
two_col = Table([[mock, instr]], colWidths=[82 * mm, 88 * mm])
two_col.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(two_col)
story.append(PageBreak())

# =============================================================================
# 7. Bandobast Detail
# =============================================================================
story.append(Paragraph("7. Page 4 — Bandobast Detail (your duty briefing)", H1))
story.append(Paragraph(
    "Tap any alert card to open this page. <b>This is the page you should "
    "show at the duty venue if asked.</b> It contains your full briefing in a "
    "single scroll.",
    BODY))

# Sections inside the screen
brief = card_block([
    ("Date",      "26 Jan 2026"),
    ("Spot",      "Buldhana Stadium"),
    ("In-charge", "PI A. Patil"),
    ("PS",        "PS Buldhana"),
])

point_card = Table([
    [Paragraph("<b>📍 My Point</b>", BODY)],
    [Paragraph("<b>Main Gate</b>  <font size='8' color='#6B7280'>· Sector A</font>", BODY)],
    [big_btn("🗺 Open Location in Google Maps", SAFFRON)],
    [card_block([
        ("My Equipment",   "Lathi"),
        ("Point Equipment","Lathi, Wireless"),
        ("Suchana / सूचना", "Report 30 min prior. Maintain crowd control."),
    ])],
], colWidths=[63 * mm])
point_card.setStyle(TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
    ("BACKGROUND", (0, 0), (-1, 0), WHITE),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))

qr_box = Table([
    [Paragraph("<b>Duty Pass QR</b>", CENTER)],
    [Paragraph("<font color='#9CA3AF'>[ QR image ]</font>", CENTER)],
    [Paragraph("<font size='7' color='#6B7280'>Show this at checkpoint</font>", CENTER)],
], colWidths=[63 * mm])
qr_box.setStyle(TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("BACKGROUND", (0, 1), (-1, 1), GRAY_100),
    ("MINROWHEIGHTS", (0, 1), (-1, 1), 18 * mm),
]))

id_card = Table([[
    Paragraph("<font color='white' size='8'><b>BULDHANA POLICE — ID CARD</b></font>", BODY),
]], colWidths=[63 * mm])
id_card2 = Table([[
    Paragraph("<font color='white'><b>RAJESH KAMBLE</b><br/>"
              "<font size='8'>HC · B12345</font><br/>"
              "<font size='8'>PS Buldhana · 📞 9876543210</font></font>", BODY),
]], colWidths=[63 * mm])
id_card.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SAFFRON),
                             ("LEFTPADDING", (0, 0), (-1, -1), 8),
                             ("TOPPADDING", (0, 0), (-1, -1), 4),
                             ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
id_card2.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SAFFRON_DARK),
                              ("LEFTPADDING", (0, 0), (-1, -1), 8),
                              ("TOPPADDING", (0, 0), (-1, -1), 8),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))

co_staff = Table([
    [Paragraph("<b>👥 With Me at this Point</b>", BODY)],
    [Paragraph("<b>S. Pawar</b>  <font size='8' color='#6B7280'>HC · B12378 · 9876500011</font><br/>"
               "<font size='7' color='#E68A2E'>🎒 Wireless</font>", BODY)],
    [Paragraph("<b>K. Jadhav</b>  <font size='8' color='#6B7280'>NPC · B12390 · 9876500012</font>", BODY)],
], colWidths=[63 * mm])
co_staff.setStyle(TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
    ("LINEBELOW", (0, 1), (-1, 1), 0.4, GRAY_100),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))

mock = phone_mockup("‹  Republic Day Parade", "26 Jan 2026 · Buldhana Stadium",
    [Paragraph("<b>Bandobast Briefing</b>", BODY), brief, Spacer(1, 6),
     point_card, Spacer(1, 6),
     qr_box],
    height=200 * mm,
)

instr = [
    Paragraph("What you'll see, top-to-bottom", H3),
    ListFlowable([
        ListItem(Paragraph(
            "<b>Briefing</b> — date, spot, in-charge officer, station.", BODY)),
        ListItem(Paragraph(
            "<b>📍 My Point</b> — name, sector, and an orange button "
            "<b>“Open Location in Google Maps”</b>. Tap once and your phone's "
            "default Maps app opens directly at the point's coordinates.", BODY)),
        ListItem(Paragraph(
            "<b>My Equipment</b> — the specific item assigned to you "
            "(e.g., Lathi). Carry only this on duty.", BODY)),
        ListItem(Paragraph(
            "<b>Suchana / सूचना</b> — special instructions written by your "
            "in-charge (e.g., reporting time, dress code).", BODY)),
        ListItem(Paragraph(
            "<b>Duty Pass QR</b> — a unique QR you show to the security "
            "checkpoint. Scanning it reveals all your duty info.", BODY)),
        ListItem(Paragraph(
            "<b>ID Card</b> — your digital police ID. Keep your photo "
            "up-to-date in Profile so this looks correct.", BODY)),
        ListItem(Paragraph(
            "<b>👥 With Me at this Point</b> — the other staff allotted to the "
            "<i>same</i> point. Their names, ranks, mobiles and equipment.", BODY)),
    ], bulletType="bullet"),
    Spacer(1, 4),
    Paragraph(
        "If you scroll and see ⚠️ <i>“You are not yet allotted to a point in "
        "this bandobast”</i>, the in-charge has alerted you but not yet placed "
        "you on a specific point. Wait for the next alert or contact them.",
        WARN),
]
two_col = Table([[mock, instr]], colWidths=[82 * mm, 88 * mm])
two_col.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(two_col)
story.append(PageBreak())

# =============================================================================
# 8. Profile
# =============================================================================
story.append(Paragraph("8. Page 5 — Profile (view & edit your info)", H1))
story.append(Paragraph(
    "Your personal details. Open it from the bottom navigation bar (👤 Profile). "
    "View your information, take/replace your photo, and edit any field except "
    "the mobile number.",
    BODY))

profile_view = Table([
    [Paragraph("<font color='#9CA3AF' size='28'>R</font>", CENTER)],
    [Paragraph("<b>Rajesh Kamble</b>", CENTER)],
    [pill("amaldar · HC", GRAY_100, GRAY_700)],
], colWidths=[63 * mm])
profile_view.setStyle(TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
    ("BACKGROUND", (0, 0), (0, 0), GRAY_100),
    ("MINROWHEIGHTS", (0, 0), (0, 0), 22 * mm),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))

field_card = card_block([
    ("Mobile",   "9876543210 <i>(locked)</i>"),
    ("Bakkal",   "12345"),
    ("Posting",  "PS Buldhana"),
    ("Gender",   "Male"),
    ("District", "Buldhana"),
    ("Category", "Open"),
])

mock = phone_mockup("My Profile", "माझी माहिती",
    [profile_view, Spacer(1, 6), field_card, Spacer(1, 6),
     big_btn("⚙ Backend Settings", GRAY_500),
     Spacer(1, 4),
     big_btn("Logout", RED),
    ],
    height=170 * mm,
)

instr = [
    Paragraph("Editing your info", H3),
    Paragraph("<b>1.</b> Tap <b>Edit</b> on the top-right of the orange bar.", BODY),
    Paragraph(
        "<b>2.</b> The fields become editable. Update name, rank, posting, "
        "gender, district or category as needed. Mobile is greyed-out — only "
        "your in-charge can change it.", BODY),
    Paragraph(
        "<b>3.</b> Tap the green camera button <b>📷 Capture Photo</b> to take "
        "a fresh selfie. Hold the phone at eye level, shoulders square, plain "
        "background.", BODY),
    Paragraph("<b>4.</b> Tap <b>Save</b>. Your data updates instantly on the admin's portal too.", BODY),
    Spacer(1, 4),
    Paragraph("Logging out", H3),
    Paragraph(
        "Tap <b>Logout</b> at the bottom. The app will forget your mobile "
        "number on this phone. To use it again, log in afresh.", BODY),
    Paragraph(
        "Logging out does <b>not</b> delete your data on the server. It only "
        "signs you out on this device.", TIP),
]
two_col = Table([[mock, instr]], colWidths=[82 * mm, 88 * mm])
two_col.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(two_col)
story.append(PageBreak())

# =============================================================================
# 9. Notifications
# =============================================================================
story.append(Paragraph("9. Notifications — how alerts reach you", H1))
story.append(Paragraph(
    "When admin presses <b>Send Alert</b> in the web portal, the server adds "
    "a record for every allotted staff member who has a valid mobile. The "
    "Staff app on your phone polls the server every <b>30 seconds</b> and, "
    "the moment it sees a new alert addressed to you, it shows a system "
    "notification:",
    BODY))

notif = Table([[
    Paragraph("<font color='#6B7280' size='8'>BULDHANA BANDOBAST STAFF · now</font><br/>"
              "<b>🚨 Bandobast Alert</b><br/>"
              "<font size='9'>Republic Day Parade on 26 Jan 2026. Tap to view your duty.</font>",
              BODY)
]], colWidths=[170 * mm])
notif.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), GRAY_50),
    ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(notif)
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Tapping the notification opens the app directly. The bell icon in the "
    "top-right of the alert card disappears the moment you read the briefing.",
    BODY))

story.append(Paragraph("Tips for reliable notifications", H3))
story.append(ListFlowable([
    ListItem(Paragraph(
        "Keep notifications <b>enabled</b> for the app (Phone Settings → Apps "
        "→ Buldhana Bandobast Staff → Notifications).", BODY)),
    ListItem(Paragraph(
        "Open the app <b>at least once a day</b>. The polling only works "
        "while the app is open or recently used. (A future version with "
        "Firebase Push will deliver alerts even when the app is closed.)", BODY)),
    ListItem(Paragraph(
        "Disable battery saver / “deep sleep” for this app to ensure the "
        "30-second polling is not throttled.", BODY)),
], bulletType="bullet"))

story.append(Paragraph(
    "<b>Privacy note:</b> The app never reads your SMS, contacts or location. "
    "It only contacts your station's admin server using the URL you saved.",
    TIP))
story.append(PageBreak())

# =============================================================================
# 10. Admin's role
# =============================================================================
story.append(Paragraph("10. Admin's role — sending an alert", H1))
story.append(Paragraph(
    "This section is for the duty in-charge using the <b>web admin portal</b>. "
    "It explains exactly how an alert flows to staff phones.",
    BODY))

steps = [
    ("1", "Create the bandobast", "Use the 5-step wizard: Create → Points → "
                                  "Select Staff → Allot → Deploy."),
    ("2", "Confirm Deploy",        "After deploying, you arrive on the "
                                   "Bandobast Detail page. The status pill "
                                   "turns green: <b>DEPLOYED</b>."),
    ("3", "Open the Alert section","Scroll to the <b>“Bandobast Alert / "
                                   "बंदोबस्त सूचना”</b> card."),
    ("4", "Press Send Alert",      "An orange button labelled "
                                   "<b>“Send Alert”</b> (or “Re-send Alert” "
                                   "if you've already sent once)."),
    ("5", "Confirm",               "A confirmation dialog asks if you really "
                                   "want to alert all allotted staff with a "
                                   "valid mobile number. Tap OK."),
    ("6", "Watch the counter",     "Below the button you'll see "
                                   "<b>“Last sent: …”</b> and a counter like "
                                   "<b>“X / Y seen”</b>. Y = number of "
                                   "phones that received the alert. X grows "
                                   "as each staff member opens the briefing "
                                   "in their app."),
]
for n, t, d in steps:
    row = Table([[
        Paragraph(f"<font color='{SAFFRON.hexval()}' size='16'><b>{n}</b></font>", BODY),
        Paragraph(f"<b>{t}</b><br/>{d}", BODY)]],
        colWidths=[10 * mm, 160 * mm])
    row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story.append(row)

story.append(Paragraph(
    "<b>Pro tip:</b> Send a test alert to yourself (set your own mobile in a "
    "test staff entry) before a major event so you can verify the end-to-end "
    "delivery on a real phone.",
    TIP))
story.append(PageBreak())

# =============================================================================
# 11. Troubleshooting
# =============================================================================
story.append(Paragraph("11. Troubleshooting / FAQ", H1))

faq = [
    ("I get the message “Backend URL not configured” at login.",
     "Open <b>Settings</b>, paste the URL your in-charge gave you, tap Save, then return."),
    ("Login says “No staff found with this mobile number.”",
     "Your number is not in the staff master list, OR it is saved with extra digits "
     "(country code, leading zero). Ask your in-charge to verify."),
    ("I receive no notification when admin sends an alert.",
     "Open the app once. Inside, pull the alerts list to refresh. If the alert is "
     "there, the issue was the system notification permission — turn it on in phone Settings."),
    ("My photo capture button does nothing.",
     "Camera permission was denied. Phone Settings → Apps → Buldhana Bandobast Staff "
     "→ Permissions → Camera → Allow."),
    ("I cannot edit my mobile number.",
     "By design. Mobile is the unique key used to authenticate you. Only the admin can change it."),
    ("Map opens but shows the wrong place.",
     "Coordinates were not entered for the point, or are outside India. Inform your in-charge."),
    ("App crashes on startup after install.",
     "Uninstall, reboot the phone, install again. If it still crashes, the APK may be "
     "corrupted in transit — re-download a fresh copy."),
    ("Different staff use the same phone (shared family device).",
     "Use <b>Logout</b> after each shift, then have the next person log in with their own number."),
    ("How is my data kept safe?",
     "Communication is over HTTPS to your station's admin server only. The app never "
     "uploads your photos or messages anywhere else."),
    ("I changed my mobile recently. What should I do?",
     "Tell your in-charge officer to update your record in the staff master list. "
     "Then log out of the app and log in with the new number."),
]
faq_rows = []
for q, a in faq:
    faq_rows.append([
        Paragraph(f"<b>Q. {q}</b>", BODY),
        Paragraph(a, BODY),
    ])
t = Table(faq_rows, colWidths=[70 * mm, 100 * mm])
t.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BACKGROUND", (0, 0), (0, -1), GRAY_50),
    ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
    ("INNERGRID", (0, 0), (-1, -1), 0.3, GRAY_200),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(t)
story.append(PageBreak())

# =============================================================================
# 12. Glossary
# =============================================================================
story.append(Paragraph("12. Glossary (English ⇄ मराठी)", H1))
glossary = [
    ("Bandobast",        "बंदोबस्त",            "A specific police deployment for an event."),
    ("Officer",          "अधिकारी",            "ASP, Dy.SP, PI, API, PSI."),
    ("Police Staff (Amaldar)", "पोलीस अंमलदार", "ASI, HC, NPC, PC, LPC."),
    ("Home Guard",       "होमगार्ड",           "Volunteer police force."),
    ("Bakkal No.",       "बक्कल क्र.",          "Personal service number."),
    ("Posting",          "पोस्टिंग",            "Current police station / branch."),
    ("In-charge",        "प्रभारी",             "Senior officer in charge of this duty."),
    ("Point",            "पॉइंट",             "A specific spot at the venue."),
    ("Suchana",          "सूचना",              "Special instructions for the duty."),
    ("Goshwara",         "गोषवारा",            "Roster — full breakdown by point and by staff."),
    ("Duty Pass",        "ड्युटी पास",          "Printable / digital pass with QR for the duty."),
    ("ID Card",          "ओळखपत्र",            "Police identity card."),
    ("Reserved",         "राखीव",              "Backup point holding extra staff."),
    ("Out-of-District",  "जिल्ह्याबाहेरील",     "Staff assigned from a different district."),
    ("Sector",           "सेक्टर",              "Sub-zone of a venue."),
    ("Equipment",        "साहित्य",             "Lathi / Wireless / Shield / etc."),
]
g = Table(glossary, colWidths=[45 * mm, 35 * mm, 90 * mm])
g.setStyle(TableStyle([
    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 10),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BACKGROUND", (0, 0), (-1, 0), SAFFRON),
    ("INNERGRID", (0, 0), (-1, -1), 0.3, GRAY_200),
    ("BOX", (0, 0), (-1, -1), 0.5, GRAY_200),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(g)

story.append(Spacer(1, 14))
story.append(hr())
story.append(Spacer(1, 4))
story.append(Paragraph(
    "<para alignment='center'><font color='#9CA3AF' size='8'>"
    "End of manual · v1.0 · Buldhana District Police · Digital Police Bandobast"
    "</font></para>",
    SMALL))

# =============================================================================
# Build
# =============================================================================
doc.build(story)
print(f"OK -> {OUT}")
