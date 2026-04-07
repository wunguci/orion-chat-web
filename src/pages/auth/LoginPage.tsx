import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
            setError('Số điện thoại gồm 10 ký tự số');
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
        <>
            {/* Main Content - Responsive */}
            <div className="flex flex-1 items-center justify-center px-3 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-12 w-full pt-20 lg:pt-12">
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-md space-y-5 sm:space-y-7">
                    {/* Title - Responsive */}
                    <div className="text-center mt-8 sm:mt-0 lg:mt-0">
                        <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl font-bold text-green-primary leading-tight">
                            LOG IN
                        </h3>
                        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed">
                            Please enter your details to continue
                        </p>
                    </div>

                    {/* Error/Message - Responsive */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium">
                            {message}
                        </div>
                    )}

                    {/* Form - Responsive */}
                    <form
                        className="space-y-3.5 sm:space-y-5"
                        onSubmit={handleLogin}
                    >
                        {/* Phone */}
                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5"
                            >
                                PHONE NUMBER
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                placeholder="0000 000 000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 focus:border-green-primary focus:bg-white focus:ring-0 focus:outline-none transition-colors placeholder-gray-350"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5 gap-1">
                                <label
                                    htmlFor="password"
                                    className="text-xs sm:text-sm font-semibold text-gray-800"
                                >
                                    PASSWORD
                                </label>
                                <Link
                                    to="/auth/forgot-password"
                                    className="text-xs text-green-primary hover:text-green-primary/80 font-semibold whitespace-nowrap ml-auto"
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
                                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 focus:border-green-primary focus:bg-white focus:ring-0 focus:outline-none transition-colors placeholder-gray-350"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember me - Custom Toggle Switch - Responsive */}
                        <div className="flex items-center gap-2.5">
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
                                        relative inline-flex h-5 w-9 items-center rounded-full 
                                        transition-colors duration-200 ease-in-out
                                        ${
                                            rememberMe
                                                ? 'bg-green-primary'
                                                : 'bg-gray-300'
                                        }
                                    `}
                                >
                                    <span
                                        className={`
                                            inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow 
                                            transition-transform duration-200 ease-in-out
                                            ${
                                                rememberMe
                                                    ? 'translate-x-4'
                                                    : 'translate-x-0.5'
                                            }
                                        `}
                                    />
                                </button>
                            </div>
                            <label
                                htmlFor="remember"
                                className="text-xs sm:text-sm text-gray-600 select-none font-medium cursor-pointer"
                            >
                                Remember me
                            </label>
                        </div>

                        {/* Submit - Responsive */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 sm:py-3 px-4 bg-green-primary hover:bg-green-primary/90 disabled:bg-gray-400 text-white rounded-full font-semibold transition-colors text-sm sm:text-base mt-2 sm:mt-4"
                        >
                            {loading ? 'Đang đăng nhập...' : 'Log in'}
                        </button>
                    </form>

                    {/* Register - Responsive */}
                    <p className="text-center text-gray-500 text-xs sm:text-sm">
                        Don't have an account?{' '}
                        <Link
                            to="/auth/register"
                            className="text-green-primary hover:text-green-primary/80 font-semibold"
                        >
                            Register now
                        </Link>
                    </p>
                </div>
            </div>

            {/* Footer - Responsive */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-3 px-3 py-3 sm:py-4 text-gray-400 text-xs sm:text-sm bg-gray-50/50 w-full">
                <a
                    href="#"
                    className="hover:text-green-primary hover:underline transition-colors"
                >
                    Terms of Service
                </a>
                <span className="text-gray-300">•</span>
                <a
                    href="#"
                    className="hover:text-green-primary hover:underline transition-colors"
                >
                    Privacy Policy
                </a>
                <span className="text-gray-300">•</span>
                <a
                    href="#"
                    className="hover:text-green-primary hover:underline transition-colors"
                >
                    Cookie Policy
                </a>
            </div>
        </>
    );
}
