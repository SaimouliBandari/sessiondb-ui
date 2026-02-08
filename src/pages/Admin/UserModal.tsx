import React, { useState } from 'react';
import { X, Shield, Search, Database, Table, ChevronDown, ChevronRight } from 'lucide-react';
import { User, DBPermission } from '../../context/AuthContext';
import { useSchema } from '../../hooks/useSchema';
import { useRoles, Role } from '../../hooks/useRoles';
import styles from './Admin.module.css';
import { useInstance } from '../../context/InstanceContext';

interface UserModalProps {
    user?: User;
    onClose: () => void;
    onSave: (user: User) => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
    const { currentInstanceId } = useInstance();
    const { data: schema } = useSchema(currentInstanceId);

    const { data: roles = [], isLoading: rolesLoading } = useRoles();

    console.log('Roles data:', roles);

    const [name, setName] = useState(user?.name || '');
    const initialRole = typeof user?.role === 'string' ? user?.role : user?.role?.name || 'Developer';
    const [role, setRole] = useState(initialRole);
    const [dbUsername, setDbUsername] = useState(user?.db_username || '');
    const [isSessionBased, setIsSessionBased] = useState(user?.isSessionBased || false);
    const [permissions, setPermissions] = useState<DBPermission[]>(user?.permissions || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedDBs, setExpandedDBs] = useState<string[]>(schema?.databases?.slice(0, 1).map(db => db.database) || []);



    const toggleDB = (db: string) => {
        setExpandedDBs(prev => prev.includes(db) ? prev.filter(d => d !== db) : [...prev, db]);
    };

    const isTableSelected = (db: string, table: string) => {
        return permissions.some(p => p.database === db && p.table === table);
    };

    const toggleTable = (db: string, table: string) => {
        if (isTableSelected(db, table)) {
            setPermissions(prev => prev.filter(p => !(p.database === db && p.table === table)));
        } else {
            setPermissions(prev => [...prev, { database: db, table: table, privileges: ['READ'], type: 'permanent' }]);
        }
    };

    const toggleAllTablesInDB = (dbName: string) => {
        const database = schema?.databases?.find(d => d.database === dbName);
        const tables = database?.tables || [];
        console.log(tables);
        const allSelected = tables.every((t: any) => isTableSelected(dbName, t.name));

        if (allSelected) {
            // Deselect all
            setPermissions(prev => prev.filter(p => p.database !== dbName));
        } else {
            // Select all (only those not already selected)
            const newPerms = tables
                .filter((t: any) => !isTableSelected(dbName, t.name))
                .map((t: any) => ({ database: dbName, table: t.name, privileges: ['READ'] as ('READ' | 'WRITE' | 'DELETE' | 'EXECUTE')[], type: 'permanent' as const }));

            setPermissions(prev => [...prev, ...newPerms]);
        }
    };

    const handleRoleChange = (newRoleName: string) => {
        setRole(newRoleName);
        const selectedRole = roles.find((r: Role) => r.name === newRoleName);
        if (selectedRole) {
            setPermissions(selectedRole.permissions);
        }
    };


    const updatePermissionPrivileges = (db: string, table: string, privilege: string) => {
        setPermissions(prev => prev.map(p => {
            if (p.database === db && p.table === table) {
                const privs = p.privileges.includes(privilege as any)
                    ? p.privileges.filter(pr => pr !== privilege)
                    : [...p.privileges, privilege as 'READ' | 'WRITE' | 'DELETE' | 'EXECUTE'];
                return { ...p, privileges: privs };
            }
            return p;
        }));
    };

    const updatePermissionType = (db: string, table: string, type: DBPermission['type']) => {
        setPermissions(prev => prev.map(p => {
            if (p.database === db && p.table === table) {
                return { ...p, type, expiry: type === 'expiring' ? p.expiry || new Date().toISOString().slice(0, 16) : p.expiry };
            }
            return p;
        }));
    };

    const updatePermissionExpiry = (db: string, table: string, expiry: string) => {
        setPermissions(prev => prev.map(p => {
            if (p.database === db && p.table === table) {
                return { ...p, expiry };
            }
            return p;
        }));
    };

    const handleSave = () => {
        const newUser: User = {
            id: user?.id || Math.random().toString(36).substr(2, 9),
            name,
            role,
            db_username: dbUsername || `sdb_${name.toLowerCase().replace(/\s+/g, '_')}`,
            status: user?.status || 'active',
            isSessionBased,
            lastLogin: user?.lastLogin || 'Never',
            permissions,
            savedScripts: user?.savedScripts || [],
            queryTabs: user?.queryTabs || []
        };
        onSave(newUser);
    };

    const filteredDatabases = schema?.databases?.map(db => {
        const matchedTables = db.tables?.filter(t =>
            db.database?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.name?.toLowerCase().includes(searchQuery.toLowerCase())
        ) || [];
        return {
            ...db,
            tables: matchedTables.length > 0 || db.database?.toLowerCase().includes(searchQuery.toLowerCase())
                ? db.tables
                : matchedTables
        };
    }).filter(db =>
        db.database?.toLowerCase().includes(searchQuery.toLowerCase()) || db.tables.length > 0
    ) || [];



    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} card`} style={{ maxWidth: '800px', width: '95%' }}>
                <div className={styles.modalHeader}>
                    <h3>{user ? 'Update User Configuration' : 'Create New User'}</h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label>Full Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>DB Username</label>
                                <input
                                    type="text"
                                    value={dbUsername}
                                    onChange={(e) => setDbUsername(e.target.value)}
                                    placeholder="e.g. sdb_john_doe"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Primary Role</label>
                                <select value={role} onChange={(e) => handleRoleChange(e.target.value)} disabled={rolesLoading}>
                                    {rolesLoading ? (
                                        <option>Loading roles...</option>
                                    ) : roles.length === 0 ? (
                                        <option>No roles available</option>
                                    ) : (
                                        <>
                                            <option value="">Select a role...</option>
                                            {roles.map((r: Role) => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className={styles.formGroup} style={{ justifyContent: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={isSessionBased} onChange={(e) => setIsSessionBased(e.target.checked)} />
                                    Session Based Access
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={styles.permissionsLayout}>
                        <div className={styles.schemaBrowser}>
                            <div className={styles.browserHeader}>
                                <label>Browse Schema</label>
                                <div className={styles.miniSearch}>
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search DB or tables..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.schemaList}>
                                {filteredDatabases.map((db: any) => (
                                    <div key={db.database} className={styles.dbGroup}>
                                        <div className={styles.dbHeader}>
                                            <div className={styles.dbTitle} onClick={() => toggleDB(db.database)}>
                                                {expandedDBs.includes(db.database) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                <Database size={14} />
                                                <span>{db.database}</span>
                                            </div>
                                            <button
                                                className={styles.selectAllBtn}
                                                onClick={() => toggleAllTablesInDB(db.database)}
                                            >
                                                {db.tables.every((t: any) => isTableSelected(db.database, t.name)) ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        {expandedDBs.includes(db.database) && (
                                            <div className={styles.tableList}>
                                                {db.tables.map((table: any) => (
                                                    <div
                                                        key={table.id}
                                                        className={`${styles.tableItem} ${isTableSelected(db.database, table.name) ? styles.selected : ''}`}
                                                        onClick={() => toggleTable(db.database, table.name)}
                                                    >
                                                        <input type="checkbox" checked={isTableSelected(db.database, table.name)} readOnly />
                                                        <Table size={12} />
                                                        <span>{table.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.selectedPerms}>
                            <label>Assigned Privileges ({permissions.length})</label>
                            <div className={styles.permCardsScroll}>
                                {permissions.map((perm) => (
                                    <div key={`${perm.database}-${perm.table}`} className={styles.permissionCardMini}>
                                        <div className={styles.permInfoMini}>
                                            <span className={styles.permName}>{perm.database}.{perm.table}</span>
                                            <button onClick={() => toggleTable(perm.database, perm.table)} className={styles.iconBtn}><X size={14} /></button>
                                        </div>

                                        <div className={styles.privsRowMini}>
                                            {['READ', 'WRITE', 'DELETE', 'EXECUTE'].map(p => (
                                                <button
                                                    key={`${perm.database}-${perm.table}-${p}`}
                                                    className={perm.privileges.includes(p) ? styles.privBtnActive : styles.privBtn}
                                                    onClick={() => updatePermissionPrivileges(perm.database, perm.table, p)}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>

                                        <div className={styles.expiryRowMini}>
                                            <select value={perm.type} onChange={(e) => updatePermissionType(perm.database, perm.table, e.target.value as any)}>
                                                <option value="permanent">Permanent</option>
                                                <option value="temp">Temp (24h)</option>
                                                <option value="expiring">Expiring</option>
                                            </select>
                                            {perm.type === 'expiring' && (
                                                <input
                                                    type="datetime-local"
                                                    value={perm.expiry || ''}
                                                    onChange={(e) => updatePermissionExpiry(perm.database, perm.table, e.target.value)}
                                                    className={styles.miniDateInput}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {permissions.length === 0 && (
                                    <div className={styles.emptySelection}>
                                        <Shield size={32} />
                                        <p>Select tables from the left to assign privileges.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn-primary">Save Configuration</button>
                </div>
            </div>
        </div>
    );
};

export default UserModal;
