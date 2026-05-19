import { readFileSync } from "node:fs";
import { ToolDef } from "./tools.js";

const allToolDefs: ToolDef[] = JSON.parse(
  readFileSync(new URL("./generated-tools.json", import.meta.url), "utf-8")
);

export interface CatalogEntry {
  name: string;
  service: string;
  command: string;
  description: string;
  risk: string;
}

function toolName(def: ToolDef): string {
  const cmd = def.command.replace(/^\+/, "");
  return `lark_${def.service}_${cmd.replace(/-/g, "_")}`;
}

/**
 * Search the tool catalog by keyword and optional service filter.
 * Performs case-insensitive matching against tool name, description,
 * service, and command fields.
 */
export function searchCatalog(
  query: string,
  service?: string,
  limit: number = 20
): CatalogEntry[] {
  const q = query.toLowerCase();
  const results: CatalogEntry[] = [];

  for (const def of allToolDefs) {
    // Service filter
    if (service && def.service.toLowerCase() !== service.toLowerCase()) {
      continue;
    }

    const name = toolName(def);
    const searchText = `${name} ${def.description} ${def.service} ${def.command}`.toLowerCase();

    if (searchText.includes(q)) {
      results.push({
        name,
        service: def.service,
        command: def.command,
        description: def.description,
        risk: def.risk,
      });
    }

    if (results.length >= limit) break;
  }

  return results;
}
