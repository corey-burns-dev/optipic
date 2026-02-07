# Image Mage

Image Mage is a web app for batch image conversion and compression with practical presets, format controls, and downloadable exports.

## Features

- Drag-and-drop multi-file upload
- Convert between JPEG, PNG, WebP, AVIF, TIFF, and GIF
- Quality presets (`tiny`, `small`, `balanced`, `crisp`) plus custom quality
- Optional target-size mode (KB) with iterative quality tuning
- Resize controls (`inside`, `cover`, `contain`)
- Metadata toggle, flatten/background options, lossless/progressive options
- ZIP export for multi-file jobs
- Size estimation endpoint before conversion

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Sharp
- OpenNext + Cloudflare Workers

## Getting Started

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
bun run dev
bun run build
bun run build:workers
bun run deploy
bun run typecheck
bun run lint
bun run biome
```
