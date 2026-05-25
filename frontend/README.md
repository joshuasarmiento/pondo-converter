# Pondo Converter — Frontend

An interactive, responsive civic tech web application that visualizes the opportunity cost of government budget allocations and public contract procurement amounts by translating currency figures into tangible everyday goods and services.

## Technology Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API with `<script setup>`)
- **Language**: TypeScript
- **Icons**: Lucide Vue Next
- **Bundler/Build Tool**: Vite
- **Styling**: Vanilla CSS / TailwindCSS (Utility-first)

## Features

1. **Audit Database Explorer**: Allows users to search and select real, high-value PhilGEPS procurement contracts and view their alternative civic purchasing equivalents (e.g. how many classrooms or sacks of rice it matches).
2. **Debounced Live Search**: Filter through thousands of loaded contracts by agency, contractor name, or project title.
3. **Interactive Budget Simulator**: A custom calculator mode that lets citizens enter any arbitrary PHP amount or use predefined civic scale presets (e.g. Barangay Project, City Infrastructure, DepEd Program) to simulate purchasing power equivalents.
4. **Metadata Inspector**: Renders details about the selected contract including procuring agency, winning contractor, award status, and direct link to the PhilGEPS source.

## Getting Started

### 1. Installation
Install the package dependencies:
```bash
bun install
```

### 2. Configuration
Ensure the API configuration inside `src/App.vue` matches your backend address:
- `API_URL`: By default points to `http://localhost:3001/api`
- `API_KEY`: By default uses the shared development credential

### 3. Running Locally
Run the development server:
```bash
bun dev
```

Open your browser and navigate to the address shown in the terminal (typically `http://localhost:5173`).

## Disclaimer

This is an independent civic tech project developed for educational and public transparency purposes. It is not affiliated with, sponsored by, endorsed by, or in any way officially connected to the Commission on Audit (COA), PhilGEPS, the Department of Agriculture (DA), or any other agency of the Government of the Republic of the Philippines.
