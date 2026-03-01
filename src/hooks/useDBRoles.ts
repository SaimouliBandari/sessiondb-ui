import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { DBPrivilege } from './useDBUsers';

export interface DBRole {
    id: string;
    name: string;           // "Read Only" (Pascal Case display name)
    dbKey: string;          // "read_only" (actual DB identifier)
    instanceId: string;
    instanceName?: string;
    memberCount?: number;
    privileges: DBPrivilege[];
    isSystemRole?: boolean;
    createdAt?: string;
}

export const useDBRoles = (instanceId?: string) => {
    return useQuery({
        queryKey: ['db-roles', instanceId ?? 'all'],
        queryFn: async () => {
            const params = instanceId ? { instanceId } : {};
            const res = await apiClient.get('/db-roles', { params });
            return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        },
        enabled: true,
    });
};

export const useCreateDBRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (roleData: Partial<DBRole>) => {
            const res = await apiClient.post('/db-roles', roleData);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['db-roles'] });
        }
    });
};

export const useUpdateDBRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (roleData: Partial<DBRole> & { id: string }) => {
            const { id, ...data } = roleData;
            const res = await apiClient.put(`/db-roles/${id}`, data);
            return res.data.data || res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['db-roles'] });
        }
    });
};

export const useDeleteDBRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete(`/db-roles/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['db-roles'] });
        }
    });
};
