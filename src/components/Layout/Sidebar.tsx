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
    DatabaseZap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';
import styles from './Layout.module.css';

const Sidebar: React.FC = () => {
    const { user: currentUser, logout } = useAuth();
    const { isSidebarCollapsed, setSidebarCollapsed } = useLayout();
    const navigate = useNavigate();

    const handleLogout = (e: React.MouseEvent) => {
        e.stopPropagation();
        logout();
        navigate('/login');
    };

    const allMenuItems = [
        { name: 'Query Editor', path: '/query', icon: Terminal, allowedRoles: ['super_admin', 'maintainer', 'viewer'] },
        {
            name: 'Admin Portal', path: '/admin', isParent: true, allowedRoles: ['super_admin', 'maintainer'], children: [
                { name: 'Users', path: '/admin/users', icon: Users, allowedRoles: ['super_admin', 'maintainer'] },
                { name: 'Roles', path: '/admin/roles', icon: ShieldCheck, allowedRoles: ['super_admin', 'maintainer'] },
                { name: 'Approvals', path: '/admin/approvals', icon: ClipboardCheck, allowedRoles: ['super_admin', 'maintainer'] },
                { name: 'Instances', path: '/admin/instances', icon: DatabaseZap, allowedRoles: ['super_admin', 'maintainer'] },
            ]
        },
        { name: 'Audit Logs', path: '/logs', icon: History, allowedRoles: ['super_admin', 'maintainer'] },
    ];

    const currentRoleName = typeof currentUser?.role === 'string'
        ? currentUser.role.toLowerCase()
        : currentUser?.role?.dbKey?.toLowerCase() || 'viewer';

    const hasAccess = (allowedRoles?: string[]) => !allowedRoles || allowedRoles.includes(currentRoleName);

    // Filter menu items based on static roles
    const menuItems = allMenuItems
        .map(item => {
            if (item.isParent && item.children) {
                const filteredChildren = item.children.filter(c => hasAccess(c.allowedRoles));
                if (filteredChildren.length === 0 || !hasAccess(item.allowedRoles)) return null;
                return { ...item, children: filteredChildren };
            }
            return hasAccess(item.allowedRoles) ? item : null;
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
                <span className={`${styles.logoText} ${isSidebarCollapsed ? styles.collapsedText : ''}`}>SessionDB</span>
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
                                            return (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    title={isSidebarCollapsed ? child.name : undefined}
                                                    className={({ isActive }) =>
                                                        `${styles.navLink} ${isActive ? styles.active : ''} ${isSidebarCollapsed ? styles.collapsedLink : ''}`
                                                    }
                                                >
                                                    <ChildIcon size={18} />
                                                    <span className={isSidebarCollapsed ? styles.collapsedText : ''}>{child.name}</span>
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    title={isSidebarCollapsed ? item.name : undefined}
                                    className={({ isActive }) =>
                                        `${styles.navLink} ${isActive ? styles.active : ''} ${isSidebarCollapsed ? styles.collapsedLink : ''}`
                                    }
                                >
                                    {Icon && <Icon size={18} />}
                                    <span className={isSidebarCollapsed ? styles.collapsedText : ''}>{item.name}</span>
                                </NavLink>
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
