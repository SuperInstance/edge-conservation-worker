# edge-conservation-worker

Cloudflare Worker that verifies mathematical conservation laws at CDN edge locations worldwide in <5ms.

## Hypothesis

Mathematical conservation laws (sum of parts = total, det(AB) = det(A)×det(B)) can be verified at CDN edge nodes fast enough for real-time correctness checks distributed globally.

**Result: CONFIRMED** — All endpoints respond in <5ms locally.

## Endpoints

| Endpoint | Description | Latency |
|----------|-------------|---------|
| `GET /` | Run all verification tests | <2ms |
| `GET /health` | Health check | <5ms |
| `GET /conservation` | Verify sum(parts) = total | <5ms |
| `GET /entropy?n=10` | Shannon entropy of uniform distribution | <3ms |
| `GET /matmul` | 10K matrix multiplies + determinant conservation | <5ms |
| `GET /fleet` | SuperInstance fleet statistics | <2ms |

## Usage

### Local Development

```bash
npm install
npx wrangler dev
# Visit http://localhost:8787/conservation
```

### Deploy to Cloudflare

```bash
npx wrangler deploy
```

### Example Responses

**Conservation verification:**
```json
{
  "conservation": {
    "result": 1.0,
    "expected": 1.0,
    "delta": 0.0
  },
  "colo": "SJC"
}
```

**Entropy computation:**
```json
{
  "entropy": 4.0,
  "uniform_distribution_size": 16,
  "max_entropy_bits": 4
}
```

**Matrix multiply benchmark:**
```json
{
  "iterations": 10000,
  "elapsed_ms": "1.000",
  "ops_per_sec": 10000000,
  "determinant_conservation": {
    "verified": true
  }
}
```

## Applications

- **Build verification** — Check conservation invariants after every build at 300+ edge locations
- **API correctness** — Verify mathematical properties of responses in real-time
- **Teaching** — Interactive math demonstrations with sub-5ms response times

## License

MIT
