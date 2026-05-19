import { searchCatalog } from "./catalog.js";
import { buildInputSchema } from "./tools.js";
import { readFileSync } from "node:fs";
const allToolDefs = JSON.parse(readFileSync(new URL("./generated-tools.json", import.meta.url), "utf-8"));
function toolName(def) {
    const cmd = def.command.replace(/^\+/, "");
    return `lark_${def.service}_${cmd.replace(/-/g, "_")}`;
}
export function getMetaToolSchemas() {
    return [
        {
            name: "lark_search_tools",
            description: "Search available Lark/Feishu tools by keyword. Returns matching tool names and descriptions. Use this to discover tools before calling them.",
            inputSchema: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Search keyword (e.g. 'calendar', 'document', 'message')",
                    },
                    service: {
                        type: "string",
                        description: "Optional: filter by service name (e.g. 'calendar', 'im', 'docs', 'drive', 'base')",
                    },
                },
                required: ["query"],
            },
        },
        {
            name: "lark_get_tool_schema",
            description: "Get the full input schema for a specific Lark tool by name. Use after searching to understand what parameters a tool accepts.",
            inputSchema: {
                type: "object",
                properties: {
                    tool_name: {
                        type: "string",
                        description: "The tool name (e.g. 'lark_calendar_agenda')",
                    },
                },
                required: ["tool_name"],
            },
        },
    ];
}
export async function handleMetaTool(name, args) {
    if (name === "lark_search_tools") {
        const query = String(args.query ?? "");
        const service = args.service ? String(args.service) : undefined;
        const results = searchCatalog(query, service);
        if (results.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No tools found matching "${query}"${service ? ` in service "${service}"` : ""}. Try broader keywords.`,
                    },
                ],
            };
        }
        const lines = results.map((r) => `• ${r.name} [${r.risk}] — ${r.description}`);
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${results.length} tool(s):\n\n${lines.join("\n")}`,
                },
            ],
        };
    }
    if (name === "lark_get_tool_schema") {
        const targetName = String(args.tool_name ?? "");
        const def = allToolDefs.find((d) => toolName(d) === targetName);
        if (!def) {
            return {
                content: [
                    { type: "text", text: `Tool "${targetName}" not found in catalog.` },
                ],
                isError: true,
            };
        }
        const schema = buildInputSchema(def);
        const result = {
            name: targetName,
            service: def.service,
            command: def.command,
            risk: def.risk,
            description: def.description,
            inputSchema: schema,
        };
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    }
    return null;
}
//# sourceMappingURL=meta-tools.js.map