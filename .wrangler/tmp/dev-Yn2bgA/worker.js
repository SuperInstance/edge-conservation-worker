var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-vIfLzW/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/worker.ts
function verifyConservation(parts, total) {
  const computed = parts.reduce((a, b) => a + b, 0);
  return {
    timestamp: Date.now(),
    operation: "conservation_verify",
    result: computed,
    expected: total,
    delta: Math.abs(computed - total)
  };
}
__name(verifyConservation, "verifyConservation");
function shannonEntropy(probs) {
  const h = -probs.filter((p) => p > 0).reduce((sum, p) => sum + p * Math.log2(p), 0);
  return {
    timestamp: Date.now(),
    operation: "shannon_entropy",
    result: h,
    expected: Math.log2(probs.length),
    delta: Math.abs(h - Math.log2(probs.length))
  };
}
__name(shannonEntropy, "shannonEntropy");
function matmul2x2(a, b) {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3]
  ];
}
__name(matmul2x2, "matmul2x2");
function det2x2(m) {
  return m[0] * m[3] - m[1] * m[2];
}
__name(det2x2, "det2x2");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "X-Edge-Timestamp": (/* @__PURE__ */ new Date()).toISOString()
    };
    if (path === "/health") {
      return Response.json({ status: "ok", version: env.VERSION }, { headers });
    }
    if (path === "/conservation") {
      const metric = verifyConservation([0.3, 0.5, 0.2], 1);
      const kvKey = `metric:${metric.timestamp}`;
      if (env.METRICS_KV) {
        await env.METRICS_KV.put(kvKey, JSON.stringify(metric));
      }
      return Response.json({
        conservation: metric,
        edge: request.headers.get("cf-ray") || "local",
        colo: request.headers.get("cf-colo") || "local"
      }, { headers });
    }
    if (path === "/entropy") {
      const n = parseInt(url.searchParams.get("n") || "10");
      const probs = Array(n).fill(1 / n);
      const metric = shannonEntropy(probs);
      return Response.json({
        entropy: metric,
        uniform_distribution_size: n,
        max_entropy_bits: Math.log2(n)
      }, { headers });
    }
    if (path === "/matmul") {
      const a = [1, 2, 3, 4];
      const b = [5, 6, 7, 8];
      const det_a = det2x2(a);
      const det_b = det2x2(b);
      const t0 = performance.now();
      let result = a;
      for (let i = 0; i < 1e4; i++) {
        result = matmul2x2(result, b);
      }
      const elapsed = performance.now() - t0;
      const det_result = det2x2(result);
      const det_expected = det_a * det_b;
      const c = matmul2x2(a, b);
      const det_c = det2x2(c);
      return Response.json({
        iterations: 1e4,
        elapsed_ms: elapsed.toFixed(3),
        ops_per_sec: Math.round(1e4 / (elapsed / 1e3)),
        determinant_conservation: {
          det_a,
          det_b,
          det_ab: det_c,
          expected: det_a * det_b,
          verified: Math.abs(det_c - det_a * det_b) < 1e-10
        }
      }, { headers });
    }
    if (path === "/fleet") {
      return Response.json({
        fleet_size: 589,
        languages: ["rust", "go", "python", "c", "typescript"],
        total_tests_estimate: 12e3,
        published_crates: 24,
        published_pypi: 4,
        edge_capabilities: ["kv-storage", "conservation-verify", "entropy-compute", "matmul-benchmark"]
      }, { headers });
    }
    const results = {
      conservation: verifyConservation([0.25, 0.25, 0.25, 0.25], 1),
      entropy: shannonEntropy([0.25, 0.25, 0.25, 0.25]),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      edge: request.headers.get("cf-ray") || "local"
    };
    return Response.json(results, { headers });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-vIfLzW/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-vIfLzW/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
