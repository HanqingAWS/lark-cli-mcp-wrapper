interface MetaToolResult {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
export declare function getMetaToolSchemas(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            service: {
                type: string;
                description: string;
            };
            tool_name?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            tool_name: {
                type: string;
                description: string;
            };
            query?: undefined;
            service?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleMetaTool(name: string, args: Record<string, unknown>): Promise<MetaToolResult | null>;
export {};
//# sourceMappingURL=meta-tools.d.ts.map