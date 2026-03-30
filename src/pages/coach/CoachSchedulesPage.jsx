import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { WeekNavigator } from '../../components/common/WeekNavigator';
import { getAssessmentStatusLabel, summarizeAssessment } from '../../features/assessments/utils';
import { WeeklyPlanBoard } from '../../components/common/WeeklyPlanBoard';
import { createCustomPlanItem, generateWeeklyPlan, getPlanId, summarizeWeeklyPlan } from '../../features/schedules/utils';
import { addWeeks, getStartOfWeek, getWeekRangeLabel } from '../../utils/date';
import { formatHours, formatPercent } from '../../utils/formatters';

export function CoachSchedulesPage() {
  const { students, weeklyPlans, selfAssessments, saveWeeklyPlan, updateWeeklyPlan, resetDemoPlans } = usePortal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('student') || students[0]?.id || '');
  const [weekOffset, setWeekOffset] = useState(0);
  const [generatorState, setGeneratorState] = useState({
    dailyHours: 3,
    targetExamDate: '',
    weakAreas: [],
  });

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || students[0];
  const weekStart = useMemo(() => addWeeks(getStartOfWeek(), weekOffset), [weekOffset]);
  const planId = selectedStudent ? getPlanId(selectedStudent.id, weekStart) : null;
  const plan = planId ? weeklyPlans[planId] || null : null;
  const summary = summarizeWeeklyPlan(plan);
  const assessmentSummary = summarizeAssessment(selectedStudent, selectedStudent ? selfAssessments[selectedStudent.id] : null);

  useEffect(() => {
    if (!selectedStudent) return;
    setGeneratorState({
      dailyHours: assessmentSummary?.preferredStudyHours || Math.max(2, Math.round(((selectedStudent.weeklyCommitmentHours || 18) / 6) * 2) / 2),
      targetExamDate: assessmentSummary?.targetExamDate || selectedStudent.targetExamDate || '',
      weakAreas: assessmentSummary?.weakAreas?.length ? assessmentSummary.weakAreas : selectedStudent.sections?.slice(0, 2) || [],
    });
  }, [assessmentSummary, selectedStudentId, selectedStudent]);

  const handleStudentChange = (studentId) => {
    setSelectedStudentId(studentId);
    setSearchParams({ student: studentId });
  };

  const handleGeneratePlan = () => {
    if (!selectedStudent) return;
    const nextPlan = generateWeeklyPlan({
      student: selectedStudent,
      weekStart,
      dailyHours: generatorState.dailyHours,
      targetExamDate: generatorState.targetExamDate,
      weakAreas: generatorState.weakAreas,
      published: plan?.published || false,
    });
    saveWeeklyPlan(selectedStudent.id, nextPlan);
  };

  const updatePlanDayItem = (dayKey, itemId, patch) => {
    if (!planId) return;
    updateWeeklyPlan(planId, (currentPlan) => ({
      ...currentPlan,
      days: {
        ...currentPlan.days,
        [dayKey]: currentPlan.days[dayKey].map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      },
    }));
  };

  const deletePlanItem = (dayKey, itemId) => {
    if (!planId) return;
    updateWeeklyPlan(planId, (currentPlan) => ({
      ...currentPlan,
      days: {
        ...currentPlan.days,
        [dayKey]: currentPlan.days[dayKey].filter((item) => item.id !== itemId),
      },
    }));
  };

  const addPlanItem = (dayKey) => {
    if (!planId) return;
    updateWeeklyPlan(planId, (currentPlan) => ({
      ...currentPlan,
      days: {
        ...currentPlan.days,
        [dayKey]: [...currentPlan.days[dayKey], createCustomPlanItem(dayKey, currentPlan.days[dayKey].length + 1)],
      },
    }));
  };

  const togglePublish = () => {
    if (!planId) return;
    updateWeeklyPlan(planId, (currentPlan) => ({
      ...currentPlan,
      published: !currentPlan.published,
    }));
  };

  const updateCoachNote = (note) => {
    if (!planId) return;
    updateWeeklyPlan(planId, (currentPlan) => ({
      ...currentPlan,
      coachNote: note,
    }));
  };

  return (
    <div className="page-stack">
      <PageIntro
        actions={
          <Button onClick={resetDemoPlans} tone="neutral" variant="outline">
            Reset demo plans
          </Button>
        }
        description="Plans are editable in memory and persisted to local storage. Notion API integration will replace local storage."
        eyebrow="Coach Portal"
        title="Schedules"
      />

      <div className="schedule-layout">
        <SectionCard className="schedule-layout__sidebar" title="Student list">
          <div className="stack-list">
            {students.map((student) => (
              <button
                className={['student-picker', student.id === selectedStudentId ? 'student-picker--active' : ''].filter(Boolean).join(' ')}
                key={student.id}
                onClick={() => handleStudentChange(student.id)}
                type="button"
              >
                <div>
                  <p className="student-picker__name">{student.name}</p>
                  <p className="student-picker__meta">{student.focusArea}</p>
                </div>
                <Badge tone={student.id === selectedStudentId ? 'accent' : 'neutral'}>{student.status}</Badge>
              </button>
            ))}
          </div>
        </SectionCard>

        <div className="schedule-layout__main">
          <SectionCard
            actions={
              selectedStudent ? (
                <Button onClick={handleGeneratePlan}>
                  {plan ? 'Regenerate plan' : 'Generate weekly plan'}
                </Button>
              ) : null
            }
            description={selectedStudent ? `${selectedStudent.name} · ${selectedStudent.focusArea}` : ''}
            title={selectedStudent ? `${selectedStudent.name}'s weekly plan` : 'Weekly plan'}
          >
            <div className="schedule-toolbar">
              <WeekNavigator
                label={getWeekRangeLabel(weekStart)}
                onCurrent={() => setWeekOffset(0)}
                onNext={() => setWeekOffset((value) => value + 1)}
                onPrevious={() => setWeekOffset((value) => value - 1)}
              />

              {plan ? (
                <div className="schedule-toolbar__status">
                  <Badge tone={plan.published ? 'success' : 'warning'}>{plan.published ? 'Published' : 'Draft'}</Badge>
                  <Button onClick={togglePublish} tone="neutral" variant="outline">
                    {plan.published ? 'Move to draft' : 'Publish'}
                  </Button>
                </div>
              ) : null}
            </div>

            {assessmentSummary ? (
              <div className="assessment-callout">
                <div>
                  <p className="list-row__title">Latest student self-assessment</p>
                  <p className="list-row__meta">
                    Weak areas will prefill from {assessmentSummary.weakAreaLabels.join(', ') || 'the lowest rated sections'}.
                    {assessmentSummary.concernLabels.length ? ` Current blockers: ${assessmentSummary.concernLabels.join(', ')}.` : ''}
                  </p>
                </div>
                <Badge tone={assessmentSummary.status === 'submitted' ? 'accent' : assessmentSummary.status === 'reviewed' ? 'success' : 'warning'}>
                  {getAssessmentStatusLabel(assessmentSummary.status)}
                </Badge>
              </div>
            ) : (
              <div className="assessment-callout assessment-callout--muted">
                <div>
                  <p className="list-row__title">No student self-assessment yet</p>
                  <p className="list-row__meta">The generator is falling back to the student’s seeded sections until they submit their own issue areas.</p>
                </div>
              </div>
            )}

            <div className="generator-grid">
              <label className="input-shell">
                <span>Daily hours</span>
                <input
                  min="1"
                  onChange={(event) => setGeneratorState((state) => ({ ...state, dailyHours: Number(event.target.value) }))}
                  step="0.5"
                  type="number"
                  value={generatorState.dailyHours}
                />
              </label>
              <label className="input-shell">
                <span>Target exam date</span>
                <input
                  onChange={(event) => setGeneratorState((state) => ({ ...state, targetExamDate: event.target.value }))}
                  type="date"
                  value={generatorState.targetExamDate}
                />
              </label>
              <label className="input-shell">
                <span>Weak areas {assessmentSummary?.weakAreaLabels?.length ? `(prefilled from student assessment)` : ''}</span>
                <select
                  multiple
                  onChange={(event) =>
                    setGeneratorState((state) => ({
                      ...state,
                      weakAreas: [...event.target.selectedOptions].map((option) => option.value),
                    }))
                  }
                  value={generatorState.weakAreas}
                >
                  {(selectedStudent?.sections || []).map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {plan ? (
              <>
                <WeeklyPlanBoard mode="coach" onAddItem={addPlanItem} onDeleteItem={deletePlanItem} onItemChange={updatePlanDayItem} plan={plan} />

                <div className="schedule-summary-grid">
                  <SectionCard title="Plan summary">
                    <div className="detail-grid">
                      <div>
                        <p className="label">Completion</p>
                        <strong>{formatPercent(summary.completionRate)}</strong>
                      </div>
                      <div>
                        <p className="label">Planned hours</p>
                        <strong>{formatHours(summary.totalHours)}</strong>
                      </div>
                    </div>
                    <div className="stack-list stack-list--tight">
                      {Object.entries(summary.sectionHours)
                        .sort((left, right) => right[1] - left[1])
                        .map(([section, hours]) => (
                          <div className="list-row" key={section}>
                            <p className="list-row__title">{section}</p>
                            <strong>{formatHours(hours)}</strong>
                          </div>
                        ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Coach note">
                    <textarea className="textarea" onChange={(event) => updateCoachNote(event.target.value)} value={plan.coachNote} />
                  </SectionCard>
                </div>
              </>
            ) : (
              <EmptyState
                action={<Button onClick={handleGeneratePlan}>Create a plan</Button>}
                description="Generate a weekly study plan, then edit it before publishing it to the student portal."
                title="No plan for this week"
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
