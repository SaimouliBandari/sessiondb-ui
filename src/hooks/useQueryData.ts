import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface SavedScript {
    id: string;
    name: string;
    query: string;
    timestamp: string;
}

export interface QueryTab {
    id: string;
    name: string;
    query: string;
    isActive: boolean;
}

export const useSavedScripts = () => {
    return useQuery({
        queryKey: ['savedScripts'],
        queryFn: async () => {
            const res = await apiClient.get('/me/scripts');
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        }
    });
};

export const useSaveScript = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (script: { name: string, query: string }) => {
            const res = await apiClient.post('/me/scripts', script);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savedScripts'] });
        }
    });
};

export const useQueryTabs = () => {
    return useQuery({
        queryKey: ['queryTabs'],
        queryFn: async () => {
            // If backend doesn't persist tabs yet, return local storage or empty
            try {
                const res = await apiClient.get('/me/tabs');
                return Array.isArray(res.data) ? res.data : (res.data.data || []);
            } catch (e) {
                return [];
            }
        },
        initialData: []
    });
};

export const useUpdateTabs = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (tabs: QueryTab[]) => {
            const res = await apiClient.put('/me/tabs', tabs);
            return res.data.data || res.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['queryTabs'], data);
        }
    });
};

export const useExecuteQuery = (instanceId?: string | null) => {
    return useMutation({
        mutationFn: async (query: string) => {
            if (!instanceId) throw new Error("No database instance selected");
            const res = await apiClient.post('/query/execute', { query, instanceId });
            // Execution result likely has { columns, rows } or similar
            return res.data.data || res.data;
        }
    });
};

/** Verify DB credentials for an instance and persist the link */
export const useVerifyCredential = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { instanceId: string; dbPassword: string }) => {
            const res = await apiClient.post('/db-credentials/verify', payload);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            // Refresh user data so dbCredentials is up-to-date
            queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    });
};
