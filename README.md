# Wizard's Chess

A browser-based, voice-controlled chess game inspired by the idea of Wizard's Chess. It runs locally as a static web app: no backend, account, or build step is required.

## Features
- Full 8x8 chess board with legal move validation.
- Check, checkmate and stalemate detection.
- Castling, en-passant and queen promotion.
- Human-vs-human and human-vs-computer modes.
- Three lightweight AI difficulty levels.
- Move history and undo.
- Voice commands such as "e2 e4" and "knight to f3" using the browser Web Speech API.
- Responsive desktop/mobile layout.
- No external runtime dependencies.
- GitHub Actions smoke CI for syntax and static serving.

## Run
Open index.html in a modern browser, or serve the directory with:
python3 -m http.server 8080
Then visit http://localhost:8080.

For voice input, use a browser that exposes SpeechRecognition/Web Speech API and grant microphone permission.

## Architecture
- index.html — UI shell.
- styles.css — responsive wizard-themed presentation.
- app.js — board state, legal chess rules, AI search and speech command parsing.
- .github/workflows/ci.yml — CI smoke checks.

The engine keeps all state in memory, so refreshing the page starts a new game.

## Notes
The AI is a lightweight educational minimax engine rather than a tournament-strength engine. Voice recognition quality depends on the browser and microphone. A future hardware/magnetic-board adapter can consume the same from/to board coordinates without changing chess rules or UI behavior.
