# TIC-TAC-TOE PRO | Futuristic Edition

A premium, modern, futuristic Tic-Tac-Toe Web Application with Dark Glassmorphism, Cyberpunk Theme, and Neon Glow. Built using HTML, CSS, and Vanilla JavaScript, satisfying Prodigy InfoTech Task-03 requirements.

## Features

- **Dark Glassmorphism UI**: Beautiful cyberpunk aesthetic with neon glowing effects.
- **Game Logic**: Alternates turns between Player X and Player O, detects wins, draws, and prevents overwriting occupied cells.
- **Interactive Animations**: Cell hover glow, smooth click animations, winning combination pulse, and confetti celebration on victory.
- **Scoreboard**: Tracks Player X wins, Player O wins, and Draws. Persistent across page reloads using `LocalStorage`.
- **Audio Experience**: Integrated Web Audio API for interactive synthesized sound effects (button clicks, moves, win/draw tones) with a mute toggle.
- **Responsive Layout**: Designed to work seamlessly on Desktop, Tablet, and Mobile devices.
- **Extra Utilities**: 
  - Dark / Light Mode Toggle
  - Real-time clock display
  - Fullscreen toggle for an immersive experience
  - Reset Score Confirmation Dialog

## Technologies Used

- **HTML5**: Semantic and accessible structure.
- **CSS3**: Variables, Flexbox, Grid, Animations, Backdrop-filters.
- **Vanilla JavaScript**: DOM Manipulation, AudioContext, LocalStorage, modular game logic.
- **canvas-confetti**: A lightweight CDN library for the premium confetti victory effect.

## How to Play

1. Open `index.html` in your web browser.
2. Player X always starts first.
3. Click any empty square on the 3x3 grid to make your move.
4. The first player to align 3 of their symbols (horizontally, vertically, or diagonally) wins.
5. If all 9 squares are filled and no player has won, the game is a draw.
6. The score is automatically tracked.
7. Use the "New Game" or "Restart" buttons to play again.
8. Use "Reset Scores" if you wish to clear the scoreboard history.

## Setup Instructions

Simply clone or download this repository and double-click `index.html` to run it in your browser. No server setup or build process is required!

```bash
# Clone the repository
git clone <your-repo-link>

# Navigate into the folder
cd PRODIGY_WD_03

# Open index.html in your default browser
```

## Accessibility

- Appropriate `aria-labels` and semantic elements used for screen readers.
- High contrast neon colors.
- SVG icons with proper titles.
- Focus states and keyboard interactions can be seamlessly integrated.
