export function MetricCard({ label, value, helper, tone = 'default' }) {
  return (
    <article className={['metric-card', `metric-card--${tone}`].join(' ')}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {helper ? <p className="metric-card__helper">{helper}</p> : null}
    </article>
  );
}
