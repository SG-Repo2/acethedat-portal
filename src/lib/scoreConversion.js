/**
 * DAT Score Conversion â Old Scale (1â30) â New Scale (200â600)
 *
 * Sourced from the official ADA conversion chart.
 * All new-scale values are rounded to the nearest 10.
 *
 * Sections: AA, SNS, Bio, GChem, OChem, PAT, QR, RC
 */

// Full lookup table indexed by old score (1â30)
// Each row: [AA, SNS, Bio, GChem, OChem, PAT, QR, RC]
const CONVERSION_TABLE = {
//  old: { AA,  SNS, Bio, GCH, OCH, PAT, QR,  RC  }
  1:  { AA: 200, SNS: 200, Bio: 200, GChem: 200, OChem: 200, PAT: 200, QR: 200, RC: 200 },
  2:  { AA: 200, SNS: 200, Bio: 200, GChem: 200, OChem: 200, PAT: 200, QR: 200, RC: 200 },
  3:  { AA: 210, SNS: 210, Bio: 200, GChem: 200, OChem: 200, PAT: 200, QR: 200, RC: 200 },
  4:  { AA: 220, SNS: 210, Bio: 200, GChem: 200, OChem: 200, PAT: 200, QR: 200, RC: 200 },
  5:  { AA: 220, SNS: 210, Bio: 200, GChem: 200, OChem: 200, PAT: 200, QR: 200, RC: 210 },
  6:  { AA: 230, SNS: 220, Bio: 200, GChem: 200, OChem: 200, PAT: 200, QR: 200, RC: 210 },
  7:  { AA: 240, SNS: 220, Bio: 200, GChem: 200, OChem: 200, PAT: 200, QR: 200, RC: 210 },
  8:  { AA: 240, SNS: 230, Bio: 200, GChem: 200, OChem: 200, PAT: 200, QR: 200, RC: 220 },
  9:  { AA: 250, SNS: 230, Bio: 200, GChem: 200, OChem: 200, PAT: 200, QR: 200, RC: 220 },
  10: { AA: 250, SNS: 240, Bio: 210, GChem: 200, OChem: 220, PAT: 200, QR: 210, RC: 220 },
  11: { AA: 260, SNS: 240, Bio: 210, GChem: 240, OChem: 260, PAT: 210, QR: 240, RC: 220 },
  12: { AA: 270, SNS: 270, Bio: 260, GChem: 280, OChem: 300, PAT: 210, QR: 270, RC: 230 },
  13: { AA: 290, SNS: 300, Bio: 290, GChem: 310, OChem: 320, PAT: 250, QR: 300, RC: 260 },
  14: { AA: 310, SNS: 320, Bio: 320, GChem: 330, OChem: 330, PAT: 280, QR: 320, RC: 280 },
  15: { AA: 330, SNS: 340, Bio: 340, GChem: 350, OChem: 350, PAT: 310, QR: 340, RC: 300 },
  16: { AA: 350, SNS: 360, Bio: 360, GChem: 360, OChem: 370, PAT: 340, QR: 360, RC: 320 },
  17: { AA: 370, SNS: 380, Bio: 370, GChem: 380, OChem: 380, PAT: 360, QR: 380, RC: 340 },
  18: { AA: 390, SNS: 400, Bio: 390, GChem: 400, OChem: 400, PAT: 390, QR: 400, RC: 360 },
  19: { AA: 410, SNS: 410, Bio: 410, GChem: 410, OChem: 410, PAT: 410, QR: 420, RC: 370 },
  20: { AA: 420, SNS: 430, Bio: 420, GChem: 430, OChem: 430, PAT: 430, QR: 430, RC: 390 },
  21: { AA: 440, SNS: 450, Bio: 440, GChem: 440, OChem: 450, PAT: 450, QR: 450, RC: 410 },
  22: { AA: 460, SNS: 460, Bio: 460, GChem: 460, OChem: 470, PAT: 470, QR: 460, RC: 430 },
  23: { AA: 470, SNS: 480, Bio: 470, GChem: 470, OChem: 480, PAT: 500, QR: 480, RC: 450 },
  24: { AA: 490, SNS: 500, Bio: 490, GChem: 490, OChem: 490, PAT: 520, QR: 500, RC: 470 },
  25: { AA: 510, SNS: 520, Bio: 500, GChem: 510, OChem: 510, PAT: 550, QR: 510, RC: 490 },
  26: { AA: 520, SNS: 530, Bio: 520, GChem: 530, OChem: 530, PAT: 580, QR: 520, RC: 510 },
  27: { AA: 540, SNS: 550, Bio: 550, GChem: 550, OChem: 550, PAT: 580, QR: 540, RC: 550 },
  28: { AA: 560, SNS: 560, Bio: 580, GChem: 570, OChem: 560, PAT: 590, QR: 580, RC: 550 },
  29: { AA: 580, SNS: 580, Bio: 590, GChem: 580, OChem: 570, PAT: 600, QR: 590, RC: 560 },
  30: { AA: 600, SNS: 600, Bio: 600, GChem: 600, OChem: 590, PAT: 600, QR: 600, RC: 580 },
};

// Section key aliases (maps common spellings â table keys)
const SECTION_ALIASES = {
  AA: 'AA',
  SNS: 'SNS',
  Bio: 'Bio', BIO: 'Bio', bio: 'Bio',
  GChem: 'GChem', GCH: 'GChem', gch: 'GChem', gchem: 'GChem',
  OChem: 'OChem', OCH: 'OChem', och: 'OChem', ochem: 'OChem',
  PAT: 'PAT', pat: 'PAT',
  QR: 'QR', QRT: 'QR', qr: 'QR', qrt: 'QR',
  RC: 'RC', RCT: 'RC', rc: 'RC', rct: 'RC',
};

/**
 * Convert a single old-scale score (1â30) to the new scale (200â600).
 *
 * @param {number} oldScore  - Score on the 1â30 scale
 * @param {string} section   - Section name (AA, Bio, GChem, OChem, PAT, QR, RC, SNS)
 * @returns {number} New-scale score (200â600, rounded to nearest 10)
 */
export function convertScore(oldScore, section = 'AA') {
  const key = SECTION_ALIASES[section] || 'AA';
  const row = CONVERSION_TABLE[Math.round(oldScore)];
  if (!row) {
    // If already in new scale range, round to nearest 10 and clamp
    if (oldScore >= 200) return Math.round(oldScore / 10) * 10;
    return 200;
  }
  return row[key] ?? row.AA;
}

/**
 * Convert an object of section scores from old (1â30) to new (200â600) scale.
 *
 * @param {Object} sections  - e.g. { Bio: 18, GChem: 17, OChem: 15, PAT: 16, QR: 19, RC: 14 }
 * @returns {Object} Converted scores
 */
export function convertSectionScores(sections) {
  const result = {};
  for (const [section, score] of Object.entries(sections)) {
    result[section] = convertScore(score, section);
  }
  return result;
}

/**
 * Determine if a score is on the old scale (1â30) vs new scale (200â600).
 * @param {number} score
 * @returns {boolean}
 */
export function isOldScale(score) {
  return typeof score === 'number' && score >= 1 && score <= 30;
}

/**
 * Auto-convert: if score looks like old scale, convert it; otherwise return as-is
 * rounded to nearest 10.
 *
 * @param {number} score
 * @param {string} section
 * @returns {number}
 */
export function normalizeScore(score, section = 'AA') {
  if (!score || score === 0) return 0;
  if (isOldScale(score)) return convertScore(score, section);
  // Already new scale â round to nearest 10, clamp 200â600
  return Math.min(600, Math.max(200, Math.round(score / 10) * 10));
}

/**
 * Round a new-scale score to the nearest 10.
 * @param {number} score - 200â600
 * @returns {number}
 */
export function roundToTen(score) {
  return Math.min(600, Math.max(200, Math.round(score / 10) * 10));
}

export { CONVERSION_TABLE };
