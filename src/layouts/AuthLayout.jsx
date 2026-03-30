export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__hero">
        <p className="auth-layout__eyebrow">AceTheDAT Portal</p>
        <h1>Coaching operations portal</h1>
        <p>
          Seed data and local storage power the current workflow. Notion API integration coming soon.
        </p>
      </div>
      <div className="auth-layout__panel">{children}</div>
    </div>
  );
}
