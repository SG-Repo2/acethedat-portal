import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function WeekNavigator({ label, onPrevious, onCurrent, onNext }) {
  return (
    <div className="week-nav">
      <div className="week-nav__controls">
        <Button tone="neutral" variant="outline" size="sm" onClick={onPrevious}>
          <ChevronLeft size={16} />
          Prev
        </Button>
        <Button tone="neutral" variant="outline" size="sm" onClick={onCurrent}>
          This Week
        </Button>
        <Button tone="neutral" variant="outline" size="sm" onClick={onNext}>
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
      <p className="week-nav__label">{label}</p>
    </div>
  );
}
