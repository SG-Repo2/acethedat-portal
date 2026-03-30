# Notion Integration Seams

Every location in the codebase marked with a `// NOTION:` comment, grouped by data type.
These are the exact points where Notion API calls will replace local seed data reads or localStorage writes.

---

## Students

| File | Comment | Notion replacement | Input/Output shape |
|---|---|---|---|
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace this seed read with Notion API call — Students database` | Query the Students database, return all pages | **Input:** none (fetch all). **Output:** array of student objects with id, name, email, initials, color, phone, targetAA, predicted, sections, program, phase, testDate, coachNote, weakAreas, focusTags, ceiling, coachId, status, primaryCoach |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page creation in Students database` | Create a new page in the Students database | **Input:** { name, email, phone, targetAA, program, phase, testDate, weakAreas, coachId, sections }. **Output:** { success, student } |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page update in Students database` | Update properties on an existing Students page | **Input:** studentId + partial update object (name, email, sections, coachNote, etc). **Output:** updated student object |

## Sessions

| File | Comment | Notion replacement | Input/Output shape |
|---|---|---|---|
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace this seed read with Notion API call — Sessions database` | Query the Sessions database, return all pages | **Input:** none (fetch all). **Output:** array of session objects with id, studentId, studentName, date, hours, topicSummary, sessionType, homework, note, coach, status |

## Payments

| File | Comment | Notion replacement | Input/Output shape |
|---|---|---|---|
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace this seed read with Notion API call — Payments database` | Query the Payments database, return all pages | **Input:** none (fetch all). **Output:** array of payment objects with id, studentId, studentName, date, amount, method, kind, note, archived |

## Weekly Plans

| File | Comment | Notion replacement | Input/Output shape |
|---|---|---|---|
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace this seed read with Notion API call — Weekly Plans database` | Query the Weekly Plans database, return all pages | **Input:** none (fetch all). **Output:** map of planId to plan objects with id, studentId, weekStart, status, publishedAt, days (day-keyed task blocks), weekLabel, title, coachNote |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page creation/update in Weekly Plans database` | Create or update a page in Weekly Plans database | **Input:** studentId + plan object (days, weekLabel, title, weekStart, status, coachNote). **Output:** saved plan object with server-assigned id |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion query for Weekly Plans database filtered by studentId` | Query Weekly Plans database filtered by student_id | **Input:** studentId. **Output:** single plan object or null |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page update in Weekly Plans database (status -> published)` | Update status property to "published" and set published_at | **Input:** studentId, planId. **Output:** void |

## Self Assessments

| File | Comment | Notion replacement | Input/Output shape |
|---|---|---|---|
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace this seed read with Notion API call — Self Assessments database` | Query the Self Assessments database, return all pages | **Input:** none (fetch all). **Output:** map of studentId to assessment objects with studentId, updatedAt, status, submittedAt, reviewedAt, coachUnread, confidenceBySection, challengeAreas, preferredStudyHours, targetExamDate, note |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page update in Self Assessments database` | Create or update a page in Self Assessments database | **Input:** studentId + assessment object. **Output:** saved assessment |

## Auth / Users

| File | Comment | Notion replacement | Input/Output shape |
|---|---|---|---|
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion user lookup or lightweight auth service` | Look up user credentials from a Notion Users database or use an external lightweight auth service | **Input:** email, password. **Output:** { profileId, role, name, studentId, homePath } or auth error |

## MQL Errors (Missed Question Log)

| File | Comment | Notion replacement | Input/Output shape |
|---|---|---|---|
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page creation in MQL Errors database` | Create a new page in MQL Errors database | **Input:** { studentId, date, section, subtopic, source, examNumber, questionNumber, errorType, confidenceBefore, whyMissed, takeaway, reviewed, stillWeak, includeInNextPlan, category }. **Output:** created error object with id |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page creation in MQL Errors database (coach path)` | Same as above but called from coach context with explicit studentId | **Input:** same as above. **Output:** same as above |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page update in MQL Errors database` | Update properties on an MQL Errors page | **Input:** errorId + partial update { reviewed, stillWeak, includeInNextPlan, takeaway, category }. **Output:** void |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page archive/delete in MQL Errors database` | Archive or delete a page in MQL Errors database | **Input:** errorId. **Output:** void |

## Check-Ins

| File | Comment | Notion replacement | Input/Output shape |
|---|---|---|---|
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page creation in Check-Ins database` | Create or upsert a page in Check-Ins database | **Input:** { studentId, weekId, data (scores, completionRate, didNotComplete, confidence, notes) }. **Output:** check-in object with id and submittedAt |

## Insights

| File | Comment | Notion replacement | Input/Output shape |
|---|---|---|---|
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page creation in Insights database` | Create a new page in Insights database | **Input:** insight object with studentId, type, content. **Output:** insight with id and created_at |
| `src/app/providers/PortalProvider.jsx` | `// NOTION: replace with Notion page update in Insights database` | Update an Insights page | **Input:** insightId + partial update object. **Output:** void |
