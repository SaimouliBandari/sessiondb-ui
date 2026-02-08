import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface Role {
    id: string;
    name: string;
    description?: string;
    isSystemRole?: boolean;
    permissions: any[];
    userCount?: number;
    createdAt?: string;
    updatedAt?: string;
}


export const useRoles = () => {
    return useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const res = await apiClient.get('/roles');
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        }
    });
};

export const useCreateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (roleData: Partial<Role>) => {
            const res = await apiClient.post('/roles', roleData);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        }
    });
};

export const useUpdateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (roleData: Partial<Role> & { id: string }) => {
            const { id, ...data } = roleData;
            const res = await apiClient.put(`/roles/${id}`, data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        }
    });
};

export const useDeleteRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete(`/roles/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        }
    });
};
