interface ToolFlag {
    name: string;
    type: "string" | "boolean" | "number";
    description: string;
    required: boolean;
    enum?: string[];
}
export interface ToolDef {
    service: string;
    command: string;
    description: string;
    risk: string;
    flags: ToolFlag[];
}
export interface McpTool {
    schema: {
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
    };
    def: ToolDef;
}
export declare function buildInputSchema(def: ToolDef): Record<string, unknown>;
export declare function buildTierOneTools(): McpTool[];
export declare function executeTool(tool: McpTool, args: Record<string, unknown>): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
export {};
//# sourceMappingURL=tools.d.ts.map