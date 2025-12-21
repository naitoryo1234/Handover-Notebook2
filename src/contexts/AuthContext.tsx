'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Operator {
    id: string;
    name: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    operator: Operator | null;
    login: (pin: string, operator: Operator) => boolean;
    logout: () => void;
    selectOperator: (operator: Operator) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'clinic-crm-auth';

interface StoredAuth {
    isAuthenticated: boolean;
    operator: Operator | null;
}

interface AuthProviderProps {
    children: ReactNode;
    authEnabled: boolean;
    authPin: string;
}

export function AuthProvider({ children, authEnabled, authPin }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [operator, setOperator] = useState<Operator | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session from localStorage on mount
    /* eslint-disable react-hooks/set-state-in-effect -- Intentional: restoring session on mount */
    useEffect(() => {
        if (!authEnabled) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: StoredAuth = JSON.parse(stored);
                setIsAuthenticated(parsed.isAuthenticated);
                setOperator(parsed.operator);
            }
        } catch (e: unknown) {
            console.error('Failed to restore auth session:', e);
        }
        setIsLoading(false);
    }, [authEnabled]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Persist session to localStorage
    useEffect(() => {
        if (isLoading) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ isAuthenticated, operator }));
    }, [isAuthenticated, operator, isLoading]);

    const login = (pin: string, selectedOperator: Operator): boolean => {
        if (pin === authPin) {
            setIsAuthenticated(true);
            setOperator(selectedOperator);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setOperator(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    const selectOperator = (selectedOperator: Operator) => {
        setOperator(selectedOperator);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, operator, login, logout, selectOperator }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper hook to get current operator ID for server actions
export function useOperatorId(): string | undefined {
    const { operator } = useAuth();
    return operator?.id;
}

