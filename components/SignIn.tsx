import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const SignIn: React.FC = () => {
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
            <div className="max-w-md w-full">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
                    {/* App Branding */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Gemini 2.5 TTS Studio
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            Professional Text-to-Speech Engine
                        </p>
                    </div>

                    {/* Sign In Section */}
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-zinc-300 mb-2">Sign in to get started</p>
                            <p className="text-xs text-zinc-500">
                                You'll need to configure your own Gemini API key after signing in
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSignIn}
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span>Sign in with Google</span>
                                </>
                            )}
                        </button>

                        <div className="border-t border-zinc-800 pt-6 text-center">
                            <p className="text-xs text-zinc-500">
                                By signing in, you agree to use your own Gemini API key.
                                <br />
                                Your API key is encrypted and stored securely.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feature Highlights */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-lg p-4">
                        <div className="text-2xl mb-2">🎙️</div>
                        <p className="text-xs text-zinc-400">Premium Voices</p>
                    </div>
                    <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-lg p-4">
                        <div className="text-2xl mb-2">⚡</div>
                        <p className="text-xs text-zinc-400">Batch Processing</p>
                    </div>
                    <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-lg p-4">
                        <div className="text-2xl mb-2">🎨</div>
                        <p className="text-xs text-zinc-400">Style Control</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
