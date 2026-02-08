import React from 'react';
import { X, Clock, Shield, CheckCircle, XCircle, Terminal } from 'lucide-react';
import { User } from '../../context/AuthContext';
import { useLogs } from '../../hooks/useLogs';
import styles from './Admin.module.css';

interface UserDetailsProps {
    user: User;
    onClose: () => void;
}

const UserDetails: React.FC<UserDetailsProps> = ({ user, onClose }) => {
    const { data: logs = [] } = useLogs();

    // Get top 5 recent queries for this user
    const recentQueries = logs
        .filter((l: any) => l.user === user.name && l.query)
        .slice(0, 5);

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} card`} style={{ maxWidth: '600px', width: '95%' }}>
                <div className={styles.modalHeader}>
                    <h3>User Details: {user.name}</h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.detailsHeaderSection}>
                        <div className={styles.detailAvatar}>{user.name.charAt(0).toUpperCase()}</div>
                        <div className={styles.detailMainInfo}>
                            <h4>{user.name}</h4>
                            <p>{user.db_username || 'No DB user assigned'}</p>
                            <div className={styles.statusRow}>
                                {user.status === 'active' ? (
                                    <span className={styles.statusActive}><CheckCircle size={14} /> Active</span>
                                ) : (
                                    <span className={styles.statusInactive}><XCircle size={14} /> Inactive</span>
                                )}
                                <span className={styles.lastLoginText}><Clock size={14} /> Last Login: {user.lastLogin}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.detailsGrid}>
                        <div className={styles.detailSection}>
                            <label><Shield size={14} /> Assigned Role</label>
                            <div className={styles.roleDisplayBig}>
                                <strong>{typeof user.role === 'string' ? user.role : user.role?.name || 'No Role'}</strong>
                                <span>{user.isSessionBased ? 'Session-Based Access' : 'Permanent Identity'}</span>
                            </div>
                        </div>

                        <div className={styles.detailSection}>
                            <label><Terminal size={14} /> Recent Queries (Top 5)</label>
                            <div className={styles.recentQueriesList}>
                                {recentQueries.length > 0 ? (
                                    recentQueries.map((q: any) => (
                                        <div key={q.id} className={styles.queryMiniEntry}>
                                            <div className={styles.queryMetaMini}>
                                                <span className={styles.queryTime}>{q.timestamp}</span>
                                                <span className={q.status === 'Success' ? styles.statusSuccess : styles.statusFailure}>
                                                    {q.status}
                                                </span>
                                            </div>
                                            <code>{q.query}</code>
                                        </div>
                                    ))
                                ) : (
                                    <p className={styles.emptyText}>No recent query activity found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className="btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
