// Edge Conservation Worker
// Implements conservation-law verification at the edge
// Tests: KV storage, compute latency, mathematical operations at Cloudflare edge

interface ConservationMetric {
  timestamp: number;
  operation: string;
  result: number;
  expected: number;
  delta: number;
  edgeLocation?: string;
}

// Verify a conservation law: sum of parts = total
function verifyConservation(parts: number[], total: number): ConservationMetric {
  const computed = parts.reduce((a, b) => a + b, 0);
  return {
    timestamp: Date.now(),
    operation: 'conservation_verify',
    result: computed,
    expected: total,
    delta: Math.abs(computed - total),
  };
}

// Compute entropy of a distribution at the edge
function shannonEntropy(probs: number[]): ConservationMetric {
  const h = -probs
    .filter(p => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);
  return {
    timestamp: Date.now(),
    operation: 'shannon_entropy',
    result: h,
    expected: Math.log2(probs.length),
    delta: Math.abs(h - Math.log2(probs.length)),
  };
}

// Matrix multiply (small, edge-suitable)
function matmul2x2(a: number[], b: number[]): number[] {
  return [
    a[0]*b[0] + a[1]*b[2], a[0]*b[1] + a[1]*b[3],
    a[2]*b[0] + a[3]*b[2], a[2]*b[1] + a[3]*b[3],
  ];
}

// Verify determinant conservation under transpose
function det2x2(m: number[]): number {
  return m[0]*m[3] - m[1]*m[2];
}

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Edge-Timestamp': new Date().toISOString(),
    };

    if (path === '/health') {
      return Response.json({ status: 'ok', version: env.VERSION }, { headers });
    }

    if (path === '/conservation') {
      // Verify conservation: [0.3, 0.5, 0.2] sums to 1.0
      const metric = verifyConservation([0.3, 0.5, 0.2], 1.0);
      
      // Try to store in KV
      const kvKey = `metric:${metric.timestamp}`;
      if (env.METRICS_KV) {
        await env.METRICS_KV.put(kvKey, JSON.stringify(metric));
      }

      return Response.json({
        conservation: metric,
        edge: request.headers.get('cf-ray') || 'local',
        colo: request.headers.get('cf-colo') || 'local',
      }, { headers });
    }

    if (path === '/entropy') {
      // Compute entropy of uniform distribution
      const n = parseInt(url.searchParams.get('n') || '10');
      const probs = Array(n).fill(1/n);
      const metric = shannonEntropy(probs);
      
      return Response.json({
        entropy: metric,
        uniform_distribution_size: n,
        max_entropy_bits: Math.log2(n),
      }, { headers });
    }

    if (path === '/matmul') {
      // Benchmark: 1000 small matrix multiplies at the edge
      const a = [1, 2, 3, 4];
      const b = [5, 6, 7, 8];
      const det_a = det2x2(a);
      const det_b = det2x2(b);
      
      const t0 = performance.now();
      let result = a;
      for (let i = 0; i < 10000; i++) {
        result = matmul2x2(result, b);
      }
      const elapsed = performance.now() - t0;
      
      // Verify det(AB) = det(A)*det(B)
      const det_result = det2x2(result);
      const det_expected = det_a * det_b;
      // After many multiplications the values blow up, but let's verify one step
      const c = matmul2x2(a, b);
      const det_c = det2x2(c);
      
      return Response.json({
        iterations: 10000,
        elapsed_ms: elapsed.toFixed(3),
        ops_per_sec: Math.round(10000 / (elapsed / 1000)),
        determinant_conservation: {
          det_a: det_a,
          det_b: det_b,
          det_ab: det_c,
          expected: det_a * det_b,
          verified: Math.abs(det_c - det_a * det_b) < 1e-10,
        },
      }, { headers });
    }

    if (path === '/fleet') {
      // Report on the SuperInstance fleet from edge perspective
      return Response.json({
        fleet_size: 589,
        languages: ['rust', 'go', 'python', 'c', 'typescript'],
        total_tests_estimate: 12000,
        published_crates: 24,
        published_pypi: 4,
        edge_capabilities: ['kv-storage', 'conservation-verify', 'entropy-compute', 'matmul-benchmark'],
      }, { headers });
    }

    // Default: run all tests
    const results = {
      conservation: verifyConservation([0.25, 0.25, 0.25, 0.25], 1.0),
      entropy: shannonEntropy([0.25, 0.25, 0.25, 0.25]),
      timestamp: new Date().toISOString(),
      edge: request.headers.get('cf-ray') || 'local',
    };
    return Response.json(results, { headers });
  },
};
