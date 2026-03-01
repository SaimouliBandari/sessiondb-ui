import React, { useState } from 'react';
import { X, Send, Database, Table, ChevronDown, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { useSchema } from '../../hooks/useSchema';
import { DBPermission } from '../../context/AuthContext';
import styles from './Admin.module.css';

interface RequestModalProps {
    onClose: () => void;
}

const RequestModal: React.FC<RequestModalProps> = ({ onClose }) => {
    const { data: schema = {} } = useSchema();
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'TEMP_USER' | 'PERM_UPGRADE'>('TEMP_USER');
    const [permissions, setPermissions] = useState<DBPermission[]>([]);
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
            setPermissions(prev => [...prev, { database: db, table: table, privileges: ['READ'], type: type === 'TEMP_USER' ? 'temp' : 'permanent' }]);
        }
    };

    const handleSubmit = () => {
        if (!description || permissions.length === 0) {
            alert('Please provide a justification and select at least one table.');
            return;
        }

        // In a real app, this would use a mutation
        console.log('Submitting request:', { type, description, permissions });
        alert('Access request submitted successfully! An administrator will review it shortly.');
        onClose();
    };

    const filteredSchema = Object.entries(schema || {}).reduce((acc, [db, tables]) => {
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.reqIcon} style={{ background: 'rgba(52, 199, 89, 0.1)', color: '#34c759' }}>
                            <Send size={18} />
                        </div>
                        <h3>Submit Access Request</h3>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label>Request Type</label>
                            <div className={styles.requestTypeToggle}>
                                <button
                                    className={type === 'TEMP_USER' ? styles.toggleActive : styles.toggleBtn}
                                    onClick={() => setType('TEMP_USER')}
                                >
                                    <Clock size={14} /> Temporary Access (24h)
                                </button>
                                <button
                                    className={type === 'PERM_UPGRADE' ? styles.toggleActive : styles.toggleBtn}
                                    onClick={() => setType('PERM_UPGRADE')}
                                >
                                    <AlertCircle size={14} /> Permanent Access
                                </button>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Justification / Reason</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Debugging customer checkout issues in production. Referring to ticket PROD-1234."
                                style={{ height: '80px' }}
                            />
                        </div>
                    </div>

                    <div className={styles.permissionsLayout}>
                        <div className={styles.schemaBrowser}>
                            <div className={styles.browserHeader}>
                                <label>Select Required Data</label>
                                <div className={styles.miniSearch}>
                                    <input
                                        type="text"
                                        placeholder="Search tables..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.schemaList}>
                                {Object.entries(filteredSchema).map(([db, tables]) => (
                                    <div key={db} className={styles.dbGroup}>
                                        <div className={styles.dbHeader} onClick={() => toggleDB(db)}>
                                            <div className={styles.dbTitle}>
                                                {expandedDBs.includes(db) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                <Database size={14} />
                                                <span>{db}</span>
                                            </div>
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
                            <label>Requested Objects ({permissions.length})</label>
                            <div className={styles.permCardsScroll}>
                                {permissions.map((perm) => (
                                    <div key={`${perm.database}-${perm.table}`} className={styles.permissionCardMini}>
                                        <div className={styles.permInfoMini}>
                                            <span className={styles.permName}>{perm.database}.{perm.table}</span>
                                            <button onClick={() => toggleTable(perm.database, perm.table)} className={styles.iconBtn}><X size={14} /></button>
                                        </div>
                                        <div className={styles.permPrivsMini}>
                                            Will request default READ access.
                                        </div>
                                    </div>
                                ))}
                                {permissions.length === 0 && (
                                    <div className={styles.emptySelection}>
                                        <Database size={32} />
                                        <p>Select the tables you need access to.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary">
                        <Send size={16} style={{ marginRight: '8px' }} />
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestModal;
