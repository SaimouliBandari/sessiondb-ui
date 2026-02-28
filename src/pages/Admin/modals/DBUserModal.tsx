import React, { useState } from 'react';
import { X, Save, UserCheck, Link as LinkIcon } from 'lucide-react';
import { DBUser, useLinkPlatformUser } from '../../../hooks/useDBUsers';
import { useUsers } from '../../../hooks/useUsers';
import { User } from '../../../context/AuthContext';
import styles from '../Admin.module.css';

interface DBUserModalProps {
    user: DBUser;
    onClose: () => void;
}

const DBUserModal: React.FC<DBUserModalProps> = ({ user, onClose }) => {
    const [linkedUserId, setLinkedUserId] = useState<string>(user.linkedUserId ?? '');

    const linkPlatformUserMutation = useLinkPlatformUser();
    const { data: platformUsers = [] } = useUsers();

    const handleSave = async () => {
        try {
            // Link / unlink platform user if changed
            const currentLinked = user.linkedUserId ?? '';
            if (linkedUserId !== currentLinked) {
                await linkPlatformUserMutation.mutateAsync({
                    dbUserId: user.id,
                    platformUserId: linkedUserId || null,
                });
            }

            onClose();
        } catch (error) {
            console.error('Failed to update DB user', error);
        }
    };

    const isSaving = linkPlatformUserMutation.isPending;

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} card`} style={{ maxWidth: '520px', width: '95%' }}>
                <div className={styles.modalHeader}>
                    <h3>Update Database User</h3>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Header info */}
                    <div className={styles.detailsHeaderSection}>
                        {/* <div className={styles.detailAvatar}>{user.username.charAt(0).toUpperCase()}</div> */}
                        <div className={styles.detailMainInfo}>
                            <h4>{user.username}</h4>
                            <p>{user.instanceName}</p>
                            <div className={styles.statusRow}>
                                <span className={user.status === 'active' ? styles.statusActive : styles.statusInactive}>
                                    {user.status}
                                </span>
                            </div>
                        </div>
                    </div>


                    {/* Link Platform User */}
                    <div className={styles.formGroup} style={{ marginTop: '1.25rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserCheck size={15} />
                            Link Platform User
                        </label>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 8px' }}>
                            Associate a SessionDB platform user with this database account.
                        </p>
                        <div className={styles.inputWithAction}>
                            <LinkIcon
                                size={16}
                                style={{ position: 'absolute', left: '10px', top: '38px', color: 'var(--text-muted)' }}
                            />
                            <select
                                value={linkedUserId}
                                onChange={(e) => setLinkedUserId(e.target.value)}
                                style={{ paddingLeft: '34px' }}
                            >
                                <option value="">— No linked user —</option>
                                {(platformUsers as User[]).map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn-primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : (
                            <>
                                <Save size={16} /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DBUserModal;
