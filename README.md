# Edge Conservation Worker

**Edge Conservation Worker** is a Cloudflare Worker (TypeScript) that implements conservation-law verification at the network edge — testing KV storage latency, computing Shannon entropy, and verifying mathematical invariants (determinant conservation, matrix operations) from edge locations worldwide.

## Why It Matters

Conservation laws must hold everywhere — including at the network edge where compute resources are constrained and variable. This Worker serves as a distributed probe: deployed to Cloudflare's 300+ edge locations, it measures whether conservation-law computations produce correct results under real-world edge conditions (limited CPU time, cold starts, geographic latency variation). The Worker verifies three classes of conservation: (1) additive conservation (sum of parts equals total), (2) entropy conservation (Shannon entropy approaches maximum for uniform distributions), and (3) algebraic conservation (matrix determinant is preserved under transpose). Any violation at any edge location signals a computational environment anomaly that could affect fleet-wide conservation guarantees.

## How It Works

**Endpoints:**

| Route | Function | Conservation Test |
|-------|----------|-------------------|
| `/health` | Liveness probe | Returns version and timestamp |
| `/conservation` | Additive conservation | Sum([0.3, 0.5, 0.2]) = 1.0 |
| `/entropy` | Shannon entropy | H(p) ≈ log₂(n) for uniform p |
| `/matrix` | Algebraic conservation | det(A) = det(Aᵀ) |

**Shannon entropy computation:**
```
H(p) = −Σ pᵢ log₂(pᵢ)
```

For a uniform distribution over n elements, H_max = log₂(n). The delta `|H − H_max|` measures deviation from maximum uncertainty.

**Determinant conservation:**
For any square matrix A, det(A) = det(Aᵀ). The Worker computes both:

```
det2x2([a,b,c,d]) = a×d − b×c
```

And verifies the transpose has the same determinant — a mathematical identity that should never fail in correct floating-point arithmetic.

**KV storage test:** Each conservation metric is stored in Cloudflare KV (`METRICS_KV`), measuring the write latency from edge location to KV regional store. The `cf-ray` header identifies the edge colo, enabling geographic analysis of conservation verification latency.

## Quick Start

```bash
# Deploy to Cloudflare Workers
npx wrangler deploy

# Test conservation endpoint
curl https://your-worker.workers.dev/conservation
# → {"conservation":{"result":1,"expected":1,"delta":0}, "edge":"SFO"}

curl https://your-worker.workers.dev/entropy
# → {"shannon_entropy":{"result":1.5,"expected":1.585,"delta":0.085}}
```

## API

| Endpoint | Returns | Tests |
|----------|---------|-------|
| `/health` | `{status, version}` | Liveness |
| `/conservation` | `{result, expected, delta, edge}` | Additive |
| `/entropy` | `{result, expected, delta}` | Shannon |
| `/matrix` | `{det, det_transpose, delta}` | Algebraic |

## Architecture Notes

Edge Conservation Worker is the **edge-verification node** for γ + η = C. It tests that conservation invariants hold in the η-layer's most resource-constrained environment — the Cloudflare edge. By running identical computations at 300+ locations and comparing results, it ensures that conservation-law violations are not artifacts of specific hardware or runtime environments.

See [ARCHITECTURE.md](https://github.com/SuperInstance/SuperInstance/blob/main/ARCHITECTURE.md).

## References

1. Shannon, C.E. (1948). "A Mathematical Theory of Communication." *Bell System Technical Journal*, 27.
2. Cloudflare (2024). *Workers Runtime: KV Storage API*. developers.cloudflare.com.

## License

MIT
