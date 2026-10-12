/* 入口：页面切换、顶栏、输入框、侧栏 */
(() => {
  const D = window.BOBBY_DATA;
  const UI = window.BobbyUI;
  const Chat = window.BobbyChat;
  const { $ } = UI;

  const app = $('#app');
  const input = $('#input');
  const inputBox = $('#inputBox');
  const sendBtn = $('#sendBtn');
  const composer = $('#composer');
  let view = 'home';
  let currentChatId = null;

  /* ---------- 设备缩放与状态栏时间 ---------- */
  function fit() {
    const s = Math.min(1, (innerHeight - 32) / 898, (innerWidth - 32) / 426);
    document.documentElement.style.setProperty('--scale', s.toFixed(4));
  }
  addEventListener('resize', fit); fit();
  const clock = () => { const d = new Date(); $('#sbTime').textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  clock(); setInterval(clock, 20000);

  /* ---------- 页面切换 ---------- */
  function greeting() {
    const h = new Date().getHours();
    const g = h < 5 ? '晚上好' : h < 11 ? '早上好' : h < 13 ? '中午好' : h < 18 ? '下午好' : '晚上好';
    $('#greeting').textContent = `${g}，iFeng`;
  }
  function show(next) {
    view = next;
    $('#viewHome').classList.toggle('is-active', next === 'home');
    $('#viewChat').classList.toggle('is-active', next === 'chat');
    $('#homeBtn').classList.toggle('is-hidden', next !== 'chat');
    syncQuick();
    syncScrolled();
  }
  function syncQuick() {
    const empty = view === 'chat' && !$('#viewChat').classList.contains('has-messages');
    composer.classList.toggle('no-quick', !empty);
  }
  function syncScrolled() {
    const sc = view === 'home' ? $('#homeScroll') : $('#chatScroll');
    app.classList.toggle('is-scrolled', sc.scrollTop > 4);
  }
  $('#homeScroll').addEventListener('scroll', syncScrolled, { passive: true });
  $('#chatScroll').addEventListener('scroll', syncScrolled, { passive: true });

  function goHome() { closeDrawer(); show('home'); UI.markCurrent(null); }
  function newChat() {
    closeDrawer();
    Chat.clear();
    currentChatId = null;
    UI.markCurrent(null);
    greeting();
    show('chat');
    // 欢迎态重新播一次入场动画
    const w = $('#chatWelcome');
    w.querySelectorAll('img, h1').forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
  }

  /* ---------- 发问 ---------- */
  const nowLabel = () => { const d = new Date(); return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  function ask(question, answer) {
    closeDrawer();
    if (view !== 'chat') { Chat.clear(); currentChatId = null; show('chat'); }
    if (!currentChatId) {
      currentChatId = 'c-' + Date.now();
      const title = question.length > 20 ? question.slice(0, 20) + '…' : question;
      UI.addHistory({ id: currentChatId, title, time: nowLabel(), q: question, a: null, answer });
      UI.markCurrent(currentChatId);
    }
    Chat.ask(question, answer || D.pick(question));
    syncQuick();
  }

  function submit() {
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    autosize(); syncSend();
    input.blur();
    ask(q);
  }

  /* ---------- 输入框 ---------- */
  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
  }
  function syncSend() {
    const has = !!input.value.trim();
    inputBox.classList.toggle('has-content', has);
    sendBtn.classList.toggle('ready', has && !Chat.isBusy());
  }
  input.addEventListener('input', () => { autosize(); syncSend(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!Chat.isBusy()) submit(); }
  });
  sendBtn.addEventListener('click', () => { if (Chat.isBusy()) Chat.stop(); else submit(); });

  // 提示语打字机
  (function typewriter() {
    let i = 0, n = 0, phase = 'type', wait = 0;
    setInterval(() => {
      if (document.activeElement === input || input.value) { input.placeholder = '问问Bobby…'; return; }
      const full = D.placeholders[i];
      if (wait > 0) { wait--; return; }
      if (phase === 'type') { n++; if (n >= full.length) { phase = 'hold'; wait = 26; } }
      else if (phase === 'hold') { phase = 'del'; }
      else { n -= 2; if (n <= 0) { n = 0; phase = 'type'; i = (i + 1) % D.placeholders.length; wait = 4; } }
      input.placeholder = full.slice(0, n) + '|';
    }, 85);
  })();

  // Bobby Pro 开关
  $('#proSwitch').addEventListener('click', (e) => {
    const on = !e.currentTarget.classList.contains('active');
    e.currentTarget.classList.toggle('active', on);
    e.currentTarget.setAttribute('aria-pressed', on);
    inputBox.classList.toggle('pro-on', on);
    UI.toast(on ? 'Bobby Pro 已开启' : 'Bobby Pro 已关闭');
  });

  // 附件、语音
  const attachBtn = $('#attachBtn'), attachPanel = $('#attachPanel');
  const closeAttach = () => { attachPanel.classList.remove('open'); attachBtn.classList.remove('open'); };
  attachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !attachPanel.classList.contains('open');
    attachPanel.classList.toggle('open', open); attachBtn.classList.toggle('open', open);
  });
  attachPanel.addEventListener('click', (e) => { if (e.target.closest('[data-attach]')) { closeAttach(); UI.toast('演示版暂不支持上传'); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('#attachPanel, #attachBtn')) closeAttach(); });
  $('#micBtn').addEventListener('click', () => UI.toast('演示版暂不支持语音'));

  /* ---------- 侧栏 ---------- */
  function openDrawer() { app.classList.add('drawer-open'); input.blur(); }
  function closeDrawer() {
    app.classList.remove('drawer-open');
    $('#drawer').classList.remove('searching');
  }
  $('#menuBtn').addEventListener('click', openDrawer);
  $('#drawerBackdrop').addEventListener('click', closeDrawer);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  // 向左滑动收起侧栏
  (() => {
    const dr = $('#drawer'); let s = null;
    dr.addEventListener('pointerdown', (e) => { if (!e.target.closest('input')) s = { x: e.clientX, dx: 0 }; });
    addEventListener('pointermove', (e) => {
      if (!s) return;
      s.dx = Math.min(0, e.clientX - s.x);
      if (s.dx < -8) { dr.style.transition = 'none'; dr.style.transform = `translateX(${s.dx}px)`; }
    });
    addEventListener('pointerup', () => {
      if (!s) return;
      const close = s.dx < -70; s = null;
      dr.style.transition = ''; dr.style.transform = '';
      if (close) closeDrawer();
    });
  })();

  $('#homeBtn').addEventListener('click', goHome);
  $('#newChatBtn').addEventListener('click', newChat);

  /* ---------- 组装 ---------- */
  const answerFor = { hot: 'market', picks: 'picks', portfolio: 'portfolio', earnings: 'earnings' };
  UI.renderQuick((q) => ask(q.prompt, D.answers[answerFor[q.id]]));
  UI.renderHot((h) => ask('帮我全面解读一下这个交易热点：' + h.title, D.answers['hot-' + h.id]));
  UI.renderBrief((p) => ask(p, D.pick(p)));
  UI.renderPro();
  UI.renderDrawer((h) => {
    closeDrawer();
    currentChatId = h.id;
    UI.markCurrent(h.id);
    show('chat');
    Chat.showStatic(h.q, h.answer || D.answers[h.a]);
    syncQuick();
  }, newChat);
  Chat.init({ busy: (b) => { sendBtn.classList.toggle('is-stopping', b); syncSend(); } });

  greeting();
  show('home');
  if (/home/.test(location.hash)) $('#onboarding').classList.add('hide');
  else UI.renderOnboarding(() => {});
})();
