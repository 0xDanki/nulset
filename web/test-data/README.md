# Test Data

Sample files for testing the NulSet admin interface.

## Files

### `banned-list.json`
JSON format with banned identifiers. Use this to test the admin upload feature.

### `banned-list.csv`
CSV format with banned identifiers. Alternative format for testing.

## Test Scenarios

**Banned Users (should be denied access):**
- bob@banned.com
- eve@malicious.org
- sanctioned@example.com
- fraud@scammer.net
- blocked@user.io
- suspended@platform.com

**Good Users (should be granted access):**
- alice@example.com
- charlie@good.com
- david@user.io
- grace@platform.com
- Any identifier not in the banned list

## Usage

1. Go to Admin panel (http://localhost:3000/admin)
2. Upload `banned-list.json` or `banned-list.csv`
3. Build the Merkle tree
4. Download the root.json
5. Test verification with both banned and good users in Platform Demo
