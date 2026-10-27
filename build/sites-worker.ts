import {liveHub} from "../app/live-hub.mjs";
import {ownerStage} from "../app/hub-stage.mjs";
import {isOwner} from "../app/cms";
import { siteBoundary } from "../app/site-boundary.mjs";
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const boundary = siteBoundary(request);
    if (boundary) return boundary;
    if(new URL(request.url).pathname.startsWith("/api/owner-backup/"))return new Response(null,{status:404,headers:{"Cache-Control":"private, no-store"}});
    const stage = (env as unknown as {HUB_LIVE_ENABLED?:string}).HUB_LIVE_ENABLED==='1'?await liveHub(request,env,isOwner):await ownerStage(request, env, isOwner);
    if (stage) return stage;
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};
