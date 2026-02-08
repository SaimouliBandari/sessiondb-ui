import React, { useState } from 'react';
import { Check, X, Shield, Clock, Database, ChevronRight, ChevronDown, User, AlertCircle, Key } from 'lucide-react';
import { useApprovals, useApproveRequest, useRejectRequest, ApprovalRequest } from '../../hooks/useApprovals';
import RequestModal from './RequestModal';
import styles from './Admin.module.css';

const Approvals: React.FC = () => {
    // Hooks
    const { data: requests = [], isLoading, isError, error } = useApprovals();
    const approveMutation = useApproveRequest();
    const rejectMutation = useRejectRequest();

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedPerms, setSelectedPerms] = useState<Record<string, number[]>>({});
    const [showCreds, setShowCreds] = useState<{ open: boolean, data?: any }>({ open: false });
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    const pendingRequests = requests.filter((r: ApprovalRequest) => r.status === 'pending');

    const handleToggleExpand = (id: string, request: ApprovalRequest) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            setSelectedPerms({
                ...selectedPerms,
                [id]: request.requestedPermissions?.map((_, i) => i) || []
            });
        }
    };

    const togglePermSelection = (reqId: string, permIdx: number) => {
        const current = selectedPerms[reqId] || [];
        if (current.includes(permIdx)) {
            setSelectedPerms({ ...selectedPerms, [reqId]: current.filter(i => i !== permIdx) });
        } else {
            setSelectedPerms({ ...selectedPerms, [reqId]: [...current, permIdx] });
        }
    };

    const handleApprove = (req: ApprovalRequest) => {
        const selectedIndices = selectedPerms[req.id] || [];
        if (selectedIndices.length === 0) {
            alert("Please select at least one permission to approve.");
            return;
        }

        // const partial = selectedIndices.length < (req.requestedPermissions?.length || 0); // Unused
        const finalPerms = req.requestedPermissions?.filter((_: any, i: number) => selectedIndices.includes(i));

        approveMutation.mutate({
            id: req.id,
            status: 'approved', // API might handle partial status internally or we send 'partially_approved'
            partialPermissions: finalPerms
        });

        // Show mock credentials (in real app, this might come from API response)
        setShowCreds({
            open: true,
            data: {
                user: req.requester,
                tempPassword: Math.random().toString(36).substr(2, 12),
                host: 'sessiondb-prod-01.internal',
                port: 5432,
                expiry: req.type === 'TEMP_USER' ? '24 hours' : 'Permanent'
            }
        });
    };

    const handleReject = (reqId: string) => {
        if (confirm("Reject this request?")) {
            rejectMutation.mutate(reqId);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Pending Approvals</h1>
                    <p className={styles.pageSubtitle}>Review and manage requests for temporary access and role changes.</p>
                </div>
            </div>

            {isLoading && <div className={styles.loadingState}>Loading requests...</div>}
            {isError && <div className={styles.errorState}>Error loading requests: {(error as any)?.message || 'Unknown error'}</div>}

            {!isLoading && !isError && (
                <div className={styles.requestGrid}>
                    {pendingRequests.map((req: any) => (
                        <div key={req.id} className={`${styles.requestCard} ${expandedId === req.id ? styles.activeCard : ''}`}>
                            <div className={styles.reqMain} onClick={() => handleToggleExpand(req.id, req)}>
                                <div className={styles.reqHeader}>
                                    <div className={styles.reqIcon}>
                                        {req.type === 'TEMP_USER' ? <User size={20} /> : <Shield size={20} />}
                                    </div>
                                    <div className={styles.reqInfo}>
                                        <div className={styles.reqType}>
                                            {(req.type || 'UNKNOWN').replace('_', ' ')}
                                            {expandedId === req.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </div>
                                        <div className={styles.requester}>From: <strong>{req.requester}</strong></div>
                                    </div>
                                    <div className={styles.reqTimestamp}>{req.timestamp}</div>
                                </div>
                                <p className={styles.reqDesc}>{req.description}</p>

                                <div className={styles.reqMeta}>
                                    <div className={styles.reqBadge}>
                                        <Database size={14} /> {(req.requestedPermissions || []).length} Objects
                                    </div>
                                    {req.type === 'TEMP_USER' && (
                                        <div className={styles.reqBadge} style={{ color: '#ff9800' }}>
                                            <Clock size={14} /> Expires in 24h
                                        </div>
                                    )}
                                </div>
                            </div>

                            {expandedId === req.id && (
                                <div className={styles.reqDetails}>
                                    <div className={styles.divider}></div>
                                    <div className={styles.partialSection}>
                                        <div className={styles.detailsHeader}>
                                            <AlertCircle size={14} />
                                            <span>Select partitions to grant access (Partial Approval)</span>
                                        </div>
                                        <div className={styles.permsListDetail}>
                                            {req.requestedPermissions.map((perm: any, pIdx: number) => (
                                                <div key={pIdx} className={styles.permSelectItem}>
                                                    <input
                                                        type="checkbox"
                                                        checked={(selectedPerms[req.id] || []).includes(pIdx)}
                                                        onChange={() => togglePermSelection(req.id, pIdx)}
                                                    />
                                                    <div className={styles.permDisplay}>
                                                        <code>{perm.database}.{perm.table}</code>
                                                        <span className={styles.permPrivs}>{perm.privileges.join(', ')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.reqActions}>
                                        <button className={styles.rejectBtn} onClick={() => handleReject(req.id)}>
                                            <X size={16} /> Reject
                                        </button>
                                        <button className={styles.approveBtn} onClick={() => handleApprove(req)}>
                                            <Check size={16} />
                                            {(selectedPerms[req.id] || []).length < (req.requestedPermissions || []).length ? 'Partial Approve' : 'Approve Request'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {pendingRequests.length === 0 && (
                        <div className={styles.emptyState}>
                            <Check size={48} />
                            <h3>All clear!</h3>
                            <p>No pending access requests at the moment.</p>
                        </div>
                    )}
                </div>
            )}

            {showCreds.open && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} card`} style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className={styles.reqIcon} style={{ margin: '0 auto 16px', width: '64px', height: '64px' }}>
                            <Key size={32} />
                        </div>
                        <h2>Credentials Generated</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Access has been granted to <strong>{showCreds.data.user}</strong>. Please share these credentials securely.
                        </p>

                        <div className={styles.partialSection} style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)' }}>
                            <div className={styles.formGroup}>
                                <label>User</label>
                                <code>{showCreds.data.user}</code>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Temporary Password</label>
                                <code style={{ color: '#ffeb3b' }}>{showCreds.data.tempPassword}</code>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Host</label>
                                <code>{showCreds.data.host}:{showCreds.data.port}</code>
                            </div>
                        </div>

                        <button className="btn-primary" onClick={() => setShowCreds({ open: false })} style={{ width: '100%' }}>
                            Done
                        </button>
                    </div>
                </div>
            )}
            {isRequestModalOpen && (
                <RequestModal onClose={() => setIsRequestModalOpen(false)} />
            )}
        </div>
    );
};

export default Approvals;
