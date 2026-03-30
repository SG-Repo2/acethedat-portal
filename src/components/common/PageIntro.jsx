export function PageIntro({ eyebrow, title, description, actions }) {
  return (
    <div className="page-intro">
      <div>
        {eyebrow ? <p className="page-intro__eyebrow">{eyebrow}</p> : null}
        <h1 className="page-intro__title">{title}</h1>
        {description ? <p className="page-intro__description">{description}</p> : null}
      </div>
      {actions ? <div className="page-intro__actions">{actions}</div> : null}
    </div>
  );
}
