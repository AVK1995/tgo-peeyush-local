/**
 * A local stand-in for Pabbly Connect.
 *
 * Point PABBLY_WEBHOOK_URL at http://localhost:4000/pabbly and every
 * fulfilment payload the webhook sends is printed here in full, sorted, with
 * the empty keys called out separately. That last part is the whole reason
 * this exists: the bug being fixed was not "no payload arrived", it was "a
 * payload arrived with most of its values blank", and a wall of JSON makes
 * that easy to skim past.
 *
 *   node scripts/webhook-echo.mjs          # or: npm run test:echo
 *
 * Nothing leaves the machine. Accepts any path and any method, always answers
 * 200, because a non-200 here would make the webhook log a Pabbly failure
 * that is this script's fault rather than the code's.
 */

import { createServer } from 'node:http';

const PORT = Number(process.env.ECHO_PORT ?? 4000);

/* The keys that made this build's fulfilment row useless when empty. Called
   out by name so a regression is one glance rather than a diff. */
const CRITICAL = [
  'created_at',
  'first_name',
  'last_name',
  'email',
  'phone',
  'city',
  'country_code',
  'payment_id',
  'order_id',
  'amount',
  'lead_id',
  /* The campaign half. These are the ones that went blank together when the
     old chunked note blob overflowed, so they are the regression canary. */
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'landing_url',
  'client_user_agent',
];

const GREEN = '\u001b[32m';
const RED = '\u001b[31m';
const DIM = '\u001b[2m';
const BOLD = '\u001b[1m';
const OFF = '\u001b[0m';

let n = 0;

const isEmpty = (v) => v === '' || v === null || v === undefined;

createServer((req, res) => {
  let body = '';
  req.on('data', (c) => {
    body += c;
  });
  req.on('end', () => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));

    n += 1;
    const stamp = new Date().toISOString();
    console.log(
      `\n${BOLD}━━━ #${n}  ${req.method} ${req.url}  ${stamp} ━━━${OFF}`,
    );

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      console.log(`${RED}not JSON:${OFF}`, body.slice(0, 2000));
      return;
    }

    const keys = Object.keys(data).sort();
    const filled = keys.filter((k) => !isEmpty(data[k]));
    const empty = keys.filter((k) => isEmpty(data[k]));

    /* Critical fields first, with a verdict, because these are the ones the
       client noticed were missing. */
    console.log(`${BOLD}Critical fields${OFF}`);
    for (const k of CRITICAL) {
      const v = data[k];
      const ok = !isEmpty(v);
      const mark = ok ? `${GREEN}✓${OFF}` : `${RED}✗ EMPTY${OFF}`;
      console.log(`  ${mark} ${k.padEnd(20)} ${ok ? JSON.stringify(v) : ''}`);
    }

    console.log(`\n${BOLD}All ${filled.length} populated fields${OFF}`);
    for (const k of filled) {
      const v = typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k]);
      const shown = v.length > 110 ? `${v.slice(0, 110)}…` : v;
      console.log(`  ${k.padEnd(24)} ${shown}`);
    }

    if (empty.length) {
      console.log(
        `\n${DIM}${empty.length} empty (expected for anything the visit did ` +
          `not carry — card_* on a UPI payment, utm_* on a direct visit):${OFF}`,
      );
      console.log(`${DIM}  ${empty.join(', ')}${OFF}`);
    }

    const missedCritical = CRITICAL.filter((k) => isEmpty(data[k]));
    console.log(
      missedCritical.length
        ? `\n${RED}${BOLD}FAIL — ${missedCritical.length} critical field(s) empty: ${missedCritical.join(', ')}${OFF}`
        : `\n${GREEN}${BOLD}PASS — every critical field populated.${OFF}`,
    );
  });
}).listen(PORT, () => {
  console.log(
    `${BOLD}Pabbly echo listening on http://localhost:${PORT}/pabbly${OFF}\n` +
      `${DIM}Set PABBLY_WEBHOOK_URL to that value in .env.local, then run a ` +
      `payment or: npm run test:purchase${OFF}`,
  );
});
