import React from 'react';
import { Search, Bell, ChevronDown, Check, Server } from 'lucide-react';
import styles from './Layout.module.css';
import { useInstance } from '../../context/InstanceContext';

const Header: React.FC = () => {
    const { currentInstance, instances, setCurrentInstanceId } = useInstance();
    const [isInstanceOpen, setIsInstanceOpen] = React.useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <input type="text" placeholder="Search resources, queries..." className={styles.searchInput} />
            </div>
            <div className={styles.actionArea}>
                <div className={styles.instanceSelector}>
                    <button
                        className={styles.instanceToggle}
                        onClick={() => setIsInstanceOpen(!isInstanceOpen)}
                    >
                        <Server size={16} />
                        <div className={styles.instanceInfo}>
                            <span className={styles.instanceLabel}>Instance</span>
                            <span className={styles.instanceValue}>{currentInstance?.name || 'Select Instance'}</span>
                        </div>
                        <ChevronDown size={14} className={`${styles.chevron} ${isInstanceOpen ? styles.chevronOpen : ''}`} />
                    </button>

                    {isInstanceOpen && (
                        <div className={styles.instanceDropdown}>
                            {instances.map((inst) => (
                                <button
                                    key={inst.id}
                                    className={`${styles.instanceOption} ${currentInstance?.id === inst.id ? styles.activeOption : ''}`}
                                    onClick={() => {
                                        setCurrentInstanceId(inst.id);
                                        setIsInstanceOpen(false);
                                    }}
                                >
                                    <div className={styles.optionDetails}>
                                        <span className={styles.optionName}>{inst.name}</span>
                                        <span className={styles.optionMeta}>{inst.host}:{inst.port}</span>
                                    </div>
                                    {currentInstance?.id === inst.id && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button className={styles.headerBtn}><Bell size={20} /></button>
                <div className={styles.statusIndicator}>
                    <div className={`${styles.pulser} ${currentInstance?.status === 'online' ? styles.online : ''}`}></div>
                    <span>{currentInstance?.name || 'No Instance Connected'}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
