import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

interface User {
    email: string;
    full_name?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    // Remove navigate from here to avoid circular dependency if AuthProvider is outside Router
    // Or ensure AuthProvider is inside Router. assuming it is.

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    // Start by decoding token or fetching user profile
                    // For now, simpler: if token exists, assume logged in.
                    // Ideally: const res = await client.get('/auth/me'); setUser(res.data);

                    // Mock user for now since /me isn't in backend yet, or decode JWT
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setUser({ email: payload.sub });
                } catch (e) {
                    console.error("Invalid token", e);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (email: string, password: string) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await client.post('/auth/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        setToken(access_token);
        // User state will update in useEffect
    };

    const register = async (email: string, password: string, full_name?: string) => {
        await client.post('/auth/register', { email, password, full_name });
        // Auto login after register? or redirect.
        // Let's just login for UX
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
