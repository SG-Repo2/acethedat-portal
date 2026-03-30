import { Plus, Trash2 } from 'lucide-react';
import { DAY_KEYS, SUBJECTS } from '../../features/schedules/utils';

export function WeeklyPlanBoard({
  plan,
  mode = 'student',
  onAddItem,
  onDeleteItem,
  onItemChange,
  onToggleComplete,
}) {
  if (!plan) return null;

  return (
    <div className="plan-board">
      {DAY_KEYS.map((dayKey) => {
        const items = plan.days?.[dayKey] || [];

        return (
          <section className="plan-board__day" key={dayKey}>
            <header className="plan-board__day-header">
              <div>
                <p className="plan-board__day-label">{dayKey}</p>
                <p className="plan-board__day-subtitle">{items.length ? `${items.length} blocks` : 'Open block'}</p>
              </div>
              {mode === 'coach' ? (
                <button className="icon-button" onClick={() => onAddItem?.(dayKey)} type="button">
                  <Plus size={15} />
                </button>
              ) : null}
            </header>

            <div className="plan-board__list">
              {items.length === 0 ? <div className="plan-board__empty">Rest / buffer day</div> : null}

              {items.map((item) => {
                const subject = SUBJECTS[item.section] || SUBJECTS.Strategy;
                const style = {
                  '--plan-accent': subject.color,
                  '--plan-surface': subject.surface,
                };

                if (mode === 'coach') {
                  return (
                    <article className="plan-item plan-item--coach" key={item.id} style={style}>
                      <div className="plan-item__coach-grid">
                        <select
                          className="input input--sm"
                          value={item.section}
                          onChange={(event) => onItemChange?.(dayKey, item.id, { section: event.target.value })}
                        >
                          {Object.entries(SUBJECTS).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value.label}
                            </option>
                          ))}
                        </select>
                        <input
                          className="input input--sm"
                          value={item.topic}
                          onChange={(event) => onItemChange?.(dayKey, item.id, { topic: event.target.value })}
                          placeholder="Topic"
                        />
                        <div className="plan-item__coach-row">
                          <input
                            className="input input--sm"
                            min="0.5"
                            step="0.5"
                            type="number"
                            value={item.hours}
                            onChange={(event) => onItemChange?.(dayKey, item.id, { hours: Number(event.target.value) })}
                          />
                          <button className="icon-button icon-button--danger" onClick={() => onDeleteItem?.(dayKey, item.id)} type="button">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }

                return (
                  <button
                    className={['plan-item', item.completed ? 'plan-item--done' : ''].filter(Boolean).join(' ')}
                    key={item.id}
                    onClick={() => onToggleComplete?.(dayKey, item.id)}
                    style={style}
                    type="button"
                  >
                    <div className="plan-item__checkbox">{item.completed ? '✓' : ''}</div>
                    <div>
                      <p className="plan-item__section">{subject.label}</p>
                      <p className="plan-item__topic">{item.topic}</p>
                      <p className="plan-item__hours">{item.hours}h</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
