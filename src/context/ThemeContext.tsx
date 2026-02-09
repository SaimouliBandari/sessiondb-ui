import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'default' | 'amber';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('app-theme');
        return (saved === 'amber' || saved === 'default') ? saved : 'default';
    });

    useEffect(() => {
        const root = document.documentElement;
        // Remove previous theme class
        root.classList.remove('theme-default', 'theme-amber');
        // Add new theme class
        root.classList.add(`theme-${theme}`);
        // Persist
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
