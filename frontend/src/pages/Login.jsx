import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const inputClassName =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const phoneInputClassName =
  "flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";



export default function Login() {
  const navigate = useNavigate();

  const loginMethod = "phone"; // Default to phone

  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");

  // eslint-disable-next-line no-unused-vars
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { login, loginEmployee } = useAuth();

  const canSubmit = loginMethod === "email" ? email && emailPassword : phone && phonePassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    console.log("Submitting Login:", loginMethod);

    try {
      if (loginMethod === "phone") {
        console.log("Attempting Employee Login...", countryCode + phone);
        await loginEmployee(countryCode + phone, phonePassword);
        console.log("Employee Login Success, Navigating...");
        navigate("/employee-dashboard", { replace: true });
        return;
      }

      console.log("Attempting Admin Login...", email);
      const userData = await login(email, emailPassword);

      // STRICT SEPARATION: Block Super Admin
      if (userData.isSuperAdmin || userData.role === 'SUPER_ADMIN') {
        // Generic error to prevent role enumeration
        throw new Error("Invalid email or password");
      }
      console.log("Admin Login Success, Navigating...");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login Error:", err);
      setErrorMsg(err?.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
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
            <h1 className="text-2xl font-semibold text-slate-900">
              {loginMethod === 'phone' ? 'Employee Login' : 'Admin Login'}
            </h1>
            <p className="text-sm text-slate-500">Sign in to your account</p>
          </div>

          {errorMsg && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {/* NORMAL LOGIN FORM */}
          <form className="space-y-4 mt-6" onSubmit={handleSubmit}>

            {/* HIDDEN TOGGLE - REPLACED WITH LINK BELOW */}
            {/* <div className="rounded-lg bg-slate-100 p-1"> ... </div> */}

            {loginMethod === "email" ? (
              <>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email"
                  className={inputClassName}
                />
                <input
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className={inputClassName}
                />
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-28 rounded-lg border border-slate-200 px-2 py-2"
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                  </select>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone"
                    className={phoneInputClassName}
                  />
                </div>
                <input
                  value={phonePassword}
                  onChange={(e) => setPhonePassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className={inputClassName}
                />
              </>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full rounded-lg px-3 py-2 text-sm font-semibold text-white ${canSubmit ? "bg-blue-600" : "bg-slate-300"
                }`}
            >
              {submitting ? "Logging in..." : "Login"}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}

