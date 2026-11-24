# Visual style (v2, started 2026-11-24)

**Mood:** cozy, calm, bedtime. Soft light on a lifted black. Warm amber as the only accent.

## Colours
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b0d12` | page (dark, bedtime) |
| `--panel` | `#12151d` | flat cards that are not tappable |
| `--bubble` | `#2b2520` | speech bubbles, question box (warm brown-black) |
| `--btn1/--btn2` | `#1c202a` / `#141720` | button gradient |
| `--btnline` | `#323850` | button rim |
| `--fg` | `#c9bfad` | brightest colour: light, slightly brownish grey |
| `--dim` | `#8d887e` | secondary text |
| `--amber` | `#d29a3e` | accent: titles, primary buttons, markers |
Pictures: no pure white (`canvas` gets a slight sepia + brightness 0.95; sprite whites are `#cbc1af`, eye whites `#ebe4d4`). Sprites have a transparent background, so cut-outs show the card colour.

## Components
- **Speech bubble (`.line`)**: flat, warm, rounded, small tail pointing to the speaker, no border. Narration (`.say`) is italic and dim, no box.
- **Button (`.btn`, `button.pcard`, `.chipw`, dock)**: gradient + light rim + 3 px floor shadow; pressed = moves down 2 px. Green = right, red = wrong, amber = primary action.
- **Flat card (`div.pcard`, `.ycard`)**: panel colour, thin line, no shadow – information only.
Rule of thumb: if you can tap it, it looks raised; if not, it is flat.

## To do
Real illustrations for yokai and scenes (docs/SCENES.md), font pairing for the UI, small animations (button press, bubble pop-in), sound-free feedback (screen shake, glow).
