# Test Data

## Files

### `demo-banned-list.json`
Sample banned identifiers for testing the faucet demo.

```json
{
  "banned": [
    "1234567890123456789",
    "9876543210987654321",
    "5555555555555555555"
  ]
}
```

### `banned-list.json` / `banned-list.csv`
Generic ban list examples showing different identifier formats.

## Usage

1. **Admin Panel**: Upload any JSON/CSV file
2. **Build Tree**: System hashes identifiers and builds Merkle tree
3. **Faucet Demo**: Enter any ID to test exclusion proof

## Test IDs

**Good (Not Banned)**:
- `8888888888888888888` - Will be approved
- `your@email.com` - Any string works
- `0x742d35Cc...` - Wallet addresses supported

**Banned (In demo-banned-list.json)**:
- `1234567890123456789` - Will be denied
- `9876543210987654321` - Will be denied

## File Formats

Both CSV and JSON supported. Examples in this directory.
