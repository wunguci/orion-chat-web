/*eslint-disable */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
    sendOtpForgetPassword,
    verifyOtpForgetPassword,
    resetPassword,
} from '../../services/authService';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCountdown, setResendCountdown] = useState(0);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Handle OTP input with auto-focus and auto-back
    const handleOtpChange = (index: number, value: string) => {
        const numericValue = value.replace(/\D/g, '');

        if (numericValue.length > 1) {
            // Handle paste
            const newOtp = [...otp];
            numericValue.split('').forEach((char, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);

            // Auto-focus last input if all filled
            if (newOtp.every((o) => o !== '')) {
                otpRefs.current[5]?.focus();
            } else {
                const nextEmptyIndex = newOtp.findIndex((o) => o === '');
                if (nextEmptyIndex >= 0 && nextEmptyIndex < 6) {
                    otpRefs.current[nextEmptyIndex]?.focus();
                }
            }
        } else {
            const newOtp = [...otp];
            newOtp[index] = numericValue;
            setOtp(newOtp);

            // Auto-focus next input
            if (numericValue && index < 5) {
                otpRefs.current[index + 1]?.focus();
            }
            // Auto-back on delete
            else if (!numericValue && index > 0) {
                otpRefs.current[index - 1]?.focus();
            }
        }
    };

    // Resend countdown timer
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    // Handle Send OTP
    const handleSendOtp = async () => {
        setError(null);

        if (!phone || phone.replace(/\D/g, '').length < 10) {
            setError('Số điện thoại phải có ít nhất 10 ký tự');
            return;
        }

        setLoading(true);
        try {
            await sendOtpForgetPassword(phone);
            setStep(2);
            setResendCountdown(60);
            setOtp(Array(6).fill(''));
            console.log('[handleSendOtp] OTP sent successfully');
        } catch (err: any) {
            setError(err.message || 'Lỗi gửi OTP');
            console.error('[handleSendOtp] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle Verify OTP
    const handleVerifyOtp = async () => {
        setError(null);

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('OTP phải có 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            await verifyOtpForgetPassword(phone, otpCode);
            setStep(3);
            console.log('[handleVerifyOtp] OTP verified successfully');
        } catch (err: any) {
            setError(err.message || 'Lỗi xác thực OTP');
            console.error('[handleVerifyOtp] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle Reset Password
    const handleResetPassword = async () => {
        setError(null);

        // Validation
        if (newPassword.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        if (!/[!@#$%^&*(),.?"':{}|<>\[\]\\/~`_+=;-]/.test(newPassword)) {
            setError('Mật khẩu phải chứa ít nhất một ký tự đặc biệt');
            return;
        }

        if (!/\d/.test(newPassword)) {
            setError('Mật khẩu phải chứa ít nhất một số');
            return;
        }

        if (newPassword !== password) {
            setError('Mật khẩu không khớp');
            return;
        }

        setLoading(true);
        try {
            const otpCode = otp.join('');
            await resetPassword({
                phoneNumber: phone,
                otp: otpCode,
                newPassword,
                confirmPassword: password,
            });

            alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
            navigate('/login');
            console.log('[handleResetPassword] Password reset successfully');
        } catch (err: any) {
            setError(err.message || 'Lỗi đặt lại mật khẩu');
            console.error('[handleResetPassword] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle Resend OTP
    const handleResendOtp = async () => {
        setError(null);
        setLoading(true);
        try {
            await sendOtpForgetPassword(phone);
            setResendCountdown(60);
            setOtp(Array(6).fill(''));
            console.log('[handleResendOtp] OTP resent successfully');
        } catch (err: any) {
            setError(err.message || 'Lỗi gửi lại OTP');
            console.error('[handleResendOtp] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative min-h-screen bg-white">
            {/* Logo */}
            <div className="absolute top-8 left-10 flex items-center gap-3">
                <div className="text-2xl bg-[#CFDCDA] p-2 rounded-2xl">
                    <FontAwesomeIcon
                        className="text-[#006275]"
                        icon={faMessage}
                    />
                </div>
                <h2 className="text-2xl font-bold text-[#006275]">Chat</h2>
            </div>

            {/* Center */}
            <div className="flex min-h-screen items-center justify-center">
                <div className="w-full max-w-md space-y-8">
                    <h3 className="text-4xl font-bold text-center text-[#006275]">
                        FORGOT PASSWORD
                    </h3>

                    {/* Progress Bar */}
                    <div className="flex gap-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 h-1 rounded-full transition-all ${
                                    s <= step ? 'bg-[#006275]' : 'bg-gray-200'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* STEP 1 */}
                    {step === 1 && (
                        <>
                            <p className="text-center text-gray-400">
                                Enter your registered phone number to receive a
                                verification code.
                            </p>

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
                                    disabled={loading}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            <p className="text-center text-gray-400">
                                By tapping Next, you may receive an SMS for
                                verification. Message and data rates may apply.
                            </p>

                            <button
                                onClick={handleSendOtp}
                                disabled={loading}
                                className="w-full py-3 bg-[#006275] text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#005060] transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>Send OTP →</>
                                )}
                            </button>
                        </>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <>
                            <p className="text-center text-gray-400">
                                We've sent a 6-digit code to your registered
                                mobile number
                            </p>

                            {/* OTP Inputs */}
                            <div className="flex justify-center gap-3">
                                {otp.map((v, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => {
                                            otpRefs.current[i] = el;
                                        }}
                                        maxLength={1}
                                        value={v}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !v && i > 0) {
                                                otpRefs.current[i - 1]?.focus();
                                            }
                                        }}
                                        disabled={loading}
                                        className="w-15 h-15 text-center text-2xl text-gray-500 font-semibold rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                ))}
                            </div>

                            <p className="text-center text-sm text-gray-400">
                                {resendCountdown > 0
                                    ? `Resend code in ${formatCountdown(resendCountdown)}`
                                    : ''}
                            </p>

                            {/* Resend */}
                            <p className="text-center text-sm text-gray-400 -mt-6">
                                Didn't receive code?{' '}
                                <button
                                    onClick={handleResendOtp}
                                    disabled={resendCountdown > 0 || loading}
                                    className="text-[#006275] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Resend
                                </button>
                            </p>

                            {/* Next */}
                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading || otp.some((o) => !o)}
                                className="w-full py-3 bg-[#006275] text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#005060] transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>Next →</>
                                )}
                            </button>

                            {/* Back */}
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setError(null);
                                }}
                                disabled={loading}
                                className="flex items-center justify-center w-full gap-2 text-sm text-[#006275] hover:underline self-start disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ← Back
                            </button>

                            <p className="text-center text-gray-400 text-xs">
                                By entering the code, you agree to our Terms of
                                Service and Privacy Policy
                            </p>
                        </>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <>
                            <p className="text-center text-gray-400">
                                Create your new password
                            </p>

                            <div>
                                <label
                                    htmlFor="newPassword"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    NEW PASSWORD
                                </label>
                                <div className="relative">
                                    <input
                                        id="newPassword"
                                        type={
                                            showNewPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        placeholder="••••••••••••"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        disabled={loading}
                                        className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(!showNewPassword)
                                        }
                                        disabled={loading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    CONFIRM PASSWORD
                                </label>

                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        disabled={loading}
                                        className={`w-full px-4 py-3.5 rounded-xl bg-gray-50/70 outline-none placeholder-gray-400 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                                            password === ''
                                                ? 'border border-gray-300 focus:bg-white focus:border-[#006275] focus:ring-2 focus:ring-[#006275]/20'
                                                : password === newPassword
                                                  ? 'border-2 border-green-message bg-green-50/30 focus:bg-white focus:border-green-message focus:ring-2 focus:ring-green-500/20'
                                                  : 'border-2 border-red-500 bg-red-50/30 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        disabled={loading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#F5F8F8] p-4 rounded-xl">
                                <h4 className="text-sm font-semibold text-[#5F8C84] mb-3">
                                    REQUIREMENTS
                                </h4>
                                <ul className="space-y-3 text-sm">
                                    {(() => {
                                        const hasLength =
                                            newPassword.length >= 8;
                                        const hasSpecial =
                                            /[!@#$%^&*(),.?"':{}|<>\[\]\\/~`_+=;-]/.test(
                                                newPassword,
                                            );
                                        const hasNumber = /\d/.test(
                                            newPassword,
                                        );

                                        const Item = ({
                                            ok,
                                            children,
                                        }: {
                                            ok: boolean;
                                            children: React.ReactNode;
                                        }) => (
                                            <li className="flex items-center gap-3 pl-2 transition-all duration-300">
                                                <span
                                                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full border-2 transition-all duration-300 ease-in-out ${
                                                        ok
                                                            ? 'border-[#2AB3B3] bg-[#2AB3B3]/10 scale-110'
                                                            : 'border-gray-300 bg-white scale-100'
                                                    }`}
                                                >
                                                    {ok ? (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#2AB3B3"
                                                            strokeWidth={2}
                                                            className="w-4 h-4 animate-[scale-in_0.3s_ease-out]"
                                                        >
                                                            <path
                                                                d="M20 6L9 17l-5-5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#cbd5e1"
                                                            strokeWidth={2}
                                                            className="w-4 h-4"
                                                        >
                                                            <circle
                                                                cx="12"
                                                                cy="12"
                                                                r="6"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    )}
                                                </span>
                                                <span
                                                    className={`transition-all duration-300 ease-in-out ${
                                                        ok
                                                            ? 'text-[#2AB3B3] font-medium'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    {children}
                                                </span>
                                            </li>
                                        );

                                        return (
                                            <>
                                                <Item ok={hasLength}>
                                                    At least 8 characters
                                                </Item>
                                                <Item ok={hasSpecial}>
                                                    At least one special symbol
                                                </Item>
                                                <Item ok={hasNumber}>
                                                    At least one number
                                                </Item>
                                            </>
                                        );
                                    })()}
                                </ul>
                            </div>

                            <p className="text-center text-gray-400 text-xs">
                                By tapping Complete, you agree to our Terms of
                                Service and Privacy Policy
                            </p>

                            <button
                                onClick={handleResetPassword}
                                disabled={loading}
                                className="w-full py-3 bg-[#006275] text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#005060] transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Completing...
                                    </>
                                ) : (
                                    <>Complete</>
                                )}
                            </button>

                            {/* Back */}
                            <button
                                onClick={() => {
                                    setStep(2);
                                    setError(null);
                                }}
                                disabled={loading}
                                className="flex items-center justify-center w-full gap-2 text-sm text-[#006275] hover:underline self-start disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ← Back
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-400 space-x-4">
                <a href="#">Terms of Service</a>
                <span>•</span>
                <a href="#">Privacy Policy</a>
                <span>•</span>
                <a href="#">Cookie Policy</a>
            </div>
        </div>
    );
}
