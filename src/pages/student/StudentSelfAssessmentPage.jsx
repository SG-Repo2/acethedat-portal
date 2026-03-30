import { useEffect, useMemo, useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import {
  challengeAreaOptions,
  createEmptyAssessment,
  deriveWeakAreas,
  getAssessmentStatusLabel,
  getAssessmentSections,
  getChallengeLabel,
  getConfidenceLabel,
  getSectionLabel,
  summarizeAssessment,
} from '../../features/assessments/utils';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { formatDate } from '../../utils/date';

export function StudentSelfAssessmentPage() {
  const { currentStudent, currentAssessment, saveSelfAssessment, submitSelfAssessment } = usePortal();
  const [draft, setDraft] = useState(() => (currentStudent ? currentAssessment || createEmptyAssessment(currentStudent) : null));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentStudent) return;
    setDraft(currentAssessment || createEmptyAssessment(currentStudent));
    setSaved(Boolean(currentAssessment));
  }, [currentAssessment, currentStudent]);

  const summary = useMemo(
    () => (currentStudent && draft ? summarizeAssessment(currentStudent, draft) : null),
    [currentStudent, draft],
  );

  if (!currentStudent || !draft) {
    return <EmptyState description="Choose a student demo profile to complete the self-assessment." title="Student profile missing" />;
  }

  const sections = getAssessmentSections(currentStudent);

  const updateSectionScore = (section, score) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      confidenceBySection: {
        ...currentDraft.confidenceBySection,
        [section]: Number(score),
      },
    }));
    setSaved(false);
  };

  const toggleChallengeArea = (value) => {
    setDraft((currentDraft) => {
      const exists = currentDraft.challengeAreas.includes(value);
      return {
        ...currentDraft,
        challengeAreas: exists
          ? currentDraft.challengeAreas.filter((item) => item !== value)
          : [...currentDraft.challengeAreas, value],
      };
    });
    setSaved(false);
  };

  const handleSave = () => {
    saveSelfAssessment(currentStudent.id, draft);
    setSaved(true);
  };

  const handleSubmit = () => {
    submitSelfAssessment(currentStudent.id, draft);
    setSaved(true);
  };

  return (
    <div className="page-stack">
      <PageIntro
        description="Use this form to tell your coach where things feel strong, where things feel shaky, and what is getting in the way week to week."
        eyebrow="Student Portal"
        title="Self-assessment"
      />

      <div className="dashboard-grid">
        <SectionCard
          actions={
            <div className="page-intro__actions">
              <Button onClick={handleSave} tone="neutral" variant="outline">
                Save draft
              </Button>
              <Button onClick={handleSubmit}>
                Submit to coach
              </Button>
            </div>
          }
          description="Drafts save locally in demo mode. Submit sends your latest evaluation to the coach notification queue and updates schedule planning defaults."
          title="How are things feeling right now?"
        >
          <div className="assessment-grid">
            <label className="input-shell">
              <span>How many focused study hours per day feel realistic?</span>
              <input
                min="1"
                onChange={(event) => {
                  setDraft((currentDraft) => ({ ...currentDraft, preferredStudyHours: Number(event.target.value) }));
                  setSaved(false);
                }}
                step="0.5"
                type="number"
                value={draft.preferredStudyHours}
              />
            </label>

            <label className="input-shell">
              <span>Target exam date</span>
              <input
                onChange={(event) => {
                  setDraft((currentDraft) => ({ ...currentDraft, targetExamDate: event.target.value }));
                  setSaved(false);
                }}
                type="date"
                value={draft.targetExamDate}
              />
            </label>
          </div>

          <div className="assessment-section">
            <p className="section-label">Rate each section</p>
            <div className="stack-list">
              {sections.map((section) => {
                const score = draft.confidenceBySection?.[section] ?? 3;
                return (
                  <div className="rating-row" key={section}>
                    <div>
                      <p className="list-row__title">{getSectionLabel(section)}</p>
                      <p className="list-row__meta">{getConfidenceLabel(score)}</p>
                    </div>
                    <select className="input input--sm rating-row__select" onChange={(event) => updateSectionScore(section, event.target.value)} value={score}>
                      <option value={1}>1 - Very shaky</option>
                      <option value={2}>2 - Needs work</option>
                      <option value={3}>3 - Okay / mixed</option>
                      <option value={4}>4 - Mostly solid</option>
                      <option value={5}>5 - Confident</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="assessment-section">
            <p className="section-label">What is getting in the way?</p>
            <div className="checkbox-grid">
              {challengeAreaOptions.map((option) => {
                const checked = draft.challengeAreas.includes(option.value);
                return (
                  <button
                    className={['checkbox-chip', checked ? 'checkbox-chip--checked' : ''].filter(Boolean).join(' ')}
                    key={option.value}
                    onClick={() => toggleChallengeArea(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="input-shell">
            <span>Anything else your coach should know?</span>
            <textarea
              className="textarea"
              onChange={(event) => {
                setDraft((currentDraft) => ({ ...currentDraft, note: event.target.value }));
                setSaved(false);
              }}
              placeholder="Example: RC gets worse when I do it late at night, or PAT confidence drops when I haven’t practiced for a few days."
              value={draft.note}
            />
          </label>

          <div className="form-status-row">
            <div className="list-row__meta">
              {currentAssessment?.updatedAt ? `Last saved ${formatDate(currentAssessment.updatedAt, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No saved assessment yet'}
            </div>
            <div className="tag-row">
              <Badge tone={currentAssessment?.status === 'submitted' ? 'accent' : currentAssessment?.status === 'reviewed' ? 'success' : 'warning'}>
                {getAssessmentStatusLabel(currentAssessment?.status || 'draft')}
              </Badge>
              {saved ? <Badge tone="success">Saved</Badge> : <Badge tone="warning">Unsaved changes</Badge>}
            </div>
          </div>
        </SectionCard>

        <SectionCard description="This summary is what the coach will see when planning your next schedule." title="Assessment preview">
          {summary ? (
            <div className="stack-list">
              <div className="list-row">
                <div>
                  <p className="list-row__title">Issue areas that will prefill the schedule generator</p>
                  <p className="list-row__meta">Derived from your lowest-confidence sections.</p>
                </div>
                <div className="tag-row">
                  {deriveWeakAreas(currentStudent, draft).map((section) => (
                    <Badge key={section} tone="danger">
                      {getSectionLabel(section)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="list-row">
                <div>
                  <p className="list-row__title">Current blockers</p>
                  <p className="list-row__meta">
                    {draft.challengeAreas.length
                      ? draft.challengeAreas.map(getChallengeLabel).join(', ')
                      : 'No blockers selected yet'}
                  </p>
                </div>
              </div>

              <div className="stack-list stack-list--tight">
                {summary.ratings
                  .sort((left, right) => left.score - right.score)
                  .map((rating) => (
                    <div className="list-row" key={rating.section}>
                      <div>
                        <p className="list-row__title">{rating.sectionLabel}</p>
                        <p className="list-row__meta">{rating.scoreLabel}</p>
                      </div>
                      <Badge tone={rating.score <= 2 ? 'danger' : rating.score === 3 ? 'warning' : 'success'}>
                        {rating.score}/5
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}
