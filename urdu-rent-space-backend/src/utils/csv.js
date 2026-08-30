// Minimal RFC4180-style CSV parser (quoted fields, escaped "" quotes, CRLF/LF).
// No external dependency needed for the Business-tier bulk listing upload.
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };

  const normalized = text.replace(/^﻿/, '');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
      continue;
    }

    if (char === '"') { inQuotes = true; }
    else if (char === ',') { pushField(); }
    else if (char === '\r') { /* skip, \n handles the row break */ }
    else if (char === '\n') { pushRow(); }
    else { field += char; }
  }

  if (field.length > 0 || row.length > 0) pushRow();

  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
};

module.exports = { parseCsv };
