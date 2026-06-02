import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
    sendOtp,
    verifyOtp,
    completeRegister,
    validatePhoneNumber,
    validatePassword,
    validateOtp,
} from '../../services/authService';

export default function RegisterPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordAgain, setPasswordAgain] = useState('');
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [showPassword, setShowPassword] = useState(false);

    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [otpVerified, setOtpVerified] = useState(false);

    /* Send OTP */
    const handleSendOtp = async () => {
        setError(null);
        setMessage(null);

        if (!validatePhoneNumber(phone)) {
            setError('Phone number must be a 10-digit number');
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {
            const result = await sendOtp(phone);
            if (result.success) {
                setMessage(result.message);
                setStep(2);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to send OTP. Please try again',
            );
        } finally {
            setLoading(false);
        }
    };

    /* Verify OTP */
    const handleVerifyOtp = async () => {
        setError(null);
        setMessage(null);

        const otpCode = otp.join('');
        if (!validateOtp(otpCode)) {
            setError('Please enter a 6-digit OTP code');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyOtp(phone, otpCode);
            if (result.success) {
                setMessage(result.message);
                setOtpVerified(true);
                setStep(3);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to verify OTP. Please try again',
            );
        } finally {
            setLoading(false);
        }
    };

    /* Step 3: Complete Register */
    const handleCompleteRegister = async () => {
        setError(null);
        setMessage(null);

        if (!otpVerified) {
            setError('Please verify OTP before continuing');
            return;
        }

        if (!fullName.trim()) {
            setError('Please enter your full name');
            return;
        }

        if (!dob) {
            setError('Please select your date of birth');
            return;
        }

        // Validate age - must be 15 or older
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }

        if (age < 15) {
            setError('You must be at least 15 years old to register');
            return;
        }

        setLoading(true);
        try {
            // Capitalize first letter of each word
            const capitalizedName = fullName
                .trim()
                .split(' ')
                .map(
                    (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase(),
                )
                .join(' ');

            const result = await completeRegister({
                phoneNumber: phone,
                password,
                fullName: capitalizedName,
                birthDate: dob,
                gender,
            });

            if (result.success) {
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 2000);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to register. Please try again',
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
                    <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl font-bold text-center text-green-primary">
                        REGISTER
                    </h3>

                    {/* STEP 1 */}
                    {step === 1 && (
                        <>
                            <p className="text-center text-gray-400">
                                Enter your phone number to get started with our
                                social community
                            </p>

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

                            <div>
                                <label
                                    htmlFor="passwordAgain"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    PASSWORD AGAIN
                                </label>

                                <div className="relative">
                                    <input
                                        id="passwordAgain"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        placeholder="••••••••••••"
                                        value={passwordAgain}
                                        onChange={(e) =>
                                            setPasswordAgain(e.target.value)
                                        }
                                        className={`w-full px-4 py-3.5 rounded-xl bg-gray-50/70 hover:border focus:bg-white focus:ring-1 focus:border outline-none transition-all placeholder-gray-400 ${
                                            passwordAgain && password
                                                ? passwordAgain === password
                                                    ? 'border border-(--color-login) focus:ring-(--color-login) focus:border-(--color-login)'
                                                    : 'border border-red-600 focus:ring-red-600 focus:border-red-600'
                                                : 'border border-gray-300 focus:ring-(--color-login) focus:border-(--color-login)'
                                        }`}
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
                                            /[!@#$%^&*(),.?"':{}|<>[\]\\/~`_+=;-]/.test(
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
                                onClick={handleSendOtp}
                                disabled={loading}
                                className="w-full py-3 bg-[#006275] hover:bg-[#004d5e] disabled:opacity-50 text-white rounded-full transition-colors"
                            >
                                {loading ? 'Sending...' : 'Send OTP →'}
                            </button>
                        </>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <>
                            <p className="text-center text-gray-400">
                                We've sent a 6-digit code to your registered
                                mobile number{' '}
                                {phone.slice(-4).padStart(11, '*')}
                            </p>

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

                            {/* OTP Inputs */}
                            <div className="flex justify-center gap-3">
                                {otp.map((v, i) => (
                                    <input
                                        key={i}
                                        maxLength={1}
                                        value={v}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*$/.test(value)) {
                                                const copy = [...otp];
                                                copy[i] = value;
                                                setOtp(copy);

                                                // Auto-jump to next field if filled
                                                if (value && i < 5) {
                                                    const nextInput =
                                                        document.querySelector(
                                                            `input[name="otp-${i + 1}"]`,
                                                        ) as HTMLInputElement;
                                                    nextInput?.focus();
                                                }
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            // Backspace - delete current & jump back
                                            if (e.key === 'Backspace') {
                                                const copy = [...otp];
                                                if (!copy[i] && i > 0) {
                                                    // If current empty, delete previous & jump back
                                                    copy[i - 1] = '';
                                                    setOtp(copy);
                                                    const prevInput =
                                                        document.querySelector(
                                                            `input[name="otp-${i - 1}"]`,
                                                        ) as HTMLInputElement;
                                                    prevInput?.focus();
                                                } else {
                                                    // Delete current field
                                                    copy[i] = '';
                                                    setOtp(copy);
                                                }
                                            }
                                        }}
                                        name={`otp-${i}`}
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
                                onClick={handleVerifyOtp}
                                disabled={loading}
                                className="w-full py-3 bg-[#006275] hover:bg-[#004d5e] disabled:opacity-50 text-white rounded-full transition-colors"
                            >
                                {loading ? 'Verifying...' : 'Next →'}
                            </button>
                            {/* Back */}
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setError(null);
                                    setMessage(null);
                                }}
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
                                    onChange={(e) => {
                                        const text = e.target.value;
                                        // Auto-capitalize first letter of each word
                                        const capitalized = text
                                            .split(' ')
                                            .map((word) => {
                                                if (word.length === 0)
                                                    return '';
                                                return (
                                                    word
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    word.slice(1).toLowerCase()
                                                );
                                            })
                                            .join(' ');
                                        setFullName(capitalized);
                                    }}
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
                                                        setGender(
                                                            g as
                                                                | 'male'
                                                                | 'female'
                                                                | 'other',
                                                        )
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

                            <button
                                onClick={handleCompleteRegister}
                                disabled={loading}
                                className="w-full py-3 bg-[#006275] hover:bg-[#004d5e] disabled:opacity-50 text-white rounded-full transition-colors"
                            >
                                {loading ? 'Registering...' : 'Complete'}
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
