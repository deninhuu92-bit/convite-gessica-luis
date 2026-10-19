(() => {
  'use strict';
  const API = 'https://hjjhxumzjmlmaeobblsf.supabase.co/rest/v1/rpc/';
  const PUBLIC_KEY = 'sb_publishable_TrqajG6n4fihDXXhi9-hFQ_WGNNhcXF';
  const panel = document.querySelector('#partial');
  const status = document.querySelector('#vote-status');
  const retry = document.querySelector('#vote-retry');
  const buttons = [...document.querySelectorAll('[data-vote]')];
  const number = new Intl.NumberFormat('pt-BR');
  let voterId, desired = null, syncing = false, revision = 0, lastChoice = null;
  try { voterId = localStorage.getItem('gl-codigo-voto'); } catch {}
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(voterId || '')) {
    voterId = crypto.randomUUID();
    try { localStorage.setItem('gl-codigo-voto', voterId); } catch {}
  }
  async function rpc(name, body = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(API + name, {
        method: 'POST', headers: { apikey: PUBLIC_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: controller.signal, cache: 'no-store'
      });
      if (!response.ok) throw new Error('Não foi possível consultar a votação.');
      const data = await response.json();
      if (!data || !['menino', 'menina', 'total'].every(k => Number.isSafeInteger(data[k]) && data[k] >= 0) || data.menino + data.menina !== data.total) {
        throw new Error('Resposta de votação inválida.');
      }
      return data;
    } finally { clearTimeout(timer); }
  }
  function render(data) {
    const boy = data.total ? Math.round(data.menino / data.total * 100) : 0;
    const girl = data.total ? 100 - boy : 0;
    for (const [choice, percent] of [['menino', boy], ['menina', girl]]) {
      document.querySelector('#count-' + choice).textContent = number.format(data[choice]);
      document.querySelector('#percent-' + choice).textContent = percent + '%';
      const bar = document.querySelector('#bar-' + choice);
      bar.style.width = (data.total ? data[choice] / data.total * 100 : 0) + '%';
      bar.parentElement.setAttribute('aria-valuenow', String(percent));
    }
    document.querySelector('#vote-total').textContent = data.total === 1 ? '1 palpite até agora' : number.format(data.total) + ' palpites até agora';
  }
  function announce(message, failed = false) {
    status.textContent = message;
    retry.hidden = !failed;
  }
  async function refresh() {
    if (syncing) return;
    const atRevision = revision;
    try {
      const data = await rpc('convite_gl_parcial');
      if (!syncing && atRevision === revision) {
        render(data);
        if (!lastChoice) announce(data.total ? 'A parcial mostra os palpites de todos os convidados.' : 'Qual time vai receber o primeiro palpite?');
      }
    } catch {
      if (!syncing && atRevision === revision) announce('A parcial não carregou. Você pode continuar e responder pelo WhatsApp.', true);
    }
  }
  async function sync() {
    if (syncing) return;
    syncing = true;
    panel.setAttribute('aria-busy', 'true');
    try {
      while (desired) {
        const choice = desired;
        desired = null;
        announce('Incluindo seu palpite na parcial…');
        try {
          const data = await rpc('convite_gl_votar', { p_codigo: voterId, p_palpite: choice });
          if (!desired) {
            render(data);
            announce('Seu palpite está na parcial! Você pode mudar de ideia.');
          }
        } catch {
          if (!desired) announce('Seu palpite ficou neste aparelho, mas ainda não entrou na parcial. Tente novamente ou continue para o WhatsApp.', true);
        }
      }
    } finally {
      syncing = false;
      panel.setAttribute('aria-busy', 'false');
    }
  }
  function choose(choice) {
    if (!['menino', 'menina'].includes(choice)) return;
    panel.hidden = false;
    lastChoice = choice;
    desired = choice;
    revision++;
    void sync();
  }
  buttons.forEach(button => button.addEventListener('click', () => choose(button.dataset.vote)));
  retry.addEventListener('click', () => lastChoice ? choose(lastChoice) : void refresh());
  const existingChoice = buttons.find(button => button.getAttribute('aria-pressed') === 'true');
  if (existingChoice) panel.hidden = false;
  void refresh();
  setInterval(() => {
    if (!panel.hidden && !document.hidden && !retry.hidden) return;
    if (!panel.hidden && !document.hidden) void refresh();
  }, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !panel.hidden && retry.hidden) void refresh();
  });
})();
