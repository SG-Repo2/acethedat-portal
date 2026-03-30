import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';

export function NotFoundPage() {
  return (
    <div className="standalone-page">
      <EmptyState
        action={
          <Link className="button button--solid button--primary button--md" to="/">
            Return to portal
          </Link>
        }
        description="The route you requested doesn’t exist in this scaffold."
        title="Page not found"
      />
    </div>
  );
}
