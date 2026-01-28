# Project Context: NulSet (Hackathon Demo, Noir)

## One-liner
NulSet is a privacy-preserving exclusion check. A user proves “I am NOT in the banned/sanctions set” to gain access to a platform — without revealing their identity or any membership details.

## Demo goal (must work end-to-end)
Ship a working, repeatable flow:
1) Admin creates/updates an exclusion set commitment (root)
2) Platform publishes current `root` (+ verification key if needed)
3) User generates a ZK proof of non-membership against that root
4) Platform verifies the proof
5) Platform grants/denies access (clear UI outcome)

## Hackathon prioritization
Prioritize a working proof pipeline + verification over cryptographic sophistication.
If a design choice reduces risk/time, choose it.

## Construction choice (v0)
We will use an SMT-lite (sparse-ish Merkle) non-membership proof:
- Depth: 32
- Index: `idx = truncate_32bits(H(identifier))` (or similar deterministic mapping)
- Leaf value: `0 = empty/not banned`, `1 = banned`
- Non-membership statement: prove leaf at `idx` is `0` and the Merkle path hashes to `root`

Important: we do NOT build the tree in-circuit. The Noir circuit only verifies a path to `root`.

This SMT-based exclusion proof is the **core deliverable** and must work independently of any extensions.

## Circuit responsibilities (Noir)
Noir circuit verifies:
Inputs:
- Public: `root`
- Private: `idx`, `leaf_value` (must be 0), `siblings[DEPTH]`, `direction_bits[DEPTH]`
Constraints:
- `leaf_value == 0`
- Recompute root by hashing from leaf up the path and assert it equals public `root`
Hash:
- Use the simplest SNARK-friendly hash available in Noir (Poseidon/Poseidon2 via a well-known Noir crate). Do NOT implement a custom hash.

## Off-circuit responsibilities (Node/TS scripts)
Scripts will:
- Build/update the SMT-lite (depth=32) using the SAME hash parameters as Noir
- Output:
  - `root.json` (current root)
  - `witness_good.json` (path for a known-good identifier where leaf=0)
  - `witness_bad.json` (path for a banned identifier where leaf=1)
- Provide a sanity test that a witness generated off-circuit passes verification in-circuit

---

## Extension (optional / stretch): User-side ZK-TLS innocence proofs
In addition to the shared exclusion set, NulSet may support **direct user-side ZK-TLS proofs**.

This mode allows a user to prove a claim such as:
- “This exchange says my account is NOT flagged”
- “This provider says my account passed checks”

**without**:
- updating the NulSet exclusion set
- adding anything to the global registry

### ZK-TLS extension scope
- User generates a ZK-TLS proof of a real HTTPS response from a known provider
- The proof selectively discloses a boolean/status claim (e.g. `passed = true`)
- The dApp verifies the proof directly and grants/denies access

This extension is:
- **Provider-specific**
- **User-controlled**
- **Complementary**, not a replacement, for the SMT exclusion proof

Important:
- The core SMT non-membership demo must work even if this extension is not implemented.
- ZK-TLS functionality, if included, should be clearly labeled as **“extension / stretch goal.”**

---

## Non-negotiables
- Real proof generation + real verification. No placeholders for prove/verify.
- Deterministic demo: “good user passes, banned user fails” every time.
- Every missing production requirement must be marked clearly with `// TODO:`.

## What we are NOT building (explicit exclusions)
- No “linked to bad actor” / heuristics / graph proofs
- No governance / decentralization / onchain updates (root can be a JSON file for demo)
- No KYC / real identity binding (identifier can be mocked)
- No witness update mechanism for users beyond regenerating proof when root changes

## Repo layout (suggested)
- `circuits/`
  - `verify_nonmembership.nr`
- `scripts/`
  - `build_tree.ts` (create tree + root)
  - `gen_witness.ts` (emit witness files for sample identities)
  - `prove.ts` (wrap nargo/bb proving; produces proof artifact)
  - `verify.ts` (wrap verification; returns pass/fail)
- `web/` (optional)
  - Simple 3-step UI: Admin → User → Platform
  - Optional extra tab: “Direct Proof (ZK-TLS)” if extension is implemented

## Deliverables (definition of done)
- A README with exact commands to run the demo from clean clone
- Sample data with at least:
  - 1 banned identity that fails
  - 1 non-banned identity that passes
- Clear UI/CLI output showing access granted/denied
- TODO list for “real NulSet” (larger depth, better identifier binding, root distribution, governance, etc.)

## Dev principle
Do not expand scope. If unsure, choose the simplest working approach that preserves the end-to-end proof story.
