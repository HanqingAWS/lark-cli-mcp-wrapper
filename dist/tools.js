import { readFileSync } from "node:fs";
import { execa } from "execa";
const tier1Names = JSON.parse(readFileSync(new URL("./tier1.json", import.meta.url), "utf-8"));
const toolDefs = JSON.parse(readFileSync(new URL("./generated-tools.json", import.meta.url), "utf-8"));
function toolName(def) {
    const cmd = def.command.replace(/^\+/, "");
    return `lark_${def.service}_${cmd.replace(/-/g, "_")}`;
}
function toSchemaKey(flagName) {
    return flagName.replace(/-/g, "_");
}
export function buildInputSchema(def) {
    const properties = {};
    const required = [];
    for (const flag of def.flags) {
        const key = toSchemaKey(flag.name);
        const prop = { description: flag.description };
        if (flag.type === "boolean")
            prop.type = "boolean";
        else if (flag.type === "number")
            prop.type = "number";
        else
            prop.type = "string";
        if (flag.enum && flag.enum.length > 0)
            prop.enum = flag.enum;
        properties[key] = prop;
        if (flag.required)
            required.push(key);
    }
    return {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
    };
}
export function buildTierOneTools() {
    const tier1Set = new Set(tier1Names);
    const tools = [];
    for (const def of toolDefs) {
        const name = toolName(def);
        if (!tier1Set.has(name))
            continue;
        tools.push({
            schema: {
                name,
                description: `[${def.risk}] ${def.description}`,
                inputSchema: buildInputSchema(def),
            },
            def,
        });
    }
    const found = new Set(tools.map((t) => t.schema.name));
    for (const name of tier1Names) {
        if (!found.has(name)) {
            console.error(`[warn] Tier 1 tool "${name}" not found in generated-tools.json, skipping`);
        }
    }
    return tools;
}
export async function executeTool(tool, args) {
    const { def } = tool;
    const isShortcut = def.command.startsWith("+");
    // FIX v1.1.0: Never pass --format json to shortcut commands.
    // lark-cli shortcut commands (+xxx) output JSON by default.
    // Some shortcuts accept --format but many do NOT — passing it to those
    // causes lark-cli to print Usage and exit without executing.
    // Safe strategy: never pass --format to shortcuts (JSON is always default).
    // For raw API commands (non-shortcut), keep --format json as a safety net.
    const cliArgs = isShortcut
        ? [def.service, def.command]
        : [def.service, def.command, "--format", "json"];
    for (const flag of def.flags) {
        const key = toSchemaKey(flag.name);
        const value = args[key];
        if (value === undefined || value === null || value === "")
            continue;
        if (flag.type === "boolean") {
            if (value)
                cliArgs.push(`--${flag.name}`);
        }
        else {
            cliArgs.push(`--${flag.name}`, String(value));
        }
    }
    if (def.risk === "high-risk-write") {
        cliArgs.push("--yes");
    }
    try {
        const result = await execa("lark-cli", cliArgs, {
            timeout: 120000,
            maxBuffer: 10 * 1024 * 1024,
            env: { ...process.env, NO_COLOR: "1" },
        });
        const output = result.stdout.trim();
        if (!output) {
            return { content: [{ type: "text", text: '{"ok":true,"data":null}' }] };
        }
        try {
            const parsed = JSON.parse(output);
            if (parsed.ok === false) {
                return { content: [{ type: "text", text: output }], isError: true };
            }
            return { content: [{ type: "text", text: output }] };
        }
        catch {
            return { content: [{ type: "text", text: output }] };
        }
    }
    catch (err) {
        const stderr = err.stderr?.trim() ?? "";
        const stdout = err.stdout?.trim() ?? "";
        const message = stdout || stderr || err.message;
        return { content: [{ type: "text", text: message }], isError: true };
    }
}
//# sourceMappingURL=tools.js.map