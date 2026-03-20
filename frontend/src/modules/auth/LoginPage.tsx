import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.login({ email, password });
            if (response.success && response.data) {
                setAuth(response.data.user, response.data.accessToken);
                // Navigate back to the originally requested page securely
                const from = location.state?.from?.pathname || '/feed';
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <form onSubmit={handleLogin} className="w-full max-w-sm border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-dark-surface shadow-sm">
                <h1 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Welcome Back</h1>

                {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}

                <div className="mb-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-gray-700"
                        required
                    />
                </div>
                <div className="mb-6">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-gray-700"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
