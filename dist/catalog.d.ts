export interface CatalogEntry {
    name: string;
    service: string;
    command: string;
    description: string;
    risk: string;
}
/**
 * Search the tool catalog by keyword and optional service filter.
 * Performs case-insensitive matching against tool name, description,
 * service, and command fields.
 */
export declare function searchCatalog(query: string, service?: string, limit?: number): CatalogEntry[];
//# sourceMappingURL=catalog.d.ts.map