export function Button({
  children,
  className = '',
  size = 'md',
  tone = 'primary',
  variant = 'solid',
  type = 'button',
  ...props
}) {
  const classes = ['button', `button--${variant}`, `button--${tone}`, `button--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
