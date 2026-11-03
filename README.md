# MediRoute AI — Medical Supply Route Optimizer

**MediRoute AI** is a healthcare logistics web application that uses **Dijkstra’s Algorithm** to calculate and visualize the shortest possible road routes from a central medical warehouse to multiple hospitals in a weighted graph network.

---

## Key Features

1. **Pure TypeScript Dijkstra Engine:**
   - Custom implementation with Min-Priority Queue and deterministic tie-breaking.
   - Non-negative edge weight enforcement.
   - Full handling of edge cases (cycles, disconnected destinations, identical source/destination, single-node graphs).

2. **Benchmark Verification on Sample Network:**
   - Warehouse (W) &rarr; City Hospital (H1): **10 km** (`W → B → A → C → H1`)
   - Warehouse (W) &rarr; General Hospital (H2): **13 km** (`W → B → A → C → H1 → H2`)
   - Warehouse (W) &rarr; Emergency Hospital (H3): **14 km** (`W → B → A → C → H1 → H3`)
   - Warehouse (W) &rarr; Children's Hospital (H4): **15 km** (`W → B → A → C → H1 → H2 → H4`)

3. **Interactive Graph Canvas:**
   - SVG canvas with pan, zoom, fit-to-view, and drag-and-drop node positioning.
   - Clickable nodes and road distance badges to inspect, edit distances, or delete.
   - Shortest path glowing green highlight with animated dashed flow.
   - Real-time ambulance / medical delivery vehicle dispatch simulation.

4. **Step-by-Step Algorithm Inspector ("How Dijkstra Works"):**
   - Play, pause, step forward/backward, and adjust animation speed (0.5x, 1x, 2x, 4x).
   - Live inspection of tentative distances, edge relaxations ($dist[u] + w(u, v) < dist[v]$), and min-priority queue heap state.

5. **Route Comparison & Resilience:**
   - Compares the shortest path against available alternative simple paths.
   - Displays distance differences ($+\text{km}$ and $\%$) and road counts.

6. **Geographic Map (Leaflet / OpenStreetMap):**
   - Toggle to live OpenStreetMap GIS view with facility pins and road polylines.

7. **Graph Customization & Persistence:**
   - Add hospitals, clinics, junctions, and one-way or two-way roads with distance validation.
   - LocalStorage auto-save with schema validation and reset to demo network.
   - Export network to JSON and import custom network JSON files.

8. **Automated Test Suite:**
   - Built-in 15-test automated suite verifying all required graph scenarios and mathematical integrity.

---

## Tech Stack

- **React 19 & TypeScript**
- **Tailwind CSS v4**
- **Lucide React**
- **Leaflet & OpenStreetMap**
- **Vite**

---

## Local Development & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Run Typecheck & Linting:**
   ```bash
   npm run lint
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```
