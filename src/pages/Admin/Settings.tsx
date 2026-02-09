import React from 'react';
import styles from './Admin.module.css';
import { useTheme } from '../../context/ThemeContext';
import { Check, Palette } from 'lucide-react';

const Settings: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Settings</h1>
                    <p className={styles.pageSubtitle}>Manage application preferences and appearance</p>
                </div>
            </div>

            <div className={styles.formSection}>
                <div className={styles.detailsHeader}>
                    <Palette size={18} />
                    <span>Appearance</span>
                </div>

                <div className={styles.formGroup}>
                    <label>Interface Theme</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>

                        {/* Default Theme Card */}
                        <div
                            className={`${styles.compactRoleCard} ${theme === 'default' ? styles.activeCard : ''}`}
                            style={{ cursor: 'pointer', minHeight: 'auto' }}
                            onClick={() => setTheme('default')}
                        >
                            <div className={styles.roleHeaderCompact}>
                                <div className={styles.roleIconCompact} style={{ background: '#1e3d99', color: '#8cb3ff' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#3260e7', borderRadius: '50%' }} />
                                </div>
                                <div className={styles.roleInfoCompact}>
                                    <h3>Default Blue</h3>
                                    <div className={styles.roleStatsCompact}>
                                        <span>Standard system theme</span>
                                    </div>
                                </div>
                                {theme === 'default' && (
                                    <div style={{ marginLeft: 'auto', color: 'var(--primary)' }}>
                                        <Check size={18} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amber Theme Card */}
                        <div
                            className={`${styles.compactRoleCard} ${theme === 'amber' ? styles.activeCard : ''}`}
                            style={{ cursor: 'pointer', minHeight: 'auto', borderColor: theme === 'amber' ? '#dd8a3c' : undefined }}
                            onClick={() => setTheme('amber')}
                        >
                            <div className={styles.roleHeaderCompact}>
                                <div className={styles.roleIconCompact} style={{ background: '#3d2511', color: '#f2ac70' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#dd8a3c', borderRadius: '50%' }} />
                                </div>
                                <div className={styles.roleInfoCompact}>
                                    <h3>Amber Dusk</h3>
                                    <div className={styles.roleStatsCompact}>
                                        <span>Warm, high contrast theme</span>
                                    </div>
                                </div>
                                {theme === 'amber' && (
                                    <div style={{ marginLeft: 'auto', color: '#dd8a3c' }}>
                                        <Check size={18} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Light Theme (Blue) Card */}
                        <div
                            className={`${styles.compactRoleCard} ${theme === 'light-blue' ? styles.activeCard : ''}`}
                            style={{
                                cursor: 'pointer',
                                minHeight: 'auto',
                                borderColor: theme === 'light-blue' ? '#3260e7' : undefined,
                                background: '#fcfcfd' // Preview bg
                            }}
                            onClick={() => setTheme('light-blue')}
                        >
                            <div className={styles.roleHeaderCompact}>
                                <div className={styles.roleIconCompact} style={{ background: '#f9f9fb', border: '1px solid #d8d9e0', color: '#1e1f24' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#3260e7', borderRadius: '50%' }} />
                                </div>
                                <div className={styles.roleInfoCompact}>
                                    <h3 style={{ color: '#1e1f24' }}>Light (Blue)</h3>
                                    <div className={styles.roleStatsCompact}>
                                        <span style={{ color: '#8b8d98' }}>Standard light theme</span>
                                    </div>
                                </div>
                                {theme === 'light-blue' && (
                                    <div style={{ marginLeft: 'auto', color: '#3260e7' }}>
                                        <Check size={18} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Light Theme (Amber) Card */}
                        <div
                            className={`${styles.compactRoleCard} ${theme === 'light-amber' ? styles.activeCard : ''}`}
                            style={{
                                cursor: 'pointer',
                                minHeight: 'auto',
                                borderColor: theme === 'light-amber' ? '#dd8a3c' : undefined,
                                background: '#fcfcfd'
                            }}
                            onClick={() => setTheme('light-amber')}
                        >
                            <div className={styles.roleHeaderCompact}>
                                <div className={styles.roleIconCompact} style={{ background: '#f9f9fb', border: '1px solid #d8d9e0', color: '#1e1f24' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#dd8a3c', borderRadius: '50%' }} />
                                </div>
                                <div className={styles.roleInfoCompact}>
                                    <h3 style={{ color: '#1e1f24' }}>Light (Amber)</h3>
                                    <div className={styles.roleStatsCompact}>
                                        <span style={{ color: '#8b8d98' }}>Warm light theme</span>
                                    </div>
                                </div>
                                {theme === 'light-amber' && (
                                    <div style={{ marginLeft: 'auto', color: '#dd8a3c' }}>
                                        <Check size={18} />
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
