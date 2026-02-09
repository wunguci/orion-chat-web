/*eslint-disable */
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

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
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400"
                                />
                            </div>

                            <p className="text-center text-gray-400">
                                By tapping Next, you may receive an SMS for
                                verification. Message and data rates may apply.
                            </p>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-3 bg-[#006275] text-white rounded-full"
                            >
                                Send OTP →
                            </button>
                        </>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <>
                            <p className="text-center text-gray-400">
                                We've sent a 6-digit code to your registered
                                mobile number 01* *** **89
                            </p>

                            {/* OTP Inputs */}
                            <div className="flex justify-center gap-3">
                                {otp.map((v, i) => (
                                    <input
                                        key={i}
                                        maxLength={1}
                                        value={v}
                                        onChange={(e) => {
                                            const copy = [...otp];
                                            copy[i] = e.target.value;
                                            setOtp(copy);
                                        }}
                                        className="w-15 h-15 text-center text-2xl text-gray-500 font-semibold rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400"
                                    />
                                ))}
                            </div>
                            <p className="text-center text-sm text-gray-400 ">
                                Resend code in 00:55
                            </p>

                            {/* Resend */}
                            <p className="text-center text-sm text-gray-400 -mt-6 ">
                                Didn’t receive code?{' '}
                                <button className="text-[#006275] hover:underline">
                                    Resend
                                </button>
                            </p>

                            {/* Next */}
                            <button
                                onClick={() => setStep(3)}
                                className="w-full py-3 bg-[#006275] text-white rounded-full"
                            >
                                Next →
                            </button>
                            {/* Back */}
                            <button
                                onClick={() => setStep(1)}
                                className="flex items-center justify-center w-full gap-2 text-sm text-[#006275] hover:underline self-start"
                            >
                                ← Back
                            </button>
                            <p className="text-center text-gray-400">
                                By entering the code, you agree to our Terms of
                                Service and Privacy Policy
                            </p>
                        </>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <>
                            <p className="text-center text-gray-400">
                                Enter your registered phone number to receive a
                                verification code.
                            </p>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    NEW PASSWORD
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
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
                                        className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(!showNewPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    CONFIRM PASSWORD
                                </label>

                                <div className="relative">
                                    <input
                                        id="confirm-password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className={`w-full px-4 py-3.5 rounded-xl bg-gray-50/70 outline-none placeholder-gray-400 transition-all duration-300 ease-in-out ${
                                            password === ''
                                                ? 'border border-gray-300 focus:bg-white focus:border-[#006275] focus:ring-2 focus:ring-[#006275]/20'
                                                : password === newPassword
                                                  ? 'border-2 border-green-500 bg-green-50/30 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-500/20'
                                                  : 'border-2 border-red-500 bg-red-50/30 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
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
                            <p className="text-center text-gray-400">
                                By tapping Next, you may receive an SMS for
                                verification. Message and data rates may apply.
                            </p>

                            <button className="w-full py-3 bg-[#006275] text-white rounded-full">
                                Complete
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
