import React, { useState } from 'react';
import { X, KeyRound, AlertTriangle, ExternalLink } from 'lucide-react';
import { useVerifyCredential } from '../../hooks/useQueryData';
import styles from './Query.module.css';

interface CredentialGateModalProps {
    instanceId: string;
    instanceName?: string;
    onSuccess: () => void;  // called after creds verified — parent should re-execute
    onClose: () => void;
}

const CredentialGateModal: React.FC<CredentialGateModalProps> = ({ instanceId, instanceName, onSuccess, onClose }) => {
    const [dbPassword, setDbPassword] = useState('');
    const { mutate: verify, isPending, error, isError } = useVerifyCredential();

    const handleVerify = () => {
        if (!dbPassword.trim()) return;
        verify(
            { instanceId, dbPassword },
            {
                onSuccess: () => {
                    onSuccess();
                }
            }
        );
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '460px', width: '90%' }}>
                {/* header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '10px',
                            background: 'rgba(251, 191, 36, 0.12)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <KeyRound size={18} style={{ color: '#fbbf24' }} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Database Credentials Required</h3>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {instanceName || 'Selected instance'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* warning banner */}
                <div style={{
                    display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '8px',
                    background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)',
                    marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5
                }}>
                    <AlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                    <span>
                        You don't have active credentials for this instance.
                        If your credentials were shared earlier, enter them below.
                        Otherwise, please <strong style={{ color: 'var(--text)' }}>contact your admin</strong> or
                        <a href="/admin/approvals" style={{ color: '#3b82f6', marginLeft: '4px', textDecoration: 'none' }}>
                            raise an access request <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
                        </a>.
                    </span>
                </div>

                {/* form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.25rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>DB Password</label>
                        <input
                            type="password"
                            value={dbPassword}
                            onChange={(e) => setDbPassword(e.target.value)}
                            placeholder="••••••••"
                            autoFocus
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '8px',
                                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                color: 'var(--text)', fontSize: '0.88rem',
                                outline: 'none', boxSizing: 'border-box'
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
                        />
                    </div>
                </div>

                {/* error */}
                {isError && (
                    <div style={{
                        padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem',
                        background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '0.82rem', color: '#ef4444'
                    }}>
                        {(error as any)?.response?.data?.error || (error as any)?.message || 'Invalid credentials. Please try again.'}
                    </div>
                )}

                {/* actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Cancel</button>
                    <button
                        onClick={handleVerify}
                        className="btn-primary"
                        disabled={isPending || !dbPassword.trim()}
                        style={{ padding: '8px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <KeyRound size={14} />
                        {isPending ? 'Verifying...' : 'Verify & Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CredentialGateModal;
