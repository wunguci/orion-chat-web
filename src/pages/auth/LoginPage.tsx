import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { Eye, EyeOff } from 'lucide-react';
import {
    login,
    validatePhoneNumber,
    validatePassword,
} from '../../services/authService';
import { setToken, setUser } from '../../utils/token';
import { ROUTES } from '../../types/routes.types';

export default function LoginPage() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const savedPhone = localStorage.getItem('remembered_phone');
        const isRemembered = localStorage.getItem('rememberMe') === 'true';

        if (savedPhone) {
            setPhone(savedPhone);
        }
        if (isRemembered) {
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!validatePhoneNumber(phone)) {
            setError('Số điện thoại phải có ít nhất 10 ký tự');
            return;
        }

        if (!validatePassword(password)) {
            setError('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        setLoading(true);
        try {
            const result = await login(phone, password);
            console.log('[LoginPage] API Response:', result);
            console.log(
                '[LoginPage] Result.data keys:',
                result.data ? Object.keys(result.data) : 'N/A',
            );
            console.log('[LoginPage] Result.data:', result.data);

            if (result.success) {
                if (!result.data) {
                    setError(
                        'Lỗi: Không nhận được dữ liệu người dùng từ server',
                    );
                    setLoading(false);
                    return;
                }

                setMessage('Đăng nhập thành công! Chuyển hướng...');

                // Store JWT token
                const token = result.data.token;
                if (!token) {
                    setError('Lỗi: Không nhận được token từ server');
                    setLoading(false);
                    return;
                }
                setToken(token);

                // Store user data with all available fields
                const userData = {
                    phoneNumber: result.data.phoneNumber || '',
                    fullName: result.data.fullName || '',
                    birthDate: result.data.birthDate || undefined,
                    gender: result.data.gender || undefined,
                    loginTime:
                        result.data.loginTime || new Date().toISOString(),
                    userId: result.data.userId || '',
                    email: result.data.email || '',
                    avatarUrl: result.data.avatarUrl || undefined,
                    coverImage: result.data.coverImage || undefined,
                    isOnline:
                        result.data.isOnline !== undefined
                            ? result.data.isOnline
                            : true,
                    showOnlineStatus:
                        result.data.showOnlineStatus !== undefined
                            ? result.data.showOnlineStatus
                            : true,
                    isActive:
                        result.data.isActive !== undefined
                            ? result.data.isActive
                            : true,
                    isDeleted:
                        result.data.isDeleted !== undefined
                            ? result.data.isDeleted
                            : false,
                    createdAt:
                        result.data.createdAt || new Date().toISOString(),
                };

                setUser(userData);

                if (rememberMe) {
                    localStorage.setItem('remembered_phone', phone);
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    // Clear saved phone if unchecked
                    localStorage.removeItem('remembered_phone');
                    localStorage.removeItem('rememberMe');
                }

                setTimeout(() => {
                    navigate(`${ROUTES.HOME}/${ROUTES.CHAT.ROOT}`);
                }, 2000);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Lỗi khi đăng nhập. Vui lòng thử lại',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-white">
            <div className="absolute top-8 left-10 flex items-center gap-3">
                <div className="text-2xl bg-green-bg-heavy p-3 rounded-full">
                    <FontAwesomeIcon
                        className="text-green-primary"
                        icon={faMessage}
                    />
                </div>
                <h2 className="text-2xl font-bold text-green-primary">Chat</h2>
            </div>

            <div className="flex min-h-screen items-center justify-center">
                <div className="w-full max-w-md space-y-8">
                    {/* Title */}
                    <div className="text-center">
                        <h3 className="text-4xl font-bold text-green-primary">
                            LOG IN
                        </h3>
                        <p className="mt-2 text-gray-400">
                            Please enter your details to continue
                        </p>
                    </div>

                    {/* Error/Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                            {message}
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {/* Phone */}
                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                PHONE NUMBER
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                placeholder="0000 000 000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    PASSWORD
                                </label>
                                <Link
                                    to="/auth/forgot-password"
                                    className="text-sm text-[#006275] hover:underline font-semibold"
                                >
                                    Forgot?
                                </Link>
                            </div>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember me - Custom Toggle Switch */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                    className="sr-only"
                                />
                                <button
                                    type="button"
                                    onClick={() => setRememberMe(!rememberMe)}
                                    className={`
                                        relative inline-flex h-6 w-11 items-center rounded-full 
                                        transition-colors duration-200 ease-in-out focus:outline-none
                                        ${
                                            rememberMe
                                                ? 'bg-green-primary'
                                                : 'bg-gray-300'
                                        }
                                    `}
                                >
                                    <span
                                        className={`
                                            inline-block h-4 w-4 transform rounded-full bg-white shadow-lg 
                                            transition-transform duration-200 ease-in-out
                                            ${
                                                rememberMe
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }
                                        `}
                                    />
                                </button>
                            </div>
                            <label
                                htmlFor="remember"
                                className="text-sm text-green-primary mb-1 select-none font-medium cursor-pointer"
                            >
                                Remember me
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-green-primary hover:bg-green-primary/90 disabled:opacity-50 text-white rounded-4xl font-medium transition-colors"
                        >
                            {loading ? 'Đang đăng nhập...' : 'Log in'}
                        </button>
                    </form>

                    {/* Register */}
                    <p className="text-center text-gray-400 text-sm mt-6">
                        Don't have an account?{' '}
                        <Link
                            to="/auth/register"
                            className="text-green-primary hover:underline font-semibold"
                        >
                            Register now
                        </Link>
                    </p>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-sm space-x-4">
                <a href="#" className="hover:underline">
                    Terms of Service
                </a>
                <span>•</span>
                <a href="#" className="hover:underline">
                    Privacy Policy
                </a>
                <span>•</span>
                <a href="#" className="hover:underline">
                    Cookie Policy
                </a>
            </div>
        </div>
    );
}
