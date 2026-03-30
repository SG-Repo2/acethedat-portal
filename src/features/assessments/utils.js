const SECTION_LABELS = {
  Bio: 'Biology',
  GChem: 'General Chemistry',
  OChem: 'Organic Chemistry',
  PAT: 'Perceptual Ability',
  RC: 'Reading Comprehension',
  QR: 'Quantitative Reasoning',
  Strategy: 'Strategy',
  App: 'Application Support',
};

export const challengeAreaOptions = [
  { value: 'timing', label: 'Timing / pacing' },
  { value: 'testAnxiety', label: 'Test anxiety' },
  { value: 'consistency', label: 'Consistency / follow-through' },
  { value: 'focus', label: 'Focus / distractions' },
  { value: 'contentGaps', label: 'Content gaps' },
  { value: 'stamina', label: 'Long practice test stamina' },
];

export function getAssessmentSections(student) {
  return (student?.sections || []).filter((section) => section !== 'Strategy' && section !== 'App');
}

export function createEmptyAssessment(student) {
  const sections = getAssessmentSections(student);
  const confidenceBySection = sections.reduce((collection, section) => {
    collection[section] = 3;
    return collection;
  }, {});

  return {
    studentId: student?.id || '',
    updatedAt: null,
    status: 'draft',
    submittedAt: null,
    reviewedAt: null,
    coachUnread: false,
    confidenceBySection,
    challengeAreas: [],
    preferredStudyHours: Math.max(2, Math.round((((student?.weeklyCommitmentHours || 18) / 6) || 3) * 2) / 2),
    targetExamDate: student?.targetExamDate || '',
    note: '',
  };
}

export function normalizeAssessment(student, assessment) {
  const base = createEmptyAssessment(student);
  const nextAssessment = {
    ...base,
    ...assessment,
    confidenceBySection: {
      ...base.confidenceBySection,
      ...(assessment?.confidenceBySection || {}),
    },
  };

  return nextAssessment;
}

export function deriveWeakAreas(student, assessment) {
  const normalized = normalizeAssessment(student, assessment);
  const sections = getAssessmentSections(student);
  const ranked = sections
    .map((section) => ({
      section,
      score: Number(normalized.confidenceBySection?.[section] ?? 3),
    }))
    .sort((left, right) => left.score - right.score);

  const urgent = ranked.filter((item) => item.score <= 2).map((item) => item.section);
  if (urgent.length) return urgent.slice(0, 3);
  return ranked.slice(0, Math.min(2, ranked.length)).map((item) => item.section);
}

export function getChallengeLabel(value) {
  return challengeAreaOptions.find((option) => option.value === value)?.label || value;
}

export function getSectionLabel(section) {
  return SECTION_LABELS[section] || section;
}

export function getConfidenceLabel(score) {
  const value = Number(score);
  if (value <= 1) return 'Very shaky';
  if (value <= 2) return 'Needs work';
  if (value <= 3) return 'Okay, but inconsistent';
  if (value <= 4) return 'Mostly solid';
  return 'Confident';
}

export function summarizeAssessment(student, assessment) {
  if (!assessment) return null;
  const normalized = normalizeAssessment(student, assessment);
  const weakAreas = deriveWeakAreas(student, normalized);
  const concernLabels = normalized.challengeAreas.map(getChallengeLabel);
  const ratings = Object.entries(normalized.confidenceBySection).map(([section, score]) => ({
    section,
    sectionLabel: getSectionLabel(section),
    score: Number(score),
    scoreLabel: getConfidenceLabel(score),
  }));

  return {
    ...normalized,
    weakAreas,
    weakAreaLabels: weakAreas.map(getSectionLabel),
    concernLabels,
    ratings,
  };
}

export function getAssessmentStatusLabel(status) {
  if (status === 'submitted') return 'Submitted';
  if (status === 'reviewed') return 'Reviewed';
  return 'Draft';
}
