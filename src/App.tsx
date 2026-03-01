import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import QueryEditor from './pages/Query/Editor';
import UserManagement from './pages/Admin/Users';
import RoleManagement from './pages/Admin/Roles';
import Approvals from './pages/Admin/Approvals';
import InstanceManagement from './pages/Admin/Instances';
import Settings from './pages/Admin/Settings';
import AuditLogs from './pages/Logs/AuditLogs';
import Login from './pages/Login/Login';
import { useAuth } from './context/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>Loading...</div>; // Or a proper loading spinner
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const RoleProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles: string[] }> = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    const currentRoleName = typeof user?.role === 'string'
        ? user.role.toLowerCase()
        : user?.role?.dbKey?.toLowerCase() || 'viewer';

    if (!allowedRoles.includes(currentRoleName)) {
        return <Navigate to="/query" replace />;
    }

    return <>{children}</>;
};

import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index element={<Navigate to="/query" replace />} />
                    <Route path="query" element={<QueryEditor />} />
                    <Route path="admin" element={<RoleProtectedRoute allowedRoles={['super_admin', 'maintainer']}><Outlet /></RoleProtectedRoute>}>
                        <Route path="users" element={<UserManagement />} />
                        <Route path="roles" element={<RoleManagement />} />
                        <Route path="approvals" element={<Approvals />} />
                        <Route path="instances" element={<InstanceManagement />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                    <Route path="logs" element={
                        <RoleProtectedRoute allowedRoles={['super_admin', 'maintainer']}>
                            <AuditLogs />
                        </RoleProtectedRoute>
                    } />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ThemeProvider>
    );
};

export default App;
