import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCreateDBRole, useUpdateDBRole, DBRole } from '../../hooks/useDBRoles';
import { useInstance } from '../../context/InstanceContext';
import RoleModal from './RoleModal';
import DBRolesTab from './tabs/DBRolesTab';
import styles from './Admin.module.css';

const RoleManagement: React.FC = () => {
    // Hooks
    const createRoleMutation = useCreateDBRole();
    const updateRoleMutation = useUpdateDBRole();
    const { currentInstanceId } = useInstance();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<DBRole | undefined>(undefined);

    const handleOpenCreate = () => {
        setEditingRole(undefined);
        setIsModalOpen(true);
    };

    const handleSaveRole = (role: DBRole) => {
        if (editingRole) {
            updateRoleMutation.mutate({ ...role, id: editingRole.id });
        } else {
            createRoleMutation.mutate(role);
        }
        setIsModalOpen(false);
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Database Roles</h1>
                    <p className={styles.pageSubtitle}>
                        View and manage database roles for the connected instance.
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleOpenCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    disabled={!currentInstanceId} // Can only create if an instance is selected
                    title={!currentInstanceId ? "Select an instance first" : "Create New Sub-Role"}
                >
                    <Plus size={18} />
                    Create New DB Role
                </button>
            </div>

            <DBRolesTab />

            {isModalOpen && (
                <RoleModal
                    role={editingRole}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveRole}
                />
            )}
        </div>
    );
};

export default RoleManagement;
