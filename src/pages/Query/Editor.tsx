import React, { useState, useEffect, useMemo } from 'react';
import { Play, RotateCcw, Save, Search, Table, Database, ChevronRight, X, Plus, FileText, Clock, PanelLeft, PanelRight, AlertTriangle, RefreshCw, Maximize2, Minimize2, ChevronLeft } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import styles from './Query.module.css';
import { useLayout } from '../../context/LayoutContext';
import { useSavedScripts, useSaveScript, useQueryTabs, useUpdateTabs, useExecuteQuery } from '../../hooks/useQueryData';
import { useSchema } from '../../hooks/useSchema';
import { useInstance } from '../../context/InstanceContext';;

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);



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
    const [isFocusedMode, setIsFocusedMode] = useState(false);
    const [editorHeight, setEditorHeight] = useState(300);
    const [isDragging, setIsDragging] = useState(false);

    // Results State
    const [results, setResults] = useState<any[]>([]);
    const [columnNames, setColumnNames] = useState<string[]>([]);
    const [queryError, setQueryError] = useState<string | null>(null);

    // Local Tabs State for snappy UI
    const [localTabs, setLocalTabs] = useState<any[]>([]);
    const [localActiveTabId, setLocalActiveTabId] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const pageSizeOptions = [10, 15, 25, 50, 100];

    useEffect(() => {
        if (tabs.length > 0 && localTabs.length === 0) {
            setLocalTabs(tabs);
            const activeId = tabs.find((t: any) => t.isActive)?.id || tabs[0]?.id;
            setLocalActiveTabId(activeId);
        }
    }, [tabs]);

    useEffect(() => {
        // Auto-collapse main Sidebar when entering Query mode
        setSidebarCollapsed(true);
    }, [setSidebarCollapsed]);

    const activeTab = localTabs.find((t: any) => t.id === localActiveTabId);

    const handleExecute = () => {
        if (!activeTab) return;
        setQueryError(null);
        setResults([]);
        setCurrentPage(1);

        executeQuery(activeTab.query, {
            onSuccess: (data) => {
                // Handle different response formats
                if (data.columns && data.rows) {
                    // Backend returns { columns: string[], rows: any[][] }
                    setColumnNames(data.columns);
                    // Transform array rows to objects with column names as keys
                    const transformedRows = data.rows.map((row: any[]) => {
                        const obj: any = {};
                        data.columns.forEach((col: string, idx: number) => {
                            obj[col] = row[idx];
                        });
                        return obj;
                    });
                    setResults(transformedRows);
                } else if (Array.isArray(data)) {
                    // Backend returns array of objects directly
                    setResults(data);
                    if (data.length > 0) {
                        setColumnNames(Object.keys(data[0]));
                    }
                } else {
                    // Fallback
                    setResults([]);
                    setColumnNames([]);
                }
            },
            onError: (err: any) => {
                console.error("Query failed:", err);
                setQueryError(err?.response?.data?.error || err?.message || "An unknown error occurred while executing the query.");
            }
        });
    };

    const handleQueryChange = (val: string) => {
        if (!localActiveTabId) return;
        setLocalTabs(prev => prev.map(t => t.id === localActiveTabId ? { ...t, query: val } : t));
    };

    const handleSyncTabs = () => {
        updateTabs(localTabs.map(t => ({ ...t, isActive: t.id === localActiveTabId })));
    };

    const addTab = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newTab = { id: newId, name: `Untitled ${localTabs.length + 1}`, query: '', isActive: true };
        const updatedTabs = localTabs.map((t: any) => ({ ...t, isActive: false })).concat(newTab);
        setLocalTabs(updatedTabs);
        setLocalActiveTabId(newId);
    };

    const closeTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (localTabs.length === 1) return;

        let updatedTabs = localTabs.filter((t: any) => t.id !== id);
        if (id === localActiveTabId && updatedTabs.length > 0) {
            setLocalActiveTabId(updatedTabs[updatedTabs.length - 1].id);
        }
        setLocalTabs(updatedTabs);
    };

    const setActiveTabLocal = (id: string) => {
        setLocalActiveTabId(id);
        setLocalTabs(prev => prev.map(t => ({ ...t, isActive: t.id === id })));
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
        const newId = Math.random().toString(36).substr(2, 9);
        const newTab = { id: newId, name: script.name, query: script.query, isActive: true };
        const updatedTabs = localTabs.map((t: any) => ({ ...t, isActive: false })).concat(newTab);
        setLocalTabs(updatedTabs);
        setLocalActiveTabId(newId);
    };

    const handleTableClick = (db: string, table: string) => {
        const selectQuery = `SELECT * FROM ${db}.${table} LIMIT 100;`;
        if (activeTab) {
            handleQueryChange(selectQuery);
        } else {
            const newId = Math.random().toString(36).substr(2, 9);
            const newTab = { id: newId, name: table, query: selectQuery, isActive: true };
            const updatedTabs = localTabs.map((t: any) => ({ ...t, isActive: false })).concat(newTab);
            setLocalTabs(updatedTabs);
            setLocalActiveTabId(newId);
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(results.length / pageSize);
    const paginatedResults = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // AG Grid Column Definitions
    const columnDefs = useMemo(() => {
        if (results.length === 0) return [];
        return Object.keys(results[0]).map(key => ({
            field: key,
            headerName: key,
            sortable: true,
            filter: true,
            resizable: true,
            flex: 1,
            minWidth: 120,
            cellRenderer: (params: any) => {
                const value = params.value;
                if (value === null || value === undefined) return 'null';
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
            }
        }));
    }, [results]);

    // Resize Logic
    const startDragging = (e: React.MouseEvent) => {
        setIsDragging(true);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            // Calculate new height based on mouse position relative to the main container
            // For simplicity, we use e.clientY minus some offset if needed, 
            // but since it's a top-bottom split, we can just use e.clientY - header_offset
            const newHeight = Math.max(100, Math.min(window.innerHeight - 200, e.clientY - 64));
            setEditorHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div className={`${styles.queryPage} ${isFocusedMode ? styles.focusedMode : ''} ${isDragging ? styles.noSelect : ''}`}>
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
                                                <summary onClick={() => handleTableClick(db.database, table.name)}>
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
                            {localTabs.map((tab: any) => (
                                <div
                                    key={tab.id}
                                    className={`${styles.tab} ${tab.id === localActiveTabId ? styles.activeTab : ''}`}
                                    onClick={() => setActiveTabLocal(tab.id)}
                                >
                                    <FileText size={14} />
                                    <span>{tab.name}</span>
                                    {localTabs.length > 1 && (
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
                            <div style={{ flex: 1 }}></div>
                            <button className={styles.toolBtn} onClick={handleSyncTabs} title="Sync tabs with server">
                                <RefreshCw size={14} />
                                Sync
                            </button>
                        </div>

                        <div className={styles.editorContainer} style={{ height: editorHeight }}>
                            <Editor
                                height="100%"
                                defaultLanguage="sql"
                                value={activeTab?.query || ''}
                                onChange={(val) => handleQueryChange(val || '')}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    tabSize: 2,
                                    wordWrap: 'on',
                                    suggestOnTriggerCharacters: true,
                                    quickSuggestions: true,
                                    padding: { top: 10, bottom: 10 }
                                }}
                                onMount={(_editor, monaco) => {
                                    // Dispose of any previous completion providers to prevent duplicates on remount
                                    // Note: In a real app we might want to track the disposable, but for now this is safe
                                    // as the component unmounts cleans up nicely usually.

                                    // Register SQL completion provider
                                    monaco.languages.registerCompletionItemProvider('sql', {
                                        provideCompletionItems: (model: any, position: any) => {
                                            const word = model.getWordUntilPosition(position);
                                            const range = {
                                                startLineNumber: position.lineNumber,
                                                endLineNumber: position.lineNumber,
                                                startColumn: word.startColumn,
                                                endColumn: word.endColumn
                                            };

                                            const suggestions: any[] = [];

                                            // 1. SQL Keywords
                                            const keywords = [
                                                'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'OFFSET',
                                                'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
                                                'DROP', 'ALTER', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER',
                                                'ON', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'AND', 'OR',
                                                'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'HAVING', 'CASE', 'WHEN',
                                                'THEN', 'ELSE', 'END', 'EXISTS', 'UNION', 'ALL', 'PRIMARY', 'KEY', 'FOREIGN',
                                                'REFERENCES', 'DEFAULT', 'CONSTRAINT', 'CHECK', 'UNIQUE', 'Show', 'describe'
                                            ];

                                            keywords.forEach(kw => {
                                                suggestions.push({
                                                    label: kw,
                                                    kind: monaco.languages.CompletionItemKind.Keyword,
                                                    insertText: kw,
                                                    range: range
                                                });
                                            });

                                            // 2. Schema Tables & Columns
                                            if (schemaData?.databases) {
                                                schemaData.databases.forEach((db: any) => {
                                                    if (db.tables) {
                                                        db.tables.forEach((table: any) => {
                                                            // Add Table Name
                                                            suggestions.push({
                                                                label: table.name,
                                                                kind: monaco.languages.CompletionItemKind.Class,
                                                                detail: `Table in ${db.database}`,
                                                                insertText: table.name,
                                                                range: range
                                                            });

                                                            // Add Columns (prefixed with table name for clarity in list, or just col name)
                                                            if (table.columns) {
                                                                table.columns.forEach((col: any) => {
                                                                    suggestions.push({
                                                                        label: col.name,
                                                                        kind: monaco.languages.CompletionItemKind.Field,
                                                                        detail: `${col.dataType} (${table.name})`,
                                                                        insertText: col.name,
                                                                        range: range // Standard column name
                                                                    });
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }

                                            return { suggestions: suggestions };
                                        }
                                    });
                                }}
                            />
                        </div>

                        <div
                            className={`${styles.resizeDivider} ${isDragging ? styles.isDragging : ''}`}
                            onMouseDown={startDragging}
                        >
                            <div className={styles.dividerHandle} />
                        </div>

                        <div className={`${styles.resultsArea} ${isFocusedMode ? styles.focusedResults : ''}`}>
                            <div className={styles.resultsHeader}>
                                <span>Query Results {results.length > 0 && `(${results.length})`}</span>
                                <div className={styles.resultsActions}>
                                    <button
                                        className={styles.iconBtn}
                                        onClick={() => setIsFocusedMode(!isFocusedMode)}
                                        title={isFocusedMode ? "Exit Focused View" : "Focused View"}
                                    >
                                        {isFocusedMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                    </button>
                                </div>
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
                                <>
                                    <div className={styles.tableWrapper}>
                                        <div className="ag-theme-alpine-dark" style={{ height: '100%', width: '100%' }}>
                                            <AgGridReact
                                                rowData={paginatedResults}
                                                columnDefs={columnDefs}
                                                defaultColDef={{
                                                    sortable: true,
                                                    filter: true,
                                                    resizable: true,
                                                    minWidth: 100
                                                }}
                                                pagination={false}
                                                domLayout="normal"
                                                suppressCellFocus={true}
                                                enableCellTextSelection={true}
                                                theme="legacy"
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.floatingPagination}>
                                        <div className={styles.pageSizeSelector}>
                                            <label htmlFor="pageSize">Rows/Page:</label>
                                            <select
                                                id="pageSize"
                                                value={pageSize}
                                                onChange={(e) => {
                                                    setPageSize(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                {pageSizeOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles.pageControls}>
                                            <button
                                                className={styles.pageBtn}
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(p => p - 1)}
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span className={styles.pageInfo}>
                                                Page <strong>{currentPage}</strong> of {totalPages}
                                            </span>
                                            <button
                                                className={styles.pageBtn}
                                                disabled={currentPage === totalPages || totalPages === 0}
                                                onClick={() => setCurrentPage(p => p + 1)}
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                        <span className={styles.totalRecords}>{results.length} records</span>
                                    </div>
                                </>
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
