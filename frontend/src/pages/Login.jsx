import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

const inputClassName =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const phoneInputClassName =
  "flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function Login() {
  const navigate = useNavigate();
  const { loginEmployee } = useAuth();

  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = phone.trim().length >= 8 && password.trim().length >= 4;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const fullPhone = countryCode + phone.replace(/[^\d]/g, '');
      await loginEmployee(fullPhone, password);
      navigate("/employee-dashboard", { replace: true });
    } catch (err) {
      console.error("Login Error:", err);
      setErrorMsg(err?.response?.data?.message || err.message || "Invalid phone or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-semibold text-white shadow">
            Yo
          </div>
          <span className="text-lg font-semibold text-blue-700">YVO</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Employee Login</h1>
            <p className="text-sm text-slate-500">Sign in to your account</p>
          </div>

          {errorMsg && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
              <div className="flex gap-2 mt-1">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                </select>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10 digit phone"
                  className={phoneInputClassName}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center pl-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className={inputClassName}
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={`w-full rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors ${canSubmit && !isSubmitting ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"
                }`}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
            <div className="pt-4 border-t border-slate-50 flex flex-col items-center gap-2">
              <Link to="/admin-login" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
                Company Admin Login
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
