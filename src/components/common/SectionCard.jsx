export function SectionCard({ title, description, actions, className = '', children }) {
  return (
    <section className={['section-card', className].filter(Boolean).join(' ')}>
      {(title || description || actions) && (
        <header className="section-card__header">
          <div>
            {title ? <h2 className="section-card__title">{title}</h2> : null}
            {description ? <p className="section-card__description">{description}</p> : null}
          </div>
          {actions ? <div className="section-card__actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
