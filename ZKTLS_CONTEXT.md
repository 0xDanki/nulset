# ZK-TLS Integration Context

## Project Goal

Integrate TLSNotary to prove Twitter account ownership, then use existing NulSet circuits to prove the Twitter user ID is not banned. This creates a production-ready, privacy-preserving exclusion verification system.

## Current Working System (DO NOT BREAK)

**Backend (Fully Working):**
- ✅ Circom circuit: `verify_nonmembership.circom` (depth-32, 7744 constraints)
- ✅ Groth16 proving with snarkjs
- ✅ Sparse Merkle Tree in TypeScript (`tree.ts`)
- ✅ Poseidon hash compatibility verified
- ✅ CLI tools: build_tree, gen_witness, prove_circom
- ✅ Trusted setup files (pot13_final.ptau, .zkey, verification_key.json)

**Frontend (Functional UI):**
- ✅ Admin panel (upload CSV/JSON)
- ✅ Platform demo (verification flow)
- ✅ User proof generation page
- ✅ React + Vite + Tailwind setup

**What Must NOT Change:**
- Circuit logic or constraints
- Tree implementation or hash function
- Proof generation/verification flow
- Trusted setup files
- CLI tools functionality

## What We're Adding

**New Component: Twitter Identity Binding**

Instead of proving:
```
"email@example.com is not banned"  // ❌ Unverifiable, anyone can claim any email
```

We prove:
```
"Twitter confirms I'm user ID X" (ZK-TLS proof)
        +
"User ID X is not banned" (NulSet proof)
```

This solves the multi-account problem because:
- Twitter verifies phone number on account creation
- Hard to create thousands of Twitter accounts
- User can't claim to be someone else

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1: Admin Setup                      │
└─────────────────────────────────────────────────────────────┘

Admin uploads banned Twitter user IDs (not emails):
  banned-twitter-ids.json: ["1234567890", "9876543210", ...]
              ↓
  Use existing tree.ts to build SMT
              ↓
  Compute root using existing Poseidon hash
              ↓
  Publish root (same as before)


┌─────────────────────────────────────────────────────────────┐
│                 PHASE 2: User Generates Proofs               │
└─────────────────────────────────────────────────────────────┘

Step 1: Twitter Identity Proof (NEW)
  User clicks "Connect Twitter" in browser
              ↓
  TLSNotary browser extension intercepts HTTPS
              ↓
  User logs into Twitter (real Twitter session)
              ↓
  TLSNotary proves: GET https://api.twitter.com/2/users/me
  Response: { "data": { "id": "1234567890", ... } }
              ↓
  ZK-TLS proof reveals ONLY: "id": "1234567890"
  (username, name, all other fields stay hidden)
              ↓
  Output: TwitterProof { twitterId: "1234567890", proof: {...} }

Step 2: NulSet Exclusion Proof (EXISTING - REUSE)
  Take twitterId from Step 1
              ↓
  Use existing tree.generateWitness(twitterId)
              ↓
  Use existing prove_circom.ts logic
              ↓
  Generate Groth16 proof with existing circuit
              ↓
  Output: NulSetProof { proof: {...}, publicSignals: [...] }


┌─────────────────────────────────────────────────────────────┐
│                 PHASE 3: Platform Verifies                   │
└─────────────────────────────────────────────────────────────┘

Platform receives:
  1. TwitterProof (proves user owns Twitter ID X)
  2. NulSetProof (proves Twitter ID X is not banned)

Verification:
  verify(TwitterProof) → confirms Twitter says "user is 1234567890"
              +
  verify(NulSetProof) → confirms "1234567890 not in banned SMT"
              ↓
  Both valid → Access Granted
  Either invalid → Access Denied
```

## Technical Integration Points

### 1. TLSNotary Integration

**Library:** `tlsn-js` (official TLSNotary JavaScript library)

**What it does:**
- Runs in browser (WASM)
- Acts as HTTPS proxy
- Generates proof of API response
- Selectively reveals specific JSON fields

**What we DON'T do:**
- Build our own TLS proxy
- Implement our own attestation
- Create custom cryptography

**Example Usage:**
```typescript
import { Prover } from 'tlsn-js'

// User initiates proof generation
const prover = await Prover.new({
  serverName: 'api.twitter.com'
})

// User logs in, API call happens
const transcript = await prover.getTranscript()

// Selectively reveal only user ID
const proof = await prover.prove({
  reveal: {
    'data.id': true  // Reveal this field
    // All other fields stay private
  }
})

// Extract revealed data
const twitterId = proof.revealed['data.id']
```

### 2. Identifier Mapping

**Current System:**
```typescript
// tree.ts derives index from any string
const idx = this.deriveIndex(identifier)  // Hash identifier to get tree index
```

**New System (NO CHANGE TO TREE.TS):**
```typescript
// Just pass Twitter ID as the identifier
const twitterId = "1234567890"  // From TLS proof
const idx = tree.deriveIndex(twitterId)  // Existing function works fine
```

**Critical:** We do NOT change `tree.ts` or `deriveIndex()`. Twitter IDs are just strings, same as emails.

### 3. Frontend Changes

**Admin Panel:**
```
Before: Upload banned-emails.csv
After:  Upload banned-twitter-ids.csv

File format:
identifier
1234567890
9876543210
```

**Platform Demo:**
```
Before: Input email → prove
After:  Click "Connect Twitter" → TLSNotary flow → auto-populate Twitter ID → prove

New component: <TwitterConnect />
```

**User Prove Page:**
```
Before: Input identifier → generate proof
After:  Click "Connect Twitter" → extract ID → generate proof (reuse existing logic)
```

## File Structure

```
web/src/
├── lib/
│   ├── tlsnotary/          # NEW - TLSNotary integration
│   │   ├── prover.ts       # TLS proof generation
│   │   ├── verifier.ts     # TLS proof verification
│   │   └── types.ts        # TypeScript types
│   └── nulset/             # EXISTING - Keep separate
│       ├── tree.ts         # Reuse from scripts/src
│       ├── prove.ts        # Reuse from scripts/src
│       └── verify.ts       # Reuse from scripts/src
├── components/
│   ├── TwitterConnect.tsx  # NEW - Twitter connection button
│   └── ...existing
└── pages/
    ├── admin/Upload.tsx    # UPDATE - Accept Twitter IDs
    ├── platform/Demo.tsx   # UPDATE - Add TwitterConnect
    └── user/Prove.tsx      # UPDATE - Add TwitterConnect
```

## Production Requirements

### No Mock Data
- ❌ No fake TLS proofs
- ❌ No simulated Twitter responses
- ❌ No hardcoded user IDs for testing
- ✅ Real TLSNotary library
- ✅ Real Twitter API calls
- ✅ Real Groth16 proofs from existing circuit

### Real Cryptographic Proofs
- TLS proof must be verifiable by anyone
- NulSet proof must use actual circuit WASM
- Both proofs must be independently verifiable

### Error Handling
- Handle TLSNotary connection failures
- Handle Twitter login failures
- Handle proof generation timeouts
- Show clear error messages to users

### Browser Compatibility
- TLSNotary WASM must load correctly
- Support Chrome, Firefox, Safari (latest)
- Handle CORS issues with Twitter API

## Security Considerations

### What We Trust
- Twitter correctly authenticates users
- TLSNotary attestation is sound
- Existing Groth16 proofs are sound

### What We Don't Trust
- User's input (always validate)
- Browser environment (proofs generated client-side)
- Network (use HTTPS, verify signatures)

### Privacy Guarantees
- Platform never learns Twitter username
- Platform never learns Twitter profile data
- Platform only learns: "User owns Twitter ID X" and "X is/isn't banned"
- User can't link multiple sessions (unlinkability from ZK proofs)

## Testing Strategy

### Unit Tests
- TLS proof parsing
- Twitter ID extraction
- Existing tree/proof logic (already tested)

### Integration Tests
- Full flow: Twitter connect → proof gen → verification
- Error cases: network failure, invalid proofs

### E2E Tests
- Create test Twitter accounts
- Upload test banned IDs
- Verify both allowed and denied cases

## Demo Script

**Setup:**
1. Create @alice_test Twitter account (record ID)
2. Create @bob_test Twitter account (record ID)
3. Upload Bob's ID to NulSet admin panel
4. Build tree, get root

**Demo:**
1. Show admin panel with uploaded Twitter IDs
2. Platform demo: Alice clicks "Connect Twitter"
3. TLSNotary flow (show browser extension)
4. Generate NulSet proof (show progress)
5. Verification succeeds → Access granted
6. Repeat with Bob → Access denied

## Dependencies

**New:**
```json
{
  "tlsn-js": "^0.1.0",           // TLSNotary library
  "@types/tlsn-js": "^0.1.0"     // TypeScript types
}
```

**Existing (keep):**
```json
{
  "circomlibjs": "^0.1.7",       // Already installed
  "snarkjs": "^0.7.6"            // Already installed
}
```

## Success Criteria

**Phase 1 Complete When:**
- ✅ Admin can upload Twitter IDs (not emails)
- ✅ Tree builds correctly with Twitter IDs
- ✅ Frontend has "Connect Twitter" button
- ✅ TLSNotary generates real proof
- ✅ Twitter ID extracted from proof
- ✅ Existing NulSet proof works with Twitter ID
- ✅ Both proofs verify correctly
- ✅ No mock data anywhere

**Phase 2 (Stretch):**
- Support GitHub IDs as alternative
- Add account age verification
- Add follower count minimum

## Non-Goals

- ❌ Building our own TLS proxy
- ❌ Creating new circuits
- ❌ Modifying existing tree/proof logic
- ❌ Adding backend API (all client-side)
- ❌ Supporting OAuth flow (just TLS proof)
- ❌ Mobile app (desktop browser only)
