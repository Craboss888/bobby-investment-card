/* 入口：页面切换、顶栏、输入框、侧栏 */
(() => {
  const D = window.BOBBY_DATA;
  const UI = window.BobbyUI;
  const Chat = window.BobbyChat;
  const Profile = window.BobbyProfile;
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
  // 演示「第二天早上」时，状态栏固定在 8:30
  const clock = () => {
    // 演示叙事：第一天晚上建卡，第二天早上回来
    $('#sbTime').textContent = window.BobbyProfile && window.BobbyProfile.state.day === 2 ? '8:30' : '21:30';
  };
  clock(); setInterval(clock, 20000);

  /* ---------- 页面切换 ---------- */
  function greeting() {
    const h = Profile.state.day === 2 ? 8 : 21;
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
      const flat = question.replace(/\s+/g, ' ');
      const title = flat.length > 20 ? flat.slice(0, 20) + '…' : flat;
      UI.addHistory({ id: currentChatId, title, time: nowLabel(), q: question, a: null, answer });
      UI.markCurrent(currentChatId);
    }
    const a = Profile.adapt(answer || resolve(question));
    Chat.ask(question, a, { badge: Profile.badgeFor(a), onDone: (m) => Profile.afterAnswer(m, question, a) });
    syncQuick();
  }
  // 有投资卡片时优先按卡片回答，否则沿用原有回答
  const resolve = (q, hint) => Profile.answerFor(q, hint) || (hint ? D.answers[hint] : D.pick(q));

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
  attachPanel.addEventListener('click', (e) => { if (e.target.closest('[data-attach]')) { closeAttach(); UI.toast('暂不支持上传'); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('#attachPanel, #attachBtn')) closeAttach(); });
  $('#micBtn').addEventListener('click', () => UI.toast('暂不支持语音'));

  /* ---------- 侧栏 ---------- */
  function openDrawer() { app.classList.add('drawer-open'); input.blur(); }
  function closeDrawer() {
    if (!app.classList.contains('drawer-open')) return;
    app.classList.remove('drawer-open');
    setTimeout(UI.resetSearch, 400);
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
  UI.renderQuick((q, question) => ask(question, resolve(question, q.answer)));
  UI.renderHot((h) => ask('帮我全面解读一下这个交易热点：' + h.title, D.answers['hot-' + h.id]));
  UI.renderBrief((p) => ask(p), () => ({ b: Profile.briefData(), day: Profile.state.day - 1 }));
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

  /* ---------- 投资卡片与演示控制 ---------- */
  Profile.init({ ask: (q) => ask(q) });
  Profile.subscribe(() => { UI.drawBrief(); syncDemo(); clock(); greeting(); UI.hot.prioritize(Profile.hotScore); });
  $('#drawerCard').addEventListener('click', () => {
    closeDrawer();
    if (Profile.state.built) Profile.openPage(); else Profile.openFlow('start', null, {});
  });

  function syncDemo() {
    const s = Profile.state;
    const d = new Date(); d.setDate(d.getDate() + s.day - 1);
    $('#stageDayLabel').textContent = `第 ${s.day} 天`;
    $('#stageDayDate').textContent = `${d.getMonth() + 1}月${d.getDate()}日 · ${s.day === 1 ? '晚上 21:30' : '早上 8:30'}`;
    document.querySelectorAll('[data-demo="day"]').forEach(b => {
      const short = b.classList.contains('drawer-demo-day');
      b.textContent = s.day === 1 ? (short ? '第二天' : '跳到第二天') : (short ? '第一天' : '回到第一天');
    });
    $('#drawerCardSub').textContent = s.built ? `${Profile.analyze().title} · 查看与编辑` : '还没有卡片，30 秒建一张';
  }
  function resetDemo() {
    Profile.closeFlow(true); Profile.closePage();
    Profile.reset(); Profile.setDay(1);
    Chat.clear(); currentChatId = null;
    $('#onboarding').classList.add('hide');
    goHome();
    $('#homeScroll').scrollTop = 0;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-demo]');
    if (!b) return;
    const act = b.dataset.demo;
    if (act === 'day') {
      const next = Profile.state.day === 1 ? 2 : 1;
      Profile.setDay(next);
      closeDrawer(); Profile.closePage(); Profile.closeFlow(true);
      goHome();
      $('#homeScroll').scrollTo({ top: $('.brief-section').offsetTop - 96, behavior: 'smooth' });
      UI.toast(next === 1 ? '回到第一天' : Profile.state.built ? '第二天早上：简报已按卡片更新' : '第二天早上：没有卡片，简报还是通用版');
    } else if (act === 'reset') { resetDemo(); UI.toast('演示已重置'); }
    else if (act === 'onboarding') { resetDemo(); UI.renderOnboarding(startCard); $('#onboarding').classList.remove('hide'); }
    else if (act === 'card') {
      Profile.closeFlow(true);
      if (!Profile.state.built) Profile.seedDemo();
      $('#onboarding').classList.add('hide');
      Profile.openPage();
    }
  });
  const startCard = (exp) => { Profile.setExp(exp); Profile.openFlow('start', null, { onboarding: true }); };

  greeting();
  show('home');
  if (/card|day2/.test(location.hash)) Profile.seedDemo();
  if (/day2/.test(location.hash)) Profile.setDay(2);
  if (/home|card|day2/.test(location.hash)) $('#onboarding').classList.add('hide');
  else UI.renderOnboarding(startCard);
  syncDemo();
})();
