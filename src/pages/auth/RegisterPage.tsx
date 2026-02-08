/*eslint-disable */
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [showPassword, setShowPassword] = useState(false);

    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

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
                        REGISTER
                    </h3>

                    {/* STEP 1 */}
                    {step === 1 && (
                        <>
                            <p className="text-center text-gray-400">
                                Enter your phone number to get started with our
                                social community
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
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    PASSWORD
                                </label>

                                <div className="relative">
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
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

                            <div className="bg-[#F5F8F8] p-4 rounded-xl">
                                <h4 className="text-sm font-semibold text-[#5F8C84] mb-3">
                                    REQUIREMENTS
                                </h4>
                                <ul className="space-y-3 text-sm">
                                    {(() => {
                                        const hasLength = password.length >= 8;
                                        const hasSpecial =
                                            /[!@#$%^&*(),.?"':{}|<>\[\]\\/~`_+=;-]/.test(
                                                password,
                                            );
                                        const hasNumber = /\d/.test(password);

                                        const Item = ({
                                            ok,
                                            children,
                                        }: {
                                            ok: boolean;
                                            children: React.ReactNode;
                                        }) => (
                                            <li className="flex items-center gap-3 pl-2">
                                                <span
                                                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full border-2 ${
                                                        ok
                                                            ? 'border-[#2AB3B3] bg-white'
                                                            : 'border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    {ok ? (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#2AB3B3"
                                                            strokeWidth={2}
                                                            className="w-4 h-4"
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
                                                    className={
                                                        ok
                                                            ? 'text-[#2AB3B3] '
                                                            : 'text-gray-400'
                                                    }
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

                            {/* Resend */}
                            <p className="text-center text-sm text-gray-400">
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
                                Add details so people recognize you.
                            </p>
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    FULL NAME
                                </label>
                                <input
                                    placeholder="Full name"
                                    value={fullName}
                                    onChange={(e) =>
                                        setFullName(e.target.value)
                                    }
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    DATE OF BIRTH
                                </label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-gray-50/70 hover:border hover:border-(--color-login) focus:bg-white focus:ring-2 focus:ring-(--color-login) focus:border focus:border-(--color-login) outline-none transition-all placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    GENDER
                                </label>
                                <div className="rounded-xl bg-gray-100 p-1 border border-gray-200">
                                    <div className="flex items-center">
                                        {['male', 'female', 'other'].map(
                                            (g) => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() =>
                                                        setGender(g as any)
                                                    }
                                                    className={`relative z-10 px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                                                        gender === g
                                                            ? 'bg-white text-[#006275] font-medium shadow-sm'
                                                            : 'text-gray-500'
                                                    }`}
                                                >
                                                    {g.charAt(0).toUpperCase() +
                                                        g.slice(1)}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-3 bg-[#006275] text-white rounded-full">
                                Complete
                            </button>
                            <p className="text-center text-gray-400">
                                By tapping "Complete", you agree to our Terms of
                                Service and Privacy Policy We use your data to
                                enhance your discovery experience.
                            </p>
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
