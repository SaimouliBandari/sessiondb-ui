// Copyright (c) 2026 Sai Mouli Bandari Licensed under Business Source License 1.1.
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './Layout.module.css';
import { useLayout } from '../../context/LayoutContext';

const Layout: React.FC = () => {
    const { isSidebarCollapsed, setSidebarCollapsed } = useLayout();
    const location = useLocation();
    const isQueryTab = location.pathname === '/query';

    return (
        <div className={styles.layout}>
            <Sidebar />
            <button
                type="button"
                className={`${styles.collapseToggle} ${isSidebarCollapsed ? styles.collapsedToggle : ''}`}
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
                <ChevronLeft size={14} />
            </button>
            <main className={`${styles.mainContent} ${isSidebarCollapsed ? styles.mainContentExpanded : ''}`}>
                <Header />
                <div className={`${styles.contentArea} ${isQueryTab ? styles.noPadding : ''}`}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
