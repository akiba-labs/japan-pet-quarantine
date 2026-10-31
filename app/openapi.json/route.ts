import { openapiDoc, preflight, staticJson } from "@/lib/agent-api";
import { API_INFO, ENDPOINTS, PUBLIC_URL } from "@/lib/api";

export function GET() {
  const base = openapiDoc(API_INFO, PUBLIC_URL, Object.values(ENDPOINTS)) as {
    paths: Record<string, unknown>;
    [k: string]: unknown;
  };
  base.paths["/api/rules"] = {
    get: {
      operationId: "japanMyNumberCardRules",
      summary: "Japan dog / cat import and export quarantine rules (AQS): non-designated steps, 180-day wait, 40-day notice, designated regions, export 14-day application (mandatory for dogs and rabbits from 2027-01-01), short stays abroad, 19 dog ports, sources",
      description: "Returns the rules the checker applies, with ordinance articles, official sources and disclaimer. No inputs.",
      responses: {
        "200": {
          description: "Rules JSON with rulesAsOf and sources.",
          content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
        },
      },
    },
  };
  return staticJson(base);
}
export const OPTIONS = preflight;
