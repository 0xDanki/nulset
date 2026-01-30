# ZK-TLS Integration Rules

## Critical Constraints

### NEVER Break These

1. **DO NOT modify existing backend files**
   - ❌ NO changes to `circuits/verify_nonmembership.circom`
   - ❌ NO changes to `scripts/src/tree.ts`
   - ❌ NO changes to `scripts/src/prove_circom.ts`
   - ❌ NO changes to trusted setup files
   - ✅ Only ADD new integration code in `web/src/lib/tlsnotary/`

2. **DO NOT use mock data in production code**
   - ❌ NO fake TLS proofs
   - ❌ NO simulated API responses
   - ❌ NO hardcoded test data in components
   - ✅ Use real TLSNotary library
   - ✅ Real Twitter API via TLS proxy
   - ✅ Real Groth16 proofs from circuit

3. **DO NOT rearchitect without permission**
   - ❌ NO major refactoring of existing code
   - ❌ NO changing file structure without asking
   - ❌ NO introducing new backend services
   - ✅ Ask first if unsure about approach

4. **DO verify everything works end-to-end**
   - ❌ NO assuming integration works
   - ✅ Test with real Twitter accounts
   - ✅ Verify proofs validate correctly
   - ✅ Confirm circuit is actually used

## Development Principles

### Additive Only

All changes must be **additions**, not modifications:

```
✅ GOOD: Add new file web/src/lib/tlsnotary/prover.ts
❌ BAD:  Modify scripts/src/tree.ts

✅ GOOD: Import existing tree.ts and use as-is
❌ BAD:  Copy tree.ts and modify it

✅ GOOD: Add TwitterConnect component
❌ BAD:  Replace existing input component
```

### Separation of Concerns

```
web/src/lib/
├── tlsnotary/          # NEW - ZK-TLS specific code
│   ├── prover.ts       # Twitter TLS proof generation
│   ├── verifier.ts     # TLS proof verification
│   └── types.ts        # TLS-specific types
│
└── nulset/             # EXISTING - Wrappers only
    ├── tree.ts         # Import from scripts/src/tree.ts
    ├── prove.ts        # Import from scripts/src/prove_circom.ts
    └── wrapper.ts      # Browser-compatible wrappers
```

### Import Existing Logic

**DO:**
```typescript
// Import existing tree implementation
import { SMTLite } from '@scripts/tree.js'

// Use it as-is
const tree = await SMTLite.create()
const witness = tree.generateWitness(twitterId)
```

**DON'T:**
```typescript
// ❌ Create new tree implementation
class BrowserTree {
  // Custom tree logic...
}
```

## Implementation Guidelines

### Phase 1: Twitter ID as Identifier

**Goal:** Replace email string with Twitter ID string

**Changes Required:**

1. **Admin Panel** (`web/src/pages/admin/Upload.tsx`)
   ```typescript
   // Before
   Upload banned-emails.csv
   
   // After
   Upload banned-twitter-ids.csv
   
   // File format unchanged, just different identifier type
   identifier
   1234567890
   9876543210
   ```

2. **Test Data** (`web/test-data/`)
   ```json
   // Before: banned-list.json
   {
     "banned": [
       "bob@banned.com"
     ]
   }
   
   // After: banned-twitter-ids.json
   {
     "banned": [
       "1234567890",  // Bob's Twitter ID
       "9876543210"   // Eve's Twitter ID
     ]
   }
   ```

3. **Frontend UI**
   - Add "Connect Twitter" button
   - Remove manual identifier input
   - Auto-populate Twitter ID from TLS proof

### Phase 2: TLSNotary Integration

**New Files Only:**

```typescript
// web/src/lib/tlsnotary/prover.ts
import { Prover } from 'tlsn-js'

export async function generateTwitterProof(): Promise<TwitterProof> {
  // 1. Initialize TLSNotary prover
  const prover = await Prover.new({
    serverName: 'api.twitter.com'
  })
  
  // 2. User authenticates with Twitter (browser handles)
  await prover.connect()
  
  // 3. Make API call through TLS proxy
  const response = await prover.request({
    method: 'GET',
    path: '/2/users/me',
    headers: {
      'Authorization': 'Bearer <user_token>'
    }
  })
  
  // 4. Generate proof revealing only user ID
  const proof = await prover.prove({
    reveal: {
      'data.id': true
    }
  })
  
  return {
    twitterId: proof.revealed['data.id'],
    tlsProof: proof.attestation,
    timestamp: Date.now()
  }
}
```

**Integration with Existing:**

```typescript
// web/src/pages/platform/Demo.tsx
import { generateTwitterProof } from '@/lib/tlsnotary/prover'
import { generateNulSetProof } from '@/lib/nulset/prove'  // Existing

async function handleVerify() {
  // Step 1: Get Twitter proof (NEW)
  const twitterProof = await generateTwitterProof()
  const twitterId = twitterProof.twitterId
  
  // Step 2: Generate NulSet proof (EXISTING)
  const nulsetProof = await generateNulSetProof(twitterId)
  
  // Step 3: Verify both (NEW + EXISTING)
  const valid = await verifyBoth(twitterProof, nulsetProof)
}
```

### Phase 3: Verification

**Combined Verification:**

```typescript
// web/src/lib/tlsnotary/verifier.ts
import { verifyTLSProof } from 'tlsn-js'
import * as snarkjs from 'snarkjs'

export async function verifyCombinedProof(
  twitterProof: TwitterProof,
  nulsetProof: NulSetProof
): Promise<{ valid: boolean; reason?: string }> {
  
  // 1. Verify TLS proof
  const tlsValid = await verifyTLSProof(
    twitterProof.tlsProof,
    'api.twitter.com'
  )
  
  if (!tlsValid) {
    return { valid: false, reason: 'TLS proof invalid' }
  }
  
  // 2. Verify NulSet proof (EXISTING LOGIC)
  const vkey = await fetch('/circuits/verification_key.json').then(r => r.json())
  const nulsetValid = await snarkjs.groth16.verify(
    vkey,
    nulsetProof.publicSignals,
    nulsetProof.proof
  )
  
  if (!nulsetValid) {
    return { valid: false, reason: 'NulSet proof invalid' }
  }
  
  // 3. Verify consistency (both used same Twitter ID)
  const twitterId = twitterProof.twitterId
  const witnessId = deriveIndexFromTwitterId(twitterId)
  // Check if witnessId matches the one in NulSet proof
  
  return { valid: true }
}
```

## Testing Requirements

### Before Committing

**Unit Tests:**
```bash
# Test Twitter ID extraction
npm test -- twitter-extractor.test.ts

# Test TLS proof verification
npm test -- tls-verifier.test.ts

# Existing tests must still pass
cd scripts && pnpm test
```

**Integration Tests:**
```bash
# End-to-end flow
cd web && npm test -- e2e.test.ts
```

**Manual Testing:**
1. ✅ Admin uploads Twitter IDs → tree builds
2. ✅ User connects Twitter → TLS proof generated
3. ✅ NulSet proof generated with Twitter ID
4. ✅ Both proofs verify correctly
5. ✅ Backend CLI still works: `cd scripts && pnpm run demo`

### Test Accounts

Create real test accounts:
- @alice_nulset_test (not banned)
- @bob_nulset_test (banned)

Record their Twitter IDs for test data.

## Code Review Checklist

Before pushing:

- [ ] No changes to existing backend files
- [ ] No mock data in production code
- [ ] TLSNotary properly integrated (not stubbed)
- [ ] Existing circuit is used (not bypassed)
- [ ] Both proofs verify independently
- [ ] Error handling for all failure cases
- [ ] Console logging for debugging
- [ ] README updated with new flow
- [ ] Test data uses real Twitter IDs
- [ ] Demo script works end-to-end

## Error Handling

**Required Error Messages:**

```typescript
// TLSNotary errors
"Failed to connect to Twitter. Please try again."
"TLS proof generation failed. Check browser console."
"Twitter API returned invalid response."

// NulSet errors (keep existing)
"Failed to generate witness."
"Proof generation timed out."
"Verification failed."

// Combined errors
"Twitter proof valid but NulSet proof invalid."
"Access denied: Twitter account is on banned list."
```

## Security Checklist

- [ ] User's Twitter username never sent to platform
- [ ] User's Twitter profile data never exposed
- [ ] Only Twitter ID revealed (nothing else)
- [ ] TLS proof can't be replayed (timestamp check)
- [ ] NulSet proof reveals only: "ID not in tree"
- [ ] Platform can't link multiple sessions by same user

## Performance Targets

- TLS proof generation: < 30 seconds
- NulSet proof generation: < 30 seconds (existing)
- Total user flow: < 2 minutes
- Verification: < 1 second

## Browser Requirements

- Chrome/Edge 90+ (WASM support)
- Firefox 88+ (WASM support)
- Safari 14+ (WASM support, may need polyfill)
- TLSNotary extension installed (link in UI)

## Documentation Updates

**Must update:**
- README.md (add Twitter flow)
- web/README.md (add TLSNotary setup)
- Test data README (explain Twitter IDs)

**Must NOT update:**
- circuits/ README (unchanged)
- scripts/ README (unchanged)

## Deployment Checklist

- [ ] TLSNotary extension link in UI
- [ ] Clear instructions for users
- [ ] Fallback UI if TLSNotary not available
- [ ] Analytics for proof success/failure rates
- [ ] Error reporting for debugging

## Communication

**Before making changes, ask if:**
- Approach requires modifying existing files
- New dependency needed beyond tlsn-js
- Architecture change is necessary
- File structure reorganization needed
- Unsure if something breaks existing system

**Always confirm:**
- "This adds X without breaking Y, correct?"
- "Should I proceed with this approach?"
- "Is this the right place for this code?"
