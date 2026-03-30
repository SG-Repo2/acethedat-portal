import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export function LoginPage() {
  const { loginWithCredentials } = usePortal();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password');
      return;
    }
    setLoading(true);
    const result = await loginWithCredentials(email.trim(), password);
    if (result.success) {
      navigate(result.profile.homePath || '/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container animate-in">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--ivory)', marginBottom: 4, letterSpacing: '-0.3px' }}>
            Ace The <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>DAT</em>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-lo)' }}>
            Coaching Portal
          </div>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="you@acethedat.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: 'var(--text-muted)', display: 'flex'
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                fontSize: 12.5, color: '#ef4444', fontWeight: 500
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-gold"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 13.5, fontWeight: 600, gap: 8 }}
            >
              {loading ? (
                <span style={{ opacity: 0.7 }}>Signing in...</span>
              ) : (
                <>
                  <LogIn size={15} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Don't have an account? Contact your coach.
        </div>
      </div>
    </div>
  );
}
