export function EmptyState({ title, description, action, compact = false }) {
  return (
    <div className={['empty-state', compact ? 'empty-state--compact' : ''].filter(Boolean).join(' ')}>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
