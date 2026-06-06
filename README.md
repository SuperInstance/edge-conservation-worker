# Edge Conservation Worker

Cloudflare Worker implementing conservation-law verification at the edge.

## Endpoints
- `GET /` - Run all tests
- `GET /health` - Health check
- `GET /conservation` - Verify conservation law
- `GET /entropy?n=10` - Compute Shannon entropy
- `GET /matmul` - Matrix multiply benchmark + det conservation
- `GET /fleet` - Fleet stats

## Hypothesis
Mathematical conservation laws can be verified at CDN edge nodes in <10ms,
enabling real-time mathematical correctness checks distributed globally.
