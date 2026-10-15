/* LifeOS — підключення до Claude API прямо з браузера.
   Ключ API зберігається лише на пристрої користувачки (localStorage) і йде тільки на api.anthropic.com. */
(function () {
  'use strict';

  const MODELS = [
    { id: 'claude-opus-5-5', name: 'Opus 5.5', note: 'найрозумніша, для складного' },
    { id: 'claude-sonnet-5-5', name: 'Sonnet 5.5', note: 'швидка й розумна, на щодень' },
    { id: 'claude-haiku-5-5', name: 'Haiku 5.5', note: 'найшвидша й найдешевша' },
    { id: 'claude-fable-5-1', name: 'Fable 5.1', note: 'найпотужніша, найдорожча' }
  ];
  const ENDPOINT = 'https://api.anthropic.com/v1/messages';

  function headers(key) {
    return {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
  }

  async function errorText(res) {
    let msg = '';
    try { const j = await res.json(); msg = (j.error && j.error.message) || ''; } catch (e) {}
    if (res.status === 401) return 'Ключ API не підходить. Перевір його в налаштуваннях.';
    if (res.status === 403) return 'Доступ заборонено. ' + msg;
    if (res.status === 404) return 'Ця модель недоступна для твого ключа — вибери іншу. ' + msg;
    if (res.status === 429) return 'Забагато запитів або закінчився баланс на рахунку API. ' + msg;
    if (res.status === 529 || res.status === 503) return 'Сервери Claude зараз перевантажені. Спробуй за хвилину.';
    if (res.status === 400 && /credit|balance/i.test(msg)) return 'На рахунку API закінчились кошти. Поповни баланс у Claude Console.';
    return 'Помилка ' + res.status + '. ' + msg;
  }

  async function send(url, opts) {
    try { return await fetch(url, opts); }
    catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new Error('Немає звʼязку з Claude. Перевір інтернет.');
    }
  }

  // Потокова відповідь: onText(повнийТекст) викликається під час генерації.
  async function stream(o) {
    const body = { model: o.model, max_tokens: o.maxTokens || 2048, system: o.system, messages: o.messages, stream: true };
    if (o.tools) body.tools = o.tools;
    const res = await send(ENDPOINT, { method: 'POST', headers: headers(o.apiKey), body: JSON.stringify(body), signal: o.signal });
    if (!res.ok) throw new Error(await errorText(res));

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    const blocks = [];
    let buf = '';
    let stop = null;
    const textNow = () => blocks.filter((b) => b && b.type === 'text').map((b) => b.text).join('');

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const line = chunk.split('\n').find((l) => l.indexOf('data:') === 0);
        if (!line) continue;
        let ev;
        try { ev = JSON.parse(line.slice(5).trim()); } catch (e) { continue; }
        if (ev.type === 'content_block_start') {
          const b = Object.assign({}, ev.content_block);
          if (b.type === 'tool_use') { b._json = ''; b.input = {}; }
          if (b.type === 'text') b.text = b.text || '';
          blocks[ev.index] = b;
        } else if (ev.type === 'content_block_delta') {
          const b = blocks[ev.index];
          if (!b) continue;
          if (ev.delta.type === 'text_delta') { b.text += ev.delta.text; if (o.onText) o.onText(textNow()); }
          else if (ev.delta.type === 'input_json_delta') b._json += ev.delta.partial_json;
        } else if (ev.type === 'content_block_stop') {
          const b = blocks[ev.index];
          if (b && b.type === 'tool_use') {
            try { b.input = b._json ? JSON.parse(b._json) : {}; } catch (e) { b.input = {}; }
            delete b._json;
          }
        } else if (ev.type === 'message_delta') {
          if (ev.delta && ev.delta.stop_reason) stop = ev.delta.stop_reason;
        } else if (ev.type === 'error') {
          throw new Error((ev.error && ev.error.message) || 'Помилка Claude');
        }
      }
    }
    const content = blocks.filter(Boolean)
      .filter((b) => (b.type === 'text' && b.text.trim()) || b.type === 'tool_use')
      .map((b) => b.type === 'text' ? { type: 'text', text: b.text } : { type: 'tool_use', id: b.id, name: b.name, input: b.input });
    return { content, stop_reason: stop };
  }

  // Звичайний виклик (для класифікації листів з примусовим інструментом).
  async function call(o) {
    const body = { model: o.model, max_tokens: o.maxTokens || 4096, system: o.system, messages: o.messages };
    if (o.tools) body.tools = o.tools;
    if (o.toolChoice) body.tool_choice = o.toolChoice;
    const res = await send(ENDPOINT, { method: 'POST', headers: headers(o.apiKey), body: JSON.stringify(body), signal: o.signal });
    if (!res.ok) throw new Error(await errorText(res));
    return res.json();
  }

  window.LOSAI = { MODELS, stream, call };
})();
