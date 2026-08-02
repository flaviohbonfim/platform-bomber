# Bomb Platform / platform-bomber

Sidescroller de plataforma inspirado no universo visual e mecânico de Bomberman.

**Repo:** https://github.com/flaviohbonfim/platform-bomber

## Stack

- Phaser 3
- TypeScript
- Vite
- Pixel art moderno (sprites PNG profissionais + fallbacks procedurais)

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra o endereço do Vite (geralmente `http://localhost:5173`).

## Controles

| Ação | Teclas |
|------|--------|
| Mover | ← → / A D |
| Pular | Z / Space / ↑ |
| Plantar bomba | X / J **tap** curto |
| Arremessar (Power Glove) | **Segurar** X / J e **soltar** |
| Drop-through (one-way) | ↓ + pular |

## Status

**PR7 — Boss + juice + áudio** ✓

- **King Bomb** — 3 fases (plant → throw+adds → slam rage)
- Arena `w1-boss` após 1-3
- HP bar, telegraphs, +5000 score
- Áudio procedural (jump, plant, throw, boom, hurt, BGM)
- Partículas na explosão + screen shake

**PR6 — Mundo 1 (3 fases)** ✓  
**PR5 — Inimigos + power-ups** ✓  
**PR4 — Vidas, checkpoints, HUD** ✓  
**PR3 — Power Glove** ✓  
**PR2 — Bombas** ✓  
**PR1 — Platformer feel** ✓

Fluxo completo: `1-1 → 1-2 → 1-3 → Boss → Victory`
