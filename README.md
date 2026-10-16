# SmartJunction — Intelligent 4-Way Traffic Operations Simulator
> **Indian Urban Mobility • Left-Hand Drive • Queue-Actuated Adaptive Signals • 100% Client-Side**

---

## 🌟 Executive Summary

**SmartJunction** is an interactive, browser-only simulation of a complex four-way signalized intersection built specifically around real Indian traffic conditions (Left-Hand Driving, mixed traffic including auto-rickshaws, bikes, buses, and cars). 

It demonstrates the fundamental limitation of traditional fixed-time traffic signals and showcases the power of **Intelligent Adaptive Signal Control** to eliminate unnecessary delay, dynamically dissipate queues, and provide instant green corridors for emergency ambulances.

---

## 🎯 Ground Rules & Must-Haves Checklist

| Requirement | Implementation Status | Technical Details |
|---|---|---|
| **Browser Only** | ✅ Complete | Runs entirely in the client browser. Zero local AI models, zero paid APIs, zero backend servers. |
| **Top-Down 4-Way Canvas** | ✅ Complete | Custom HTML5 Canvas renderer with asphalt noir styling, lane striping, crosswalks, and anti-gridlock yellow box markings. |
| **4-Direction Car Spawning** | ✅ Complete | Vehicles spawn from North, South, East, and West with user-adjustable density (1.0 to 8.0 veh/s + quick presets). |
| **3-Phase Traffic Signals** | ✅ Complete | Green, Amber, Red cycles with countdown timers and distinct shapes (▲ GO, ◆ WAIT, ■ STOP) for 100% black & white accessibility. |
| **Queueing & Collision Avoidance** | ✅ Complete | Zero vehicle overlap in queues (safe bumper headway clamping) and zero collisions in the junction. Safe stopping distance \(v^2 / 2a\) prevents abrupt mid-box stopping on amber. |
| **Live Statistics** | ✅ Complete | Real-time tracking of: Total Cars Passed, Average Waiting Time (s), Active Road Vehicles, and Per-Direction Queue Lengths (Current & Peak). |
| **Full Simulation Controls** | ✅ Complete | Start, Pause, Resume, and clean state Reset. |
| **Privacy by Default (DPDP 2023)** | ✅ Complete | Zero personal data leaves the browser. Ephemeral memory only. Meets Indian Digital Personal Data Protection Act, 2023. |
| **Prompt Log & Failed Prompt Case Study** | ✅ Complete | Dedicated interactive modal displaying AI trajectory, prompt log, and the debugged case study for hackathon judges. |

---

## 🚀 High-Value Stretch Goals Implemented

### 1. Queue-Actuated Adaptive Signal Control
- Uses real-time lane queue sensing to allocate optimal green time (6s to 28s) proportional to actual traffic demand.
- Features **early gap-out detection**: when an active queue clears and waiting traffic exists on cross streets, signals transition early to eliminate empty green time.

### 2. Dual-Junction Synchronized Arena
- Run **Fixed 15s Cycle** and **Adaptive AI Control** side-by-side simultaneously with **identical pseudo-random arrival seeds** (Mulberry32 PRNG).
- Provides undeniable scientific proof that Adaptive mode reduces delay and raises throughput under the exact same traffic stream.

### 3. Free Left Turn (Indian Traffic Regulation)
- Vehicles in curbside slip lanes make continuous left turns without stopping at red signals, yielding safely to non-conflicting traffic.

### 4. Emergency Green Corridor
- Spawns an ambulance with active strobe beacon lights.
- Automatically initiates safe amber and all-red clearance phases for cross traffic, opens an immediate green corridor, and returns to normal operation once cleared.

---

## ⏱️ 3-Minute Hackathon Demo Script

- **0:00 – 0:20 | Introduction**: State problem: Indian 4-way junctions experience severe bottlenecks when fixed timers waste green time on empty approaches while traffic piles up on others.
- **0:20 – 1:10 | Must-Haves**:
  1. Click **Start Simulation**.
  2. Adjust Spawn Density slider to **4.0 veh/s (High)**.
  3. Show vehicles stopping at red and queueing cleanly without overlapping.
  4. Point out live KPI cards (Cars Passed, Avg Wait Time, Directional Queues).
  5. Demonstrate **Pause**, **Resume**, and **Reset**.
- **1:10 – 2:10 | Stretch Goals**:
  1. Switch mode to **Adaptive AI**. Notice dynamic green allocation and early queue clearance.
  2. Toggle **Free Left Turn** — observe curbside vehicles filtering through the slip curve.
  3. Click **Dispatch Ambulance** — observe siren strobes, clearance transition, and immediate green corridor.
- **2:10 – 2:40 | Extreme Stress Test**:
  1. Set Spawn Density to **Extreme (6.0 veh/s)**.
  2. Show judges that even under heavy congestion, no cars pass through each other in queues, and no middle-of-box collisions occur.
  3. Switch to **Live Arena (Dual View)** to see Fixed vs Adaptive side-by-side!
- **2:40 – 3:00 | AI Prompt Log & Debug Case Study**:
  1. Open the **AI Log** modal.
  2. Point out the **Failed Prompt Case Study**: initial naive spawning caused overlaps at entry and sudden stopping inside the box during amber; show how refactoring into `QueueManager` and `CollisionManager` with \(v^2/2a\) braking physics resolved the bug completely.

---

## 🎨 Design Theme: Asphalt Noir

Inspired by premium minimalist automotive aesthetics (Nixtio motorcycle concept):
- **Background Primary**: `#141010`
- **Surface Primary**: `#242020`
- **Accent Red**: `#A41717`
- **Metallic Gold**: `#B59447`
- **Road Markings**: `#E0D8D0`
- **Signal Colors**: Green `#39B86B`, Amber `#F2B544`, Red `#E54848`

---

## 🛠️ Tech Stack & Local Execution

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Timeline telemetry & area plots)
- **Physics**: Custom 2D Fixed-Timestep Simulation Loop

### To Run Locally:
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```
Visit `http://localhost:5173` or `http://localhost:4173`.
