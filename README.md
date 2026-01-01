# Deal or No Deal Game

A simple web-based Deal or No Deal game built with Vite.

## Features

- **Host Setup**: Set values for 10 boxes at the start of the game
- **Contestant Selection**: Contestant picks their box
- **Box Revelation**: Host can reveal values of unpicked boxes

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The game will open in your browser at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How to Play

1. **Setup Phase**: As the host, enter values for all 10 boxes
2. **Start Game**: Click "Start Game" to begin
3. **Contestant Pick**: The contestant picks their box (1-10)
4. **Reveal Boxes**: The host can click on any unpicked box to reveal its value
5. **Reset**: Click "Reset Game" to start over

## Game Rules

- Each box has a unique value set by the host
- The contestant picks one box to keep
- The host reveals other boxes one by one
- The contestant's box value is revealed at the end (if you implement that feature)

