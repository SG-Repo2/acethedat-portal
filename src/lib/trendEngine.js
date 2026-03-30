/**
 * trendEngine.js
 * Pure utility module for consuming student data, check-ins, and MQL errors
 * to produce coaching signals. No React dependencies.
 */

/**
 * Helper: Convert date to week ID in YYYY-WNN format
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Week ID in format 'YYYY-WNN'
 */
export function getWeekId(date) {
  if (!date) return null;

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  // ISO week calculation
  const temp = new Date(d.getTime());
  temp.setDate(temp.getDate() - temp.getDay() + (temp.getDay() === 0 ? -6 : 1));

  const weekStart = new Date(temp);
  const year = weekStart.getFullYear();

  const jan4 = new Date(year, 0, 4);
  const msPerDay = 24 * 60 * 60 * 1000;
  const weekNum = Math.round((weekStart - jan4) / msPerDay / 7) + 1;

  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Helper: Filter errors from last N days
 * @param {Array} mqlErrors - Array of MQL error objects
 * @param {number} days - Number of days to look back (default 7)
 * @returns {Array} Filtered errors
 */
export function getRecentErrors(mqlErrors, days = 7) {
  if (!Array.isArray(mqlErrors) || mqlErrors.length === 0) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return mqlErrors.filter((err) => {
    if (!err || !err.date) return false;
    const errDate = new Date(err.date);
    return errDate >= cutoffDate;
  });
}

/**
 * Compute Academic Average from section scores
 * AA = average of Bio, GChem, OChem, PAT, QR, RC (exclude SNS)
 * @param {Object} sections - Object with section scores {Bio, GChem, ...}
 * @returns {number} Academic Average (rounded to nearest integer)
 */
export function computeAA(sections) {
  if (!sections || typeof sections !== 'object') return 0;

  const aaComponents = ['Bio', 'GChem', 'OChem', 'PAT', 'QR', 'RC'];
  const scores = aaComponents
    .map((s) => sections[s])
    .filter((score) => typeof score === 'number' && score > 0);

  if (scores.length === 0) return 0;

  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round(sum / scores.length);
}

/**
 * Get most missed topics in recent N weeks
 * @param {Array} mqlErrors - Array of MQL error objects
 * @param {number} weekCount - Number of recent weeks to consider (default 1)
 * @returns {Array} Array of {section, subtopic, count} sorted by frequency descending
 */
export function getMostMissedTopics(mqlErrors, weekCount = 1) {
  if (!Array.isArray(mqlErrors) || mqlErrors.length === 0) return [];

  // Get cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weekCount * 7);

  // Filter to recent errors
  const recent = mqlErrors.filter((err) => {
    if (!err || !err.date) return false;
    return new Date(err.date) >= cutoffDate;
  });

  // Count by section + subtopic
  const topicMap = {};
  recent.forEach((err) => {
    const section = err.section || 'Unknown';
    const subtopic = err.subtopic || 'Unknown';
    const key = `${section}|${subtopic}`;

    topicMap[key] = (topicMap[key] || 0) + 1;
  });

  // Convert to array and sort by count descending
  return Object.entries(topicMap)
    .map(([key, count]) => {
      const [section, subtopic] = key.split('|');
      return { section, subtopic, count };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Get topics that appear in MQL across 2+ different weeks
 * @param {Array} mqlErrors - Array of MQL error objects
 * @returns {Array} Array of {section, subtopic, weekCount, totalMisses, lastSeen}
 */
export function getRepeatMissedTopics(mqlErrors) {
  if (!Array.isArray(mqlErrors) || mqlErrors.length === 0) return [];

  // Group by section|subtopic, then by week
  const topicWeeks = {};

  mqlErrors.forEach((err) => {
    if (!err || !err.date || !err.section || !err.subtopic) return;

    const key = `${err.section}|${err.subtopic}`;
    const week = getWeekId(err.date);

    if (!topicWeeks[key]) {
      topicWeeks[key] = { weeks: new Set(), errors: [] };
    }

    topicWeeks[key].weeks.add(week);
    topicWeeks[key].errors.push(err);
  });

  // Filter to topics appearing in 2+ weeks
  return Object.entries(topicWeeks)
    .filter(([, data]) => data.weeks.size >= 2)
    .map(([key, data]) => {
      const [section, subtopic] = key.split('|');
      const lastSeen = data.errors
        .map((e) => new Date(e.date))
        .reduce((latest, d) => (d > latest ? d : latest), new Date(0));

      return {
        section,
        subtopic,
        weekCount: data.weeks.size,
        totalMisses: data.errors.length,
        lastSeen: lastSeen.toISOString().split('T')[0],
      };
    })
    .sort((a, b) => b.weekCount - a.weekCount || b.totalMisses - a.totalMisses);
}

/**
 * Get topics where confidence was 1 or 2 (low pre-answer confidence)
 * @param {Array} mqlErrors - Array of MQL error objects
 * @returns {Array} Array of {section, subtopic, count}
 */
export function getLowConfidenceTopics(mqlErrors) {
  if (!Array.isArray(mqlErrors) || mqlErrors.length === 0) return [];

  const lowConf = mqlErrors.filter(
    (err) => err && typeof err.confidenceBefore === 'number' && err.confidenceBefore <= 2
  );

  // Count by section + subtopic
  const topicMap = {};
  lowConf.forEach((err) => {
    const section = err.section || 'Unknown';
    const subtopic = err.subtopic || 'Unknown';
    const key = `${section}|${subtopic}`;

    topicMap[key] = (topicMap[key] || 0) + 1;
  });

  return Object.entries(topicMap)
    .map(([key, count]) => {
      const [section, subtopic] = key.split('|');
      return { section, subtopic, count };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Get topics where errorType is 'timing'
 * @param {Array} mqlErrors - Array of MQL error objects
 * @returns {Array} Array of {section, subtopic, count}
 */
export function getTimingPressureTopics(mqlErrors) {
  if (!Array.isArray(mqlErrors) || mqlErrors.length === 0) return [];

  const timingErrors = mqlErrors.filter((err) => err && err.errorType === 'timing');

  const topicMap = {};
  timingErrors.forEach((err) => {
    const section = err.section || 'Unknown';
    const subtopic = err.subtopic || 'Unknown';
    const key = `${section}|${subtopic}`;

    topicMap[key] = (topicMap[key] || 0) + 1;
  });

  return Object.entries(topicMap)
    .map(([key, count]) => {
      const [section, subtopic] = key.split('|');
      return { section, subtopic, count };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Get unfinished assignments from check-ins
 * @param {Array} checkIns - Array of weekly check-in objects
 * @returns {Array} Array of unfinished items, most recent first
 */
export function getUnfinishedAssignments(checkIns) {
  if (!Array.isArray(checkIns) || checkIns.length === 0) return [];

  const unfinished = [];

  checkIns.forEach((checkin) => {
    if (!checkin) return;

    const didNotComplete = Array.isArray(checkin.didNotComplete) ? checkin.didNotComplete : [];
    const submittedAt = checkin.submittedAt ? new Date(checkin.submittedAt) : new Date(0);

    didNotComplete.forEach((item) => {
      if (item) {
        unfinished.push({
          item,
          weekId: checkin.weekId || 'Unknown',
          submittedAt,
        });
      }
    });
  });

  // Sort by submittedAt descending (most recent first)
  return unfinished.sort((a, b) => b.submittedAt - a.submittedAt);
}

/**
 * Identify improving vs declining sections across check-ins
 * @param {Array} checkIns - Array of weekly check-in objects
 * @returns {Object} {improving: [...], declining: [...]} with {section, delta, scores}
 */
export function getSectionTrends(checkIns) {
  if (!Array.isArray(checkIns) || checkIns.length < 2) {
    return { improving: [], declining: [] };
  }

  // Sort by weekId descending to get chronological order
  const sorted = [...checkIns]
    .filter((c) => c && c.scores && typeof c.scores === 'object')
    .sort((a, b) => (b.weekId || '').localeCompare(a.weekId || ''));

  if (sorted.length < 2) {
    return { improving: [], declining: [] };
  }

  const sections = ['Bio', 'GChem', 'OChem', 'PAT', 'QR', 'RC', 'SNS'];
  const trends = { improving: [], declining: [] };

  sections.forEach((section) => {
    const scores = sorted
      .map((c) => c.scores[section])
      .filter((s) => typeof s === 'number' && s > 0);

    if (scores.length < 2) return;

    const earliest = scores[scores.length - 1];
    const latest = scores[0];
    const delta = latest - earliest;

    const trend = {
      section,
      delta: Math.round(delta),
      scores: scores.reverse(),
    };

    if (delta > 0) {
      trends.improving.push(trend);
    } else if (delta < 0) {
      trends.declining.push(trend);
    }
  });

  // Sort by absolute delta descending
  trends.improving.sort((a, b) => b.delta - a.delta);
  trends.declining.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return trends;
}

/**
 * Get MQL entries marked as stillWeak
 * @param {Array} mqlErrors - Array of MQL error objects
 * @returns {Array} Array of {section, subtopic, count}
 */
export function getStillWeakTopics(mqlErrors) {
  if (!Array.isArray(mqlErrors) || mqlErrors.length === 0) return [];

  const stillWeak = mqlErrors.filter((err) => err && err.stillWeak === true);

  const topicMap = {};
  stillWeak.forEach((err) => {
    const section = err.section || 'Unknown';
    const subtopic = err.subtopic || 'Unknown';
    const key = `${section}|${subtopic}`;

    topicMap[key] = (topicMap[key] || 0) + 1;
  });

  return Object.entries(topicMap)
    .map(([key, count]) => {
      const [section, subtopic] = key.split('|');
      return { section, subtopic, count };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Get topics prioritized for next tutoring session
 * Combines: repeat misses + still weak + low confidence
 * @param {Array} mqlErrors - Array of MQL error objects
 * @param {Array} checkIns - Array of weekly check-in objects
 * @returns {Array} Prioritized topics for session
 */
export function getSessionReviewTopics(mqlErrors, checkIns) {
  if ((!Array.isArray(mqlErrors) || mqlErrors.length === 0) &&
      (!Array.isArray(checkIns) || checkIns.length === 0)) {
    return [];
  }

  const priorities = new Map(); // key -> {section, subtopic, reasons: [], count}

  // Add repeat misses
  const repeatMisses = getRepeatMissedTopics(mqlErrors || []);
  repeatMisses.forEach((item) => {
    const key = `${item.section}|${item.subtopic}`;
    if (!priorities.has(key)) {
      priorities.set(key, {
        section: item.section,
        subtopic: item.subtopic,
        reasons: [],
        count: 0,
      });
    }
    const entry = priorities.get(key);
    entry.reasons.push('repeat-miss');
    entry.count += item.totalMisses;
  });

  // Add still weak
  const stillWeak = getStillWeakTopics(mqlErrors || []);
  stillWeak.forEach((item) => {
    const key = `${item.section}|${item.subtopic}`;
    if (!priorities.has(key)) {
      priorities.set(key, {
        section: item.section,
        subtopic: item.subtopic,
        reasons: [],
        count: 0,
      });
    }
    const entry = priorities.get(key);
    if (!entry.reasons.includes('still-weak')) {
      entry.reasons.push('still-weak');
    }
    entry.count += item.count;
  });

  // Add low confidence
  const lowConf = getLowConfidenceTopics(mqlErrors || []);
  lowConf.forEach((item) => {
    const key = `${item.section}|${item.subtopic}`;
    if (!priorities.has(key)) {
      priorities.set(key, {
        section: item.section,
        subtopic: item.subtopic,
        reasons: [],
        count: 0,
      });
    }
    const entry = priorities.get(key);
    if (!entry.reasons.includes('low-confidence')) {
      entry.reasons.push('low-confidence');
    }
    entry.count += item.count;
  });

  // Convert to array and sort by count descending, then by reason count
  return Array.from(priorities.values())
    .sort((a, b) => b.count - a.count || b.reasons.length - a.reasons.length);
}

/**
 * Generate comprehensive weak area summary and coaching signals
 * @param {Object} student - Student profile with sections, targetAA, targetSections, testDate
 * @param {Array} mqlErrors - Array of MQL error objects
 * @param {Array} checkIns - Array of weekly check-in objects
 * @returns {Object} Coaching signals object
 */
export function generateWeakAreaSummary(student, mqlErrors, checkIns) {
  const defaultSummary = {
    mostMissedThisWeek: [],
    repeatMisses: [],
    lowConfidence: [],
    timingPressure: [],
    unfinished: [],
    declining: [],
    improving: [],
    stillWeak: [],
    sessionPriorities: [],
    riskLevel: 'medium',
    weeksUntilExam: 0,
    biggestGaps: [],
  };

  // Validate inputs
  if (!student || typeof student !== 'object') {
    return defaultSummary;
  }

  const errors = Array.isArray(mqlErrors) ? mqlErrors : [];
  const checkins = Array.isArray(checkIns) ? checkIns : [];

  // Calculate weeks until exam
  let weeksUntilExam = 0;
  if (student.testDate) {
    const testDate = new Date(student.testDate);
    const today = new Date();
    const daysLeft = (testDate - today) / (1000 * 60 * 60 * 24);
    weeksUntilExam = Math.ceil(daysLeft / 7);
  }

  // Get current section scores from latest check-in
  const latestCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;
  const currentSections = latestCheckin && latestCheckin.scores ? latestCheckin.scores : student.sections || {};

  // Identify biggest gaps (target - current > 50 points)
  const biggestGaps = [];
  if (student.targetSections && typeof student.targetSections === 'object') {
    const sections = ['Bio', 'GChem', 'OChem', 'PAT', 'QR', 'RC', 'SNS'];
    sections.forEach((section) => {
      const target = student.targetSections[section];
      const current = currentSections[section] || 0;
      const gap = target - current;

      if (typeof target === 'number' && typeof current === 'number' && gap > 50) {
        biggestGaps.push({
          section,
          target,
          current,
          gap: Math.round(gap),
        });
      }
    });
    biggestGaps.sort((a, b) => b.gap - a.gap);
  }

  // Determine risk level
  let riskLevel = 'low';
  if (weeksUntilExam < 4 && biggestGaps.length > 2) {
    riskLevel = 'high';
  } else if (weeksUntilExam < 8 || biggestGaps.length > 0) {
    riskLevel = 'medium';
  }

  return {
    mostMissedThisWeek: getMostMissedTopics(errors, 1),
    repeatMisses: getRepeatMissedTopics(errors),
    lowConfidence: getLowConfidenceTopics(errors),
    timingPressure: getTimingPressureTopics(errors),
    unfinished: getUnfinishedAssignments(checkins),
    declining: getSectionTrends(checkins).declining,
    improving: getSectionTrends(checkins).improving,
    stillWeak: getStillWeakTopics(errors),
    sessionPriorities: getSessionReviewTopics(errors, checkins),
    riskLevel,
    weeksUntilExam,
    biggestGaps,
  };
}
