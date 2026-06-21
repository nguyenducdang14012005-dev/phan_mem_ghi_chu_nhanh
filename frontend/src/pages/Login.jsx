import React, { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const sampleUser = {
    userId: 1,
    email: "demo@example.com",
    fullName: "Demo User",
    status: "Active",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call / authentication
    setTimeout(() => {
      // For demo, accept any credentials and return the sample user
      onLogin(sampleUser);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Đăng nhập</h2>
        <p className="muted">Sử dụng tài khoản mẫu để tiến hành phát triển.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="demo@example.com"
            required
          />

          <label>Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            required
          />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="divider" />
        <div className="sample">
          <strong>Tài khoản mẫu:</strong>
          <div>Email: demo@example.com</div>
          <div>Mật khẩu: any</div>
        </div>
      </div>
    </div>
  );
}
