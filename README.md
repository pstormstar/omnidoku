# Omnidoku

Omnidoku is a powerful, professional-grade Sudoku design and play engine. Built for power-users and grid designers, it supports an extensive range of variants, multi-grid layouts (Multisudoku), and advanced logic constraints.

![Omnidoku Logo](app/favicon.ico)

## 🌟 Key Features

### 🧩 Grid Meta-Variants
- **Multisudoku Engine**: Overlap multiple 9x9 grids to create complex interlocking puzzles.
- **Windoku**: Adds four independent 3x3 regions to any grid.
- **Diagonal (Sudoku X)**: Full-length diagonal constraints.
- **Asterisk & Center Dots**: Specialized 9-cell regions for advanced solving logic.

### 📐 Logical Constraints & Clues
- **Edge Clues**: Adjacent cell sum constraints (X for 10, V for 5), Kropki dots (Consecutive White, 1:2 Ratio Black), and Inequalities (> and <).
- **Corner Clues**: Quadruple clues for vertex-shared intersections.
- **Outside Clues**: Sandwich clues (sum of digits between 1 and 9).
- **Global Rules**: Anti-Knight, Anti-King, and Non-Consecutive constraints.
- **Negative Constraints**: Support for "All XV Given" and "All Kropki Given" logic.

### 🎨 Design & Experience
- **Glassmorphic UI**: High-fidelity, modern interface with dark mode support.
- **Pan & Zoom Board**: Infinite-feel board space for multi-grid designs.
- **Marker mode**: Place permanent marker digits for puzzle creation.
- **AI Art Generation**: Create thematic backgrounds for your puzzles using Google Generative AI integration.

### 🔬 Validation & Solving
- **Z3 Solver Integration**: Real-time uniqueness checking using the Z3 SMT solver.
- **Constraint Validator**: automated rule checking for all supported variants.

---

## 🚀 Getting Started

Omnidoku is built with **Next.js** for the frontend and **Python** for the backend solving and validation logic.

### Prerequisites

1.  **Node.js**: v18.x or later.
2.  **Python**: 3.8 or later.
3.  **A Screen**: Designed for desktop usage.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/pstormstar/omnidoku.git
    cd omnidoku
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```

3.  **Install Python Dependencies**:
    It is recommended to use a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/click/activate  # On Windows: .\venv\Scripts\activate
    pip install -r requirements.txt
    ```

### Running Locally

1.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Project Structure

- `app/`: Next.js App Router source code.
- `app/api/`: Serverless routes spawning Python processes for Z3 logic.
- `scripts/`: Python logic for rule validation, uniqueness checks, and AI art.
- `sample_puzzles/`: JSON definitions for various Sudoku variants.
- `premade_puzzles/`: Library of curated puzzles.

## 🔑 AI Art Integration

To use the AI art generation feature, you need to provide a Google Generative AI API key.
1. Create a `.env.local` file in the root directory.
2. Add your key:
   ```text
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   ```

---

## 📄 License

This project is for personal use and portfolio display. All rights reserved.
