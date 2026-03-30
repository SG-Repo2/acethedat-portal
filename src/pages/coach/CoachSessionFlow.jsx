import { useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';

const SESSION_STEPS = [
  { time: '5 min', icon: 'ð¬', title: 'Check-In', desc: "Emotional + performance state. What's their energy? Any anxiety spikes? Did they complete the assigned work?" },
  { time: '20 min', icon: 'ð¬', title: 'Error Review', desc: 'Work through logged errors. Diagnose before correcting. Get reasoning first â classify category â then fix.' },
  { time: '25 min', icon: 'ð¯', title: 'Targeted Intervention', desc: 'Based on error category breakdown. Knowledge Gap â reteach. Classic Mix-Up â rebuild model. Brain Fart â timed drills.' },
  { time: '20 min', icon: 'â¡', title: 'Performance Training', desc: 'Live questions under timed conditions. Coach decision-making in real time. Catch bad habits before test day.' },
  { time: '7 min', icon: 'ð£', title: 'Feedback Delivery', desc: 'One or two surgical observations. Observation â Mechanism â Correction. No praise without specificity.' },
  { time: '3 min', icon: 'ð', title: 'Assignment + Tracking', desc: 'Exact tasks before next session. Update student portal. Log one session insight to Knowledge Engine.' },
];

const PROTOCOLS = {
  unsure: {
    title: 'Unsure Question Protocol',
    steps: [
      { n: 1, action: 'Read stem fully â do not skip to answers', time: '0â15s' },
      { n: 2, action: 'Eliminate definitively wrong answers first', time: '15â30s' },
      { n: 3, action: "If 2 remain and you're under 90s: commit to best guess", time: '30â75s' },
      { n: 4, action: 'Flag for review â do NOT revisit until section end', time: 'â' },
      { n: 5, action: 'Move immediately. Section momentum is non-negotiable', time: 'â' },
    ]
  },
  reset: {
    title: 'Section Reset Routine',
    steps: [
      { n: 1, action: '5-breath cycle between sections (box breathing)', time: '30s' },
      { n: 2, action: 'Physically shift in chair. Reset posture.', time: '5s' },
      { n: 3, action: "Say internally: 'That section is done. It's scored.'", time: '5s' },
      { n: 4, action: 'First question of next section: go slow for 30s to anchor.', time: '30s' },
      { n: 5, action: 'Build momentum â treat first 3 items as warm-up', time: 'â' },
    ]
  },
  morning: {
    title: 'Test Morning Routine',
    steps: [
      { n: 1, action: 'No studying morning of â zero content review for aggressive studiers. Light 15-min review for efficient studiers.', time: '7:00â7:15am' },
      { n: 2, action: 'Eat: complex carbs + protein. No caffeine spike.', time: '7:15am' },
      { n: 3, action: 'Arrive 20 min early. Environmental familiarity reduces anxiety.', time: 'â' },
      { n: 4, action: 'One mental anchor phrase â written night before.', time: 'Pre-test' },
      { n: 5, action: 'Section 1 target: 85% confidence on first pass.', time: 'Test start' },
    ]
  },
};

function FeedbackBuilder({ student }) {
  const [obs, setObs] = useState('');
  const [mech, setMech] = useState('');
  const [corr, setCorr] = useState('');
  const [built, setBuilt] = useState(null);
  const [tone, setTone] = useState('precise');

  const TEMPLATES = [
    { obs: 'defaulting to keyword pattern-matching in Bio instead of reasoning through mechanisms', mech: "That's why you miss medium-difficulty questions â the keywords appear in wrong answers by design", corr: 'Verbalize the mechanism out loud before selecting. Every time. No exceptions.' },
    { obs: 'hesitating 15â20 seconds before committing to QR answers', mech: "Decision latency is consuming 30% of your QR time budget â you're running out of time, not knowledge", corr: "Set a 90-second hard cap. If you don't have the answer, mark your best guess and move. No revisits until the end." },
    { obs: 'confidence exceeding accuracy by approximately 8 points in Bio', mech: "You're pattern-matching to familiar concepts but not verifying â overconfidence is masking knowledge gaps", corr: 'Before submitting any Bio answer, state in one sentence why the other three choices are wrong.' },
  ];

  const buildFeedback = () => {
    if (!obs || !mech || !corr) return;
    setBuilt(`You're ${obs}. ${mech}. Going forward: ${corr}`);
  };

  const loadTemplate = (t) => { setObs(t.obs); setMech(t.mech); setCorr(t.corr); setBuilt(null); };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Feedback Builder</span>
          <span className="tag tag-muted">Obs â Mech â Fix</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Tone Calibration</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['precise', 'direct', 'blunt'].map(t => (
              <button key={t} className={`btn ${tone === t ? 'btn-gold' : 'btn-ghost'}`}
                style={{ padding: '5px 14px', fontSize: 11, textTransform: 'capitalize' }}
                onClick={() => setTone(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label className="form-label">Observation (what you saw)</label>
          <textarea className="form-textarea" value={obs} onChange={e => setObs(e.target.value)}
            placeholder="You're defaulting to..." rows={2} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label className="form-label">Mechanism (why it's happening)</label>
          <textarea className="form-textarea" value={mech} onChange={e => setMech(e.target.value)}
            placeholder="That's why..." rows={2} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Correction (exact behavior change)</label>
          <textarea className="form-textarea" value={corr} onChange={e => setCorr(e.target.value)}
            placeholder="Going forward..." rows={2} />
        </div>
        <button className="btn btn-gold" onClick={buildFeedback}>Build Feedback Statement â</button>

        {built && (
          <div style={{ marginTop: 14, padding: '16px 18px', borderRadius: 10, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--gold)', marginBottom: 8, textTransform: 'uppercase' }}>Generated Feedback</div>
            <div style={{ fontSize: 14, color: 'var(--text-hi)', lineHeight: 1.7 }}>"{built}"</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <span className="tag tag-success">â Specific</span>
              <span className="tag tag-success">â Behavioral</span>
              <span className="tag tag-success">â Actionable</span>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Template Library</span>
          <span className="tag tag-muted">{student?.name || 'Student'}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-lo)', marginBottom: 12 }}>
          Based on logged failure modes. Click to load.
        </div>
        {TEMPLATEQ.map((t, i) => (
          <div key={i} onClick={() => loadTemplate(t)} style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--bg-panel-hover)', border: '1px solid var(--border)',
            marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.15s',
            fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>TEMPLATE {i + 1}</div>
            "You're {t.obs}â¦"
          </div>
        ))}

        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', marginBottom: 6, textTransform: 'uppercase' }}>Vague Feedback â Auto-Flag</div>
          <div style={{ fontSize: 12, color: 'var(--text-lo)', lineHeight: 1.8 }}>
            â "You need to study Bio more"<br />
            â "Try to be more careful"<br />
            â "Good job on that section"
          </div>
        </div>
      </div>
    </div>
  );
}

function EnrollmentFilter() {
  const [form, setForm] = useState({ name: '', gpa: '', timeline: '', target: '' });
  const [result, setResult] = useState(null);

  const evaluate = () => {
    const gpa = parseFloat(form.gpa);
    const weeks = parseInt(form.timeline);
    const target = parseInt(form.target);
    const issues = [];
    let viable = true;

    if (gpa < 3.0) { issues.push('GPA below 3.0 â DAT score alone cannot overcome this gap. Recommend GPA strategy first.'); viable = false; }
    if (weeks < 4) { issues.push('Less than 4 weeks â insufficient time for meaningful score improvement. Recommend rescheduling test date.'); viable = false; }
    if (weeks < 6 && target >= 470) { issues.push('6 weeks is not enough to reach 470+. Set realistic expectation or recommend 10-week program.'); }
    if (target > 510) { issues.push('510+ is elite territory. Flag as aspirational â set primary target at 470.'); }

    const recommendation = viable
      ? weeks >= 10 ? 'Elite Mastery (12-week)' : weeks >= 7 ? 'Accelerator (8-week)' : 'Targeted Boost (4-week)'
      : 'Do not enroll at this time';

    setResult({ viable, issues, recommendation });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Student Evaluation</span>
          <span className="tag tag-muted">run before every enrollment</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div><label className="form-label">Student Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" /></div>
          <div><label className="form-label">GPA</label><input className="form-input" value={form.gpa} onChange={e => setForm({ ...form, gpa: e.target.value })} placeholder="3.8" type="number" /></div>
          <div><label className="form-label">Weeks Until Test</label><input className="form-input" value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} placeholder="8" type="number" /></div>
          <div><label className="form-label">Target AA (200â600)</label><input className="form-input" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="400" type="number" min="200" max="600" step="10" /></div>
        </div>
        <button className="btn btn-gold" onClick={evaluate}>Evaluate Fit â</button>

        {result && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 10,
            background: result.viable ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${result.viable ? 'var(--success-border)' : 'var(--danger-border)'}`
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: result.viable ? 'var(--success)' : 'var(--danger)', marginBottom: 10 }}>
              {result.viable ? 'â VIABLE ENROLLMENT' : 'â NOT RECOMMENDED AT THIS TIME'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: 10 }}>
              Recommendation: {result.recommendation}
            </div>
            {result.issues.map((iss, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid var(--danger)' }}>
                {iss}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Enrollment Principles</span>
        </div>
        {[
          { rule: 'Be honest about timeline', detail: "If a student has 5 weeks and wants a 23, tell them the math doesn't work. Recommend a better test date." },
          { rule: 'Log every declined enrollment', detail: 'Pattern-matching declined students reveals where your marketing is attracting the wrong fit.' },
          { rule: "Offer an alternative, not just a no", detail: "If you can't help them now, tell them what they need to do first. They'll come back â and refer others." },
          { rule: 'Your acceptance rate is a reputation metric', detail: 'Taking students you can\'t serve tanks your testimonials and referral rate. One bad outcome costs 3 good referrals.' },
        ].map((p, i) => (
          <div key={i} style={{ marginBottom: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>{p.rule}</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6 }}>{p.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoachSessionFlow() {
  const { students } = usePortal();
  const [activeTab, setActiveTab] = useState('session');
  const [step, setStep] = useState(-1);
  const [notes, setNotes] = useState(Array(6).fill(''));
  const [protocol, setProtocol] = useState('unsure');
  const [activeStudent, setActiveStudent] = useState(students[0]?.id || 'haniyeh');

  const student = students.find(s => s.id === activeStudent) || students[0];

  const TABS = [
    { id: 'session', label: 'Session Flow' },
    { id: 'protocols', label: 'Performance Protocols' },
    { id: 'feedback', label: 'Feedback Builder' },
    { id: 'enrollment', label: 'Enrollment Filter' },
  ];

  return (
    <div className="animate-in">
      <div className="section-header">
        <div className="section-header-title">Session Tools</div>
        <div className="section-header-sub">Standardized session structure, performance protocols, feedback builder, and enrollment evaluation.</div>
      </div>

      {/* Student Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {students.map(s => (
          <button key={s.id} className={`btn ${activeStudent === s.id ? 'btn-gold' : 'btn-ghost'}`}
            onClick={() => setActiveStudent(s.id)}>
            {s.name}
          </button>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Session Flow */}
      {activeTab === 'session' && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Session Structure</span>
            <span className="tag tag-muted">80 min total</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {SESSION_STEPS.map((s, i) => (
              <div key={i} onClick={() => setStep(step === i ? -1 : i)} style={{
                cursor: 'pointer', padding: '16px 18px',
                borderLeft: `3px solid ${step === i ? 'var(--gold)' : 'transparent'}`,
                background: step === i ? 'var(--gold-bg)' : 'transparent',
                borderBottom: i < SESSION_STEPS.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: step === i ? 'var(--gold)' : 'var(--text-hi)' }}>{s.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-lo)' }}>{s.time}</span>
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-lo)', fontSize: 12 }}>{step === i ? 'â²' : 'â¼'}</span>
                </div>
                {step === i && (
                  <div style={{ marginTop: 12, paddingLeft: 30 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: 12 }}>{s.desc}</div>
                    <div>
                      <label className="form-label">Session Notes</label>
                      <textarea className="form-textarea" value={notes[i]}
                        onChange={e => { const n = [...notes]; n[i] = e.target.value; setNotes(n); }}
                        placeholder={`Notes for ${s.title}...`} rows={2} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Protocols */}
      {activeTab === 'protocols' && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Performance Protocols</span>
            <span className="tag tag-muted">standardized decision trees</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {Object.keys(PROTOCOLS).map(k => (
              <button key={k} className={`btn ${protocol === k ? 'btn-gold' : 'btn-ghost'}`}
                onClick={() => setProtocol(k)}>
                {PROTOCOLS[k].title.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
          <div style={{ background: 'var(--bg-panel-hover)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 12, letterSpacing: '0.5px' }}>
              {PROTOCOLS[protocol].title}
            </div>
            {PROTOCOLS[protocol].steps.map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: 'var(--gold)', flexShrink: 0
                }}>{s.n}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-hi)' }}>{s.action}</div>
                </div>
                {s.time !== 'â' && <div style={{ fontSize: 11, color: 'var(--text-lo)', flexShrink: 0, fontFamily: 'monospace' }}>{s.time}</div>}
              </div>
            ))}
          </div>

          {/* 2-Week Peak Protocol */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 12 }}>
              2-Week Peak Protocol â {student.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { day: 'Day 14â10', load: 'Heavy', focus: 'Full practice tests + deep error review' },
                { day: 'Day 9â5', load: 'Moderate', focus: 'Targeted section drilling on weak areas' },
                { day: 'Day 4â2', load: 'Light', focus: 'Short drills, confidence areas only' },
                { day: 'Day 1', load: 'Off', focus: 'No content. Full rest. Mental prep only.' },
              ].map((t, i) => {
                const loadColor = t.load === 'Heavy' ? 'var(--danger)' : t.load === 'Moderate' ? 'var(--gold)' : t.load === 'Light' ? 'var(--success)' : '#a78bfa';
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: 'var(--bg-panel-hover)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-lo)', width: 80, flexShrink: 0 }}>{t.day}</div>
                    <span className="tag" style={{ background: `${loadColor}18`, borderColor: `${loadColor}30`, color: loadColor }}>{t.load}</span>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)', flex: 1 }}>{t.focus}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Builder */}
      {activeTab === 'feedback' && <FeedbackBuilder student={student} />}

      {/* Enrollment Filter */}
      {activeTab === 'enrollment' && <EnrollmentFilter />}
    </div>
  );
}
