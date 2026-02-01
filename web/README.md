# NulSet Web Interface

Frontend application for privacy-preserving exclusion verification.

## Quick Start

```bash
# Install dependencies (from project root)
cd ~/nulset
pnpm install

# Start dev server
cd web
pnpm run dev
```

Open http://localhost:3000

## Features

- **Admin Panel**: Upload CSV/JSON exclusion lists, build Merkle tree
- **Faucet Demo**: Anti-Sybil gate using zero-knowledge exclusion proofs
- **Client-side ZK**: All proof generation happens in browser (privacy-preserving)

## Architecture

- **Framework:** Vite + React + TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **ZK Libraries:** circomlibjs, snarkjs

## Pages

- `/` - Home with overview
- `/admin` - Administrator panel (upload lists, build trees)
- `/platform` - Faucet demo (anti-Sybil verification)

## Development

```bash
# Development
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Integration with Backend

Frontend reuses existing backend logic:
- `../scripts/src/tree.ts` - Tree building
- `../scripts/src/prove_circom.ts` - Proof generation

All cryptography happens client-side for privacy.
