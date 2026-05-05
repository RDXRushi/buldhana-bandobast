"""
Generate Android launcher icons + pager.wav for the Buldhana Police Staff App.

Source logo: /app/staff-app/src/assets/maharashtra-police-logo.png
"""
import os
import math
import struct
import wave
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path("/app/staff-app/android/app/src/main/res")
LOGO = Image.open("/app/staff-app/src/assets/maharashtra-police-logo.png").convert("RGBA")

# Pad logo to square + add a tiny halo so it scales cleanly.
def square_logo(size):
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    # Background: subtle radial-style police-blue ring
    draw = ImageDraw.Draw(canvas)
    margin = int(size * 0.04)
    draw.ellipse(
        (margin, margin, size - margin, size - margin),
        fill=(255, 255, 255, 255),
        outline=(46, 49, 146, 255),
        width=max(2, int(size * 0.025)),
    )
    # Logo box
    inset = int(size * 0.14)
    box = (inset, inset, size - inset, size - inset)
    box_w, box_h = box[2] - box[0], box[3] - box[1]
    # Fit logo while preserving aspect
    lw, lh = LOGO.size
    scale = min(box_w / lw, box_h / lh)
    nw, nh = int(lw * scale), int(lh * scale)
    logo = LOGO.resize((nw, nh), Image.LANCZOS)
    px = box[0] + (box_w - nw) // 2
    py = box[1] + (box_h - nh) // 2
    canvas.paste(logo, (px, py), logo)
    return canvas

def round_logo(size):
    """Same as square_logo but with circular alpha mask for ic_launcher_round."""
    base = square_logo(size)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((0, 0, size, size), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    return out

# Standard Android launcher icon sizes
SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

# Adaptive icon foreground (108dp viewport, but only inner 72dp visible).
# Foreground sizes: 162 / 216 / 324 / 432 / 648 (1.5x of base mipmap).
FG_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

def fg_logo(size):
    """Foreground for adaptive icons: transparent canvas, logo in centre 60%."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inset = int(size * 0.20)
    box = (inset, inset, size - inset, size - inset)
    box_w, box_h = box[2] - box[0], box[3] - box[1]
    lw, lh = LOGO.size
    scale = min(box_w / lw, box_h / lh)
    nw, nh = int(lw * scale), int(lh * scale)
    logo = LOGO.resize((nw, nh), Image.LANCZOS)
    px = box[0] + (box_w - nw) // 2
    py = box[1] + (box_h - nh) // 2
    canvas.paste(logo, (px, py), logo)
    return canvas

# 1) Standard launcher icons
for folder, size in SIZES.items():
    out_dir = ROOT / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    square_logo(size).save(out_dir / "ic_launcher.png", "PNG")
    round_logo(size).save(out_dir / "ic_launcher_round.png", "PNG")
    fg_logo(FG_SIZES[folder]).save(out_dir / "ic_launcher_foreground.png", "PNG")
    print(f"  {folder}: ic_launcher {size}, fg {FG_SIZES[folder]}")

# 2) Adaptive icon background colour (saffron theme)
values_dir = ROOT / "values"
values_dir.mkdir(parents=True, exist_ok=True)
ic_launcher_bg = values_dir / "ic_launcher_background.xml"
ic_launcher_bg.write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources>\n'
    '    <color name="ic_launcher_background">#FFFFFF</color>\n'
    '</resources>\n'
)

# 3) Adaptive icon XML descriptors (anydpi-v26)
adaptive_dir = ROOT / "mipmap-anydpi-v26"
adaptive_dir.mkdir(parents=True, exist_ok=True)
for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
    (adaptive_dir / name).write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        '</adaptive-icon>\n'
    )
print("Adaptive icon XML written.")

# 4) Pager alert tone — 5-second WAV in res/raw/
raw_dir = ROOT / "raw"
raw_dir.mkdir(parents=True, exist_ok=True)
pager_path = raw_dir / "pager.wav"

def build_pager_wav(path, duration=5.0, sr=22050):
    n_total = int(sr * duration)
    beep_len = 0.25
    gap = 0.08
    cycle = beep_len + gap
    samples = []
    for i in range(n_total):
        t = i / sr
        cycle_idx = int(t // cycle)
        phase_in_cycle = t - cycle_idx * cycle
        if phase_in_cycle <= beep_len:
            freq = 1000.0 if (cycle_idx % 2 == 0) else 1400.0
            # Square-ish wave (triangle of square via sign of sin)
            v = 1.0 if math.sin(2 * math.pi * freq * t) >= 0 else -1.0
            # envelope: small ramp at start/end of each beep to avoid clicks
            env_in = min(phase_in_cycle / 0.01, 1.0)
            env_out = min((beep_len - phase_in_cycle) / 0.02, 1.0)
            env = max(0.0, min(env_in, env_out))
            v *= 0.55 * env
        else:
            v = 0.0
        samples.append(int(max(-1.0, min(1.0, v)) * 32767))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(b"".join(struct.pack("<h", s) for s in samples))

build_pager_wav(pager_path, duration=5.0)
print(f"Wrote pager.wav: {pager_path.stat().st_size} bytes")

# 5) Update strings.xml app_name
strings_xml = values_dir / "strings.xml"
if strings_xml.exists():
    txt = strings_xml.read_text()
    import re
    txt2 = re.sub(
        r'<string name="app_name">[^<]*</string>',
        '<string name="app_name">Buldhana Police Staff App</string>',
        txt,
    )
    txt2 = re.sub(
        r'<string name="title_activity_main">[^<]*</string>',
        '<string name="title_activity_main">Buldhana Police Staff App</string>',
        txt2,
    )
    strings_xml.write_text(txt2)
    print("strings.xml app_name updated.")
else:
    print("WARN: strings.xml missing; create at", strings_xml)
