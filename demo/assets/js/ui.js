/* 界面组件：首页各模块、侧栏、引导、提示条 */
window.BobbyUI = (() => {
  const D = window.BOBBY_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = (inner, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}">${inner}</svg>`;

  /* ---------- 提示条 ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /* ---------- 快捷入口卡 ---------- */
  let marqueeDragged = false;
  const qaCard = (q) => `
    <button type="button" class="qa-card" data-qa="${q.id}">
      <span class="qa-icon"><img src="${q.icon}" alt=""></span>
      <span class="qa-text">${esc(q.label)}</span>
    </button>`;

  function renderQuick(onPick) {
    // 首页：自动横向滚动（内容复制一份实现无缝循环）
    const home = $('#homeQuick');
    const cards = D.quickActions.map(qaCard).join('');
    home.innerHTML = `<div class="qa-track">${cards}${cards}</div>`;
    startMarquee(home.firstElementChild);
    // 新对话：输入框上方，可手动横滑
    $('#chatQuick').innerHTML = D.quickActions.map(qaCard).join('');
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-qa]');
      if (!b) return;
      if (marqueeDragged && b.closest('#homeQuick')) { marqueeDragged = false; return; }
      const q = D.quickActions.find(x => x.id === b.dataset.qa);
      if (q) onPick(q);
    });
  }

  function startMarquee(track) {
    let x = 0, last = performance.now(), paused = false, resumeAt = 0;
    const speed = 22; // px/s
    const half = () => track.scrollWidth / 2;
    const pause = () => { paused = true; resumeAt = performance.now() + 2200; };
    track.parentElement.addEventListener('pointerdown', pause, { passive: true });
    track.parentElement.addEventListener('wheel', pause, { passive: true });
    // 支持手指拖动
    let dragStart = null;
    track.parentElement.addEventListener('pointerdown', (e) => { dragStart = { px: e.clientX, x }; marqueeDragged = false; });
    window.addEventListener('pointermove', (e) => {
      if (!dragStart) return;
      if (Math.abs(e.clientX - dragStart.px) > 6) marqueeDragged = true;
      x = dragStart.x + (e.clientX - dragStart.px);
      resumeAt = performance.now() + 2200;
    });
    window.addEventListener('pointerup', () => { dragStart = null; });
    (function tick(now) {
      const dt = Math.min(64, now - last); last = now;
      if (paused && now > resumeAt && !dragStart) paused = false;
      if (!paused) x -= speed * dt / 1000;
      const h = half();
      if (h > 0) { if (x <= -h) x += h; if (x > 0) x -= h; }
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(tick);
    })(last);
  }

  /* ---------- 热门交易卡片堆 ---------- */
  function renderHot(onAnalyze) {
    const stack = $('#hotStack');
    const sparkle = svg('<path d="M12 3.5l1.7 4.6a3 3 0 0 0 1.8 1.8L20 11.5l-4.5 1.6a3 3 0 0 0-1.8 1.8L12 19.5l-1.7-4.6a3 3 0 0 0-1.8-1.8L4 11.5l4.5-1.6a3 3 0 0 0 1.8-1.8z"/><path d="M19 3v3M17.5 4.5h3"/>');
    stack.innerHTML = D.hotTrades.map((h, i) => `
      <article class="hot-card" data-id="${h.id}" data-pos="${i}">
        <div class="hot-media"><img src="${h.img}" alt="" draggable="false"></div>
        <div class="hot-meta"><span class="hot-tag">${esc(h.tag)}</span><span class="hot-time">${esc(h.time)}</span></div>
        <h3 class="hot-title">${esc(h.title)}</h3>
        <p class="hot-body">${esc(h.body)}</p>
        <div class="hot-stocks">${h.stocks.map(s => `<span class="hot-chip">${esc(s.label)}<span class="hot-chip-div"></span><span class="${s.up ? 'up' : 'down'}">${esc(s.chg)}</span></span>`).join('')}</div>
        <div class="hot-actions"><button type="button" class="hot-btn" data-analyze="${h.id}">${sparkle}<span>分析交易策略</span></button></div>
      </article>`).join('');

    let order = D.hotTrades.map(h => h.id);
    const cardOf = (id) => stack.querySelector(`[data-id="${id}"]`);
    const layout = () => order.forEach((id, i) => { cardOf(id).dataset.pos = Math.min(i, 3); });

    const next = (dir = -1) => {
      const top = cardOf(order[0]);
      top.classList.add('fly-out');
      top.style.transform = `translateX(${dir * 120}%) rotate(${dir * 12}deg)`;
      order.push(order.shift());
      // 其余卡片先上移
      order.slice(0, -1).forEach((id, i) => { cardOf(id).dataset.pos = i; });
      setTimeout(() => {
        top.classList.remove('fly-out');
        top.style.transition = 'none';
        top.style.transform = '';
        top.dataset.pos = 3;
        requestAnimationFrame(() => { top.style.transition = ''; layout(); });
      }, 380);
    };

    // 拖动切换
    let drag = null;
    stack.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.hot-card');
      if (!card || card.dataset.pos !== '0' || e.target.closest('.hot-btn, .hot-stocks')) return;
      drag = { card, x0: e.clientX, y0: e.clientY, dx: 0, moved: false };
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      drag.dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.moved && Math.abs(drag.dx) > 6 && Math.abs(drag.dx) > Math.abs(dy)) { drag.moved = true; drag.card.classList.add('dragging'); }
      if (drag.moved) drag.card.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 28}deg)`;
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      const { card, dx, moved } = drag; drag = null;
      card.classList.remove('dragging');
      if (moved && Math.abs(dx) > 70) { next(dx > 0 ? 1 : -1); }
      else { card.style.transform = ''; }
      if (moved) { card.dataset.justDragged = '1'; setTimeout(() => delete card.dataset.justDragged, 50); }
    });
    stack.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-analyze]');
      if (btn) { onAnalyze(D.hotTrades.find(h => h.id === btn.dataset.analyze)); return; }
      const card = e.target.closest('.hot-card');
      if (card && card.dataset.pos === '0' && !card.dataset.justDragged && !e.target.closest('.hot-stocks')) next(-1);
    });
  }

  /* ---------- 每日简报 ---------- */
  function renderBrief(onPrompt) {
    const b = D.brief;
    const d = new Date();
    const summary = b.summary.map(s => s.metric ? `<span class="brief-metric">${esc(s.text)}</span>` : esc(s.text)).join('');
    $('#briefMount').innerHTML = `
      <article class="brief-card">
        <div class="brief-body">
          <div class="brief-top"><span class="brief-kicker">${esc(b.kicker)}</span><span class="brief-ticker">${esc(b.ticker)}</span></div>
          <h3 class="brief-title">${esc(b.title)}</h3>
          <p class="brief-summary">${summary}</p>
          <div class="brief-prompts">${b.prompts.map((p, i) => `<button type="button" class="brief-prompt" data-brief="${i}"><span class="brief-prompt-idx">0${i + 1}</span><span>${esc(p)}</span></button>`).join('')}</div>
        </div>
        <footer class="brief-footer">
          <span class="brief-date">今天 · ${d.getMonth() + 1}月${d.getDate()}日</span>
          <span class="brief-dots"><span></span></span>
          <span class="brief-pager">
            <button type="button" aria-label="上一页" tabindex="-1">${svg('<path d="M15 5l-7 7 7 7"/>')}</button>
            <span class="brief-count">1 <span>/</span> 1</span>
            <button type="button" aria-label="下一页" tabindex="-1">${svg('<path d="M9 5l7 7-7 7"/>')}</button>
          </span>
        </footer>
      </article>`;
    $('#briefMount').addEventListener('click', (e) => {
      const p = e.target.closest('[data-brief]');
      if (p) onPrompt(b.prompts[+p.dataset.brief]);
    });
  }

  /* ---------- Bobby Pro 卡 ---------- */
  function renderPro() {
    const p = D.pro;
    const particles = Array.from({ length: 9 }, (_, i) => {
      const size = 3 + (i * 7 % 5);
      const colors = ['rgba(130,190,255,.7)', 'rgba(160,210,255,.5)', 'rgba(255,255,255,.6)', 'rgba(80,140,255,.9)'];
      const c = colors[i % 4];
      return `<i style="left:${(i * 37 + 8) % 92}%;bottom:${48 + (i * 13) % 34}%;width:${size}px;height:${size}px;background:${c};box-shadow:0 0 ${size * 2}px ${c};--dur:${2.4 + (i % 4) * .6}s;--delay:${(i * .45) % 3}s"></i>`;
    }).join('');
    const exp = [['新手入门', '刚开始学习，需要多点指导。'], ['有些经验', '懂基本术语，有实盘经验。'], ['非常专业', '追求效率，直接聊数据和策略。']];
    $('#proMount').innerHTML = `
      <div class="pro-card" id="proCard">
        <div class="pro-surface">
          <div class="pro-glow"></div>
          <div class="pro-back-bg"></div>
          <div class="pro-face pro-front">
            <div class="pro-inner">
              <div class="pro-word"><span>PRO</span></div>
              <div class="pro-particles">${particles}</div>
              <div class="pro-art"><img src="assets/img/pro-artifact.png" alt=""></div>
              <div class="pro-copy">
                <h3 class="pro-title">${esc(p.title)}</h3>
                <p class="pro-desc">${esc(p.desc)}</p>
                <div class="pro-feats">${p.feats.map(f => `<div class="pro-feat"><span class="pro-feat-ico">${svg(f.icon)}</span><span class="pro-feat-text">${esc(f.label)}</span></div>`).join('')}</div>
              </div>
              <div class="pro-cta-wrap">
                <button type="button" class="pro-cta" id="proCta">
                  <span class="pro-cta-bg"></span>
                  <span class="pro-cta-badge">${esc(p.badge)}</span>
                  <span class="pro-cta-copy"><span class="pro-cta-main">${esc(p.cta)}</span><span class="pro-cta-sub">${esc(p.ctaSub)}</span></span>
                  ${svg('<path d="M5 12h14M13 5l7 7-7 7"/>')}
                </button>
                <div class="pro-note">${svg('<path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 2.2-3.7L12 7z"/><path d="M12 7h4.5a2.5 2.5 0 1 0-2.2-3.7L12 7z"/>')}<span>${esc(p.note)}</span></div>
              </div>
            </div>
          </div>
          <div class="pro-face pro-back">
            <div class="pro-back-inner">
              <div class="pro-back-head">
                <div><h3 class="pro-back-title">加入 Bobby Pro</h3><p class="pro-back-sub">简单介绍一下你的交易风格</p></div>
                <button type="button" class="pro-back-close" id="proBack" aria-label="返回">${svg('<path d="M15 18l-6-6 6-6"/>')}</button>
              </div>
              <div class="pro-form">
                <div class="pro-field"><div class="pro-field-label">邮箱<b>*</b></div><input class="pro-input" id="proEmail" type="email" placeholder="you@example.com" autocomplete="off"></div>
                <div class="pro-field" style="margin-top:14px"><div class="pro-field-label">交易经验<b>*</b></div>
                  <div class="pro-radios">${exp.map(([t, s], i) => `<button type="button" class="pro-radio${i === 1 ? ' sel' : ''}" data-exp="${i}"><span class="pro-radio-dot"></span><span class="pro-radio-copy"><span class="pro-radio-title">${t}</span><span class="pro-radio-sub">${s}</span></span></button>`).join('')}</div>
                </div>
                <button type="button" class="pro-cta" id="proSubmit" style="margin-top:18px"><span class="pro-cta-bg"></span><span class="pro-cta-copy"><span class="pro-cta-main">${esc(p.cta)}</span></span>${svg('<path d="M5 12h14M13 5l7 7-7 7"/>')}</button>
              </div>
              <div class="pro-done">${svg('<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5"/>')}<div class="pro-done-title">已加入候补</div><div class="pro-done-sub">开放后会第一时间通知你</div></div>
            </div>
          </div>
        </div>
      </div>`;
    const card = $('#proCard');
    // 卡片高度跟随当前朝向那一面的内容
    const fitHeight = () => {
      const face = card.querySelector(card.classList.contains('flipped') ? '.pro-back' : '.pro-front');
      card.style.height = face.scrollHeight + 'px';
    };
    card.querySelector('.pro-art img').addEventListener('load', fitHeight);
    addEventListener('resize', fitHeight);
    document.fonts && document.fonts.ready.then(fitHeight);
    fitHeight();
    $('#proCta').addEventListener('click', () => { card.classList.add('flipped'); fitHeight(); });
    $('#proBack').addEventListener('click', () => { card.classList.remove('flipped'); fitHeight(); });
    card.addEventListener('click', (e) => {
      const r = e.target.closest('[data-exp]');
      if (!r) return;
      card.querySelectorAll('[data-exp]').forEach(x => x.classList.toggle('sel', x === r));
    });
    $('#proSubmit').addEventListener('click', () => {
      const v = $('#proEmail').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(v)) { toast('请填写有效邮箱'); $('#proEmail').focus(); return; }
      card.classList.add('joined');
      toast('已加入候补');
    });
  }

  /* ---------- 引导问卷 ---------- */
  function renderOnboarding(onDone) {
    const o = D.onboarding;
    const el = $('#onboarding');
    el.innerHTML = `
      <div class="ob-progress"><div class="ob-track"><div class="ob-fill"></div></div><div class="ob-count"><b>01</b> / 05</div></div>
      <div class="ob-step">
        <img class="ob-logo" src="assets/img/logo.png" alt="">
        <h1 class="ob-title">${esc(o.title)}</h1>
        <p class="ob-sub">${esc(o.sub)}</p>
        <div class="ob-options">${o.options.map(op => `
          <button type="button" class="ob-option" data-ob="${op.id}">
            <span class="ob-ico" style="color:${op.color}">${svg(op.icon).replace('<svg', '<svg stroke="currentColor"')}</span>
            <span class="ob-copy"><span class="ob-opt-title">${esc(op.title)}</span><span class="ob-opt-sub" style="display:block">${esc(op.sub)}</span></span>
            <span class="ob-radio"></span>
          </button>`).join('')}</div>
        <button type="button" class="ob-next" id="obNext" disabled>继续 ${svg('<path d="M5 12h14M13 5l7 7-7 7"/>')}</button>
      </div>`;
    const nextBtn = $('#obNext');
    el.addEventListener('click', (e) => {
      const op = e.target.closest('[data-ob]');
      if (!op) return;
      el.querySelectorAll('[data-ob]').forEach(x => x.classList.toggle('sel', x === op));
      nextBtn.disabled = false; nextBtn.classList.add('ready');
    });
    nextBtn.addEventListener('click', () => {
      el.querySelector('.ob-fill').style.width = '100%';
      setTimeout(() => { el.classList.add('hide'); onDone(); }, 260);
    });
  }

  /* ---------- 侧栏 ---------- */
  function renderDrawer(onOpenHistory, onNewChat) {
    const list = $('#drawerHistory');
    list.innerHTML = D.history.map(h => `
      <button type="button" class="drawer-item" data-hist="${h.id}">
        <span class="drawer-item-title">${esc(h.title)}</span>
        <span class="drawer-item-time">${esc(h.time)}</span>
      </button>`).join('');
    list.addEventListener('click', (e) => {
      const it = e.target.closest('[data-hist]');
      if (it) onOpenHistory(D.history.find(h => h.id === it.dataset.hist));
    });
    $('#drawerNewChat').addEventListener('click', onNewChat);
    const drawer = $('#drawer');
    const input = $('#drawerSearchInput');
    $('#drawerSearchBtn').addEventListener('click', () => { drawer.classList.add('searching'); setTimeout(() => input.focus(), 120); });
    $('#drawerSearchCancel').addEventListener('click', () => { drawer.classList.remove('searching'); input.value = ''; filter(''); });
    const filter = (q) => {
      let shown = 0;
      list.querySelectorAll('.drawer-item').forEach(it => {
        const hit = !q || it.textContent.includes(q);
        it.classList.toggle('is-hidden', !hit); if (hit) shown++;
      });
      $('#drawerEmpty').classList.toggle('show', shown === 0);
    };
    input.addEventListener('input', () => filter(input.value.trim()));
  }

  function addHistory(item) {
    D.history.unshift(item);
    const list = $('#drawerHistory');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'drawer-item is-new'; b.dataset.hist = item.id;
    b.innerHTML = `<span class="drawer-item-title">${esc(item.title)}</span><span class="drawer-item-time">${esc(item.time)}</span>`;
    list.prepend(b);
  }

  function markCurrent(id) {
    document.querySelectorAll('.drawer-item').forEach(x => x.classList.toggle('is-current', x.dataset.hist === id));
  }

  return { $, esc, svg, toast, renderQuick, renderHot, renderBrief, renderPro, renderOnboarding, renderDrawer, addHistory, markCurrent };
})();
