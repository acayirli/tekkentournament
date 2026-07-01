# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tekken 8 Tournament Tracker — a React + Express app for managing local fighting game tournaments. Players pick Tekken 8 characters, and the app generates a full match matrix (cartesian product of player×character combinations), tracks wins/losses, and aggregates crowns across tournaments and seasons.

## Commands

- `npm start` — runs both frontend (Vite dev server) and backend (Express on :3001) concurrently
- `npm run dev` — frontend only (Vite)
- `npm run server` — backend only (Express, `tsx server.ts`)
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — ESLint

No test framework is configured.

**Environment limitation:** The Vite dev server (`npm run dev` / `npm start`) and `npm run build` do not work in this environment — the native binding `@rolldown/binding-linux-x64-gnu` is missing. Use `npx tsc --noEmit` for type-checking and `npm run lint` for linting. Do not attempt to start the dev server or build.

## Architecture

**Frontend:** React 19, TypeScript, Vite. No router — tab-based navigation via Zustand `activeView` state (`"setup" | "matches" | "seasons"`).

**Backend:** Express server (`server.ts`) with two endpoints: `GET /api/data` and `POST /api/data`. Reads/writes entire app state to `data.json`. Vite proxies `/api/*` to `:3001`.

**State:** Single Zustand store (`src/store/useTournamentStore.ts`) holds all app state. Persisted to localStorage (`tekken-tournament-store`) and auto-synced to backend via debounced POST (1000ms) on every state change.

**Data model hierarchy:** Season → Tournament → Players/Matches. Matches are generated as all character-pair combinations between players. Crowns are awarded by rank within a tournament and aggregate up through seasons to all-time.

## Key Conventions

- UI labels are in German (Aufstellung, Kämpfe, Turnier, etc.) — not through an i18n system, just hardcoded strings.
- Styling is pure CSS in `src/App.css` with a dark theme. Button classes: `.tekken-btn`, `.tekken-btn.gold`, `.tekken-btn.secondary`, `.tekken-btn.small`.
- No auth — the app is fully open.
- Character data (39 characters) lives in `src/data/characters.ts` with image lookup via `CHARACTER_MAP`.
- `src/utils/sync.ts` handles backend communication with silent failure (localStorage is the primary persistence).
