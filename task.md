# ZOMRA OS Execution Plan (Phase 6.8 & 6.9)

## Status: Pending

- [x] **Step 1: Global State Architecture (Zustand)**
    - [x] Install `zustand`.
    - [x] Create `src/store/useZomraStore.ts`.
    - [ ] Migrate Context API state to Zustand.
- [ ] **Step 2: The Logic Trinity Implementation (Root Personas)**
    - [ ] Create `hermes.md`, `horus.md`, `green.md`.
    - [ ] Update `AIProvider.ts` to fetch and inject personas.
- [ ] **Step 3: Shadow Chat & Insights Telemetry**
    - [ ] Implement internal dialogue logging logic.
    - [ ] Implement persistence to `swarm_telemetry.json`.
    - [ ] Update/Create `InsightsPanel.tsx`.
- [ ] **Step 4: The Agnostic API Layer (Refactoring)**
    - [ ] Create `src/adapters/` directory.
    - [ ] Implement `AIAdapter` interface, `GeminiAdapter.ts`, and `OllamaAdapter.ts`.
    - [ ] Refactor `processTask` to use dynamic adapters.
