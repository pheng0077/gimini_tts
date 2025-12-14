import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, ApiKey } from '../types/user';
import CryptoJS from 'crypto-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    getActiveApiKey: () => Promise<string | null>;
    getAllApiKeys: () => Promise<ApiKey[]>;
    addApiKey: (label: string, apiKey: string, setAsActive?: boolean) => Promise<void>;
    deleteApiKey: (keyId: string) => Promise<void>;
    setActiveApiKey: (keyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Encryption key - In production, consider using a more secure key management approach
const ENCRYPTION_KEY = 'gemini-tts-secret-key-2024';

const encryptApiKey = (apiKey: string): string => {
    return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
};

const decryptApiKey = (encryptedKey: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        user_metadata: session.user.user_metadata || {}
                    });
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    user_metadata: session.user.user_metadata || {}
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Error signing in with Google:', error.message);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
        } catch (error: any) {
            console.error('Error signing out:', error.message);
            throw error;
        }
    };

    const getActiveApiKey = async (): Promise<string | null> => {
        if (!user) return null;

        try {
            const { data, error } = await supabase
                .from('api_keys')
                .select('encrypted_api_key')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No active key found
                    return null;
                }
                throw error;
            }

            if (data?.encrypted_api_key) {
                return decryptApiKey(data.encrypted_api_key);
            }

            return null;
        } catch (error: any) {
            console.error('Error getting active API key:', error.message);
            return null;
        }
    };

    const getAllApiKeys = async (): Promise<ApiKey[]> => {
        if (!user) return [];

        try {
            const { data, error } = await supabase
                .from('api_keys')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error: any) {
            console.error('Error getting all API keys:', error.message);
            return [];
        }
    };

    const addApiKey = async (label: string, apiKey: string, setAsActive: boolean = true): Promise<void> => {
        if (!user) throw new Error('No user logged in');

        try {
            const encryptedKey = encryptApiKey(apiKey);

            const { error } = await supabase
                .from('api_keys')
                .insert({
                    user_id: user.id,
                    label: label,
                    encrypted_api_key: encryptedKey,
                    is_active: setAsActive
                });

            if (error) throw error;
        } catch (error: any) {
            console.error('Error adding API key:', error.message);
            throw error;
        }
    };

    const deleteApiKey = async (keyId: string): Promise<void> => {
        if (!user) throw new Error('No user logged in');

        try {
            const { error } = await supabase
                .from('api_keys')
                .delete()
                .eq('id', keyId)
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error: any) {
            console.error('Error deleting API key:', error.message);
            throw error;
        }
    };

    const setActiveApiKey = async (keyId: string): Promise<void> => {
        if (!user) throw new Error('No user logged in');

        try {
            // First, deactivate all keys
            await supabase
                .from('api_keys')
                .update({ is_active: false })
                .eq('user_id', user.id);

            // Then activate the selected key
            const { error } = await supabase
                .from('api_keys')
                .update({ is_active: true })
                .eq('id', keyId)
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error: any) {
            console.error('Error setting active API key:', error.message);
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        signInWithGoogle,
        signOut,
        getActiveApiKey,
        getAllApiKeys,
        addApiKey,
        deleteApiKey,
        setActiveApiKey,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
