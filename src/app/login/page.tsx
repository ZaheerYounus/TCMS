"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Lock, User, AlertCircle, ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Please enter your User ID and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Invalid User ID or password. Please try again.");
        setLoading(false);
        return;
      }

      // Successful login
      router.push(nextUrl);
      router.refresh();
    } catch (err: any) {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#0B2B5E]/40 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#0B2B5E] border border-blue-900 shadow-xl mb-3 text-white">
            <Building2 className="h-8 w-8 text-[#F37021]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            TCMS
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-[#F37021] border border-orange-500/30">
              v2.0 Enterprise
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Transmission Case Management System
          </p>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
            CDC Share Registrar Services Limited
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-md">
          <CardHeader className="p-6 pb-4 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#F37021]" />
              Secure Staff Sign In
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your assigned officer credentials to access transmission cases
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  User ID (Username)
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or staff1"
                    autoFocus
                    className="pl-9 h-9 text-xs bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-[#F37021]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 h-9 text-xs bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-[#F37021]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#0B2B5E] hover:bg-[#123977] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to TCMS Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#F37021]" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Access Helper for Administrator & Staff */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-400 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-emerald-400" /> Authorized Team Credentials:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900/80 p-2 rounded border border-slate-800 text-slate-400">
                <div>
                  <span className="text-[#F37021] font-bold">Admin:</span> admin<br />
                  <span className="text-slate-500">Pass:</span> Admin@TCMS2026
                </div>
                <div>
                  <span className="text-blue-400 font-bold">Staff:</span> staff1 .. staff4<br />
                  <span className="text-slate-500">Pass:</span> Staff1@TCMS
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic text-center pt-1">
                Administrators can create or modify accounts in the Admin panel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <LoginForm />
    </Suspense>
  );
}
