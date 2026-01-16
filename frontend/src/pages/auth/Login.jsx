import React, { useState } from "react";
import "./Login.scss";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "../../services/Api.service";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  let navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    let { data, error } = await ApiService.login(formData);

    setLoading(false);

    if (error) {
      toast.error(error.response.data.message);
      return;
    }

    if (data) {
      toast.success(data.message);
      navigate("/default");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Left Side - Login Form */}
        <div className="login-left">
          <div className="form-section">
            {/* Logo and Brand */}
            <div className="logo-section">
              <div className="logo-badge">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <defs>
                    <linearGradient id="logoGradient">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <rect x="4" y="4" width="16" height="16" rx="2" fill="url(#logoGradient)"/>
                  <rect x="20" y="4" width="16" height="16" rx="2" fill="url(#logoGradient)" opacity="0.7"/>
                  <rect x="4" y="20" width="16" height="16" rx="2" fill="url(#logoGradient)" opacity="0.7"/>
                  <rect x="20" y="20" width="16" height="16" rx="2" fill="url(#logoGradient)" opacity="0.4"/>
                </svg>
              </div>
              <div className="brand-info">
                <h2 className="brand-name">SkitSmith</h2>
                <p className="brand-tagline">AI Chat Platform</p>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="welcome-section">
              <h1>Welcome Back</h1>
              <p>Sign in to your account and start chatting with AI</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-field">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </div>
              </div>

              <div className="form-group">
                <div className="label-header">
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="forgot-btn">Forgot?</Link>
                </div>
                <div className="input-field password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.26 3.64m-3.28-2.3a3 3 0 1 0-4.24 4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span> Signing in...
                  </>
                ) : (
                  <>
                    Sign In <span className="arrow">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <span>New to SkitSmith?</span>
            </div>

            {/* Sign Up Link */}
            <Link to="/register" className="btn-signup">
              Create Account
            </Link>

            {/* Footer */}
            <p className="footer-text">
              By signing in, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Right Side - Features */}
        <div className="login-right">
          <div className="features-container">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>AI responses in milliseconds</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure</h3>
              <p>Enterprise-grade encryption</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Track every conversation</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Global</h3>
              <p>Available worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
