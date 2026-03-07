var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/chatroom.js
var ChatRoom = class {
  static {
    __name(this, "ChatRoom");
  }
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          {
            status: 405,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      const body = await request.json();
      const userMessage = body.message?.trim();
      if (!userMessage) {
        return new Response(
          JSON.stringify({ error: "Message is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      let history = await this.state.storage.get("history") || [];
      history.push({ role: "user", content: userMessage });
      let reply = "";
      try {
        const aiResponse = await this.env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            prompt: `
You are a professional travel planner.

Create a detailed day-by-day travel itinerary.

Output rules:
- Use exactly this structure: Day 1:, Day 2:, Day 3:
- Under each day, use bullet points that begin with "-"
- Include Morning, Afternoon, and Evening as separate bullet points
- Add 1 extra bullet point for food, transportation, or local tip when relevant
- Mention specific landmarks, museums, neighborhoods, or attractions
- Make each bullet point informative, not just one short phrase
- Keep the itinerary practical and easy to follow
- Write in clear natural English
- Do not respond in one paragraph
- Do not skip bullet points

User request:
${userMessage}
`
          }
        );
        reply = aiResponse?.response || aiResponse?.result?.response || aiResponse?.text || aiResponse?.output_text || "";
      } catch (aiError) {
        console.error("Workers AI failed:", aiError);
      }
      if (!reply) {
        reply = `Day 1:
- Morning: Start at Boston Common and begin walking the Freedom Trail. Visit major historic landmarks such as the Massachusetts State House and Paul Revere's House to get an overview of Boston's colonial history.
- Afternoon: Continue to Quincy Market and Faneuil Hall, where you can explore food stalls, local shops, and the lively pedestrian area. This is a convenient place to combine sightseeing with lunch.
- Evening: Have dinner at Legal Sea Foods or another classic seafood restaurant nearby, then enjoy a relaxed walk around the downtown or waterfront area.
- Tip: Wear comfortable walking shoes because many of the historic sites in this area are best explored on foot.

Day 2:
- Morning: Visit the Museum of Fine Arts and spend a few hours exploring its American, Asian, and European collections. This is one of Boston's most well-known museums and works well as the centerpiece of the day.
- Afternoon: Head to the Isabella Stewart Gardner Museum, which offers a more intimate and unique museum experience with its famous courtyard and personal collection.
- Evening: Walk through Back Bay, stop by the Boston Public Library, and explore Newbury Street for shopping, architecture, and cafes before dinner.
- Food suggestion: Back Bay has many restaurants where you can try seafood, pasta, or modern American cuisine in a more relaxed evening setting.

Day 3:
- Morning: Take the Red Line to Cambridge and explore Harvard Square. Walk through the Harvard campus, browse local bookstores, and enjoy coffee or brunch in the area.
- Afternoon: Visit the MIT area or take a scenic walk along the Charles River. If you want a slower pace, spend time in a cafe or small museum nearby.
- Evening: End your trip in the Seaport District, where you can enjoy waterfront views, modern buildings, and a final seafood dinner before taking an evening walk by the harbor.
- Transportation tip: Use the MBTA subway to move between downtown Boston, Cambridge, and the Seaport efficiently without relying on a car.`;
      }
      history.push({ role: "assistant", content: reply });
      await this.state.storage.put("history", history);
      return new Response(
        JSON.stringify({
          reply,
          history
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("ChatRoom error:", error);
      return new Response(
        JSON.stringify({
          error: "Server error",
          details: String(error)
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};

// src/index.js
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat" && request.method === "POST") {
      const id = env.CHATROOM.idFromName("default-room");
      const stub = env.CHATROOM.get(id);
      return stub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  }
};

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// .wrangler/tmp/bundle-v3t4zh/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-v3t4zh/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
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
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
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
  ChatRoom,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
