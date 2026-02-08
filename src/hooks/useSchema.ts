import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface SchemaColumn {
    id: string;
    name: string;
    dataType: string;
    isNullable: boolean;
    isPrimaryKey: boolean;
}

export interface SchemaTable {
    id: string;
    name: string;
    columns: SchemaColumn[];
}

export interface SchemaDatabase {
    database: string;  // API uses 'database' not 'name'
    tables: SchemaTable[];
}

export interface HierarchicalSchema {
    instanceId: string;
    databases: SchemaDatabase[];
}


export const useSchema = (instanceId?: string | null) => {
    return useQuery<HierarchicalSchema | null>({
        queryKey: ['schema', instanceId],
        queryFn: async () => {
            if (!instanceId) return null;
            const res = await apiClient.get(`/instances/${instanceId}/schema`);
            return res.data.data || res.data;
        },
        enabled: !!instanceId,
        staleTime: Infinity,
        gcTime: Infinity,
    });
};

