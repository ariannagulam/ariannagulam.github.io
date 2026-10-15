/* LifeOS — Google Календар і Gmail без сервера.
   Вхід через OAuth 2.0 для клієнтських веб-застосунків (переадресація, токен на 1 годину).
   Токен лежить лише на цьому пристрої. */
(function () {
  'use strict';

  const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.readonly'
  ].join(' ');
  const TOKEN_KEY = 'lifeos.gtoken';
  const STATE_KEY = 'lifeos.gstate';

  const redirectUri = () => location.origin + location.pathname.replace(/index\.html$/, '');

  function readToken() {
    try { const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null'); return t && t.exp > Date.now() + 60000 ? t : null; }
    catch (e) { return null; }
  }
  function clearToken() { try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} }
  const connected = () => !!readToken();

  function signIn(clientId) {
    const st = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem(STATE_KEY, st); } catch (e) {}
    const p = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri(),
      response_type: 'token',
      scope: SCOPES,
      include_granted_scopes: 'true',
      state: st
    });
    location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + p.toString();
  }

  // Повертає 'ok', текст помилки або null (якщо це не повернення з Google).
  function handleRedirect() {
    if (!location.hash || location.hash.indexOf('access_token=') < 0 && location.hash.indexOf('error=') < 0) return null;
    const p = new URLSearchParams(location.hash.slice(1));
    history.replaceState(null, '', redirectUri());
    let expected = null;
    try { expected = localStorage.getItem(STATE_KEY); localStorage.removeItem(STATE_KEY); } catch (e) {}
    if (p.get('error')) return p.get('error') === 'access_denied' ? 'Ти скасувала вхід у Google.' : 'Google повернув помилку: ' + p.get('error');
    if (!expected || p.get('state') !== expected) return 'Не вдалося перевірити вхід. Спробуй ще раз.';
    const token = { token: p.get('access_token'), exp: Date.now() + Number(p.get('expires_in') || 3600) * 1000, scope: p.get('scope') || '' };
    try { localStorage.setItem(TOKEN_KEY, JSON.stringify(token)); } catch (e) {}
    return 'ok';
  }

  async function api(url, opts) {
    const t = readToken();
    if (!t) { const e = new Error('Потрібно увійти в Google знову'); e.auth = true; throw e; }
    opts = opts || {};
    const h = Object.assign({ Authorization: 'Bearer ' + t.token }, opts.body ? { 'Content-Type': 'application/json' } : {});
    let res;
    try { res = await fetch(url, Object.assign({}, opts, { headers: h })); }
    catch (e) { throw new Error('Немає звʼязку з Google'); }
    if (res.status === 401) { clearToken(); const e = new Error('Сесія Google закінчилась — увійди знову'); e.auth = true; throw e; }
    if (res.status === 204) return null;
    if (!res.ok) {
      let msg = '';
      try { const j = await res.json(); msg = (j.error && j.error.message) || ''; } catch (e) {}
      if (res.status === 403 && /has not been used|disabled/i.test(msg)) throw new Error('У Google Cloud не ввімкнено потрібне API (Gmail або Calendar).');
      throw new Error('Google: помилка ' + res.status + (msg ? ' — ' + msg : ''));
    }
    return res.json();
  }

  // ---------- Calendar ----------
  const CAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  async function listEvents(timeMin, timeMax) {
    const p = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '250' });
    const r = await api(CAL + '?' + p.toString());
    return (r.items || []).filter((e) => e.status !== 'cancelled');
  }
  const createEvent = (ev) => api(CAL, { method: 'POST', body: JSON.stringify(ev) });
  const updateEvent = (id, ev) => api(CAL + '/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(ev) });
  const deleteEvent = (id) => api(CAL + '/' + encodeURIComponent(id), { method: 'DELETE' }).catch((e) => { if (!/404|410/.test(e.message)) throw e; });

  // ---------- Gmail ----------
  const GM = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
  async function listMessages(q, max) {
    const p = new URLSearchParams({ q, maxResults: String(max || 25) });
    const r = await api(GM + '?' + p.toString());
    return r.messages || [];
  }
  function b64(s) {
    try {
      const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) { return ''; }
  }
  function stripHtml(h) {
    const d = new DOMParser().parseFromString(h, 'text/html');
    d.querySelectorAll('style,script').forEach((n) => n.remove());
    return (d.body && d.body.textContent) || '';
  }
  function findPart(part, mime) {
    if (!part) return null;
    if (part.mimeType === mime && part.body && part.body.data) return part.body.data;
    for (const p of part.parts || []) { const f = findPart(p, mime); if (f) return f; }
    return null;
  }
  async function getMessage(id) {
    const m = await api(GM + '/' + id + '?format=full');
    const hs = {};
    ((m.payload && m.payload.headers) || []).forEach((h) => { hs[h.name.toLowerCase()] = h.value; });
    let text = '';
    const plain = findPart(m.payload, 'text/plain');
    if (plain) text = b64(plain);
    else { const html = findPart(m.payload, 'text/html'); if (html) text = stripHtml(b64(html)); }
    text = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
    return {
      id: m.id,
      threadId: m.threadId,
      from: hs.from || '',
      subject: hs.subject || '(без теми)',
      date: Number(m.internalDate) || Date.now(),
      snippet: m.snippet || '',
      text: text.slice(0, 2500),
      unread: (m.labelIds || []).indexOf('UNREAD') >= 0
    };
  }

  window.LOSG = { signIn, handleRedirect, connected, clearToken, redirectUri, listEvents, createEvent, updateEvent, deleteEvent, listMessages, getMessage };
})();
