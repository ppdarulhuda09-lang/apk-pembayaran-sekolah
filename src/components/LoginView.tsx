import React, { useState } from "react";
import { Building2, Lock, User, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { AppConfig } from "../types";

interface LoginViewProps {
  onLoginSuccess: () => void;
  config: AppConfig;
  isDark: boolean;
}

export default function LoginView({ onLoginSuccess, config, isDark }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate database lookup / credentials verification
    setTimeout(() => {
      // Fetch custom credentials from localStorage, otherwise default to admin/admin123
      const savedUser = localStorage.getItem("KAS_SEKOLAH_USER") || "admin";
      const savedPass = localStorage.getItem("KAS_SEKOLAH_PASS") || "admin123";

      if (username.trim() === savedUser && password === savedPass) {
        // Correct credentials
        sessionStorage.setItem("KAS_SEKOLAH_LOGGED_IN", "true");
        localStorage.removeItem("KAS_SEKOLAH_LOGGED_IN"); // Clean up any old localStorage
        onLoginSuccess();
      } else {
        setError("Username atau password salah. Silakan coba kembali.");
        setIsLoading(false);
      }
    }, 600); // Friendly natural latency
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 font-sans ${isDark ? "dark mesh-bg" : "light bg-slate-50"}`}>
      <div className="w-full max-w-md select-none">
        
        {/* Brand Banner */}
        <div className="text-center mb-8 animate-fade-in">
          {config.logoSekolah ? (
            <img 
              src={config.logoSekolah} 
              alt="Logo Sekolah" 
              referrerPolicy="no-referrer"
              className="inline-flex size-20 object-contain mb-4 transition-transform hover:scale-105"
            />
          ) : (
            <div className="inline-flex size-16 bg-blue-600 rounded-2xl items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-4 transition-transform hover:scale-105">
              <Building2 className="size-8" />
            </div>
          )}
          <h1 className={`text-2xl font-extrabold tracking-tight transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}>
            {config.namaSekolah || "SMA Nusantara Mandiri"}
          </h1>
          <p className={`text-xs mt-1 font-semibold uppercase tracking-wider transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Sistem Kasir Penerimaan & SPP Sekolah
          </p>
        </div>

        {/* Login Card */}
        <div className={`border transition-all duration-300 rounded-2xl shadow-xl overflow-hidden ${
          isDark 
            ? "bg-slate-900 border-white/10 text-slate-100" 
            : "bg-white border-slate-200 text-slate-800"
        }`}>
          
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-base font-bold text-white">Login Admin</h2>
              <p className="text-xs text-slate-400 font-medium font-semibold">Lakukan login untuk mengelola tagihan, kuitansi, dan sinkronisasi.</p>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Username</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450">
                    <User className="size-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 transition-all placeholder:text-slate-500 placeholder:font-medium text-slate-100"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Password</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450">
                    <Lock className="size-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-9 pr-10 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 transition-all placeholder:text-slate-500 placeholder:font-medium text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-550 hover:bg-blue-600 disabled:bg-blue-600/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-500/15 cursor-pointer active:scale-95"
                >
                  <LogIn className="size-4" />
                  {isLoading ? "Memvalidasi..." : "Masuk ke Sistem"}
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[10px] text-slate-400 font-medium animate-fade-in">
          Sistem Keuangan Kasir & SPP Sekolah v1.0. All Rights Reserved.
        </div>

      </div>
    </div>
  );
}
