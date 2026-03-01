import React, { useState } from 'react';
import { X, Shield, Search, Database, Table, ChevronDown, ChevronRight } from 'lucide-react';
import { useSchema } from '../../hooks/useSchema';
import { DBRole } from '../../hooks/useDBRoles';
import { DBPrivilege } from '../../hooks/useDBUsers';
import { DBPermission } from '../../context/AuthContext';
import { useInstance } from '../../context/InstanceContext';
import styles from './Admin.module.css';

interface RoleModalProps {
    role?: DBRole;
    onClose: () => void;
    onSave: (role: DBRole) => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ role, onClose, onSave }) => {
    const { currentInstanceId } = useInstance();
    const { data: schema = {} as Record<string, string[]> } = useSchema();
    const [name, setName] = useState(role?.name || '');

    // Map DBPrivilege[] to UI state DBPermission[]
    const [permissions, setPermissions] = useState<DBPermission[]>(() => {
        if (!role?.privileges) return [];
        const map = new Map<string, DBPermission>();
        role.privileges.forEach(p => {
            const parts = p.object.split('.');
            const db = parts.length > 1 ? parts[0] : parts[0];
            const table = parts.length > 1 ? parts[1] : '*';

            const key = `${db}.${table}`;
            if (!map.has(key)) {
                map.set(key, { database: db, table, privileges: [], type: 'permanent' });
            }
            const perm = map.get(key)!;
            if (p.type === 'SELECT' && !perm.privileges.includes('READ')) perm.privileges.push('READ');
            if (['INSERT', 'UPDATE'].includes(p.type) && !perm.privileges.includes('WRITE')) perm.privileges.push('WRITE');
            if (p.type === 'DELETE' && !perm.privileges.includes('DELETE')) perm.privileges.push('DELETE');
            if (p.type === 'EXECUTE' && !perm.privileges.includes('EXECUTE')) perm.privileges.push('EXECUTE');
            if (p.type === 'ALL') perm.privileges = ['READ', 'WRITE', 'DELETE', 'EXECUTE'];
        });
        return Array.from(map.values());
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedDBs, setExpandedDBs] = useState<string[]>(Object.keys(schema || {}).slice(0, 1));

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

    const toggleAllTablesInDB = (db: string) => {
        const tables = (schema as any)[db] || [];
        const allSelected = (tables as string[]).every((t: string) => isTableSelected(db, t));

        if (allSelected) {
            setPermissions(prev => prev.filter(p => p.database !== db));
        } else {
            const newPerms = (tables as string[])
                .filter((t: string) => !isTableSelected(db, t))
                .map((t: string) => ({ database: db, table: t, privileges: ['READ'] as ('READ' | 'WRITE' | 'DELETE' | 'EXECUTE')[], type: 'permanent' as const }));
            setPermissions(prev => [...prev, ...newPerms]);
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

    const handleSave = () => {
        if (!name) {
            alert('Please provide a role name.');
            return;
        }

        const privileges: DBPrivilege[] = [];
        permissions.forEach(p => {
            if (p.privileges.includes('READ')) {
                privileges.push({ object: `${p.database}.${p.table}`, type: 'SELECT', grantable: false });
            }
            if (p.privileges.includes('WRITE')) {
                privileges.push({ object: `${p.database}.${p.table}`, type: 'INSERT', grantable: false });
                privileges.push({ object: `${p.database}.${p.table}`, type: 'UPDATE', grantable: false });
            }
            if (p.privileges.includes('DELETE')) {
                privileges.push({ object: `${p.database}.${p.table}`, type: 'DELETE', grantable: false });
            }
            if (p.privileges.includes('EXECUTE')) {
                privileges.push({ object: `${p.database}.${p.table}`, type: 'EXECUTE', grantable: false });
            }
        });

        const newRole: Partial<DBRole> = {
            id: role?.id || Math.random().toString(36).substr(2, 9),
            name,
            dbKey: role?.dbKey || name.toLowerCase().replace(/\s+/g, '_'),
            privileges,
            instanceId: currentInstanceId || '',
            isSystemRole: false
        };
        onSave(newRole as DBRole);
    };

    const filteredSchema = Object.entries(schema || {}).reduce((acc: Record<string, string[]>, [db, tables]) => {
        const matchedTables = (tables as string[]).filter(t =>
            db.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (matchedTables.length > 0 || db.toLowerCase().includes(searchQuery.toLowerCase())) {
            acc[db] = tables as string[];
        }
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} card`} style={{ maxWidth: '800px', width: '95%' }}>
                <div className={styles.modalHeader}>
                    <h3>{role ? 'Edit DB Role' : 'Create New DB Role'}</h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label>Role Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Read Only App"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>DB Role Key (Generated)</label>
                            <div className={styles.inputWithAction} style={{ position: 'relative' }}>
                                <Shield size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    value={role?.dbKey || name.toLowerCase().replace(/\s+/g, '_')}
                                    disabled
                                    style={{ paddingLeft: '34px', background: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }}
                                />
                            </div>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                This is the internal identifier used on the database instance.
                            </p>
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
                                {Object.entries(filteredSchema).map(([db, tables]) => (
                                    <div key={db} className={styles.dbGroup}>
                                        <div className={styles.dbHeader}>
                                            <div className={styles.dbTitle} onClick={() => toggleDB(db)}>
                                                {expandedDBs.includes(db) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                <Database size={14} />
                                                <span>{db}</span>
                                            </div>
                                            <button className={styles.selectAllBtn} onClick={() => toggleAllTablesInDB(db)}>
                                                {((schema as any)[db] as string[] || []).every((t: string) => isTableSelected(db, t)) ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        {expandedDBs.includes(db) && (
                                            <div className={styles.tableList}>
                                                {tables.map(table => (
                                                    <div
                                                        key={table}
                                                        className={`${styles.tableItem} ${isTableSelected(db, table) ? styles.selected : ''}`}
                                                        onClick={() => toggleTable(db, table)}
                                                    >
                                                        <input type="checkbox" checked={isTableSelected(db, table)} readOnly />
                                                        <Table size={12} />
                                                        <span>{table}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.selectedPerms}>
                            <label>Role Privileges ({permissions.length})</label>
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
                                                    key={p}
                                                    className={perm.privileges.includes(p as any) ? styles.privBtnActive : styles.privBtn}
                                                    onClick={() => updatePermissionPrivileges(perm.database, perm.table, p as any)}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {permissions.length === 0 && (
                                    <div className={styles.emptySelection}>
                                        <Shield size={32} />
                                        <p>Define base privileges for this database role.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn-primary">Save Role</button>
                </div>
            </div>
        </div>
    );
};

export default RoleModal;
