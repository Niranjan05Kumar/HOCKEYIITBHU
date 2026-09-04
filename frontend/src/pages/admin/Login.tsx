import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context";

const CREST_URL =
    "https://lh3.googleusercontent.com/aida/AEtjO1VG2Lu-UiqgQyMuZ6D1Ab5dW9GRgFyeTLKDzjhX0VbbyB0T840DrfY0N_JZYi6wZUh7pqec5pKch0umVhVrjGMMYBRB2Oxx07UFn1QwaiSv362lmrZk3vpROD6ZDisUY09Mk0DzKLJwfZj_pyJr1d6i5GwSmCE8kqgqbkB7e77HxwP8RixKgFBleJmgVjrljLhpZo5DJj6S5ed18w6JCcj2okOfn2JK7IBuwgNq98jC17RrJKeMbr6Uqno";

const loginSchema = z.object({
    email: z.string().trim().min(1, "Institutional email is required").email("Please provide a valid email address"),
    password: z.string().min(1, "Passphrase is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Target route to redirect upon authentication
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/admin/dashboard";

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate, from]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        setServerError(null);
        try {
            await login(values);
            navigate(from, { replace: true });
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Unable to authenticate with the archive server. Please verify your credentials.";
            setServerError(errorMessage);
        }
    };

    return (
        <main className="min-h-screen w-full bg-[#F4F1EA] text-[#1A1A1A] flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md mx-auto">
                {/* Institutional Header */}
                <div className="text-center mb-8">
                    <img
                        src={CREST_URL}
                        alt="IIT (BHU) Hockey Heritage Logo"
                        className="w-20 h-20 mx-auto mb-5 object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                    <h1 className="font-serif text-3xl font-bold text-[#3d030b] mb-1.5 tracking-tight">
                        Heritage Archive
                    </h1>
                    <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#6B665F]">
                        Secure Admin Access
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-[#ECE8E1] p-6 sm:p-8 border border-[rgba(26,26,26,0.08)] rounded-none shadow-xs">
                    {/* Server Error Alert Banner */}
                    {serverError && (
                        <div className="mb-6 p-4 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-none flex items-start gap-3 text-xs text-[#93000a]">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="font-semibold">Authentication Failed</p>
                                <p>{serverError}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        {/* Institutional Email Field */}
                        <div>
                            <label
                                htmlFor="admin-email"
                                className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2"
                            >
                                Institutional Email
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9C968D]">
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    id="admin-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="historian@iitbhu.ac.in"
                                    {...register("email")}
                                    className={`block w-full pl-10 pr-4 py-2.5 bg-transparent border rounded text-xs text-[#1A1A1A] placeholder-[#9C968D] focus:outline-none focus:border-[#3d030b] focus:ring-1 focus:ring-[#3d030b] transition-all ${
                                        errors.email
                                            ? "border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]"
                                            : "border-[rgba(26,26,26,0.15)]"
                                    }`}
                                />
                            </div>
                            {errors.email && <p className="mt-1.5 text-xs text-[#ba1a1a]">{errors.email.message}</p>}
                        </div>

                        {/* Passphrase Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label
                                    htmlFor="admin-password"
                                    className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A]"
                                >
                                    Passphrase
                                </label>
                                <span className="text-[11px] text-[#6B665F]">Restricted Credentials</span>
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9C968D]">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <input
                                    id="admin-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    {...register("password")}
                                    className={`block w-full pl-10 pr-10 py-2.5 bg-transparent border rounded text-xs text-[#1A1A1A] placeholder-[#9C968D] focus:outline-none focus:border-[#3d030b] focus:ring-1 focus:ring-[#3d030b] transition-all ${
                                        errors.password
                                            ? "border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]"
                                            : "border-[rgba(26,26,26,0.15)]"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9C968D] hover:text-[#1A1A1A] transition-colors focus:outline-none"
                                    aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-[#ba1a1a]">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center items-center py-3 px-4 rounded-full bg-[#5a181e] text-white hover:bg-[#3d030b] text-xs font-semibold tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-[#3d030b]/40 disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? "Authenticating Access..." : "Sign In to Archive Suite"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Archival Note & Back to Public Portal */}
                <div className="mt-8 text-center space-y-4">
                    <p className="text-[11px] text-[#6B665F] max-w-xs mx-auto leading-relaxed">
                        Access is restricted to authorized members of the Heritage Committee. Institutional archive
                        integrity must be maintained at all times.
                    </p>
                    <div>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-xs text-[#6B665F] hover:text-[#3d030b] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Return to Public Archive</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
