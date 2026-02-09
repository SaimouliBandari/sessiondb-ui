import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'default' | 'amber' | 'light-blue' | 'light-amber';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('app-theme');
        // Validate saved theme against new allowed values
        if (saved === 'amber' || saved === 'default' || saved === 'light-blue' || saved === 'light-amber') {
            return saved as Theme;
        }
        // Fallback for legacy 'light' value
        if (saved === 'light') return 'light-blue';

        return 'default';
    });

    useEffect(() => {
        const root = document.documentElement;
        // Remove previous theme classes
        root.classList.remove('theme-default', 'theme-amber', 'theme-light', 'theme-light-blue', 'theme-light-amber');
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
