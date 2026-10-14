/* 投资卡片（新功能）：状态、称号规则、建卡流程、卡片组件、卡片页、对话钩子 */
window.BobbyProfile = (() => {
  const D = window.BOBBY_DATA;
  const K = D.profileKit, U = K.universe, S = D.S, steps = D.steps;
  const { $, esc, svg, toast } = window.BobbyUI;

  const I = {
    back: '<path d="M15 18l-6-6 6-6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    share: '<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 15.5 16 11 6 20"/>',
    star: '<path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
    mask: '<path d="M3 3l18 18"/><path d="M10.6 5.1C11 5 11.5 5 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.3 6.3C4.2 7.7 2.7 9.8 2 12c1 2.5 5 7 10 7 1.8 0 3.4-.6 4.8-1.4"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    minus: '<path d="M6 12h12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    card: '<rect x="4" y="3" width="16" height="18" rx="3.5"/><path d="M8 15h8M8 18h5"/><path d="M12 6.5l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>',
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M4 12h16"/>',
  };
  const ic = (k, cls = '') => svg(I[k], cls);

  /* ---------- 状态 ---------- */
  const state = { built: false, source: null, holdings: [], watch: [], prefs: {}, log: [], day: 1, created: null };
  let hooks = { ask: () => {}, view: () => 'home', home: () => {} };
  const subs = [];
  const changed = () => subs.forEach(f => f(state));

  const dayDate = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d; };
  const mdLabel = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;
  const hm = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const nameOf = (t) => (t === 'CASH' ? '现金' : t);
  const stocksOf = (s = state) => s.holdings.filter(h => !U[h.t].cash);

  // 头像：代码首字母 + 品类色（不用真实公司标志）
  const avatar = (t, cls = '') => `<span class="pf-av ${cls}" style="--c:${U[t].color}">${t === 'CASH' ? '$' : t.slice(0, 2)}</span>`;

  // 比例取整并保证合计 100（最大余数法）
  function normalize(list) {
    const total = list.reduce((n, x) => n + Math.max(0, +x.w || 0), 0) || 1;
    const raw = list.map(x => ({ t: x.t, v: Math.max(0, +x.w || 0) * 100 / total }));
    const out = raw.map(x => ({ t: x.t, w: Math.floor(x.v), r: x.v - Math.floor(x.v) }));
    let left = 100 - out.reduce((n, x) => n + x.w, 0);
    [...out].sort((a, b) => b.r - a.r).forEach(x => { if (left > 0) { x.w++; left--; } });
    return out.filter(x => x.w > 0).map(({ t, w }) => ({ t, w })).sort((a, b) => (U[a.t].cash ? 1 : 0) - (U[b.t].cash ? 1 : 0) || b.w - a.w);
  }

  /* ---------- 称号 ---------- */
  function analyze(s = state) {
    const h = stocksOf(s);
    const sum = (f) => h.reduce((n, x) => n + (f(U[x.t]) ? x.w : 0), 0);
    const tech = sum(u => u.tech), lev = sum(u => u.lev), index = sum(u => u.index), div = sum(u => u.div);
    const cash = s.holdings.filter(x => U[x.t].cash).reduce((n, x) => n + x.w, 0);
    const key = !h.length ? 'scout' : tech >= 70 ? 'single' : lev > 0 ? 'lever' : index >= 50 ? 'index' : div >= 50 ? 'div' : 'multi';
    const tags = [];
    if (h.length) {
      if (tech) tags.push(`科技 ${tech}%`);
      if (lev) tags.push('含杠杆');
      if (cash) tags.push(`现金 ${cash}%`);
    } else if (s.watch.length) tags.push(`关注 ${s.watch.length} 只`);
    if (s.prefs.dip) tags.push(K.prefLabels.dip[s.prefs.dip]);
    if (s.prefs.horizon) tags.push(K.prefLabels.horizon[s.prefs.horizon]);
    return { key, ...K.personas[key], tags: tags.slice(0, 4), tech, lev, cash, stocks: h };
  }

  /* ---------- 卡片组件 ---------- */
  function cardHTML(opts = {}) {
    const a = analyze();
    const h = state.holdings;
    const watchOnly = state.watch.filter(t => !h.some(x => x.t === t));
    const mix = h.length
      ? `<div class="pfc-bar">${h.map(x => `<i style="flex:${x.w};background:${U[x.t].color}"></i>`).join('')}</div>
         <div class="pfc-legend">${h.map(x => `<span><b style="background:${U[x.t].color}"></b>${nameOf(x.t)}<em>${x.w}%</em></span>`).join('')}</div>
         ${watchOnly.length ? `<div class="pfc-also">另关注 ${watchOnly.slice(0, 3).join('、')}${watchOnly.length > 3 ? ` 等 ${watchOnly.length} 只` : ''}</div>` : ''}`
      : `<div class="pfc-watch">${state.watch.slice(0, 8).map(t => `<span>${avatar(t)}${t}</span>`).join('')}</div>`;
    const title = opts.reveal ? [...a.title].map((c, i) => `<span style="--i:${i}">${esc(c)}</span>`).join('') : esc(a.title);
    return `
      <div class="pfc${opts.reveal ? ' is-reveal' : ''}${opts.flat ? ' is-flat' : ''}" data-tilt>
        <div class="pfc-sheen"></div>
        <img class="pfc-mark" src="assets/img/logo.png" alt="">
        <div class="pfc-in">
          <header class="pfc-head"><img src="assets/img/logo.png" alt=""><span>Bobby 投资卡片</span><span class="pfc-src">${state.source === 'import' ? '截图导入' : '点选关注'}</span></header>
          <div class="pfc-name"><h3 class="pfc-title">${title}</h3><div class="pfc-en">${esc(a.en)}</div></div>
          <div class="pfc-tags">${a.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
          <div class="pfc-blind"><span class="pfc-blind-k">盲点</span><p>${esc(a.blind)}</p></div>
          <div class="pfc-mix">${mix}</div>
          <footer class="pfc-foot"><span>iFeng</span><span>生成于 ${mdLabel(state.created || new Date())}</span></footer>
        </div>
      </div>`;
  }

  // 指针移动时轻微倾斜，光泽跟随
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function bindTilt(root) {
    if (reduceMotion) return;
    root.querySelectorAll('[data-tilt]').forEach(card => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = '1';
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        card.classList.add('is-tilting');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        ['--rx', '--ry', '--mx', '--my'].forEach(p => card.style.removeProperty(p));
      });
    });
  }

  /* ---------- 建卡流程（全屏层） ---------- */
  let flow, flowBody, stack = [], ctx = {}, scanTimers = [];
  const clearScan = () => { scanTimers.forEach(clearTimeout); scanTimers = []; };

  function mountFlow() {
    flow = document.createElement('section');
    flow.className = 'pf-flow'; flow.id = 'pfFlow';
    flow.setAttribute('aria-label', '建投资卡片');
    flow.innerHTML = `
      <header class="pf-flow-top">
        <button type="button" class="glass-btn pf-flow-back" aria-label="返回">${ic('back')}</button>
        <div class="pf-flow-progress"></div>
        <button type="button" class="glass-btn pf-flow-close" aria-label="关闭">${ic('close')}</button>
      </header>
      <div class="pf-flow-body"></div>`;
    $('#app').appendChild(flow);
    flowBody = flow.querySelector('.pf-flow-body');
    flow.querySelector('.pf-flow-back').addEventListener('click', back);
    flow.querySelector('.pf-flow-close').addEventListener('click', () => closeFlow());
  }

  function go(screen, arg, push = true) {
    clearScan();
    if (push && stack.length) stack[stack.length - 1].scroll = flowBody.scrollTop;
    if (push) stack.push({ screen, arg });
    flow.dataset.screen = screen;
    flowBody.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'pf-screen';
    flowBody.appendChild(el);
    flowBody.scrollTop = 0;
    SCREENS[screen](el, arg);
    flow.querySelector('.pf-flow-back').classList.toggle('is-hidden', screen === 'reveal' || screen === 'scan');
    flow.querySelector('.pf-flow-close').classList.toggle('is-hidden', screen === 'reveal' || !!ctx.onboarding);
    const prog = flow.querySelector('.pf-flow-progress');
    prog.innerHTML = ctx.onboarding && screen === 'start'
      ? `<div class="ob-track"><div class="ob-fill" style="width:100%"></div></div><div class="ob-count"><b>02</b> / 02</div>` : '';
  }
  function back() {
    stack.pop();
    // 识别动画只在前进时播放，返回时跳过
    while (stack.length && stack[stack.length - 1].screen === 'scan') stack.pop();
    const prev = stack[stack.length - 1];
    if (!prev) {
      if (ctx.onboarding) { $('#onboarding').classList.remove('hide'); const f = $('#onboarding .ob-fill'); if (f) f.style.width = ''; }
      closeFlow(true); return;
    }
    go(prev.screen, prev.arg, false);
  }
  function openFlow(screen, arg, c = {}) {
    ctx = c; stack = [];
    flow.classList.add('open');
    go(screen, arg);
  }
  function closeFlow(silent) {
    clearScan();
    flow.classList.remove('open');
    stack = [];
    if (!silent && ctx.onClose) ctx.onClose();
  }

  // 两个大选项（沿用引导页样式）
  const choice = (id, icon, title, sub) => `
    <button type="button" class="ob-option pf-choice" data-choice="${id}">
      <span class="ob-ico pf-choice-ico">${ic(icon)}</span>
      <span class="ob-copy"><span class="ob-opt-title">${title}</span><span class="ob-opt-sub" style="display:block">${sub}</span></span>
      ${ic('chev', 'pf-choice-chev')}
    </button>`;

  const SCREENS = {
    start(el) {
      el.innerHTML = `
        <div class="pf-hero">
          <div class="pf-hero-card" aria-hidden="true"><span></span><span></span><span></span></div>
          <h1 class="pf-h1">建一张你的投资卡片</h1>
          <p class="pf-sub">不用开户。Bobby 会记住你持有和关注的股票，之后的分析和简报都围绕它们。</p>
        </div>
        <div class="pf-choices">
          ${choice('import', 'image', '截图导入持仓', '任意券商的持仓页，金额可打码')}
          ${choice('pick', 'star', '挑几只关注', '还没买，或者不想截图')}
        </div>
        <button type="button" class="pf-skip">${ctx.onboarding ? '先跳过' : '以后再说'}</button>`;
      el.addEventListener('click', (e) => {
        const c = e.target.closest('[data-choice]');
        if (c) { go(c.dataset.choice === 'import' ? 'album' : 'pick', 'build'); return; }
        if (e.target.closest('.pf-skip')) closeFlow();
      });
    },

    album(el) {
      el.innerHTML = `
        <h1 class="pf-h2">选一张持仓截图</h1>
        <p class="pf-sub">打开你常用的券商 App，截一张持仓页就行。</p>
        <div class="pf-album">
          <button type="button" class="pf-thumb is-pick" data-thumb="0"><img src="${K.demoImport.img}" alt="演示持仓截图"><span class="pf-thumb-tag">演示截图</span></button>
          <button type="button" class="pf-thumb" data-thumb="1"><span class="pf-thumb-ph ph-a"></span></button>
          <button type="button" class="pf-thumb" data-thumb="2"><span class="pf-thumb-ph ph-b"></span></button>
        </div>
        <ul class="pf-promise">
          <li>${ic('scan')}<span>只读取股票代码和仓位比例</span></li>
          <li>${ic('mask')}<span>金额和盈亏会被自动打码，不会记录</span></li>
          <li>${ic('lock')}<span>识别完成后，截图不会保存</span></li>
        </ul>`;
      el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-thumb]');
        if (!t) return;
        if (t.dataset.thumb !== '0') { toast('演示版请选第一张截图'); return; }
        go('scan');
      });
    },

    scan(el) {
      const m = K.demoImport;
      const box = (r, cls, i) => `<i class="${cls}" style="left:${r[0]}%;top:${r[1]}%;width:${r[2]}%;height:${r[3]}%;--d:${i}"></i>`;
      el.innerHTML = `
        <div class="pf-scan">
          <div class="pf-shot">
            <img src="${m.img}" alt="">
            ${m.mask.map((r, i) => box(r, 'pf-mask', i)).join('')}
            ${m.rows.map((r, i) => box(r, 'pf-row', i)).join('')}
            <span class="pf-beam"></span>
          </div>
          <ol class="pf-scan-steps">
            <li data-s="0">找到持仓列表</li>
            <li data-s="1">给金额和盈亏打码</li>
            <li data-s="2">读取代码和比例</li>
          </ol>
        </div>`;
      const shot = el.querySelector('.pf-shot');
      const stepEl = (i) => el.querySelector(`[data-s="${i}"]`);
      const at = (ms, f) => scanTimers.push(setTimeout(f, ms));
      at(100, () => { shot.classList.add('is-scanning'); stepEl(0).classList.add('active'); });
      at(1000, () => { stepEl(0).classList.replace('active', 'done'); stepEl(1).classList.add('active'); shot.classList.add('is-masking'); });
      at(2100, () => { stepEl(1).classList.replace('active', 'done'); stepEl(2).classList.add('active'); shot.classList.add('is-reading'); });
      at(3300, () => { stepEl(2).classList.replace('active', 'done'); shot.classList.add('is-done'); });
      at(3900, () => { ctx.draft = K.demoImport.holdings.map(x => ({ ...x })); go('confirm'); });
    },

    confirm(el) {
      const draft = ctx.draft || (ctx.draft = K.demoImport.holdings.map(x => ({ ...x })));
      const n = draft.filter(x => !U[x.t].cash).length;
      el.innerHTML = `
        <h1 class="pf-h2">识别到 ${n} 只股票${draft.some(x => U[x.t].cash) ? '和现金' : ''}</h1>
        <p class="pf-sub">比例可以直接改，识别错的可以删掉。</p>
        <div class="pf-rows"></div>
        <div class="pf-total"></div>
        <p class="pf-fine">${ic('lock')}只保存代码和比例，截图和金额不会保存。</p>
        <div class="pf-actions">
          <button type="button" class="pf-btn-ghost" data-act="again">换一张截图</button>
          <button type="button" class="pf-btn" data-act="make">生成我的投资卡片</button>
        </div>`;
      const rows = el.querySelector('.pf-rows');
      const draw = () => {
        rows.innerHTML = draft.map((x, i) => `
          <div class="pf-row-item" data-i="${i}">
            ${avatar(x.t)}
            <div class="pf-row-copy"><b>${nameOf(x.t)}</b><span>${esc(U[x.t].name)}</span></div>
            <div class="pf-row-bar"><i style="width:${Math.min(100, x.w)}%;background:${U[x.t].color}"></i></div>
            <label class="pf-row-w"><input type="text" inputmode="numeric" maxlength="3" value="${x.w}" aria-label="${nameOf(x.t)} 仓位比例">%</label>
            <button type="button" class="pf-row-del" aria-label="删除 ${nameOf(x.t)}">${ic('close')}</button>
          </div>`).join('');
        total();
      };
      const total = () => {
        const sum = draft.reduce((s, x) => s + (+x.w || 0), 0);
        const t = el.querySelector('.pf-total');
        t.textContent = sum === 100 ? '合计 100%' : `合计 ${sum}%，生成时会按比例换算成 100%`;
        t.classList.toggle('warn', sum !== 100);
        el.querySelector('[data-act="make"]').disabled = !draft.some(x => !U[x.t].cash && +x.w > 0);
      };
      rows.addEventListener('input', (e) => {
        const inp = e.target.closest('input');
        if (!inp) return;
        inp.value = inp.value.replace(/\D/g, '').slice(0, 3);
        const i = +inp.closest('[data-i]').dataset.i;
        draft[i].w = +inp.value || 0;
        inp.closest('.pf-row-item').querySelector('.pf-row-bar i').style.width = Math.min(100, draft[i].w) + '%';
        total();
      });
      rows.addEventListener('focusin', (e) => { if (e.target.matches('input')) e.target.select(); });
      rows.addEventListener('click', (e) => {
        const d = e.target.closest('.pf-row-del');
        if (!d) return;
        const item = d.closest('[data-i]');
        item.classList.add('is-leaving');
        setTimeout(() => { draft.splice(+item.dataset.i, 1); draw(); }, 200);
      });
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'again') { ctx.draft = null; stack.length = Math.max(0, stack.findIndex(x => x.screen === 'album')); go('album'); return; }
        state.holdings = normalize(draft);
        state.source = 'import';
        build();
        go('reveal');
      });
      draw();
    },

    pick(el, mode) {
      const sel = new Set(mode === 'add' ? [] : state.watch);
      const owned = new Set(mode === 'add' ? [...state.watch, ...state.holdings.map(h => h.t)] : []);
      el.innerHTML = `
        <h1 class="pf-h2">${mode === 'add' ? '添加关注' : '挑几只你关注的股票'}</h1>
        <p class="pf-sub">${mode === 'add' ? '加进卡片后，相关的新闻会出现在你的简报里。' : '买过的、想买的、常看的都可以。'}</p>
        <div class="pf-grid">${K.pickList.map(t => `
          <button type="button" class="pf-tile${sel.has(t) ? ' sel' : ''}${owned.has(t) ? ' is-owned' : ''}" data-t="${t}" ${owned.has(t) ? 'disabled' : ''} aria-pressed="${sel.has(t)}">
            ${avatar(t)}<b>${t}</b><span>${esc(U[t].name)}</span><i class="pf-tile-check">${ic('check')}</i>
          </button>`).join('')}</div>
        <div class="pf-dock"><button type="button" class="pf-btn" data-act="next" disabled>下一步</button></div>`;
      const btn = el.querySelector('[data-act="next"]');
      const sync = () => {
        btn.disabled = !sel.size;
        btn.textContent = sel.size ? `${mode === 'add' ? '加入卡片' : '下一步'} · 已选 ${sel.size} 只` : (mode === 'add' ? '加入卡片' : '至少选 1 只');
      };
      el.querySelector('.pf-grid').addEventListener('click', (e) => {
        const tile = e.target.closest('[data-t]');
        if (!tile || tile.disabled) return;
        const t = tile.dataset.t;
        sel.has(t) ? sel.delete(t) : sel.add(t);
        tile.classList.toggle('sel', sel.has(t));
        tile.setAttribute('aria-pressed', sel.has(t));
        sync();
      });
      btn.addEventListener('click', () => {
        if (mode === 'add') {
          sel.forEach(t => { if (!state.watch.includes(t)) state.watch.push(t); });
          changed(); closeFlow(true); toast(`已加入关注：${[...sel].join('、')}`); return;
        }
        state.watch = [...sel];
        go('question', 0);
      });
      sync();
    },

    question(el, i) {
      const q = K.questions[i];
      el.innerHTML = `
        <div class="pf-q-count">${i + 1} / ${K.questions.length}</div>
        <h1 class="pf-h2">${esc(q.title)}</h1>
        <p class="pf-sub">${esc(q.sub)}</p>
        <div class="pf-q-options">${q.options.map(([id, t, s]) => `
          <button type="button" class="ob-option${state.prefs[q.id] === id ? ' sel' : ''}" data-opt="${id}">
            <span class="ob-copy"><span class="ob-opt-title">${t}</span><span class="ob-opt-sub" style="display:block">${s}</span></span>
            <span class="ob-radio"></span>
          </button>`).join('')}</div>`;
      el.addEventListener('click', (e) => {
        const o = e.target.closest('[data-opt]');
        if (!o) return;
        el.querySelectorAll('[data-opt]').forEach(x => x.classList.toggle('sel', x === o));
        state.prefs[q.id] = o.dataset.opt;
        setTimeout(() => {
          if (i + 1 < K.questions.length) go('question', i + 1);
          else { if (!state.holdings.length) state.source = 'pick'; build(); go('reveal'); }
        }, 260);
      });
    },

    reveal(el) {
      const a = analyze();
      el.innerHTML = `
        <p class="pf-reveal-k">你的投资卡片</p>
        <div class="pf-reveal-card">${cardHTML({ reveal: true })}</div>
        <p class="pf-reveal-note">称号描述持仓结构，盲点是 Bobby 最想提醒你的事。</p>
        <div class="pf-actions">
          <button type="button" class="pf-btn-ghost" data-act="share">${ic('share')}分享卡片</button>
          <button type="button" class="pf-btn" data-act="go">开始使用</button>
        </div>`;
      bindTilt(el);
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'share') { openShare(); return; }
        closeFlow();
        toast(`「${a.title}」卡片已生成`);
      });
    },
  };

  function build() {
    state.built = true;
    state.created = state.created || new Date();
    changed();
  }

  /* ---------- 分享面板 ---------- */
  let share;
  function mountShare() {
    share = document.createElement('div');
    share.className = 'pf-share'; share.id = 'pfShare';
    share.innerHTML = `
      <div class="pf-share-scrim"></div>
      <div class="pf-share-panel" role="dialog" aria-modal="true" aria-label="分享卡片">
        <div class="pf-share-head"><b>分享卡片</b><button type="button" class="pf-share-x" aria-label="关闭">${ic('close')}</button></div>
        <div class="pf-share-card"></div>
        <p class="pf-share-note">${ic('lock')}分享图只有称号、盲点和仓位比例，不含金额与收益。</p>
        <div class="pf-share-acts">
          <button type="button" data-share="save"><span>${ic('download')}</span>保存图片</button>
          <button type="button" data-share="link"><span>${ic('link')}</span>复制链接</button>
          <button type="button" data-share="chat"><span>${ic('chat')}</span>发给朋友</button>
        </div>
      </div>`;
    $('#app').appendChild(share);
    const close = () => share.classList.remove('open');
    share.querySelector('.pf-share-scrim').addEventListener('click', close);
    share.querySelector('.pf-share-x').addEventListener('click', close);
    share.querySelector('.pf-share-acts').addEventListener('click', (e) => {
      const b = e.target.closest('[data-share]');
      if (!b) return;
      close();
      toast({ save: '演示版：分享图已保存到相册', link: '演示版：链接已复制', chat: '演示版：已打开分享' }[b.dataset.share]);
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
  function openShare() {
    share.querySelector('.pf-share-card').innerHTML = cardHTML({ flat: true });
    share.classList.add('open');
  }

  /* ---------- 卡片页 ---------- */
  let page, pageBody, editing = { hold: false, watch: false }, clearArmed = false;
  function mountPage() {
    page = document.createElement('section');
    page.className = 'pf-page'; page.id = 'pfPage';
    page.setAttribute('aria-label', '我的投资卡片');
    page.innerHTML = `
      <header class="pf-page-top">
        <button type="button" class="glass-btn" data-page="back" aria-label="返回">${ic('back')}</button>
        <div class="pf-page-title">我的投资卡片</div>
        <button type="button" class="glass-btn" data-page="share" aria-label="分享卡片">${ic('share')}</button>
      </header>
      <div class="pf-page-body scroll"></div>`;
    $('#app').appendChild(page);
    pageBody = page.querySelector('.pf-page-body');
    pageBody.addEventListener('scroll', () => page.classList.toggle('is-scrolled', pageBody.scrollTop > 4), { passive: true });
    page.addEventListener('click', onPageClick);
  }

  const section = (title, action, body) => `
    <section class="pf-sec">
      <header class="pf-sec-head"><h2>${title}</h2>${action || ''}</header>
      ${body}
    </section>`;

  function renderPage() {
    if (!page) return;
    page.querySelector('[data-page="share"]').classList.toggle('is-hidden', !state.built);
    if (!state.built) {
      pageBody.innerHTML = `
        <div class="pf-empty">
          <div class="pf-empty-card" aria-hidden="true"><img src="assets/img/logo.png" alt=""></div>
          <h2>还没有投资卡片</h2>
          <p>截一张任意券商的持仓图，或者挑几只关注的股票，30 秒就能建好。</p>
          <div class="pf-choices">
            ${choice('import', 'image', '截图导入持仓', '金额可以打码，截图不保存')}
            ${choice('pick', 'star', '挑几只关注', '还没买，或者不想截图')}
          </div>
        </div>`;
      return;
    }
    const a = analyze();
    const h = state.holdings;
    const holdBody = h.length
      ? `<div class="pf-hold${editing.hold ? ' is-editing' : ''}">${h.map(x => `
          <div class="pf-hold-row">
            ${avatar(x.t)}
            <div class="pf-row-copy"><b>${nameOf(x.t)}</b><span>${esc(U[x.t].name)}</span></div>
            <div class="pf-row-bar"><i style="width:${x.w}%;background:${U[x.t].color}"></i></div>
            <span class="pf-hold-w">${x.w}%</span>
            <button type="button" class="pf-mini-del" data-del-hold="${x.t}" aria-label="删除 ${nameOf(x.t)}">${ic('minus')}</button>
          </div>`).join('')}</div>`
      : `<button type="button" class="pf-inline-cta" data-page="import">${ic('image')}<span><b>还没有持仓</b>截图导入后，Bobby 能看清你的仓位结构</span>${ic('chev')}</button>`;
    const watch = state.watch;
    const watchBody = `<div class="pf-watch${editing.watch ? ' is-editing' : ''}">${watch.map(t => `
        <span class="pf-chip">${avatar(t)}${t}<button type="button" data-del-watch="${t}" aria-label="取消关注 ${t}">${ic('close')}</button></span>`).join('')}
        <button type="button" class="pf-chip pf-chip-add" data-page="add">${ic('plus')}添加</button></div>`;
    const prefs = Object.entries(state.prefs).map(([k, v]) => K.prefLabels[k][v]);
    const log = state.log;
    pageBody.innerHTML = `
      <div class="pf-page-card">${cardHTML()}</div>
      ${section(`持仓${h.length ? `<em>${stocksOf().length} 只股票${a.cash ? ' + 现金' : ''}</em>` : ''}`,
        h.length ? `<div class="pf-sec-acts"><button type="button" data-page="import">更新截图</button><button type="button" data-page="edit-hold">${editing.hold ? '完成' : '编辑'}</button></div>` : '', holdBody)}
      ${section(`关注<em>${watch.length} 只</em>`, watch.length ? `<div class="pf-sec-acts"><button type="button" data-page="edit-watch">${editing.watch ? '完成' : '编辑'}</button></div>` : '', watchBody)}
      ${prefs.length ? section('偏好', '', `<div class="pf-prefs">${prefs.map(p => `<span>${esc(p)}</span>`).join('')}</div><p class="pf-sec-note">来自建卡时的两道情景题，Bobby 用它调整讲解的深浅。</p>`) : ''}
      ${section('最近记下的', '', log.length ? `<ul class="pf-log">${log.map(l => `
          <li class="${l.undone ? 'is-undone' : ''}">
            <span class="pf-log-dot"></span>
            <div><b>${l.undone ? '已撤销' : '加入关注'} ${l.tickers.join('、')}</b><span>${esc(l.from)} · ${esc(l.time)}</span></div>
            ${l.undone ? '' : `<button type="button" data-undo="${l.id}">撤销</button>`}
          </li>`).join('')}</ul>` : `<p class="pf-sec-note">你在对话里问到卡片之外的股票时，Bobby 会把它记到这里，每一条都可以撤销。</p>`)}
      <div class="pf-link">
        <span class="pf-link-ico">${ic('link')}</span>
        <div><b>绑定 RockFlow 账户</b><span>持仓每天自动同步，不用再截图</span></div>
        <button type="button" data-page="bind">绑定</button>
      </div>
      <p class="pf-disclaimer">卡片内容来自你提供的信息，只用于让 Bobby 的回答更贴近你，仅供参考，不构成投资建议。</p>
      <button type="button" class="pf-clear${clearArmed ? ' armed' : ''}" data-page="clear">${clearArmed ? '再点一次，确认清空卡片' : '清空卡片'}</button>`;
    bindTilt(pageBody);
  }

  function onPageClick(e) {
    const c = e.target.closest('[data-choice]');
    if (c) { openFlow(c.dataset.choice === 'import' ? 'album' : 'pick', 'build'); return; }
    const dh = e.target.closest('[data-del-hold]');
    if (dh) {
      state.holdings = normalize(state.holdings.filter(x => x.t !== dh.dataset.delHold));
      if (!stocksOf().length) state.holdings = [];
      changed(); toast(`已删除 ${nameOf(dh.dataset.delHold)}，称号已按新比例更新`); return;
    }
    const dw = e.target.closest('[data-del-watch]');
    if (dw) { state.watch = state.watch.filter(t => t !== dw.dataset.delWatch); changed(); return; }
    const u = e.target.closest('[data-undo]');
    if (u) { undo(u.dataset.undo); return; }
    const b = e.target.closest('[data-page]');
    if (!b) return;
    const act = b.dataset.page;
    if (act !== 'clear' && clearArmed) { clearArmed = false; }
    if (act === 'back') closePage();
    else if (act === 'share') openShare();
    else if (act === 'import') openFlow('album', null, { onClose: renderPage });
    else if (act === 'add') openFlow('pick', 'add');
    else if (act === 'edit-hold') { editing.hold = !editing.hold; renderPage(); }
    else if (act === 'edit-watch') { editing.watch = !editing.watch; renderPage(); }
    else if (act === 'bind') toast('演示版不开放绑定账户');
    else if (act === 'clear') {
      if (!clearArmed) { clearArmed = true; renderPage(); setTimeout(() => { if (clearArmed) { clearArmed = false; renderPage(); } }, 3500); return; }
      clearArmed = false; reset(); toast('卡片已清空');
    }
  }

  function openPage() {
    editing = { hold: false, watch: false }; clearArmed = false;
    renderPage();
    pageBody.scrollTop = 0;
    page.classList.add('open');
    document.activeElement && document.activeElement.blur();
  }
  function closePage() { page.classList.remove('open'); }

  /* ---------- 首页卡片条 ---------- */
  function renderStrip() {
    const el = $('#pfStrip');
    if (!el) return;
    if (!state.built) {
      el.innerHTML = `
        <button type="button" class="pf-strip is-empty" data-strip="build">
          <span class="pf-strip-ico">${ic('card')}</span>
          <span class="pf-strip-copy"><b>建一张投资卡片</b><span>简报就只讲和你有关的股票</span></span>
          <span class="pf-strip-btn">去建卡</span>
        </button>`;
      return;
    }
    const a = analyze();
    const ts = (state.holdings.length ? stocksOf().map(x => x.t) : state.watch).slice(0, 3);
    el.innerHTML = `
      <button type="button" class="pf-strip" data-strip="open">
        <span class="pf-strip-foil"></span>
        <span class="pf-strip-copy"><b>${esc(a.title)}</b><span>${state.day === 1 ? '明早起，简报会围绕这张卡片' : '今天的简报已按你的卡片生成'}</span></span>
        <span class="pf-strip-avs">${ts.map(t => avatar(t)).join('')}</span>
        ${ic('chev', 'pf-strip-chev')}
      </button>`;
  }

  /* ---------- 简报数据 ---------- */
  function briefData() {
    if (!state.built) return D.brief;
    if (state.day >= 2 && stocksOf().some(h => h.t === 'TQQQ')) return K.brief2;
    const names = (state.holdings.length ? stocksOf().map(x => x.t) : state.watch).slice(0, 3).join('、');
    return {
      ...D.brief,
      summary: [S('iFeng，今天最受关注的是 RBC Capital 上调 Datadog 目标价至'), S('320美元', { metric: true }), S(`。你的投资卡片已生成，明早起简报会围绕 ${names}。`)],
    };
  }

  /* ---------- 对话：识别股票、按卡片回答、回答后的附加内容 ---------- */
  const cnNames = { 英伟达: 'NVDA', 特斯拉: 'TSLA', 苹果: 'AAPL', 微软: 'MSFT', 谷歌: 'GOOGL', 亚马逊: 'AMZN', 可口可乐: 'KO', 摩根大通: 'JPM' };
  function detect(text) {
    const out = [];
    Object.keys(U).forEach(t => { if (t !== 'CASH' && new RegExp(`\\b${t}\\b`, 'i').test(text)) out.push(t); });
    Object.entries(cnNames).forEach(([n, t]) => { if (text.includes(n) && !out.includes(t)) out.push(t); });
    return out;
  }

  const holdSummary = () => stocksOf().map(x => `${x.t} ${x.w}%`).join(' · ') || state.watch.join(' · ');
  const topHolding = () => (stocksOf()[0] || {}).t || state.watch[0];
  const beta = (t) => { const u = U[t]; return u.cash ? 0 : u.lev ? 3 : t === 'TSLA' ? 1.5 : u.index ? (u.tech ? 1 : .8) : u.div ? .4 : 1.3; };
  const pfSteps = (mid, end) => steps(['读取你的投资卡片', holdSummary(), '读取卡片'], mid, end || ['按卡片比例估算', '整理结论', '生成回答']);
  let lastTopic = { topic: null, title: '' };

  function checkupAnswer() {
    const a = analyze();
    if (!stocksOf().length) {
      return {
        topic: 'checkup', tickers: [],
        steps: steps(['读取你的投资卡片', `关注 ${state.watch.length} 只 · 暂无持仓`, '读取卡片'], ['整理关注列表的共同点', '整理结论', '生成回答']),
        blocks: [
          { t: 'p', c: [S('你的卡片里还没有持仓，只关注了 '), S(state.watch.join('、'), { b: true }), S('。我先说说这份关注列表本身透露了什么：')] },
          { t: 'ul', items: [
            [S('主题集中：', { b: true }), S(`${state.watch.filter(t => U[t].tech).length} 只属于科技成长方向，它们往往同涨同跌。`)],
            [S('你的偏好：', { b: true }), S(Object.entries(state.prefs).map(([k, v]) => K.prefLabels[k][v]).join('、') || '还没有填写')],
          ] },
          { t: 'p', c: [S('截一张持仓图导入后，我可以算出你的真实仓位结构和最大的风险来源。')] },
          K.pfNote,
        ],
      };
    }
    const rows = state.holdings.map(x => [nameOf(x.t), x.w + '%', U[x.t].cash ? '现金' : U[x.t].lev ? `${U[x.t].lev} 倍杠杆 ETF` : U[x.t].index ? '宽基指数' : U[x.t].div ? '高股息' : '科技成长']);
    const items = [[S('同一个方向：', { b: true }), S(`科技成长合计 ${a.tech}%，它们大多在同一天朝同一个方向走。`)]];
    if (a.lev) items.push([S('杠杆放大：', { b: true }), S(`含杠杆 ETF ${a.lev}%，下跌日它的分量相当于 ${a.lev * 3}% 的普通仓位。`)]);
    items.push([S('缓冲垫：', { b: true }), S(a.cash ? `现金 ${a.cash}%，是组合里唯一不跟着波动的部分。` : '没有现金，波动时没有缓冲。')]);
    return {
      topic: 'checkup', tickers: [],
      steps: pfSteps(['计算集中度、杠杆与现金比例', `科技 ${a.tech}%`, '整理数据']),
      blocks: [
        { t: 'p', c: [S(`按你的投资卡片（${state.source === 'import' ? '截图导入' : '点选'}，${mdLabel(state.created)}）来看：`)] },
        { t: 'table', head: ['持仓', '占比', '类型'], rows },
        { t: 'h2', c: [S('一句话')] },
        { t: 'p', c: [S(`你是「${a.title}」：`), S(a.blind, { b: true })] },
        { t: 'h2', c: [S('三个值得知道的数字')] },
        { t: 'ul', items },
        K.pfNote,
      ],
    };
  }

  function sensitivityAnswer() {
    const lvl = (t) => { const b = beta(t); return b >= 3 ? '最高（三倍放大）' : b >= 1.4 ? '高' : b >= 1 ? '较高' : b > 0 ? '低' : '不受影响'; };
    const list = stocksOf().length ? state.holdings : state.watch.map(t => ({ t, w: null }));
    const rows = [...list].sort((x, y) => beta(y.t) - beta(x.t)).map(x => [nameOf(x.t), x.w == null ? '关注' : x.w + '%', lvl(x.t)]);
    const top = [...list].sort((x, y) => beta(y.t) - beta(x.t))[0];
    return {
      topic: 'pf', tickers: [],
      steps: pfSteps(['把这条消息映射到你的每一格', lastTopic.title ? lastTopic.title.slice(0, 16) + '…' : '最近的市场消息', '整理数据']),
      blocks: [
        { t: 'p', c: [S('按你卡片里的比例，对'), S(lastTopic.title ? `「${lastTopic.title}」` : '这条消息'), S('的敏感度从高到低是：')] },
        { t: 'table', head: ['卡片里的', '占比', '敏感度'], rows },
        { t: 'p', c: [S(`最敏感的是 ${nameOf(top.t)}。`, { b: true }), S(U[top.t].lev ? '它不是对这条消息本身更敏感，而是杠杆把整个板块的波动放大了三倍。' : '它和这条消息处在同一条产业链上，市场情绪会最先传到它身上。')] },
        K.pfNote,
      ],
    };
  }

  function impactAnswer(t) {
    const x = state.holdings.find(h => h.t === t);
    const a = analyze();
    return {
      topic: 'pf', tickers: [t],
      steps: pfSteps([`关联这条消息与 ${t}`, lastTopic.title ? lastTopic.title.slice(0, 16) + '…' : '最近的市场消息', '检索资料']),
      blocks: [
        { t: 'p', c: [S(x ? `按你的卡片，${t} 占 ${x.w}%。` : `${t} 在你的关注列表里，还没有持仓。`, { b: true }), S(`这条消息对 ${t} 更多是情绪和估值层面的影响，不直接改变它的基本面。`)] },
        { t: 'h2', c: [S('对你的组合意味着什么')] },
        { t: 'ul', items: [
          [S('同向波动：', { b: true }), S(`你的卡片里科技成长合计 ${a.tech}%，板块情绪变化会同时作用在这些仓位上。`)],
          ...(a.lev ? [[S('杠杆放大：', { b: true }), S('杠杆 ETF 会把板块当天的涨跌放大三倍。')]] : []),
        ] },
        { t: 'h2', c: [S('接下来可以留意')] },
        { t: 'ol', items: [[S(`${t} 的下一次财报时间与指引`)], [S('同板块公司对这条消息的反应')]] },
        K.pfNote,
      ],
    };
  }

  function crashAnswer() {
    const list = stocksOf().length ? state.holdings : [];
    if (!list.length) return null;
    const rows = list.map(x => { const d = -10 * beta(x.t); return [nameOf(x.t), x.w + '%', d ? `约 ${d.toFixed(0)}%` : '0', d ? (d * x.w / 100).toFixed(1) + '%' : '0']; });
    const total = list.reduce((n, x) => n + -10 * beta(x.t) * x.w / 100, 0);
    rows.push(['合计', '', '', `约 ${total.toFixed(1)}%`]);
    const a = analyze();
    return {
      topic: 'pf-edu', tickers: [],
      steps: pfSteps(['用过去一年的相对波动做情景推演', '纳指 -10% 情景', '整理数据']),
      blocks: [
        { t: 'p', c: [S('用一个情景推演（不是预测）：假设纳指 100 在一段时间内回落 10%，按卡片里每一格过去一年相对纳指的波动幅度估算——')] },
        { t: 'table', head: ['代码', '占比', '估算跌幅', '对组合影响'], rows },
        { t: 'p', c: [S(`纳指跌 10%，你的组合可能跌 ${Math.abs(total).toFixed(0)}% 左右。`, { b: true }), S(`原因不是某一只股票不好，而是卡片里 ${a.tech}% 的仓位会在同一天朝同一个方向走。`)] },
        { t: 'p', c: [S(`这正是「${a.title}」的盲点。要不要调整、怎么调整，取决于你能承受多大的回撤——这一点只有你自己能回答。`)] },
        K.pfNote,
      ],
    };
  }

  // 有卡片时，优先按卡片回答；返回 null 表示交给原有的回答
  function answerFor(q, hint) {
    if (/三倍杠杆|杠杆.*磨损/.test(q)) return D.answers['pf-leverage'];
    if (!state.built) return null;
    if (/扛住|这一跌/.test(q) && state.holdings.some(h => h.t === 'TQQQ')) return D.answers['pf-day2'];
    if (/一起跌|会怎样/.test(q)) return crashAnswer() || checkupAnswer();
    if (/最敏感/.test(q)) return sensitivityAnswer();
    if (/意味着什么/.test(q)) {
      const t = detect(q)[0] || topHolding();
      if (t === 'NVDA' && lastTopic.topic === 'hot-amd' && state.holdings.some(h => h.t === 'NVDA')) return D.answers['pf-amd-nvda'];
      return impactAnswer(t);
    }
    if (hint === 'portfolio' || /持仓|体检|我的组合|调仓|风险比较大/.test(q)) return checkupAnswer();
    return null;
  }

  function followupsFor(answer) {
    const topic = answer.topic || '';
    const F = K.followups;
    const top = topHolding();
    let list;
    if (/^hot-|^tesla$|^market$/.test(topic)) list = state.built ? F.news.built : F.news.plain;
    else if (topic === 'portfolio') list = state.built ? ['帮我按卡片做一次持仓体检', '科技股一起跌时，我的组合会怎样？'] : ['怎么授权我的账户？', '今日市场概览'];
    else if (state.built && F[topic]) list = F[topic];
    else if (state.built) list = ['这对我的 {top} 意味着什么？', '帮我按卡片做一次持仓体检'];
    else list = ['今日市场概览', '本周有哪些重要财报值得关注？'];
    // 已经问过的不再推荐
    const asked = new Set([...document.querySelectorAll('#chatThread .bubble-user')].map(b => b.textContent.trim()));
    return list.map(q => q.replace('{top}', top || '持仓')).filter(q => !asked.has(q));
  }

  // 按卡片生成的回答，开头标一行来源
  const badgeFor = (a) => (state.built && /^(pf|checkup)/.test(a.topic || '')
    ? `<button type="button" class="pf-based" data-cap-open>${ic('card')}<span>基于你的投资卡片 · ${esc(holdSummary())}</span></button>` : '');

  // 回答结束：记入卡片 + 追问建议。数据挂在节点上，卡片状态变化时重绘
  const extras = new WeakMap();
  function afterAnswer(m, question, answer) {
    lastTopic = { topic: answer.topic || null, title: (answer.topic || '').startsWith('hot-') ? (D.hotTrades.find(h => 'hot-' + h.id === answer.topic) || {}).title || '' : lastTopic.title };
    const box = document.createElement('div');
    box.className = 'msg-extras';
    const tickers = [...new Set([...(answer.tickers || []), ...detect(question)])].filter(t => U[t] && !U[t].cash);
    const data = { answer, tickers, entry: null, builtBefore: state.built };
    if (state.built) {
      const fresh = tickers.filter(t => !state.watch.includes(t) && !state.holdings.some(h => h.t === t));
      if (fresh.length) {
        const from = (answer.topic || '').startsWith('hot-') ? '来自热点' : '来自对话';
        data.entry = { id: 'l' + Date.now(), tickers: fresh, from, time: '今天 ' + hm(), undone: false };
        state.log.unshift(data.entry);
        state.watch.push(...fresh);
      }
    }
    extras.set(box, data);
    renderExtras(box);
    m.appendChild(box);
    if (data.entry) changed();
  }

  function renderExtras(box) {
    const d = extras.get(box);
    if (!d) return;
    let html = '';
    if (d.entry) html += capturePill(d.entry);
    else if (!d.builtBefore && state.built) {
      html += `<button type="button" class="pf-nudge is-done" data-cap-open>${ic('check')}<span>卡片已生成，下面的追问会按它来</span>${ic('chev')}</button>`;
    } else if (!state.built && (d.tickers.length || d.answer.topic === 'portfolio')) {
      html += `<button type="button" class="pf-nudge" data-nudge>${ic('card')}<span>${d.tickers.length ? `建投资卡片，Bobby 会记住你关心的 ${d.tickers[0]}` : '不用开户：截一张持仓图建投资卡片'}</span>${ic('chev')}</button>`;
    }
    const fu = followupsFor(d.answer);
    if (fu.length) html += `<div class="fu"><div class="fu-label">接着问</div>${fu.map(q => `<button type="button" class="fu-item" data-fu="${esc(q)}"><span>${esc(q)}</span>${ic('arrow')}</button>`).join('')}</div>`;
    box.innerHTML = html;
  }
  let lastBuilt = false;
  function refreshExtras() {
    const flip = lastBuilt !== state.built;
    lastBuilt = state.built;
    document.querySelectorAll('#chatThread .msg-extras').forEach(box => {
      const d = extras.get(box);
      if (d && (flip || d.entry)) renderExtras(box);
    });
  }

  const capturePill = (l) => `
    <div class="pf-cap${l.undone ? ' is-undone' : ''}" data-log="${l.id}">
      <button type="button" class="pf-cap-main" data-cap-open>
        <span class="pf-cap-ico">${ic('card')}</span>
        <span class="pf-cap-text">${l.undone ? `已撤销，${l.tickers.join('、')} 不会记入卡片` : `已加入你的卡片 · 关注 ${l.tickers.join('、')}`}</span>
      </button>
      ${l.undone ? '' : `<button type="button" class="pf-cap-undo" data-undo="${l.id}">撤销</button>`}
    </div>`;

  function undo(id) {
    const l = state.log.find(x => x.id === id);
    if (!l || l.undone) return;
    l.undone = true;
    state.watch = state.watch.filter(t => !l.tickers.includes(t));
    changed();
    toast(`已撤销，${l.tickers.join('、')} 不会记入卡片`);
  }

  // 对话里的附加内容点击：追问、撤销、进卡片页、去建卡
  function bindThread() {
    $('#chatThread').addEventListener('click', (e) => {
      const f = e.target.closest('[data-fu]');
      if (f) { hooks.ask(f.dataset.fu); return; }
      const u = e.target.closest('.pf-cap [data-undo]');
      if (u) { undo(u.dataset.undo); return; }
      if (e.target.closest('[data-cap-open]')) { openPage(); return; }
      if (e.target.closest('[data-nudge]')) openFlow('start', null, {});
    });
  }

  /* ---------- 演示控制 ---------- */
  function setDay(d) { state.day = d; changed(); }
  function seedDemo() {
    state.holdings = K.demoImport.holdings.map(x => ({ ...x }));
    state.source = 'import';
    state.watch = [];
    build();
  }
  function reset() {
    Object.assign(state, { built: false, source: null, holdings: [], watch: [], prefs: {}, log: [], created: null });
    changed();
  }

  function init(h) {
    hooks = { ...hooks, ...h };
    mountFlow(); mountShare(); mountPage();
    bindThread();
    subs.push(() => { renderStrip(); refreshExtras(); if (page.classList.contains('open')) renderPage(); });
    $('#pfStrip').addEventListener('click', (e) => {
      const b = e.target.closest('[data-strip]');
      if (!b) return;
      if (b.dataset.strip === 'build') openFlow('start', null, {});
      else openPage();
    });
    renderStrip();
  }

  return {
    init, state, subscribe: (f) => subs.push(f), openFlow, openPage, closePage, closeFlow,
    answerFor, afterAnswer, badgeFor, briefData, setDay, seedDemo, reset, analyze,
    isOpen: () => page.classList.contains('open') || flow.classList.contains('open'),
  };
})();
