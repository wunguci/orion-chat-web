import { Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-solid-svg-icons';

export const AuthLayout = () => {
    return (
        <div className="relative min-h-screen w-full bg-white flex flex-col lg:flex-row overflow-x-hidden">
            {/* Left Side - Hero Section (Desktop Only) */}
            <section className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:items-start lg:px-12 lg:py-12 bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden group">
                <div
                    className="absolute inset-0 z-0 bg-center bg-cover transition-transform duration-1000 group-hover:scale-105"
                    style={{
                        backgroundImage:
                            'url("https://photo.znews.vn/w660/Uploaded/jaroin/2016_08_05/getintravel.jpg")',
                    }}
                />

                <div className="absolute inset-0 z-10 bg-linear-to-r from-[#101922]/80 to-[#101922]/20" />
                <div className="absolute inset-0 z-10 bg-linear-to-b from-[#a8ffda]/10 to-transparent" />

                <div className="absolute h-0.5 w-64 top-1/4 -left-12 rotate-15 bg-linear-to-r from-transparent via-[#a8ffda] to-transparent opacity-30 z-20" />
                <div className="absolute h-0.5 w-96 top-2/3 right-10 rotate-[-10deg] bg-linear-to-r from-transparent via-[#a8ffda] to-transparent opacity-30 z-20" />
                <div className="absolute h-0.5 w-48 top-1/2 left-1/3 rotate-45 bg-linear-to-r from-transparent via-[#a8ffda] to-transparent opacity-20 z-20" />

                <div className="relative z-30 max-w-xl">
                    <div className="flex items-center gap-2 mb-8">
                        <span className="text-sm font-bold tracking-widest uppercase text-green-400">
                            Network V.1.0
                        </span>
                    </div>

                    <h1 className="text-5xl font-bold leading-none tracking-tighter mb-6 text-white">
                        Connect
                    </h1>

                    <p className="text-base text-gray-300 max-w-md font-light leading-relaxed">
                        Experience seamless messaging and global connectivity at
                        your fingertips with our secure platform.
                    </p>

                    <div className="mt-12 flex items-center gap-6">
                        <div className="flex -space-x-3">
                            <img
                                className="w-10 h-10 rounded-full border-2 border-[#101922]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCtVGhMhb602WGOWBQxxsagjL4qZx5X994hB_IBB36Dw5AwXbbj1Mc92hKsH3W1e3z7mVncBWvzgIgFq_aD1a173fZR804Xd8sAqnaYd3YEh0LK2hAS8Z0Sf0z95dSH1PgHVeJycq1ZaIqnJyWNTVveVcGtMdEMObKbKGdbZvFw6PoBpZwNSiKXYVcA9uaZ8I_F9DhVIeE8TwG97ku1F_NJEvdSL4ji79IIVJBiAlH0aXJ5tL-_OsBgSt5OsYomLp7UpE1Ny-hugk"
                                alt="User 1"
                            />
                            <img
                                className="w-10 h-10 rounded-full border-2 border-[#101922]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVL15ivS9vM3rzLd6XZJB5Ue3KNdYPoNk_eo7krrOWKHooAaswJAQnGRnnzBf5vGYEX_eWGCQVufqkAyeD3gZoIR4GRgPv31V4wDHpxi2SUZNbD6bHrKVihSQfS6SR0BXadN7DYBokJfrthAA65JqoGjch7_iDS1btRoEXR3rlkDJc-O2ZpC0XGPOosWegVmp8sf3NdKoAJcs-bRrNR4R48pLRkGibTCLsJkXSxLwjOfUFyzVXhjUVNtnm4JFVF3Wey95aQh9xHRg"
                                alt="User 2"
                            />
                            <img
                                className="w-10 h-10 rounded-full border-2 border-[#101922]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWQfm2RiNqtHyS4wgIzDF_8erg9L7jMR5pQ0msgz6PsiYiUDRrBqyiryHZBg9g3p_1tYETN2GqiyC2byFs8dWocWaBVREpvXzp7dX1lWccrLJv7iiHcbUEYOb5iQPZtrhQe91MlXPQQPfJ1eU4aNDp1vSIlkwxXjEExU4dc5nD4w_Y9lMkpsR5fTO-fKct3Uvj-tzi1WzKB4QWZWMbWqmuiJO1b-yMeX97iDXtXKK3Da9kGPHdCbTdNzevCGFp5lrKJIthXIjklkI"
                                alt="User 3"
                            />
                        </div>
                        <span className="text-sm text-gray-300 font-medium">
                            Joined by 10k+ professionals
                        </span>
                    </div>
                </div>

                {/* Footer indicator */}
                <div className="absolute bottom-10 left-12 z-30 flex items-center gap-4">
                    <div className="h-px w-12 bg-[#a8ffda]/50" />
                    <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                        Premium Digital Environment
                    </span>
                </div>
            </section>

            {/* Right Side - Form Section */}
            <div className="flex flex-1 flex-col w-full lg:w-1/2 min-h-screen lg:min-h-auto relative">
                {/* Header - Top Left (Mobile + Desktop) */}
                <div className="absolute top-3 left-3 sm:top-6 md:top-8 lg:top-8 lg:left-8 flex items-center gap-2 z-20">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-bg-heavy p-2 sm:p-2.5 rounded-full flex items-center justify-center shrink-0">
                        <FontAwesomeIcon
                            className="text-green-primary text-sm sm:text-base"
                            icon={faMessage}
                        />
                    </div>
                    <h2 className="text-sm sm:text-lg md:text-2xl font-bold text-green-primary hidden sm:block">
                        Chat
                    </h2>
                </div>
                <Outlet />
            </div>
        </div>
    );
};
