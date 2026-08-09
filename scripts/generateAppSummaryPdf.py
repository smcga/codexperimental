from __future__ import annotations

from pathlib import Path

PAGE_WIDTH = 612
PAGE_HEIGHT = 792
LEFT = 54
TOP = 756
LEADING = 15
FONT_SIZE = 10
TITLE_SIZE = 18
HEADING_SIZE = 12


def esc(text: str) -> str:
    return text.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')


def heading(text: str) -> list[str]:
    return [f"/F2 {HEADING_SIZE} Tf", f"({esc(text)}) Tj"]


def body(text: str) -> list[str]:
    return [f"/F1 {FONT_SIZE} Tf", f"({esc(text)}) Tj"]


lines: list[list[str]] = []

lines.append([f"/F2 {TITLE_SIZE} Tf", "(Demoscene AI 2022 Demo - One-Page Summary) Tj"])
lines.append(body("Generated from repository evidence on 2026-04-08."))
lines.append([])

lines.append(heading("What it is"))
lines.append(body("A single-page, music-synced demoscene web app built with Vite + TypeScript, Canvas 2D, and Web Audio API."))
lines.append(body("It plays a curated timeline of visual effects, transitions, and text cues over a soundtrack."))
lines.append([])

lines.append(heading("Who it is for"))
lines.append(body("Primary persona: a demo creator/editor who wants to author or tweak audio-timed effect sections for a browser-based show."))
lines.append([])

lines.append(heading("What it does"))
for bullet in [
    "Runs a full-screen intro + section timeline with per-section effects, transitions, layering, and text cues.",
    "Synchronizes visuals to audio features (RMS/bass/mid/treble/beat) and supports manual beat injection via canvas taps.",
    "Supports many built-in effects plus WebGL2 effects with automatic Canvas2D fallback when WebGL2 is unavailable.",
    "Provides debug/editor controls, quality presets, framing modes, and URL-based rendering/performance tuning.",
    "Tracks live view counts using /api/views with GET/POST handling and KV-backed persistence when configured.",
    "Includes community workflows for submitting doodles and AI-generated effect ideas with moderation/review endpoints.",
]:
    lines.append(body(f"- {bullet}"))
lines.append([])

lines.append(heading("How it works (repo-evidenced architecture)"))
for bullet in [
    "Frontend app: src/main.ts wires canvas/UI, loads timeline config, initializes AudioPlayer, Timeline, and Renderer.",
    "Config layer: src/config/loadConfig.ts validates/normalizes raw JSON (audio, intro, sections, layers, transitions, cues).",
    "Playback core: src/timeline/timeline.ts computes intro/section mode, active transition windows, and active text cues by time.",
    "Audio analysis: src/audio/audioPlayer.ts uses Web Audio analyser data to emit beat + band energy features each frame.",
    "Rendering: src/renderer/renderer.ts and effect registry modules render the selected effect stack and transition blending.",
    "Service endpoints: api/views.ts, api/doodles.ts, api/effects.ts expose JSON APIs; they use createKvClients() for persistence.",
    "Data flow: timeline.release.json + song.mp3 -> load/normalize -> frame loop reads audio+time -> timeline state -> renderer output.",
]:
    lines.append(body(f"- {bullet}"))
lines.append([])

lines.append(heading("How to run (minimal)"))
for bullet in [
    "1) Install Node.js 18+.",
    "2) Run: npm install",
    "3) Run: npm run dev",
    "4) Open the local Vite URL and press Start.",
    "5) Optional: replace public/song.mp3 and edit public/timeline.release.json for custom timing/effects.",
]:
    lines.append(body(bullet))

ops: list[str] = ["BT", f"1 0 0 1 {LEFT} {TOP} Tm"]
for i, row in enumerate(lines):
    if i > 0:
        ops.append(f"0 -{LEADING} Td")
    if not row:
        continue
    ops.extend(row)
ops.append("ET")

content = "\n".join(ops).encode("latin-1", "replace")

objects: list[bytes] = []
objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
objects.append(b"<< /Type /Pages /Count 1 /Kids [3 0 R] >>")
objects.append(
    f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>".encode()
)
objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
objects.append(f"<< /Length {len(content)} >>\nstream\n".encode() + content + b"\nendstream")

pdf = bytearray(b"%PDF-1.4\n")
offsets = [0]
for idx, obj in enumerate(objects, start=1):
    offsets.append(len(pdf))
    pdf.extend(f"{idx} 0 obj\n".encode())
    pdf.extend(obj)
    pdf.extend(b"\nendobj\n")

xref_start = len(pdf)
pdf.extend(f"xref\n0 {len(objects)+1}\n".encode())
pdf.extend(b"0000000000 65535 f \n")
for off in offsets[1:]:
    pdf.extend(f"{off:010d} 00000 n \n".encode())
pdf.extend(
    f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode()
)

out = Path("docs/app-summary.pdf")
out.write_bytes(pdf)
print(out)
