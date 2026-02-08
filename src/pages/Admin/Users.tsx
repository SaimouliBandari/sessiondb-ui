import React, { useState } from 'react';
import { UserPlus, Search, Edit2, Shield, Trash2, Key, Eye, Lock } from 'lucide-react';
import { Role } from '../../hooks/useRoles';

import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { useAuthConfig, useUpdateAuthConfig } from '../../hooks/useAuthConfig';
import { User } from '../../context/AuthContext';
import UserModal from './UserModal';
import UserDetails from './UserDetails';
import styles from './Admin.module.css';

const UserManagement: React.FC = () => {
    // Hooks
    const { data: users = [], isLoading, isError, error } = useUsers();
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();
    const { data: authConfig } = useAuthConfig();
    const updateAuthConfigMutation = useUpdateAuthConfig();

    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');

    const filteredUsers = users.filter((u: User) => {
        const roleName = typeof u.role === 'string' ? u.role : u.role?.name || '';
        return (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
            roleName.toLowerCase().includes(search.toLowerCase());
    });

    const handleOpenCreate = () => {
        setEditingUser(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleViewDetails = (user: User) => {
        setSelectedUserForDetails(user);
    };

    const handleSaveUser = (user: User) => {
        if (editingUser) {
            updateUserMutation.mutate({ ...user, id: editingUser.id });
        } else {
            createUserMutation.mutate(user);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete user ${name}?`)) {
            deleteUserMutation.mutate(id);
        }
    };

    // For setAuthConfig
    const setAuthConfig = (config: { type: 'password' | 'sso' }) => {
        updateAuthConfigMutation.mutate(config);
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>User Management</h1>
                    <p className={styles.pageSubtitle}>Manage system users, granular DB permissions, and session access.</p>
                </div>
                <button className="btn-primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={18} />
                    Create New User
                </button>
            </div>

            <div className={styles.tabsArea}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'users' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    System Settings
                </button>
            </div>

            {activeTab === 'users' ? (
                <>
                    <div className={styles.filtersArea}>
                        <div className={styles.searchBox}>
                            <Search size={18} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search by name or role..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading && <div className={styles.loadingState}>Loading users...</div>}
                    {isError && <div className={styles.errorState}>Error loading users: {(error as any)?.message || 'Unknown error'}</div>}

                    {!isLoading && !isError && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Permissions</th>
                                        <th>Session Based</th>
                                        <th>Status</th>
                                        <th style={{ width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <div className={styles.avatarSmall}>{(user.name || '?').charAt(0).toUpperCase()}</div>
                                                    <span>{user.name || 'Unknown User'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.roleTag}>
                                                    <Shield size={14} />
                                                    {typeof user.role === 'string' ? user.role : user.role?.name || 'No Role'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.permsSummary}>
                                                    {(user.permissions || []).length > 0 ? (
                                                        (user.permissions || []).slice(0, 2).map((p: any, i: number) => (
                                                            <span key={i} className={styles.permBadge}>
                                                                {p.database}.{p.table}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className={styles.noPerms}>No specific permissions</span>
                                                    )}
                                                    {(user.permissions || []).length > 2 && (
                                                        <span className={styles.morePerms}>+{(user.permissions || []).length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={user.isSessionBased ? styles.statusActive : styles.statusInactive}>
                                                    {user.isSessionBased ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={user.status === 'active' ? styles.statusActive : styles.statusInactive}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button className={styles.iconBtn} onClick={() => handleViewDetails(user)} title="View Details">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className={styles.iconBtn} onClick={() => handleOpenEdit(user)} title="Edit Privileges">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className={styles.iconBtn} onClick={() => handleDelete(user.id, user.name)} title="Delete User">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                <div className="card" style={{ maxWidth: '600px' }}>
                    <h3>Security & Authentication</h3>
                    <p className={styles.pageSubtitle}>Select the system-wide login method for all users.</p>

                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div
                            className={`${styles.configPlate} ${authConfig.type === 'password' ? styles.configActive : ''}`}
                            onClick={() => setAuthConfig({ type: 'password' })}
                        >
                            <div className={styles.configIcon}>
                                <Key size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Password Based</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Users login using their system username and password.</div>
                            </div>
                            <div className={styles.radio}>
                                {authConfig.type === 'password' && <div className={styles.radioInner} />}
                            </div>
                        </div>

                        <div
                            className={`${styles.configPlate} ${authConfig.type === 'sso' ? styles.configActive : ''}`}
                            onClick={() => setAuthConfig({ type: 'sso' })}
                        >
                            <div className={styles.configIcon}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Single Sign-On (SSO)</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Force users to authenticate via enterprise provider (GitHub).</div>
                            </div>
                            <div className={styles.radio}>
                                {authConfig.type === 'sso' && <div className={styles.radioInner} />}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                        <div style={{ color: '#eab308', fontWeight: 600, fontSize: '0.85rem' }}>Important: Login Method Change</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                            Changing the login method will apply globally. Users currently logged in will NOT be logged out, but new sessions must use the new method.
                        </p>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <UserModal
                    user={editingUser}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                />
            )}

            {selectedUserForDetails && (
                <UserDetails
                    user={selectedUserForDetails}
                    onClose={() => setSelectedUserForDetails(undefined)}
                />
            )}
        </div>
    );
};

export default UserManagement;
