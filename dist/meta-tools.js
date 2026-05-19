import { searchCatalog } from "./catalog.js";
import { buildInputSchema, executeTool } from "./tools.js";
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
        {
            name: "lark_invoke",
            description: "[read|write] Invoke any Lark tool by name. Use after lark_search_tools + lark_get_tool_schema to call tools not in the high-frequency set. Pass the exact tool_name and its args object.",
            inputSchema: {
                type: "object",
                required: ["tool_name"],
                properties: {
                    tool_name: {
                        type: "string",
                        description: "The tool name from lark_search_tools (e.g. 'lark_wiki_node_create')",
                    },
                    args: {
                        type: "object",
                        description: "Arguments object matching the tool's inputSchema",
                    },
                },
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
    if (name === "lark_invoke") {
        const targetName = String(args.tool_name ?? "");
        const toolArgs = args.args ?? {};
        if (!targetName) {
            return {
                content: [{ type: "text", text: JSON.stringify({ error: "tool_name is required" }) }],
                isError: true,
            };
        }
        const def = allToolDefs.find((d) => toolName(d) === targetName);
        if (!def) {
            // Try to suggest similar tools
            const similar = allToolDefs
                .map((d) => toolName(d))
                .filter((n) => n.includes(targetName.split("_").slice(-1)[0]))
                .slice(0, 5);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: "unknown_tool",
                            tool_name: targetName,
                            similar,
                            hint: "Use lark_search_tools to find the correct tool name",
                        }),
                    },
                ],
                isError: true,
            };
        }
        // Build a McpTool and execute it
        const mcpTool = {
            schema: {
                name: targetName,
                description: `[${def.risk}] ${def.description}`,
                inputSchema: buildInputSchema(def),
            },
            def,
        };
        return executeTool(mcpTool, toolArgs);
    }
    return null;
}
//# sourceMappingURL=meta-tools.js.map