import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Save, Search, Table, Database, ChevronRight, X, Plus, FileText, Clock, PanelLeft, PanelRight, AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './Query.module.css';
import { useLayout } from '../../context/LayoutContext';
import { useSavedScripts, useSaveScript, useQueryTabs, useUpdateTabs, useExecuteQuery } from '../../hooks/useQueryData';
import { useSchema } from '../../hooks/useSchema';
import { useInstance } from '../../context/InstanceContext';;


const SQLQueryEditor: React.FC = () => {
    const { setSidebarCollapsed } = useLayout();
    const { currentInstanceId } = useInstance();
    const { data: savedScripts = [], isLoading: scriptsLoading } = useSavedScripts();
    const { mutate: saveScript } = useSaveScript();
    const { data: tabs = [], isLoading: tabsLoading } = useQueryTabs();
    const { mutate: updateTabs } = useUpdateTabs();
    const { mutate: executeQuery, isPending: isExecuting } = useExecuteQuery(currentInstanceId);
    const { data: schemaData, isLoading: schemaLoading, refetch: refetchSchema, isRefetching: isRefetchingSchema } = useSchema(currentInstanceId);


    // Internal Sidebars Toggle State - Defaulting to collapsed as requested
    const [explorerCollapsed, setExplorerCollapsed] = useState(true);
    const [libraryCollapsed, setLibraryCollapsed] = useState(true);

    useEffect(() => {
        // Auto-collapse main Sidebar when entering Query mode
        setSidebarCollapsed(true);
    }, [setSidebarCollapsed]);

    const activeTabId = tabs.find((t: any) => t.isActive)?.id || tabs[0]?.id;
    const activeTab = tabs.find((t: any) => t.id === activeTabId);

    const [results, setResults] = useState<any[]>([]);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [showAutocomplete, setShowAutocomplete] = useState(false);

    const editorRef = useRef<HTMLTextAreaElement>(null);

    const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INSERT', 'UPDATE', 'DELETE', 'LIMIT', 'GROUP BY', 'ORDER BY'];

    const handleExecute = () => {
        if (!activeTab) return;
        setQueryError(null);
        setResults([]);

        executeQuery(activeTab.query, {
            onSuccess: (data) => {
                setResults(data);
            },
            onError: (err: any) => {
                console.error("Query failed:", err);
                setQueryError(err?.response?.data?.error || err?.message || "An unknown error occurred while executing the query.");
            }
        });
    };

    const handleQueryChange = (val: string) => {
        if (!activeTabId) return;
        const updatedTabs = tabs.map((t: any) => t.id === activeTabId ? { ...t, query: val } : t);
        updateTabs(updatedTabs);
    };

    const addTab = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newTab = { id: newId, name: `Untitled ${tabs.length + 1}`, query: '', isActive: true };
        const updatedTabs = tabs.map((t: any) => ({ ...t, isActive: false })).concat(newTab);
        updateTabs(updatedTabs);
    };

    const closeTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (tabs.length === 1) return;

        let updatedTabs = tabs.filter((t: any) => t.id !== id);
        if (id === activeTabId && updatedTabs.length > 0) {
            updatedTabs[updatedTabs.length - 1].isActive = true;
        }
        updateTabs(updatedTabs);
    };

    const setActiveTab = (id: string) => {
        const updatedTabs = tabs.map((t: any) => ({ ...t, isActive: t.id === id }));
        updateTabs(updatedTabs);
    };

    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [newScriptName, setNewScriptName] = useState('');

    const handleSaveClick = () => {
        if (!activeTab) return;
        setNewScriptName(activeTab.name);
        setIsSaveModalOpen(true);
    };

    const handleSaveConfirm = () => {
        if (newScriptName.trim() && activeTab) {
            saveScript({ name: newScriptName, query: activeTab.query || '' });
            setIsSaveModalOpen(false);
        }
    };

    const loadScript = (script: any) => {
        const newTab = { id: Math.random().toString(36).substr(2, 9), name: script.name, query: script.query, isActive: true };
        const updatedTabs = tabs.map((t: any) => ({ ...t, isActive: false })).concat(newTab);
        updateTabs(updatedTabs);
    };

    return (
        <div className={styles.queryPage}>
            {isSaveModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Save Script</h3>
                        <input
                            type="text"
                            value={newScriptName}
                            onChange={(e) => setNewScriptName(e.target.value)}
                            placeholder="Enter script name..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveConfirm();
                                if (e.key === 'Escape') setIsSaveModalOpen(false);
                            }}
                        />
                        <div className={styles.modalActions}>
                            <button className={`${styles.modalBtn} ${styles.cancelBtn}`} onClick={() => setIsSaveModalOpen(false)}>Cancel</button>
                            <button className={`${styles.modalBtn} ${styles.confirmBtn}`} onClick={handleSaveConfirm}>Save Script</button>
                        </div>
                    </div>
                </div>
            )}

            <aside className={`${styles.schemaExplorer} ${explorerCollapsed ? styles.explorerCollapsed : ''}`}>
                <div className={styles.explorerHeader}>
                    <div className={styles.headerText}>
                        <Database size={16} />
                        {!explorerCollapsed && <span>Schema Explorer</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {!explorerCollapsed && (
                            <button className={styles.panelToggle} onClick={() => refetchSchema()} title="Refresh Schema" disabled={schemaLoading || isRefetchingSchema}>
                                <RefreshCw size={14} className={(schemaLoading || isRefetchingSchema) ? 'spin' : ''} />
                            </button>
                        )}
                        <button className={styles.panelToggle} onClick={() => setExplorerCollapsed(!explorerCollapsed)} title={explorerCollapsed ? "Expand Explorer" : "Collapse Explorer"}>
                            {explorerCollapsed ? <PanelRight size={16} /> : <PanelLeft size={16} />}
                        </button>
                    </div>
                </div>
                {!explorerCollapsed && (
                    <>
                        <div className={styles.explorerSearch}>
                            <Search size={14} />
                            <input type="text" placeholder="Find tables..." />
                        </div>
                        <div className={styles.schemaList}>
                            {schemaLoading && <div className={styles.loadingItem}>Loading schema...</div>}
                            {schemaData?.databases?.map((db: any) => (
                                <details key={db.database} className={styles.schemaItem} open>
                                    <summary>
                                        <ChevronRight size={14} className={styles.toggleIcon} />
                                        <Database size={14} />
                                        <span>{db.database}</span>
                                    </summary>
                                    <div style={{ marginLeft: '12px' }}>
                                        {db.tables?.map((table: any) => (
                                            <details key={table.id} className={styles.schemaItem}>
                                                <summary>
                                                    <ChevronRight size={14} className={styles.toggleIcon} />
                                                    <Table size={14} />
                                                    <span>{table.name}</span>
                                                </summary>
                                                <ul className={styles.columnList}>
                                                    {table.columns?.map((col: any) => (
                                                        <li key={col.id}>
                                                            {col.name}
                                                            {col.dataType && <span className={styles.colType}>{col.dataType}</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </details>
                                        ))}
                                    </div>
                                </details>
                            ))}

                            {!schemaLoading && (!schemaData || !schemaData.databases || schemaData.databases.length === 0) && (
                                <div className={styles.emptyState}>No databases found.</div>
                            )}

                        </div>
                    </>
                )}
            </aside>

            <div className={styles.editorMain}>
                {tabsLoading ? (
                    <div className={styles.tabLoadingOverlay}>
                        <div className={styles.spinner}></div>
                        <span>Initializing tabs...</span>
                    </div>
                ) : (
                    <>
                        <div className={styles.tabBar}>
                            {tabs.map((tab: any) => (
                                <div
                                    key={tab.id}
                                    className={`${styles.tab} ${tab.id === activeTabId ? styles.activeTab : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <FileText size={14} />
                                    <span>{tab.name}</span>
                                    {tabs.length > 1 && (
                                        <button className={styles.closeTab} onClick={(e) => closeTab(tab.id, e)}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button className={styles.newTabBtn} onClick={addTab} title="New Tab">
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className={styles.editorToolbar}>
                            <button className={`${styles.toolBtn} ${styles.runBtn}`} onClick={handleExecute} disabled={isExecuting || !activeTab}>
                                <Play size={16} fill="currentColor" />
                                {isExecuting ? 'Running...' : 'Run Query'}
                            </button>
                            <button className={styles.toolBtn}>
                                <RotateCcw size={16} />
                                Format
                            </button>
                            <button className={styles.toolBtn} onClick={handleSaveClick} disabled={!activeTab}>
                                <Save size={16} />
                                Save
                            </button>
                        </div>

                        <div className={styles.editorContainer}>
                            <textarea
                                ref={editorRef}
                                className={styles.sqlInput}
                                value={activeTab?.query || ''}
                                onChange={(e) => handleQueryChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === ' ' && e.ctrlKey) setShowAutocomplete(true);
                                }}
                                placeholder="-- Write your SQL query here
SELECT * FROM users;"
                                spellCheck={false}
                            />
                            {showAutocomplete && (
                                <div className={styles.autocompleteOverlay} style={{ top: 20, left: 20 }}>
                                    {keywords.map(k => (
                                        <div key={k} className={styles.suggestion} onClick={() => {
                                            handleQueryChange((activeTab?.query || '') + k + ' ');
                                            setShowAutocomplete(false);
                                        }}>{k}</div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.resultsArea}>
                            <div className={styles.resultsHeader}>
                                <span>Query Results {results.length > 0 && `(${results.length})`}</span>
                            </div>
                            {isExecuting ? (
                                <div className={styles.emptyResults}>
                                    <div className={styles.spinner}></div>
                                    <p>Executing query...</p>
                                </div>
                            ) : queryError ? (
                                <div className={styles.errorResults}>
                                    <AlertTriangle size={48} color="var(--error)" />
                                    <p className={styles.errorText}>{queryError}</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className={styles.tableWrapper}>
                                    <table className={styles.resultsTable}>
                                        <thead>
                                            <tr>
                                                {results[0] && Object.keys(results[0]).map(key => (
                                                    <th key={key}>{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).map((val: any, j) => (
                                                        <td key={j}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className={styles.emptyResults}>
                                    <Database size={48} className={styles.emptyIcon} />
                                    <p>Execute a query to see results here.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <aside className={`${styles.scriptLibrary} ${libraryCollapsed ? styles.libraryCollapsed : ''}`}>
                <div className={styles.explorerHeader}>
                    <button className={styles.panelToggle} onClick={() => setLibraryCollapsed(!libraryCollapsed)} title={libraryCollapsed ? "Expand Scripts" : "Collapse Scripts"}>
                        {libraryCollapsed ? <PanelLeft size={16} /> : <PanelRight size={16} />}
                    </button>
                    <div className={styles.headerText}>
                        {!libraryCollapsed && <span>Saved Scripts</span>}
                        <Clock size={16} />
                    </div>
                </div>
                {!libraryCollapsed && (
                    <div className={styles.schemaList}>
                        {scriptsLoading ? (
                            <div className={styles.loadingItem}>Loading scripts...</div>
                        ) : (
                            savedScripts.map((script: any) => (
                                <div key={script.id} className={styles.scriptItem} onClick={() => loadScript(script)}>
                                    <span className={styles.scriptName}>{script.name}</span>
                                    <span className={styles.scriptMeta}>{script.timestamp}</span>
                                </div>
                            ))
                        )}
                        {!scriptsLoading && savedScripts.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                No saved scripts yet.
                            </div>
                        )}
                    </div>
                )}
            </aside>
        </div>
    );
};

export default SQLQueryEditor;
