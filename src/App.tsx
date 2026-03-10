// Copyright (c) 2026 Sai Mouli Bandari Licensed under Business Source License 1.1.
import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import QueryEditor from './pages/Query/Editor';
import UserManagement from './pages/Admin/Users';
import RoleManagement from './pages/Admin/Roles';
import Approvals from './pages/Admin/Approvals';
import InstanceManagement from './pages/Admin/Instances';
import Settings from './pages/Admin/Settings';
import SettingsAIConfig from './pages/Admin/SettingsAIConfig';
import AuditLogs from './pages/Logs/AuditLogs';
import Login from './pages/Login/Login';
import { useAuth } from './context/AuthContext';
import { AccessProvider } from './context/AccessContext';
import { PermissionGate } from './components/AccessControl/PermissionGate';
import { FeatureGate } from './components/AccessControl/FeatureGate';
import { ThemeProvider } from './context/ThemeContext';

import { PremiumRegistry } from './features/premium-registry';

const { QueryInsights, DBMetrics, AutoCredsExpiry, TTLTableAccess } = PremiumRegistry;

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

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AccessProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                        <Route index element={<Navigate to="/query" replace />} />
                        <Route path="query" element={<QueryEditor />} />
                        <Route path="admin" element={
                            <PermissionGate requiredAny={['users:read', 'roles:manage', 'instances:manage', 'approvals:manage']} fallback={<Navigate to="/query" replace />}>
                                <Outlet />
                            </PermissionGate>
                        }>
                            {/* Standard Core Admin Features */}
                            <Route path="users" element={
                                <PermissionGate required="users:read" fallback={<Navigate to="/query" replace />}>
                                    <UserManagement />
                                </PermissionGate>
                            } />
                            <Route path="roles" element={
                                <PermissionGate required="roles:manage" fallback={<Navigate to="/query" replace />}>
                                    <RoleManagement />
                                </PermissionGate>
                            } />
                            <Route path="approvals" element={
                                <PermissionGate required="approvals:manage" fallback={<Navigate to="/query" replace />}>
                                    <Approvals />
                                </PermissionGate>
                            } />
                            <Route path="instances" element={
                                <PermissionGate required="instances:manage" fallback={<Navigate to="/query" replace />}>
                                    <InstanceManagement />
                                </PermissionGate>
                            } />
                            <Route path="settings" element={<Settings />} />
                            <Route path="ai-config" element={<SettingsAIConfig />} />

                            {/* Pro Admin Features */}
                            <Route path="insights" element={
                                <FeatureGate featureKey="query_insights">
                                    <Suspense fallback={<div>Loading insights...</div>}>
                                        <QueryInsights />
                                    </Suspense>
                                </FeatureGate>
                            } />
                            <Route path="metrics" element={
                                <FeatureGate featureKey="db_metrics">
                                    <Suspense fallback={<div>Loading metrics...</div>}>
                                        <DBMetrics />
                                    </Suspense>
                                </FeatureGate>
                            } />
                            <Route path="expiry" element={
                                <FeatureGate featureKey="auto_creds_expiry">
                                    <Suspense fallback={<div>Loading configuration...</div>}>
                                        <AutoCredsExpiry />
                                    </Suspense>
                                </FeatureGate>
                            } />
                            <Route path="ttl" element={
                                <FeatureGate featureKey="ttl_table_access">
                                    <Suspense fallback={<div>Loading configuration...</div>}>
                                        <TTLTableAccess />
                                    </Suspense>
                                </FeatureGate>
                            } />
                        </Route>

                        {/* Logs Feature */}
                        <Route path="logs" element={
                            <PermissionGate required="logs:view" fallback={<Navigate to="/query" replace />}>
                                <FeatureGate featureKey="audit_logs">
                                    <AuditLogs />
                                </FeatureGate>
                            </PermissionGate>
                        } />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AccessProvider>
        </ThemeProvider>
    );
};

export default App;
