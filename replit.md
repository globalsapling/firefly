# Project Firefly

## Overview
Project Firefly is a static HTML website for an open-source initiative building a community-selected advanced small reactor. The specific reactor design is being chosen through the 2026 Founding Series of the Firefly Reading Circle. The site presents the project mission, the Reading Circle (/circle), and volunteer/partnership opportunities.

## Project Structure
- `index.html` - Main landing page with all content sections
- `styles.css` - Styling with responsive design and modern UI elements
- `README.md` - Project documentation

## Technology Stack
- Pure HTML5 and CSS3
- No build system or dependencies required
- Static site served via Python HTTP server
- Typography: IBM Plex Sans (body) + IBM Plex Mono (labels/metadata) via Google Fonts

## Design System
- Technical/academic research-document aesthetic (not marketing).
- Near-monochrome palette: paper white, ink black, muted grays; single restrained accent (muted rust `--accent`).
- Type-driven hierarchy with numbered sections, abstract-style intro, monospace metadata labels.
- Squared-off layout: hairline rules and dividers instead of cards. No rounded corners, drop shadows, hover-lift, pill buttons, or gradients.
- Two-column grid per section (label column + reading column) collapsing to single column on mobile.
- CTAs are bordered rectangles with inverted hover; resource/partner/volunteer lists are indexed (R.01, P.01, V.01).

## Recent Changes
- 2026-06-09: Full 2026 redesign — replaced blue/rounded-card/shadow look with restrained technical-academic typographic system.
- 2025-10-25: Initial setup in Replit environment with Python HTTP server on port 5000

## Development
The site is served using Python's built-in HTTP server for simplicity. The server runs on port 5000 and serves static files from the root directory.
