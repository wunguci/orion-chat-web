import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
    return (
        <div>
            {/* Container  */}
            <div className="flex w-screen">
                <section className="relative hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-24 overflow-hidden group">
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
                            <span className="text-sm font-bold tracking-widest uppercase text-(--color-login)">
                                Network V.1.0
                            </span>
                        </div>

                        <h1 className="text-[min(100px,20vw)] font-bold leading-none tracking-tighter mb-6">
                            Connect
                        </h1>

                        <p className="text-xl text-gray-300 max-w-md font-light leading-relaxed">
                            Experience seamless messaging and global
                            connectivity at your fingertips with our secure
                            platform.
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
                            <span className="text-sm text-gray-400 font-medium">
                                Joined by 10k+ professionals
                            </span>
                        </div>
                    </div>

                    {/* Footer indicator */}
                    <div className="absolute bottom-10 left-12 xl:left-24 z-30 flex items-center gap-4">
                        <div className="h-px w-12 bg-[#a8ffda]/50" />
                        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                            Premium Digital Environment
                        </span>
                    </div>
                </section>

                {/* Auth Card  */}
                <div className="w-[40vw]">
                    <Outlet />
                </div>

                {/* Footer  */}
            </div>
        </div>
    );
};
