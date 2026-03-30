import { useState, useMemo } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { normalizeScore } from '../../lib/scoreConversion';

const SECTIONS = ['Bio', 'GChem', 'OChem', 'PAT', 'QR', 'RC'];

const DIFFICULTY_COLORS = {
  easy: 'var(--accent-green)',
  medium: 'var(--accent-yellow)',
  hard: 'var(--accent-red)',
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'var(--accent-blue)' },
  { value: 'reviewing', label: 'Reviewing', color: 'var(--accent-yellow)' },
  { value: 'mastered', label: 'Mastered', color: 'var(--accent-green)' },
];

function groupBySection(questions) {
  const grouped = {};
  for (const q of questions) {
    if (!grouped[q.section]) grouped[q.section] = [];
    grouped[q.section].push(q);
  }
  return grouped;
}

function groupByTopic(questions) {
  const grouped = {};
  for (const q of questions) {
    const key = q.topic || 'Uncategorized';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  }
  return grouped;
}

export default function StudentMissedQuestions({ studentId }) {
  const { students, updateMissedQuestion, addMissedQuestion, currentStudent } = usePortal();
  const student = studentId ? students.find((s) => s.id === studentId) : currentStudent;

  const [activeSection, setActiveSection] = useState('All');
  const [groupBy, setGroupBy] = useState('section'); // 'section' | 'topic' | 'status'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'new' | 'reviewing' | 'mastered'
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQ, setNewQ] = useState({ section: 'Bio', topic: '', question: '', difficulty: 'medium', notes: '' });

  if (!student) {
    return (
      <div className="missed-q-page">
        <p className="text-muted">Student not found.</p>
      </div>
    );
  }

  const allQuestions = student.missedQuestions || [];

  const filtered = useMemo(() => {
    return allQuestions.filter(q => {
      if (activeSection !== 'All' && q.section !== activeSection) return false;
      if (filterStatus !== 'all' && q.status !== filterStatus) return false;
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !q.question?.toLowerCase().includes(term) &&
          !q.topic?.toLowerCase().includes(term) &&
          !q.notes?.toLowerCase().includes(term)
        ) return false;
      }
      return true;
    });
  }, [allQuestions, activeSection, filterStatus, filterDifficulty, searchTerm]);

  const stats = useMemo(() => {
    const total = allQuestions.length;
    const byStatus = { new: 0, reviewing: 0, mastered: 0 };
    for (const q of allQuestions) {
      if (q.status) byStatus[q.status] = (byStatus[q.status] || 0) + 1;
    }
    const bySection = {};
    for (const q of allQuestions) {
      bySection[q.section] = (bySection[q.section] || 0) + 1;
    }
    return { total, byStatus, bySection };
  }, [allQuestions]);

  function toggleGroup(key) {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function startEdit(q) {
    setEditingId(q.id);
    setEditNote(q.notes || '');
  }

  function saveEdit(q) {
    updateMissedQuestion?.(student.id, q.id, { notes: editNote });
    setEditingId(null);
  }

  function cycleStatus(q) {
    const order = ['new', 'reviewing', 'mastered'];
    const next = order[(order.indexOf(q.status || 'new') + 1) % order.length];
    updateMissedQuestion?.(student.id, q.id, { status: next });
  }

  async function handleAddQuestion() {
    if (!newQ.question.trim()) return;
    const q = {
      id: `mq-${Date.now()}`,
      ...newQ,
      status: 'new',
      dateAdded: new Date().toISOString().slice(0, 10),
    };
    await addMissedQuestion?.(student.id, q);
    setNewQ({ section: 'Bio', topic: '', question: '', difficulty: 'medium', notes: '' });
    setShowAddForm(false);
  }

  function getGroups() {
    if (groupBy === 'section') return groupBySection(filtered);
    if (groupBy === 'topic') return groupByTopic(filtered);
    if (groupBy === 'status') {
      return {
        new: filtered.filter(q => (q.status || 'new') === 'new'),
        reviewing: filtered.filter(q => q.status === 'reviewing'),
        mastered: filtered.filter(q => q.status === 'mastered'),
      };
    }
    return { All: filtered };
  }

  const groups = getGroups();

  return (
    <div className="missed-q-page">
      {/* Header */}
      <div className="mqp-header">
        <div className="mqp-title-row">
          <h2>Missed Questions</h2>
          <button className="btn-primary" onClick={() => setShowAddForm(v => !v)}>
            {showAddForm ? 'â Cancel' : '+ Add Question'}
          </button>
        </div>
        <p className="text-muted">{student.name}</p>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat-chip">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div
              key={status}
              className={`stat-chip clickable ${filterStatus === status ? 'active' : ''}`}
              style={filterStatus === status ? { borderColor: STATUS_OPTIONS.find(s => s.value === status)?.color } : {}}
              onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
            >
              <span className="stat-num">{count}</span>
              <span className="stat-label" style={{ color: STATUS_OPTIONS.find(s => s.value === status)?.color }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Question Form */}
      {showAddForm && (
        <div className="add-form-card">
          <h4>Add Missed Question</h4>
          <div className="add-form-grid">
            <div className="form-field">
              <label>Section</label>
              <select value={newQ.section} onChange={e => setNewQ(p => ({ ...p, section: e.target.value }))}>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Topic</label>
              <input
                type="text"
                value={newQ.topic}
                onChange={e => setNewQ(p => ({ ...p, topic: e.target.value }))}
                placeholder="e.g. Resonance"
              />
            </div>
            <div className="form-field">
              <label>Difficulty</label>
              <select value={newQ.difficulty} onChange={e => setNewQ(p => ({ ...p, difficulty: e.target.value }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div className="form-field full-width">
            <label>Question / Description</label>
            <textarea
              value={newQ.question}
              onChange={e => setNewQ(p => ({ ...p, question: e.target.value }))}
              placeholder="Describe what this question was about..."
              rows={3}
            />
          </div>
          <div className="form-field full-width">
            <label>Notes</label>
            <input
              type="text"
              value={newQ.notes}
              onChange={e => setNewQ(p => ({ ...p, notes: e.target.value }))}
              placeholder="Why did you miss it? What's the correct approach?"
            />
          </div>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleAddQuestion} disabled={!newQ.question.trim()}>
              Add Question
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mqp-controls">
        {/* Section filter tabs */}
        <div className="section-tabs">
          {['All', ...SECTIONS].map(s => (
            <button
              key={s}
              className={`section-tab ${activeSection === s ? 'active' : ''}`}
              onClick={() => setActiveSection(s)}
            >
              {s}
              {s !== 'All' && stats.bySection[s] ? (
                <span className="section-count">{stats.bySection[s]}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search questions, topics, notesâ¦"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
          >
            <option value="all">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            className="filter-select"
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
          >
            <option value="section">Group by Section</option>
            <option value="topic">Group by Topic</option>
            <option value="status">Group by Status</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="results-count text-muted">
        {filtered.length} question{filtered.length !== 1 ? 's' : ''}
        {filtered.length < allQuestions.length ? ` (filtered from ${allQuestions.length})` : ''}
      </p>

      {/* Question groups */}
      <div className="question-groups">
        {Object.entries(groups).map(([groupKey, questions]) => {
          if (!questions.length) return null;
          const isExpanded = expandedGroups[groupKey] !== false; // default open
          const statusOpt = STATUS_OPTIONS.find(s => s.value === groupKey);

          return (
            <div key={groupKey} className="question-group">
              <button
                className="group-header"
                onClick={() => toggleGroup(groupKey)}
              >
                <span className="group-toggle">{isExpanded ? 'â¾' : 'â¸'}</span>
                <span
                  className="group-name"
                  style={statusOpt ? { color: statusOpt.color } : {}}
                >
                  {groupKey}
                </span>
                <span className="group-count">{questions.length}</span>
              </button>

              {isExpanded && (
                <div className="question-list">
                  {questions.map(q => {
                    const statusOpt = STATUS_OPTIONS.find(s => s.value === (q.status || 'new'));
                    return (
                      <div key={q.id} className="question-card">
                        <div className="qcard-top">
                          <div className="qcard-meta">
                            {groupBy !== 'section' && (
                              <span className="qcard-section">{q.section}</span>
                            )}
                            {q.topic && (
                              <span className="qcard-topic">{q.topic}</span>
                            )}
                            <span
                              className="qcard-difficulty"
                              style={{ color: DIFFICULTY_COLORS[q.difficulty] || 'var(--text-muted)' }}
                            >
                              {q.difficulty || 'medium'}
                            </span>
                            {q.dateAdded && (
                              <span className="qcard-date text-muted">{q.dateAdded}</span>
                            )}
                          </div>
                          <button
                            className="status-badge"
                            style={{ borderColor: statusOpt?.color, color: statusOpt?.color }}
                            onClick={() => cycleStatus(q)}
                            title="Click to cycle status"
                          >
                            {statusOpt?.label || 'New'}
                          </button>
                        </div>

                        <p className="qcard-question">{q.question}</p>

                        {editingId === q.id ? (
                          <div className="note-edit">
                            <input
                              type="text"
                              value={editNote}
                              onChange={e => setEditNote(e.target.value)}
                              className="note-input"
                              placeholder="Add notes about this questionâ¦"
                              autoFocus
                            />
                            <div className="note-actions">
                              <button className="btn-ghost sm" onClick={() => setEditingId(null)}>Cancel</button>
                              <button className="btn-primary sm" onClick={() => saveEdit(q)}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="qcard-note-row">
                            {q.notes ? (
                              <p className="qcard-note">{q.notes}</p>
                            ) : (
                              <span className="text-muted qcard-note-empty">No notes yet</span>
                            )}
                            <button className="note-edit-btn text-muted" onClick={() => startEdit(q)}>
                              â
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <p>
              {allQuestions.length === 0
                ? 'No missed questions recorded yet. Add one to start tracking!'
                : 'No questions match the current filters.'}
            </p>
          </div>
        )}
      </div>

      <style>{`
        .missed-q-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .mqp-header { margin-bottom: 1.5rem; }
        .mqp-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        .mqp-title-row h2 { margin: 0; font-size: 1.6rem; }
        .stats-bar {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }
        .stat-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 1rem;
          background: var(--surface-2);
          border-radius: 8px;
          border: 1px solid var(--border);
          min-width: 60px;
        }
        .stat-chip.clickable { cursor: pointer; transition: all 0.15s; }
        .stat-chip.clickable:hover { border-color: var(--accent-blue); }
        .stat-chip.active { border-width: 2px; }
        .stat-num { font-size: 1.25rem; font-weight: 700; line-height: 1; }
        .stat-label { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem; }
        .add-form-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .add-form-card h4 { margin: 0 0 1rem; font-size: 1rem; }
        .add-form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .form-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .form-field.full-width { margin-bottom: 0.75rem; }
        .form-field label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
        .form-field input, .form-field select, .form-field textarea {
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .form-field textarea { resize: vertical; }
        .form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }
        .mqp-controls { margin-bottom: 1rem; }
        .section-tabs {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }
        .section-tab {
          padding: 0.3rem 0.7rem;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .section-tab.active {
          background: var(--accent-blue);
          color: #fff;
          border-color: var(--accent-blue);
        }
        .section-count {
          background: rgba(255,255,255,0.25);
          border-radius: 10px;
          padding: 0 5px;
          font-size: 0.7rem;
        }
        .section-tab:not(.active) .section-count {
          background: var(--surface-3);
          color: var(--text-muted);
        }
        .filter-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 1;
          min-width: 180px;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .filter-select {
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
        }
        .results-count { font-size: 0.8rem; margin-bottom: 0.75rem; }
        .question-groups { display: flex; flex-direction: column; gap: 0.75rem; }
        .question-group {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
        }
        .group-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--surface-2);
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          transition: background 0.15s;
        }
        .group-header:hover { background: var(--surface-3); }
        .group-toggle { font-size: 0.75rem; color: var(--text-muted); }
        .group-name { flex: 1; }
        .group-count {
          background: var(--surface-3);
          border-radius: 12px;
          padding: 0.1rem 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .question-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .question-card {
          padding: 0.875rem 1rem;
          border-top: 1px solid var(--border);
          transition: background 0.1s;
        }
        .question-card:hover { background: var(--surface-2); }
        .qcard-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.4rem;
        }
        .qcard-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .qcard-section, .qcard-topic {
          font-size: 0.75rem;
          font-weight: 600;
          background: var(--surface-3);
          border-radius: 4px;
          padding: 0.1rem 0.4rem;
          color: var(--text-secondary);
        }
        .qcard-difficulty { font-size: 0.75rem; font-weight: 600; }
        .qcard-date { font-size: 0.72rem; }
        .status-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          border: 1px solid;
          background: transparent;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .qcard-question {
          margin: 0 0 0.4rem;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--text-primary);
        }
        .qcard-note-row {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .qcard-note {
          flex: 1;
          margin: 0;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-style: italic;
          line-height: 1.4;
        }
        .qcard-note-empty { font-size: 0.8rem; font-style: italic; flex: 1; }
        .note-edit-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0;
          line-height: 1;
          opacity: 0.5;
          transition: opacity 0.15s;
        }
        .note-edit-btn:hover { opacity: 1; }
        .note-edit { display: flex; flex-direction: column; gap: 0.4rem; }
        .note-input {
          width: 100%;
          padding: 0.35rem 0.6rem;
          border-radius: 6px;
          border: 1px solid var(--accent-blue);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.875rem;
          box-sizing: border-box;
        }
        .note-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-muted);
          background: var(--surface-1);
          border: 1px dashed var(--border);
          border-radius: 10px;
        }
        .btn-primary {
          padding: 0.5rem 1rem;
          background: var(--accent-blue);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-primary.sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          padding: 0.5rem 1rem;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-ghost.sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; }
        .btn-ghost:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
        .text-muted { color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export { StudentMissedQuestions };
