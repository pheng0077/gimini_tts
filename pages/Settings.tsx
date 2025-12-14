import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiKey } from '../types/user';

export const Settings: React.FC = () => {
    const { user, signOut, getAllApiKeys, addApiKey, deleteApiKey, setActiveApiKey } = useAuth();
    const navigate = useNavigate();

    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Add new key form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newKeyLabel, setNewKeyLabel] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [showNewKey, setShowNewKey] = useState(false);
    const [adding, setAdding] = useState(false);

    const loadApiKeys = async () => {
        try {
            const keys = await getAllApiKeys();
            setApiKeys(keys);
        } catch (error) {
            console.error('Error loading API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApiKeys();
    }, []);

    const handleAddKey = async () => {
        if (!newKeyLabel.trim() || !newKeyValue.trim()) {
            setMessage({ type: 'error', text: 'Please enter both label and API key' });
            return;
        }

        setAdding(true);
        setMessage(null);

        try {
            const setAsActive = apiKeys.length === 0; // First key is automatically active
            await addApiKey(newKeyLabel.trim(), newKeyValue.trim(), setAsActive);
            setMessage({ type: 'success', text: 'API key added successfully!' });
            setNewKeyLabel('');
            setNewKeyValue('');
            setShowAddForm(false);
            await loadApiKeys();
        } catch (error: any) {
            if (error.message?.includes('unique')) {
                setMessage({ type: 'error', text: 'A key with this label already exists' });
            } else {
                setMessage({ type: 'error', text: error.message || 'Failed to add API key' });
            }
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm('Are you sure you want to delete this API key?')) return;

        try {
            await deleteApiKey(keyId);
            setMessage({ type: 'success', text: 'API key deleted' });
            await loadApiKeys();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete API key' });
        }
    };

    const handleSetActive = async (keyId: string) => {
        try {
            await setActiveApiKey(keyId);
            setMessage({ type: 'success', text: 'Active API key updated' });
            await loadApiKeys();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to set active key' });
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/signin');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const getUserDisplayName = () => {
        return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    };

    const getUserAvatar = () => {
        return user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName())}&background=6366f1&color=fff`;
    };

    const maskApiKey = (key: string) => {
        if (key.length <= 8) return '****';
        return key.slice(0, 4) + '****' + key.slice(-4);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-zinc-950">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                        <p className="text-zinc-400 text-sm">Manage your account and API keys</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-sm font-medium"
                    >
                        ← Back to App
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                            : 'bg-red-500/10 border border-red-500/50 text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
                        <div className="flex items-center gap-4">
                            <img
                                src={getUserAvatar()}
                                alt={getUserDisplayName()}
                                className="w-16 h-16 rounded-full border-2 border-zinc-700"
                            />
                            <div>
                                <p className="text-white font-medium">{getUserDisplayName()}</p>
                                <p className="text-zinc-400 text-sm">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* API Keys Section */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">Gemini API Keys</h2>
                                <p className="text-zinc-400 text-sm">
                                    Manage your API keys. Get one from{' '}
                                    <a
                                        href="https://aistudio.google.com/app/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-400 hover:text-indigo-300 underline"
                                    >
                                        Google AI Studio
                                    </a>
                                </p>
                            </div>
                            {!showAddForm && (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add New Key
                                </button>
                            )}
                        </div>

                        {/* Add Key Form */}
                        {showAddForm && (
                            <div className="mb-6 bg-zinc-950 border border-zinc-700 rounded-xl p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Label / Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newKeyLabel}
                                            onChange={(e) => setNewKeyLabel(e.target.value)}
                                            placeholder="e.g., Personal, Work, Project A"
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            API Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewKey ? 'text' : 'password'}
                                                value={newKeyValue}
                                                onChange={(e) => setNewKeyValue(e.target.value)}
                                                placeholder="Enter your Gemini API key"
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 pr-12 text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewKey(!showNewKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                            >
                                                {showNewKey ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddKey}
                                            disabled={adding}
                                            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-sm font-medium disabled:opacity-50"
                                        >
                                            {adding ? 'Adding...' : 'Add Key'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setNewKeyLabel('');
                                                setNewKeyValue('');
                                            }}
                                            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* API Keys List */}
                        {apiKeys.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500">
                                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                <p className="font-medium">No API keys yet</p>
                                <p className="text-sm mt-1">Add your first Gemini API key to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {apiKeys.map((key) => (
                                    <div
                                        key={key.id}
                                        className={`p-4 rounded-lg border transition-all ${key.is_active
                                                ? 'bg-indigo-950/30 border-indigo-700'
                                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <button
                                                        onClick={() => !key.is_active && handleSetActive(key.id)}
                                                        disabled={key.is_active}
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${key.is_active
                                                                ? 'border-indigo-500 bg-indigo-500'
                                                                : 'border-zinc-600 hover:border-indigo-500 cursor-pointer'
                                                            }`}
                                                        title={key.is_active ? 'Active key' : 'Set as active'}
                                                    >
                                                        {key.is_active && (
                                                            <div className="w-2 h-2 bg-white rounded-full" />
                                                        )}
                                                    </button>
                                                    <h3 className="text-white font-medium">{key.label}</h3>
                                                    {key.is_active && (
                                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-xs font-medium">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-zinc-400 text-sm font-mono ml-8">
                                                    {maskApiKey(key.encrypted_api_key)}
                                                </p>
                                                <p className="text-zinc-500 text-xs mt-1 ml-8">
                                                    Added {new Date(key.created_at!).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteKey(key.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                                                title="Delete key"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-xs text-zinc-400 space-y-1">
                                    <p>• Click the circle to switch between API keys</p>
                                    <p>• Your API keys are encrypted before being stored</p>
                                    <p>• Each key needs a unique label</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-zinc-900/40 border border-red-900/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-4">Account Actions</h2>
                        <button
                            onClick={handleSignOut}
                            className="px-6 py-3 rounded-lg bg-red-600/10 border border-red-600/50 hover:bg-red-600/20 text-red-400 transition-colors font-medium"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
