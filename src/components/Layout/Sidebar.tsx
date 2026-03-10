// Copyright (c) 2026 Sai Mouli Bandari Licensed under Business Source License 1.1.
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Database,
    Terminal,
    Users,
    ShieldCheck,
    ClipboardCheck,
    History,
    LogOut,
    ChevronLeft,
    DatabaseZap,
    Bot,
    Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';
import { useAccess } from '../../context/AccessContext';
import styles from './Layout.module.css';

const Sidebar: React.FC = () => {
    const { user: currentUser, logout } = useAuth();
    const { isSidebarCollapsed, setSidebarCollapsed } = useLayout();
    const navigate = useNavigate();
    const { hasPermission, isFeatureEnabled } = useAccess();

    const handleLogout = (e: React.MouseEvent) => {
        e.stopPropagation();
        logout();
        navigate('/login');
    };

    const allMenuItems = [
        { name: 'Query Editor', path: '/query', icon: Terminal },
        { name: 'Query Insights', path: '/admin/insights', icon: Terminal, requiredFeature: 'query_insights' },
        {
            name: 'Admin Portal', path: '/admin', isParent: true, requiredPermission: 'users:read', children: [
                { name: 'Users', path: '/admin/users', icon: Users, requiredPermission: 'users:read' },
                { name: 'Roles', path: '/admin/roles', icon: ShieldCheck, requiredPermission: 'roles:manage' },
                { name: 'Approvals', path: '/admin/approvals', icon: ClipboardCheck, requiredPermission: 'approvals:manage' },
                { name: 'Instances', path: '/admin/instances', icon: DatabaseZap, requiredPermission: 'instances:manage' },
                { name: 'AI Config', path: '/admin/ai-config', icon: Bot },
                { name: 'DB Metrics', path: '/admin/metrics', icon: DatabaseZap, requiredFeature: 'db_metrics' },
                { name: 'Creds Expiry', path: '/admin/expiry', icon: ShieldCheck, requiredFeature: 'auto_creds_expiry' },
                { name: 'TTL Access', path: '/admin/ttl', icon: ClipboardCheck, requiredFeature: 'ttl_table_access' },
            ]
        },
        { name: 'Audit Logs', path: '/logs', icon: History, requiredPermission: 'logs:view', requiredFeature: 'audit_logs' },
    ];

    const canAccessMenuItem = (item: any) => {
        if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
            return false;
        }
        return true;
    };

    // Filter menu items based on scalable permissions
    const menuItems = allMenuItems
        .map(item => {
            if (item.isParent && item.children) {
                const filteredChildren = item.children.filter(canAccessMenuItem);
                if (filteredChildren.length === 0 || !canAccessMenuItem(item)) return null;
                return { ...item, children: filteredChildren };
            }
            return canAccessMenuItem(item) ? item : null;
        })
        .filter(Boolean) as typeof allMenuItems;

    if (!currentUser) return null;

    return (
        <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
            <button
                className={`${styles.collapseToggle} ${isSidebarCollapsed ? styles.collapsedToggle : ''}`}
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                <ChevronLeft size={14} />
            </button>

            <div className={styles.logoArea}>
                <Database size={24} className={styles.logoIcon} />
                <span className={styles.logoText}>SessionDB</span>
            </div>
            <nav className={styles.nav}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.name} className={styles.navSection}>
                            {item.isParent ? (
                                <>
                                    <div className={`${styles.navHeading} ${isSidebarCollapsed ? styles.collapsedHeading : ''}`}>
                                        {!isSidebarCollapsed && item.name}
                                    </div>
                                    <div className={styles.subMenu}>
                                        {item.children?.map((child) => {
                                            const ChildIcon = child.icon;
                                            const isLocked = child.requiredFeature && !isFeatureEnabled(child.requiredFeature);
                                            return (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    title={isSidebarCollapsed ? child.name : undefined}
                                                    className={({ isActive }) =>
                                                        `${styles.navLink} ${isActive ? styles.active : ''} ${isSidebarCollapsed ? styles.collapsedLink : ''}`
                                                    }
                                                >
                                                    <span className={styles.navLinkIconWrap}>
                                                        <ChildIcon size={18} />
                                                        {isSidebarCollapsed && isLocked && (
                                                            <span className={styles.lockBadge} aria-hidden>
                                                                <Lock size={6} />
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className={styles.navLinkLabel}>
                                                        {child.name}
                                                        {!isSidebarCollapsed && isLocked && <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
                                                    </span>
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                (() => {
                                    const isLocked = item.requiredFeature && !isFeatureEnabled(item.requiredFeature);
                                    return (
                                        <NavLink
                                            to={item.path}
                                            title={isSidebarCollapsed ? item.name : undefined}
                                            className={({ isActive }) =>
                                                `${styles.navLink} ${isActive ? styles.active : ''} ${isSidebarCollapsed ? styles.collapsedLink : ''}`
                                            }
                                        >
                                            {Icon && (
                                                <span className={styles.navLinkIconWrap}>
                                                    <Icon size={18} />
                                                    {isSidebarCollapsed && isLocked && (
                                                        <span className={styles.lockBadge} aria-hidden>
                                                            <Lock size={6} />
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                            <span className={styles.navLinkLabel}>
                                                {item.name}
                                                {!isSidebarCollapsed && isLocked && <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
                                            </span>
                                        </NavLink>
                                    );
                                })()
                            )}
                        </div>
                    );
                })}
            </nav>
            <div className={styles.footer}>
                <div
                    className={styles.userProfile}
                    onClick={() => navigate('/admin/settings')}
                    style={{ cursor: 'pointer' }}
                    title="Account Settings"
                >
                    <div className={styles.avatar}>{currentUser?.name?.charAt(0).toUpperCase() || 'U'}</div>
                    <div className={`${styles.userInfo} ${isSidebarCollapsed ? styles.collapsedUserInfo : ''}`}>
                        <span className={styles.userName}>{currentUser.name}</span>
                        <span className={styles.userRole}>
                            {typeof currentUser.role === 'string' ? currentUser.role : currentUser.role?.name || ''}
                        </span>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn} title="Sign Out">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
