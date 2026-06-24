import { useState } from "react";
import { Loader2, Lock, ShieldCheck, UserPlus, KeyRound } from "lucide-react";
import { api, getApiError } from "../api";
import "./admin.css";

export default function Login({ onLogin }) {
  const [authMode, setAuthMode] = useState("login"); // "login" | "register" | "forgot" | "reset"

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    device_name: "Web - Google Keep Clone",
  });
  const [registerForm, setRegisterForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetForm, setResetForm] = useState({ email: "", otp: "", newPassword: "" });

  const [message, setMessage] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const setMsg = (type, text) => setMessage({ type, text });
  const clearMsg = () => setMessage(null);

  // ─── Đăng nhập ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    clearMsg();
    try {
      const res = await api.post("/auth/login", loginForm);
      const { token, user } = res.data.data || res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setMsg("error", getApiError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Đăng ký ────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    clearMsg();
    try {
      await api.post("/auth/register", registerForm);
      setRegisterForm({ full_name: "", email: "", password: "" });
      setAuthMode("login");
      setMsg("success", "Tạo tài khoản thành công, có thể đăng nhập.");
    } catch (err) {
      setMsg("error", getApiError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Quên mật khẩu: Gửi OTP ─────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return setMsg("error", "Vui lòng nhập email");
    setAuthLoading(true);
    clearMsg();
    try {
      const res = await api.post("/auth/forgot-password", { email: forgotEmail });
      setResetForm({ email: forgotEmail, otp: "", newPassword: "" });
      setMsg("success", res.data.message || "Đã gửi mã OTP!");
      setAuthMode("reset");
    } catch (err) {
      setMsg("error", getApiError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Đặt lại mật khẩu ────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetForm.otp || !resetForm.newPassword) {
      return setMsg("error", "Vui lòng nhập đủ mã OTP và mật khẩu mới");
    }
    setAuthLoading(true);
    clearMsg();
    try {
      const res = await api.post("/auth/reset-password", resetForm);
      setMsg("success", res.data.message || "Đổi mật khẩu thành công!");
      setResetForm({ email: "", otp: "", newPassword: "" });
      setForgotEmail("");
      setTimeout(() => {
        setAuthMode("login");
        clearMsg();
      }, 2000);
    } catch (err) {
      setMsg("error", getApiError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Tiêu đề theo mode ──────────────────────────────────────
  const titleMap = {
    login: "Đăng nhập hệ thống",
    register: "Tạo tài khoản mới",
    forgot: "Quên mật khẩu",
    reset: "Đặt mật khẩu mới",
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="brand-mark">
          <ShieldCheck size={30} aria-hidden="true" />
          <div>
            <span>Google Keep Clone</span>
            <strong>Xác thực</strong>
          </div>
        </div>

        {/* Tabs — chỉ hiện khi không ở chế độ forgot/reset */}
        {authMode !== "forgot" && authMode !== "reset" && (
          <div className="auth-tabs" role="tablist" aria-label="Chọn biểu mẫu">
            <button
              className={authMode === "login" ? "active" : ""}
              type="button"
              onClick={() => { setAuthMode("login"); clearMsg(); }}
            >
              <Lock size={18} aria-hidden="true" />
              Đăng nhập
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              type="button"
              onClick={() => { setAuthMode("register"); clearMsg(); }}
            >
              <UserPlus size={18} aria-hidden="true" />
              Đăng ký
            </button>
          </div>
        )}

        <h1 id="auth-title">{titleMap[authMode]}</h1>

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {/* ── ĐĂNG NHẬP ─────────────────────────────────── */}
        {authMode === "login" && (
          <form className="form-stack" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </label>
            <button className="primary-action" type="submit" disabled={authLoading}>
              {authLoading ? (
                <Loader2 className="spin" size={18} aria-hidden="true" />
              ) : (
                <Lock size={18} aria-hidden="true" />
              )}
              Đăng nhập
            </button>
            <button
              type="button"
              className="ghost-action"
              style={{ justifyContent: "center", marginTop: -4 }}
              onClick={() => { setAuthMode("forgot"); clearMsg(); }}
            >
              <KeyRound size={15} />
              Quên mật khẩu?
            </button>
          </form>
        )}

        {/* ── ĐĂNG KÝ ──────────────────────────────────── */}
        {authMode === "register" && (
          <form className="form-stack" onSubmit={handleRegister}>
            <label>
              Họ tên
              <input
                value={registerForm.full_name}
                onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                minLength={6}
                maxLength={72}
                required
              />
            </label>
            <button className="primary-action" type="submit" disabled={authLoading}>
              {authLoading ? (
                <Loader2 className="spin" size={18} aria-hidden="true" />
              ) : (
                <UserPlus size={18} aria-hidden="true" />
              )}
              Đăng ký
            </button>
          </form>
        )}

        {/* ── QUÊN MẬT KHẨU: nhập email ───────────────── */}
        {authMode === "forgot" && (
          <form className="form-stack" onSubmit={handleForgotPassword}>
            <label>
              Email đã đăng ký
              <input
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </label>
            <button className="primary-action" type="submit" disabled={authLoading}>
              {authLoading ? (
                <Loader2 className="spin" size={18} aria-hidden="true" />
              ) : (
                <KeyRound size={18} aria-hidden="true" />
              )}
              Gửi mã xác nhận
            </button>
            <button
              type="button"
              className="ghost-action"
              style={{ justifyContent: "center" }}
              onClick={() => { setAuthMode("login"); clearMsg(); }}
            >
              ← Quay lại đăng nhập
            </button>
          </form>
        )}

        {/* ── ĐẶT MẬT KHẨU MỚI: nhập OTP + mật khẩu ─── */}
        {authMode === "reset" && (
          <form className="form-stack" onSubmit={handleResetPassword}>
            <p style={{ fontSize: 13, color: "var(--admin-text-muted)", margin: 0 }}>
              Mã OTP đã được in ra console server (15 phút). Nhập vào đây để đặt mật khẩu mới.
            </p>
            <label>
              Mã OTP (6 chữ số)
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={resetForm.otp}
                onChange={(e) => setResetForm({ ...resetForm, otp: e.target.value })}
                required
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                type="password"
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                required
              />
            </label>
            <button className="primary-action" type="submit" disabled={authLoading}>
              {authLoading ? (
                <Loader2 className="spin" size={18} aria-hidden="true" />
              ) : (
                <KeyRound size={18} aria-hidden="true" />
              )}
              Đặt lại mật khẩu
            </button>
            <button
              type="button"
              className="ghost-action"
              style={{ justifyContent: "center" }}
              onClick={() => { setAuthMode("forgot"); clearMsg(); }}
            >
              ← Gửi lại mã OTP
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
