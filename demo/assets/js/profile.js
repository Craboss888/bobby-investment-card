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
  const abbr = { CASH: '$', AMZN: 'AZ', GOOGL: 'GO' };
  const SECTOR = { NVDA: 'AI 芯片', AMD: 'AI 芯片', TSLA: '电动车', TQQQ: '纳指杠杆', QQQ: '宽基指数', SPY: '宽基指数', AAPL: '科技巨头', MSFT: '科技巨头', GOOGL: '科技巨头', AMZN: '科技巨头', META: '科技巨头', PLTR: '软件', DDOG: '软件', SPCX: '航天', KO: '消费', JPM: '金融' };
  const avatar = (t, cls = '') => `<span class="pf-av ${cls}" style="--c:${U[t].color}">${abbr[t] || t.slice(0, 2)}</span>`;

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
    ['exp', 'dip', 'horizon'].forEach(k => { if (s.prefs[k]) tags.push(K.prefLabels[k][s.prefs[k]]); });
    const p = { ...K.personas[key] };
    if (key === 'scout' && K.scoutBlind[s.prefs.dip]) p.blind = K.scoutBlind[s.prefs.dip];
    const a = { key, ...p, tags: tags.slice(0, 4), tech, lev, cash, stocks: h };
    a.dims = dims(a, s);
    return a;
  }

  // 四个维度：风险偏好、集中度、持有周期、杠杆；n 为 0–5 档，用圆点表示
  function dims(a, s) {
    const h = a.stocks;
    const clamp = (v) => Math.max(1, Math.min(5, Math.round(v)));
    const dip = s.prefs.dip;
    const risk = h.length
      ? clamp(1 + a.tech / 50 + (a.lev ? 1.2 : 0) - a.cash / 40 + ({ add: .5, cut: -.5 }[dip] || 0))
      : clamp({ add: 3.5, hold: 2.6, cut: 1.5 }[dip] || 2.4);
    const top = h.length ? Math.max(...h.map(x => x.w)) : 0;
    const conc = !h.length ? [0, '只看不买'] : a.tech >= 70 || top >= 50 ? [5, '高度集中'] : top >= 30 ? [3, '适中'] : [2, '分散'];
    const hz = s.prefs.horizon ? { short: [2, '几个月'], mid: [3, '一两年'], long: [5, '五年以上'] }[s.prefs.horizon] : a.lev ? [2, '偏短线'] : [4, '偏长线'];
    return [
      { k: '风险偏好', v: ['', '保守', '稳健', '均衡', '进取', '激进'][risk], n: risk },
      { k: '集中度', v: conc[1], n: conc[0] },
      { k: '持有周期', v: hz[1], n: hz[0] },
      { k: '杠杆', v: a.lev ? `${a.lev}%` : '不用', n: a.lev ? Math.min(5, 2 + Math.ceil(a.lev / 10)) : 0 },
    ];
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
          <header class="pfc-head"><img src="assets/img/logo.png" alt=""><span>Bobby 投资卡片</span></header>
          <div class="pfc-name"><h3 class="pfc-title">${title}</h3><div class="pfc-en">${esc(a.en)}</div></div>
          <p class="pfc-desc">${esc(a.desc)}</p>
          <div class="pfc-dims">${a.dims.map(d => `
            <div class="pfc-dim"><span class="pfc-dim-k">${d.k}</span><b>${esc(d.v)}</b><i class="pfc-dots">${[1, 2, 3, 4, 5].map(i => `<em class="${i <= d.n ? 'on' : ''}"></em>`).join('')}</i></div>`).join('')}</div>
          <div class="pfc-blind"><span class="pfc-blind-k">盲点</span><p>${esc(a.blind)}</p></div>
          <div class="pfc-mix">${mix}</div>
          <footer class="pfc-foot"><span>iFeng</span><span>${state.updated ? `更新于 ${mdLabel(state.updated)}` : `生成于 ${mdLabel(state.created || new Date())}`}</span></footer>
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
    flow.querySelector('.pf-flow-back').classList.toggle('is-hidden', screen === 'reveal');
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
          <p class="pf-sub">不用开户。Bobby 记住你的持仓和关注，之后的回答和简报都围绕它们。</p>
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
        const n2 = draft.filter(x => !U[x.t].cash).length;
        el.querySelector('.pf-h2').textContent = n2 ? `识别到 ${n2} 只股票${draft.some(x => U[x.t].cash) ? '和现金' : ''}` : '没有可用的持仓';
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
        if (state.built) state.updated = new Date();
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
        <p class="pf-sub">${mode === 'add' ? '加进卡片后，相关的新闻会出现在你的简报里。' : '想买的、常看的都可以。已经持有的，建议用截图导入。'}</p>
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
        ${ctx.single ? '' : `<div class="pf-q-count">${i + 1} / ${K.questions.length}</div>`}
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
          if (ctx.single) { closeFlow(true); changed(); toast('已更新偏好'); return; }
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
          <p>截一张持仓图，或者挑几只关注的股票。</p>
          <div class="pf-choices">
            ${choice('import', 'image', '截图导入持仓', '金额可以打码，截图不保存')}
            ${choice('pick', 'star', '挑几只关注', '还没买，或者不想截图')}
          </div>
        </div>`;
      return;
    }
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
      : `<button type="button" class="pf-inline-cta" data-page="import">${ic('image')}<b>截图导入持仓</b>${ic('chev')}</button>`;
    const watch = state.watch;
    const watchBody = `<div class="pf-watch${editing.watch ? ' is-editing' : ''}">${watch.map(t => `
        <span class="pf-chip">${avatar(t)}${t}<button type="button" data-del-watch="${t}" aria-label="取消关注 ${t}">${ic('close')}</button></span>`).join('')}
        <button type="button" class="pf-chip pf-chip-add" data-page="add">${ic('plus')}添加</button></div>`;
    const dirs = [...new Set([...stocksOf().map(x => x.t), ...state.watch].map(t => SECTOR[t]).filter(Boolean))].slice(0, 3);
    const prefRows = [
      ['投资经验', prefText('exp'), null],
      ['跌 20% 时', prefText('dip') && K.questions[0].options.find(o => o[0] === state.prefs.dip)[1], 0],
      ['资金期限', prefText('horizon') && K.questions[1].options.find(o => o[0] === state.prefs.horizon)[1], 1],
      ['常看的方向', dirs.join('、'), null],
    ];
    const log = state.log;
    const editBtn = (k, on) => `<button type="button" data-page="edit-${k}">${on ? '完成' : '编辑'}</button>`;
    pageBody.innerHTML = `
      <div class="pf-page-card">${cardHTML()}</div>
      ${section('持仓', h.length ? `<div class="pf-sec-acts"><button type="button" data-page="import">更新截图</button>${editBtn('hold', editing.hold)}</div>` : '', holdBody)}
      ${section('关注', watch.length ? `<div class="pf-sec-acts">${editBtn('watch', editing.watch)}</div>` : '', watchBody)}
      ${section('投资偏好', '', `<div class="pf-pref-list">${prefRows.map(([k, v, q]) => `
          <div class="pf-pref-row"><span>${k}</span>${v ? `<b>${esc(v)}</b>` : q != null ? `<button type="button" data-pref-q="${q}">去回答${ic('chev')}</button>` : '<em>未填写</em>'}</div>`).join('')}</div>`)}
      ${log.length ? section('最近记下的', '', `<ul class="pf-log">${log.map(l => `
          <li class="${l.undone || l.removed ? 'is-undone' : ''}">
            <span class="pf-log-dot"></span>
            <div><b>${l.undone ? '已撤销' : l.removed ? '已移除' : '关注'} ${l.tickers.join('、')}</b><span>${esc(l.from)} · ${l.day === state.day ? '今天' : '昨天'} ${esc(l.hm)}</span></div>
            ${l.undone || l.removed ? '' : `<button type="button" data-undo="${l.id}">撤销</button>`}
          </li>`).join('')}</ul>`) : ''}
      <div class="pf-bind">
        <div class="pf-bind-head">
          <span class="pf-bind-logo"><img src="assets/img/logo.png" alt=""></span>
          <div><b>绑定 RockFlow 账户</b><span>持仓每天自动同步，不用再截图</span></div>
        </div>
        <button type="button" class="pf-bind-btn" data-page="bind">绑定${ic('arrow')}</button>
        <p class="pf-bind-foot">交易服务由 RockFlow 提供</p>
      </div>
      <p class="pf-disclaimer">仅供参考，不构成投资建议</p>
      <button type="button" class="pf-clear${clearArmed ? ' armed' : ''}" data-page="clear">${clearArmed ? '再点一次，确认清空' : '清空卡片'}</button>`;
    bindTilt(pageBody);
  }

  function onPageClick(e) {
    const c = e.target.closest('[data-choice]');
    if (c) { openFlow(c.dataset.choice === 'import' ? 'album' : 'pick', 'build'); return; }
    const dh = e.target.closest('[data-del-hold]');
    if (dh) {
      const before = { holdings: state.holdings.map(x => ({ ...x })), source: state.source, built: state.built };
      const t = dh.dataset.delHold;
      const oldTitle = analyze().title;
      state.holdings = normalize(state.holdings.filter(x => x.t !== t));
      if (!stocksOf().length) { state.holdings = []; state.source = 'pick'; }
      const empty = !state.holdings.length && !state.watch.length;
      if (empty) state.built = false;
      changed();
      const msg = empty ? `已删除 ${nameOf(t)}，卡片已经空了` : analyze().title !== oldTitle ? `已删除 ${nameOf(t)}，称号变成「${analyze().title}」` : `已删除 ${nameOf(t)}`;
      toast(msg, { action: '撤销', onAction: () => { Object.assign(state, before); changed(); toast(`已恢复 ${nameOf(t)}`); } });
      return;
    }
    const dw = e.target.closest('[data-del-watch]');
    if (dw) {
      const t = dw.dataset.delWatch;
      state.watch = state.watch.filter(x => x !== t);
      state.log.forEach(l => { if (!l.undone && l.tickers.includes(t) && !l.tickers.some(x => state.watch.includes(x))) l.removed = true; });
      if (!state.holdings.length && !state.watch.length) { state.built = false; toast('卡片已经空了'); }
      changed(); return;
    }
    const u = e.target.closest('[data-undo]');
    if (u) { undo(u.dataset.undo); return; }
    const pq = e.target.closest('[data-pref-q]');
    if (pq) { openFlow('question', +pq.dataset.prefQ, { single: true }); return; }
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

  /* ---------- 首页「我的投资卡片」区 ---------- */
  function renderStrip() {
    const el = $('#pfStrip');
    if (!el) return;
    if (!state.built) {
      el.innerHTML = `
        <button type="button" class="pf-home-card is-empty" data-strip="build">
          <span class="pf-home-thumb">${ic('plus')}</span>
          <span class="pf-home-copy"><b>建一张投资卡片</b><span>截图或点选，30 秒。之后的回答和简报都围绕你。</span></span>
          <span class="pf-strip-btn">去建卡</span>
        </button>`;
      return;
    }
    const a = analyze();
    const ts = (state.holdings.length ? stocksOf().map(x => x.t) : state.watch).slice(0, 3);
    el.innerHTML = `
      <button type="button" class="pf-home-card" data-strip="open">
        <span class="pf-home-thumb"><img src="assets/img/logo.png" alt=""></span>
        <span class="pf-home-copy">
          <b class="pf-home-title">${esc(a.title)}</b>
          <span class="pf-home-dims">${a.dims.slice(0, 2).map(d => `${d.k} <em>${esc(d.v)}</em>`).join('<i></i>')}</span>
          <span class="pf-home-meta"><span class="pf-strip-avs">${ts.map(t => avatar(t)).join('')}</span>${state.day === 1 ? '明早起，简报按它生成' : '今天的简报已按它生成'}</span>
        </span>
        ${ic('chev', 'pf-strip-chev')}
      </button>`;
  }

  /* ---------- 简报数据 ---------- */
  const N = K.overnight;
  const mv = (t) => (N.moves[t] != null ? N.moves[t] : -1.5);
  const pct = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toFixed(d) + '%';
  const hasHold = () => stocksOf().length > 0;
  const levHold = () => stocksOf().find(x => U[x.t].lev);
  // 第一天对话里记下、还在关注里的股票
  const recalled = () => state.log.filter(l => !l.undone).flatMap(l => l.tickers).filter(t => state.watch.includes(t));
  const contrib = () => state.holdings.map(x => ({ t: x.t, w: x.w, m: U[x.t].cash ? 0 : mv(x.t), c: x.w * (U[x.t].cash ? 0 : mv(x.t)) / 100 }));

  function day2Brief() {
    const r = recalled()[0];
    const recallSeg = r ? [S(`你昨天加入关注的 ${r} 昨晚 ${pct(mv(r))}${K.recallNews[r] ? `，${K.recallNews[r]}` : ''}。`)] : [];
    if (hasHold()) {
      const cs = contrib();
      const total = cs.reduce((n, x) => n + x.c, 0);
      const worst = [...cs].sort((a, b) => a.c - b.c)[0];
      const share = total < 0 ? Math.round(worst.c / total * 100) : 0;
      const lev = levHold();
      return {
        kicker: '按你的卡片', ticker: (lev || worst).t,
        title: lev ? `纳指跌 ${Math.abs(N.ndx)}%，你卡片里的 ${lev.t} 跌了 ${Math.abs(mv(lev.t))}%` : `纳指跌 ${Math.abs(N.ndx)}%，你卡片里跌得最多的是 ${worst.t}`,
        summary: [S('按卡片比例估算，组合约跌 '), S(`${Math.abs(total).toFixed(1)}%`, { metric: true }), S(`，${worst.t} 一格占了${share >= 40 ? '近一半' : ` ${share}%`}。`), ...recallSeg],
        note: '按你在卡片里提供的比例估算，仅供参考，不构成投资建议。',
        prompts: ['昨晚这一跌，落到我的组合上是多少？', lev ? '为什么三倍杠杆在震荡市会磨损？' : '科技股一起跌时，我的组合会怎样？'],
      };
    }
    const w = state.watch.slice(0, 3);
    const wst = [...state.watch].sort((a, b) => mv(a) - mv(b))[0];
    const quiz = { hold: '你说过跌了会拿住——这就是一次小测验。', add: '你说过跌了想加仓——先想想最多加到多少。', cut: '你说过跌了会先离场——这次的幅度到你的线了吗？' }[state.prefs.dip] || '';
    return {
      kicker: '按你的关注', ticker: wst,
      title: `纳指跌 ${Math.abs(N.ndx)}%，你关注的 ${wst} 跌得最多`,
      summary: [S(`${w.map(t => `${t} ${pct(mv(t))}`).join('，')}。`), S(`${wst} 跌得最多：${U[wst].index ? '指数基金跟着大盘走' : U[wst].div ? '防御型股票通常跌得少，这次也不例外' : '高估值的成长股，在指数回落时通常跌得更深'}。`), ...(quiz ? [S(quiz)] : recallSeg)],
      note: '按你的关注列表生成，仅供参考，不构成投资建议。',
      prompts: ['我关注的这几只为什么常一起涨跌？', '截图导入持仓后能多看到什么？'],
    };
  }

  function briefData() {
    if (!state.built) return D.brief;
    if (state.day >= 2) return day2Brief();
    // 建卡当天：去掉「你尚未授权」，其余照旧；「明早起围绕卡片」只在卡片条上说一次
    return { ...D.brief, summary: [S('iFeng，今天最受关注的是 RBC Capital 上调 Datadog 目标价至'), S('320美元', { metric: true }), S('，维持跑赢大盘评级。')] };
  }

  /* ---------- 对话：识别股票、按卡片回答、回答后的附加内容 ---------- */
  const cnNames = { 英伟达: 'NVDA', 特斯拉: 'TSLA', 苹果: 'AAPL', 微软: 'MSFT', 谷歌: 'GOOGL', 亚马逊: 'AMZN', 可口可乐: 'KO', 摩根大通: 'JPM' };
  function detect(text) {
    const out = [];
    Object.keys(U).forEach(t => { if (t !== 'CASH' && new RegExp(`\\b${t}\\b`, 'i').test(text)) out.push(t); });
    Object.entries(cnNames).forEach(([n, t]) => { if (text.includes(n) && !out.includes(t)) out.push(t); });
    return out;
  }

  const inCard = (t) => state.holdings.some(h => h.t === t) || state.watch.includes(t);
  const holdSummary = () => stocksOf().map(x => `${x.t} ${x.w}%`).join(' · ') || `关注 ${state.watch.join(' · ')}`;
  const topHolding = () => (stocksOf()[0] || {}).t || state.watch[0];
  const beta = (t) => { const u = U[t]; return u.cash ? 0 : u.lev ? 3 : t === 'TSLA' ? 1.5 : u.index ? (u.tech ? 1 : .8) : u.div ? .4 : 1.3; };
  const pfSteps = (mid, end) => steps(['读取你的投资卡片', holdSummary(), '读取卡片'], mid, end || (hasHold() ? ['按卡片比例估算', '整理结论', '生成回答'] : ['对照你的关注列表', '整理结论', '生成回答']));
  const note = () => (hasHold() ? K.pfNote : { t: 'callout', c: [S('以上基于你在投资卡片里的关注列表，只描述风险暴露，不构成投资建议。')] });
  const prefText = (k) => (state.prefs[k] ? K.prefLabels[k][state.prefs[k]] : '');
  const newsTitles = { tesla: '特斯拉 9 月出口创新高', market: '今日美股盘面' };
  let lastTopic = { topic: null, title: '' };

  function checkupAnswer(q = '') {
    const a = analyze();
    if (!hasHold()) {
      return {
        topic: 'checkup', tickers: [],
        steps: steps(['读取你的投资卡片', `关注 ${state.watch.length} 只 · 暂无持仓`, '读取卡片'], ['整理关注列表的共同点', '整理结论', '生成回答']),
        blocks: [
          { t: 'p', c: [S('你的卡片里还没有持仓，只关注了 '), S(state.watch.join('、'), { b: true }), S('。先说说这份关注列表本身透露了什么：')] },
          { t: 'ul', items: [
            [S('主题集中：', { b: true }), S(`${state.watch.filter(t => U[t].tech).length} 只属于科技成长方向，它们往往同涨同跌。`)],
            [S('你的偏好：', { b: true }), S(['exp', 'dip', 'horizon'].map(prefText).filter(Boolean).join('、') || '还没有填写')],
          ] },
          { t: 'p', c: [S('截一张持仓图导入后，我可以算出你的真实仓位结构和最大的风险来源。')] },
          note(),
        ],
      };
    }
    const rows = state.holdings.map(x => [nameOf(x.t), x.w + '%', U[x.t].cash ? '现金' : U[x.t].lev ? `${U[x.t].lev} 倍杠杆 ETF` : U[x.t].index ? '宽基指数' : U[x.t].div ? '高股息' : '科技成长']);
    const items = [[S('同一个方向：', { b: true }), S(`科技成长合计 ${a.tech}%，它们大多在同一天朝同一个方向走。`)]];
    if (a.lev) items.push([S('杠杆放大：', { b: true }), S(`含杠杆 ETF ${a.lev}%，下跌日它的分量相当于 ${a.lev * 3}% 的普通仓位。`)]);
    items.push([S('缓冲垫：', { b: true }), S(a.cash ? `现金 ${a.cash}%，是组合里唯一不跟着波动的部分。` : '没有现金，波动时没有缓冲。')]);
    const lead = /RockFlow|rockflow/.test(q) ? '你还没有绑定 RockFlow，我先按你的投资卡片来看' : '按你的投资卡片';
    const blocks = [
      { t: 'p', c: [S(`${lead}（${{ import: '截图导入', chat: '对话录入', pick: '点选' }[state.source] || '点选'}，${mdLabel(state.updated || state.created)}）：`)] },
      { t: 'table', head: ['持仓', '占比', '类型'], rows },
      { t: 'h2', c: [S('一句话')] },
      { t: 'p', c: [S(`你是「${a.title}」：`), S(a.blind, { b: true })] },
      { t: 'h2', c: [S('值得知道的几点')] },
      { t: 'ul', items },
    ];
    if (/调仓|调整|风险/.test(q)) blocks.push({ t: 'p', c: [S('要不要调仓、怎么调，取决于你能承受多大的回撤和这笔钱打算放多久——这两点只有你自己能回答。我能帮你做的，是把每种调整前后的风险暴露算清楚。')] });
    blocks.push(note());
    return { topic: 'checkup', tickers: [], steps: pfSteps(['计算集中度、杠杆与现金比例', `科技 ${a.tech}%`, '整理数据']), blocks };
  }

  // 「谁对这条消息最敏感」：先按和消息的关系排，再按波动幅度排
  function sensitivityAnswer() {
    const rel = K.relevance[lastTopic.topic] || {};
    const relOf = (t) => rel[t] || (U[t].cash ? [0, '不受影响'] : U[t].tech ? [1, '科技股整体情绪联动'] : [0.5, '关联较弱']);
    const list = [
      ...stocksOf().map(x => ({ t: x.t, w: x.w + '%' })),
      ...state.watch.filter(t => !state.holdings.some(h => h.t === t)).map(t => ({ t, w: '关注' })),
    ];
    const score = (x) => relOf(x.t)[0] * 10 + beta(x.t);
    const sorted = list.sort((a, b) => score(b) - score(a));
    const rows = sorted.map(x => [nameOf(x.t), x.w, relOf(x.t)[1] + (U[x.t].lev ? '，再放大 3 倍' : '')]);
    const top = sorted.find(x => x.w !== '关注') || sorted[0];
    const title = lastTopic.title ? `「${lastTopic.title}」` : '这条消息';
    return {
      topic: 'pf', tickers: [],
      steps: pfSteps(['把这条消息映射到卡片里的每一只', lastTopic.title ? lastTopic.title.slice(0, 16) + '…' : '最近的市场消息', '整理数据']),
      blocks: [
        { t: 'p', c: [S('按你卡片里的持仓和关注，对'), S(title), S('的敏感度从高到低是：')] },
        { t: 'table', head: ['卡片里的', '占比', '和这条消息的关系'], rows },
        { t: 'p', c: [S(`持仓里最敏感的是 ${nameOf(top.t)}。`, { b: true }), S(`${relOf(top.t)[1]}${U[top.t].lev ? '；杠杆会把整个板块当天的波动放大三倍' : ''}。`)] },
        note(),
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
        { t: 'p', c: [S(x ? `按你的卡片，${t} 占 ${x.w}%。` : `${t} 在你的关注里，还没有持仓。`, { b: true }), S(`这条消息对 ${t} 更多是情绪和估值层面的影响，不直接改变它的基本面。`)] },
        { t: 'h2', c: [S(hasHold() ? '对你的组合意味着什么' : '对你的关注列表意味着什么')] },
        { t: 'ul', items: hasHold() ? [
          [S('同向波动：', { b: true }), S(`你的卡片里科技成长合计 ${a.tech}%，板块情绪变化会同时作用在这些仓位上。`)],
          ...(a.lev ? [[S('杠杆放大：', { b: true }), S('杠杆 ETF 会把板块当天的涨跌放大三倍。')]] : []),
        ] : [[S('同涨同跌：', { b: true }), S(`你关注的 ${state.watch.join('、')} 大多处在同一条主线上，这条消息会一起影响它们的情绪。`)]] },
        { t: 'h2', c: [S('接下来可以留意')] },
        { t: 'ol', items: [[S(`${t} 的下一次财报时间与指引`)], [S('同板块公司对这条消息的反应')]] },
        note(),
      ],
    };
  }

  function crashAnswer() {
    if (!hasHold()) return null;
    const list = state.holdings;
    const rows = list.map(x => { const d = -10 * beta(x.t); return [nameOf(x.t), x.w + '%', d ? `约 ${d.toFixed(0)}%` : '0', d ? (d * x.w / 100).toFixed(1) + '%' : '0']; });
    const total = list.reduce((n, x) => n + -10 * beta(x.t) * x.w / 100, 0);
    rows.push(['合计', '', '', `约 ${total.toFixed(1)}%`]);
    const a = analyze();
    return {
      topic: 'pf-crash', tickers: [],
      steps: pfSteps(['用过去一年的相对波动做情景推演', '纳指 -10% 情景', '整理数据']),
      blocks: [
        { t: 'p', c: [S('用一个情景推演（不是预测）：假设纳指 100 在一段时间内回落 10%，按卡片里每一格过去一年相对纳指的波动幅度估算——')] },
        { t: 'table', head: ['代码', '占比', '估算跌幅', '对组合影响'], rows },
        { t: 'p', c: [S(`纳指跌 10%，你的组合可能跌 ${Math.abs(total).toFixed(0)}% 左右。`, { b: true }), S(`原因不是某一只股票不好，而是卡片里 ${a.tech}% 的仓位会在同一天朝同一个方向走。`)] },
        { t: 'p', c: [S(`这正是「${a.title}」的盲点。要不要调整、怎么调整，取决于你能承受多大的回撤——这一点只有你自己能回答。`)] },
        note(),
      ],
    };
  }

  // 第二天：昨夜行情按卡片比例折算
  function overnightAnswer() {
    const cs = contrib();
    const total = cs.reduce((n, x) => n + x.c, 0);
    const worst = [...cs].sort((a, b) => a.c - b.c)[0];
    const share = total < 0 ? Math.round(worst.c / total * 100) : 0;
    const lev = levHold();
    const rows = cs.map(x => [nameOf(x.t), x.w + '%', U[x.t].cash ? '0' : pct(x.m), x.c ? pct(x.c, 2) : '0']);
    rows.push(['合计', '100%', '—', pct(total, 2)]);
    const items = [[S(`${worst.t} 一格贡献了 ${share}% 的跌幅。`, { b: true }), S(lev && worst.t === lev.t ? `它只占 ${lev.w}%，但三倍杠杆让它在下跌日的分量相当于 ${lev.w * 3}% 的纳指仓位。` : '它是你卡片里比例和波动乘起来最大的一格。')]];
    items.push([S(`${cs.filter(x => x.m < 0).length} 格同向下跌。`, { b: true }), S(state.holdings.some(x => U[x.t].cash) ? '现金是唯一没受影响的部分。' : '卡片里没有现金，没有缓冲。')]);
    if (lev) items.push([S('单日波动本身不罕见。', { b: true }), S('更值得留意的是：纳指如果连续震荡，杠杆 ETF 会出现「指数回到原点、它却没回来」的磨损。')]);
    return {
      topic: 'pf-day2', tickers: [],
      steps: pfSteps(['拉取昨夜收盘数据', `纳指 ${N.ndx}%`, '检索资料']),
      blocks: [
        { t: 'p', c: [S('按卡片比例估算，昨晚你的组合约跌 '), S(`${Math.abs(total).toFixed(1)}%`, { b: true }), S(`，同期纳指 100 跌 ${Math.abs(N.ndx)}%。`)] },
        { t: 'table', head: ['代码', '占比', '昨夜涨跌', '按比例折算'], rows },
        { t: 'h2', c: [S('怎么理解')] },
        { t: 'ul', items },
        note(),
      ],
    };
  }

  // 杠杆科普：通用部分 + 只有持有杠杆 ETF 时才有的「放到你的卡片里」
  function leverageAnswer() {
    const lev = state.built && levHold();
    const blocks = [
      { t: 'p', c: [S('三倍杠杆 ETF 每天都把杠杆重新调回 3 倍，所以它跟踪的是'), S('每一天', { b: true }), S('的 3 倍，而不是一段时间的 3 倍。震荡市里，这会让它慢慢落后。')] },
      { t: 'table', head: ['', '指数', '三倍 ETF'], rows: [['起点', '100', '100'], ['第 1 天 +10%', '110', '130'], ['第 2 天 -10%', '99', '91'], ['两天合计', '-1%', '-9%']] },
      { t: 'p', c: [S('指数两天只跌了 1%，三倍 ETF 却跌了 9%，不是 3%。波动越大、来回越多，差距越大。')] },
    ];
    if (lev) {
      blocks.push({ t: 'h2', c: [S('放到你的卡片里')] });
      blocks.push({ t: 'p', c: [S(`你的 ${lev.t} 占 ${lev.w}%。单边上涨时它是放大器；但在来回震荡的行情里，它在悄悄地给组合加成本。这也是你的卡片标签里有「含杠杆」的原因。`)] });
      blocks.push(note());
    } else if (state.built) {
      blocks.push({ t: 'p', c: [S('你的卡片里目前没有杠杆 ETF，这一条暂时和你的持仓无关。')] });
    }
    return { topic: lev ? 'pf-edu' : 'edu', tickers: [], steps: steps(['理解你的问题', '杠杆 ETF 的每日重置', '准备分析'], ['用一个两天的例子演示', '整理结论', '生成回答']), blocks };
  }

  // 只关注、没持仓的用户
  function coMoveAnswer() {
    const w = state.watch;
    const tech = w.filter(t => U[t].tech);
    return {
      topic: 'pf-watch', tickers: [],
      steps: pfSteps(['比较关注列表的行业与驱动因素', `${w.length} 只`, '整理数据']),
      blocks: [
        { t: 'p', c: [S(`你关注的 ${w.length} 只里，`), S(`${tech.length} 只属于科技成长方向`, { b: true }), S('。它们常一起涨跌，主要因为三件事：')] },
        { t: 'ol', items: [[S('同一个估值逻辑：', { b: true }), S('都靠未来增长定价，利率预期一变，一起被重估。')], [S('同一批资金：', { b: true }), S('很多基金按「科技」整体加减仓。')], [S('同一条主线：', { b: true }), S('AI 算力的消息，会同时传到芯片、云和软件公司。')]] },
        { t: 'table', head: ['关注', '类别', '昨夜涨跌'], rows: w.map(t => [t, U[t].lev ? '杠杆 ETF' : U[t].index ? '宽基指数' : U[t].div ? '高股息' : '科技成长', pct(mv(t))]) },
        note(),
      ],
    };
  }
  function importBenefitAnswer() {
    return {
      topic: 'pf-watch', tickers: [],
      steps: steps(['理解你的问题', '读取你的投资卡片', '准备分析'], ['整理导入后的变化', '整理结论', '生成回答']),
      blocks: [
        { t: 'p', c: [S('现在你的卡片只有关注。截一张持仓图导入后，Bobby 能多做三件事：')] },
        { t: 'ol', items: [
          [S('看清仓位结构：', { b: true }), S('哪几只占得最多、是不是押在同一个方向、有没有杠杆。')],
          [S('简报按比例算：', { b: true }), S('不只说关注的股票涨跌，而是说这对你的组合意味着多少。')],
          [S('追问更具体：', { b: true }), S('「这条消息对我意味着什么」会落到你真实持有的那几只上。')],
        ] },
        { t: 'p', c: [S('只读取代码和比例，金额会被自动打码，截图识别后不保存。')] },
      ],
    };
  }

  // AMD 热点 × 我的 NVDA（录屏主线）：数字按卡片现算
  function amdNvdaAnswer() {
    const a = analyze();
    const nv = state.holdings.find(h => h.t === 'NVDA');
    const lev = levHold();
    const expo = Math.round(nv.w + (lev ? lev.w * 3 * 0.09 : 0));
    const amdWatched = state.watch.includes('AMD');
    const items = [[S('同涨同跌更明显：', { b: true }), S(`AMD、英伟达${lev ? `、${lev.t}` : ''} 都在纳指 100 的 AI 主线上，这条消息引起的板块波动，会同时打在你卡片里 ${a.tech}% 的科技仓位上。`)]];
    items.push([S(amdWatched ? 'AMD 只在你的关注里：' : '你没有 AMD：', { b: true }), S(`你的持仓里没有 AMD${amdWatched ? '（它刚进了你的关注）' : ''}。如果市场转向「AI 算力分散化」，你的组合主要通过 NVDA 承受这种变化。`)]);
    if (lev) items.push([S(`${lev.t} 放大波动：`, { b: true }), S(`若纳指因 AI 板块分歧单日波动 2%，${lev.t} 约 6%，折合你的组合约 ${(lev.w * 0.06).toFixed(1)} 个百分点。`)]);
    return {
      topic: 'pf', tickers: ['NVDA', 'AMD'],
      steps: pfSteps(['对比 Helion 与英伟达机架方案', '已读取 8 条来源', '检索资料']),
      blocks: [
        { t: 'p', c: [S('按你的卡片，'), S(`NVDA 占 ${nv.w}%${nv === stocksOf()[0] ? '，是你最大的一格' : ''}`, { b: true }), S(lev ? `；${lev.t} 通过三倍杠杆又间接放大了约 ${Math.round(lev.w * 0.27)}% 的英伟达，你对英伟达的实际暴露大约是 ${expo}%。` : '。')] },
        { t: 'h2', c: [S('判断')] },
        { t: 'p', c: [S('短期看，这是竞争层面的噪音，不改变英伟达的基本盘；但它是「AI 算力不再只有一家」叙事的又一个信号。', { b: true })] },
        { t: 'p', c: [S('Helion 瞄准的是机架级整机方案，正是英伟达 GB 系列的主场。英伟达的订单能见度仍然很高，市场更可能把这条消息理解为「需求够大，容得下第二家」——对 AMD 是加分，对英伟达是估值上限的讨论。')] },
        { t: 'h2', c: [S('对你的组合意味着什么')] },
        { t: 'ul', items },
        { t: 'h2', c: [S('接下来可以留意')] },
        { t: 'ol', items: [[S('英伟达下次财报里数据中心营收的增速')], [S('Helion 首批客户名单与出货时间')], [S('云厂商资本开支指引是否继续上调')]] },
        note(),
      ],
    };
  }

  // 未建卡用户：介绍投资卡片（作为通用追问的答案）
  function cardIntroAnswer() {
    return {
      topic: 'card-intro', tickers: [],
      steps: steps(['理解你的问题', '不开户也能用的个性化', '准备分析'], ['整理做法', '整理结论', '生成回答']),
      blocks: [
        { t: 'p', c: [S('建一张投资卡片就行，不用开户，30 秒：')] },
        { t: 'ol', items: [
          [S('截图导入：', { b: true }), S('任意券商的持仓页截一张图，我只读代码和比例，金额自动打码，截图不保存。')],
          [S('或者挑几只关注：', { b: true }), S('还没买、不想截图，就点选你常看的股票。')],
        ] },
        { t: 'p', c: [S('之后你在对话里问到卡片之外的股票，我会顺手记进关注（每一条都能撤销）；第二天的简报只讲你卡片里的股票。')] },
      ],
    };
  }

  // 已建卡时问「该不该买 / 卖」：不替用户决定，把这只股票放回卡片里看
  function decisionAnswer(t, q) {
    const x = state.holdings.find(h => h.t === t);
    const buy = /买|加仓/.test(q) && !/卖/.test(q);
    const drop = x ? -20 * x.w / 100 : 0;
    const items = [];
    if (x) {
      items.push([S('它在卡片里的分量：', { b: true }), S(`${t} 占 ${x.w}%${U[t].lev ? '，而且是三倍杠杆' : ''}。`)]);
      items.push([S('如果它再跌 20%：', { b: true }), S(`按比例，你的组合约 ${pct(drop)}${U[t].lev ? '；而纳指只要跌 7% 左右，它就可能跌掉 20%' : ''}。`)]);
    } else {
      items.push([S('它还不在你的持仓里：', { b: true }), S(`${t} ${state.watch.includes(t) ? '在你的关注里' : '不在你的卡片里'}。${hasHold() && U[t].tech && analyze().tech >= 50 ? '如果买入，它和你现有的科技仓位大概率同涨同跌。' : ''}`)]);
    }
    if (state.prefs.horizon || state.prefs.dip) items.push([S('你建卡时说过：', { b: true }), S(`${[prefText('dip'), prefText('horizon')].filter(Boolean).join('、')}。拿这句话对照一下现在的想法。`)]);
    return {
      topic: 'pf-decide', tickers: [t],
      steps: pfSteps([`把 ${t} 放回你的卡片里看`, '仓位 · 波动 · 你的偏好', '整理数据']),
      blocks: [
        { t: 'p', c: [S(`要不要${buy ? '买' : '卖'} ${t}，我不替你决定。`, { b: true }), S('我能做的是把它放回你的卡片里，看清楚这个决定会改变什么：')] },
        { t: 'ul', items },
        { t: 'h2', c: [S('决定之前，可以先问自己')] },
        { t: 'ol', items: (buy
          ? ['它和你现有的仓位，是不是同一个赌注？', '打算拿多久？', '买入后最多能接受跌多少？']
          : x ? ['当初买它的理由，现在还成立吗？', '如果明天再跌 10%，我会怎么做？', '卖掉之后，这笔钱打算做什么？']
            : ['它在你的关注里多久了？关注的理由变了吗？', '如果买入，它和你现有的仓位是不是同一个赌注？', '最多能接受跌多少？']).map(x2 => [S(x2)]) },
        note(),
      ],
    };
  }

  // 未建卡时，用户在对话里说出持仓：「我有 TSLA 和 NVDA 各一半」
  let mention = null;
  function parseMention(q) {
    const ts = detect(q);
    if (!ts.length) return null;
    const ws = ts.map(t => { const m = q.match(new RegExp(`${t}[^0-9%]{0,6}(\\d{1,3})\\s*%`, 'i')); return m ? +m[1] : null; });
    const hold = ts.map((t, i) => ({ t, w: ws[i] != null ? ws[i] : 0 }));
    const known = hold.reduce((n, x) => n + x.w, 0);
    const empty = hold.filter(x => !x.w);
    empty.forEach(x => { x.w = Math.max(1, (100 - known) / empty.length); });
    return normalize(hold);
  }
  const MENTION = /我(现在)?(有|持有|买了|拿着)\s*([A-Za-z]{2,5}|英伟达|特斯拉|苹果|微软|谷歌|亚马逊)|(\d{1,3}\s*%|一半|各占|各一半)/;
  const isMention = (q) => /我(现在)?(有|持有|买了|拿着)/.test(q) && MENTION.test(q) && detect(q).length > 0;
  function mentionAnswer(q) {
    mention = parseMention(q);
    if (!mention) return null;
    const techW = mention.filter(x => U[x.t].tech).reduce((n, x) => n + x.w, 0);
    const judge = mention.length === 1
      ? [S('只有一只股票：', { b: true }), S('它的涨跌就是你组合的涨跌，这是最大的风险来源。')]
      : techW >= 70 ? [S(`${mention.filter(x => U[x.t].tech).length} 只都在科技成长方向，`), S('它们大多在同一天朝同一个方向走', { b: true }), S('。这是你组合里最大的风险来源，比任何一只股票本身的好坏都重要。')]
        : [S(`科技成长占 ${techW}%，`), S('分散程度还可以', { b: true }), S('。值得留意的是哪几只其实会同涨同跌。')];
    const ask2 = state.built ? '要不要用这个比例更新你的投资卡片？更新后，简报和之后的回答都会按新比例来。' : '要不要把它们存进投资卡片？存了以后，每天的简报和之后的回答都会按这个比例来，不用每次重说。';
    return {
      topic: 'mention', tickers: [],
      steps: steps(['理解你的问题', mention.map(x => `${x.t} ${x.w}%`).join(' · '), '读取持仓'], ['做一次简版分析', '整理结论', '生成回答']),
      blocks: [
        { t: 'p', c: [S('按你说的，先做一次简版分析：')] },
        { t: 'table', head: ['持仓', '占比', '类型'], rows: mention.map(x => [x.t, x.w + '%', U[x.t].lev ? '杠杆 ETF' : U[x.t].index ? '宽基指数' : U[x.t].div ? '高股息' : '科技成长']) },
        { t: 'p', c: judge },
        { t: 'p', c: [S(ask2)] },
        { t: 'callout', c: [S('以上基于你在对话里提供的持仓比例，只描述风险暴露，不构成投资建议。')] },
      ],
    };
  }

  // 有卡片时，优先按卡片回答；返回 null 表示交给原有的回答
  function answerFor(q, hint) {
    if (/三倍杠杆|杠杆.*磨损/.test(q)) return leverageAnswer();
    if (isMention(q)) return mentionAnswer(q);
    if (/怎么让 Bobby 记住/.test(q)) return cardIntroAnswer();
    if (!state.built) return null;
    if (/一起涨跌/.test(q)) return coMoveAnswer();
    if (/截图导入持仓后/.test(q)) return importBenefitAnswer();
    if (/扛住|这一跌|落到/.test(q) && hasHold()) return overnightAnswer();
    if (/一起跌|会怎样/.test(q)) return crashAnswer() || checkupAnswer(q);
    if (/最敏感/.test(q)) return sensitivityAnswer();
    if (/意味着什么/.test(q)) {
      const t = detect(q)[0] || topHolding();
      if (t === 'NVDA' && lastTopic.topic === 'hot-amd' && state.holdings.some(h => h.t === 'NVDA')) return amdNvdaAnswer();
      return impactAnswer(t);
    }
    const t = detect(q).find(inCard) || (/买|卖|加仓|减仓|止损|该不该/.test(q) && detect(q)[0]);
    if (t && /买|卖|加仓|减仓|止损|该不该|要不要/.test(q)) return decisionAnswer(t, q);
    if (hint === 'portfolio' || /持仓|体检|我的组合|调仓|风险比较大|风险大/.test(q)) return checkupAnswer(q);
    return null;
  }

  // 卡片里每只股票和某条热点的关系
  const relOf = (topic, t) => (K.relevance[topic] || {})[t] || (U[t].cash ? [0, '不受影响'] : U[t].tech ? [1, '科技股整体情绪联动'] : [0.5, '关联较弱']);
  function hotScore(id) {
    if (!state.built) return { score: 0, label: '' };
    const topic = 'hot-' + id;
    const own = [...stocksOf().map(x => x.t), ...state.watch];
    const best = own.map(t => ({ t, r: relOf(topic, t)[0] })).sort((a, b) => b.r - a.r)[0];
    if (!best || best.r < 2) return { score: best ? best.r : 0, label: '' };
    return { score: best.r, label: `和你的 ${best.t} ${best.r >= 3 ? '直接相关' : '相关'}` };
  }

  // 按卡片和经验改写原有回答：热点回答顶部加「和你有关」；新手把交易策略换成对卡片的影响，并附名词小抄
  function adapt(answer) {
    const tp = answer.topic || '';
    let blocks = answer.blocks;
    if (tp.startsWith('hot-') && state.built) {
      const rel = stocksOf().map(x => ({ x, r: relOf(tp, x.t) })).filter(o => o.r[0] >= 2).sort((a, b) => b.r[0] - a.r[0]);
      if (rel.length) blocks = [{ t: 'callout', c: [S('和你有关：', { b: true }), S(rel.map(o => `${o.x.t} 占 ${o.x.w}%，${o.r[1]}`).join('；') + '。')] }, ...blocks];
    }
    if (tp.startsWith('hot-') && state.prefs.exp === 'new') {
      const h = blocks.findIndex(b => b.t === 'h2' && /交易策略/.test(b.c[0].text));
      if (h >= 0) {
        const own = stocksOf();
        const repl = own.length
          ? [{ t: 'h2', c: [S('三、对你意味着什么')] }, { t: 'ul', items: own.map(x => [S(`${x.t}（${x.w}%）：`, { b: true }), S(relOf(tp, x.t)[1] + '。')]) }]
          : [{ t: 'h2', c: [S('三、新手先看什么')] }, { t: 'p', c: [S('先别急着交易。看清这条消息影响的是哪几家公司、市场之前有没有预期，比判断明天涨跌更重要。')] }];
        blocks = [...blocks.slice(0, h), ...repl, { t: 'callout', c: [S('你选了「新手入门」，', { b: true }), S('这里不展示短线交易策略。')] }, ...blocks.slice(h + 2).filter(b => b.t !== 'callout')];
      }
    }
    if (state.prefs.exp === 'new' && /^(hot-|pf|checkup)/.test(tp)) {
      const text = JSON.stringify(blocks);
      const terms = Object.entries(GLOSSARY).filter(([k]) => text.includes(k)).slice(0, 3);
      if (terms.length) blocks = [...blocks, { t: 'glossary', title: '名词小抄', items: terms }];
    }
    return blocks === answer.blocks ? answer : { ...answer, blocks };
  }
  const GLOSSARY = {
    机架级: '把芯片、服务器、网络打包成一整柜一起卖',
    估值: '市场愿意为这家公司的盈利付多少倍的价格',
    资本开支: '公司花在机房、服务器这类长期设备上的钱',
    杠杆: '用借来的钱放大涨跌，三倍杠杆就是涨跌都放大三倍',
    回撤: '从最高点跌下来的幅度',
    情景推演: '假设某种行情发生，算一算会怎样，不是预测',
    暴露: '你的钱有多少会跟着某个因素一起涨跌',
  };

  function followupsFor(answer) {
    const topic = answer.topic || '';
    const hold = hasHold(), lev = !!levHold();
    const crash = '科技股一起跌时，我的组合会怎样？', checkup = '帮我按卡片做一次持仓体检';
    const watchPair = ['我关注的这几只为什么常一起涨跌？', '截图导入持仓后能多看到什么？'];
    let list;
    if (!state.built) list = topic === 'card-intro' ? ['今日市场概览', '本周有哪些重要财报值得关注？'] : ['不用开户，怎么让 Bobby 记住我关心的股票？', '今日市场概览'];
    else if (/^hot-|^tesla$|^market$/.test(topic)) list = [hold ? '这对我的 {top} 意味着什么？' : '这对我关注的 {top} 意味着什么？', hold ? '我的组合里谁对这条消息最敏感？' : watchPair[0]];
    else if (!hold) list = topic === 'pf-watch' ? [...watchPair, '今日市场概览'] : watchPair;
    else if (topic === 'pf') list = [crash, '我的组合里谁对这条消息最敏感？'];
    else if (topic === 'pf-day2') list = [lev ? '为什么三倍杠杆在震荡市会磨损？' : crash, lev ? crash : checkup];
    else if (topic === 'pf-crash' || topic === 'pf-edu') list = [checkup, lev ? '为什么三倍杠杆在震荡市会磨损？' : '今日市场概览'];
    else if (topic === 'checkup' || topic === 'portfolio') list = [topic === 'portfolio' ? checkup : crash, lev ? '为什么三倍杠杆在震荡市会磨损？' : crash];
    else if (topic === 'pf-decide') list = [crash, checkup];
    else if (topic === 'mention') list = [checkup, crash];
    else list = lastTopic.topic ? ['这对我的 {top} 意味着什么？', checkup] : [crash, checkup];
    // {top}：优先用这条回答涉及、且在卡片里的股票
    const tks = answer.tickers || [];
    const top = tks.find(t => state.holdings.some(h => h.t === t)) || (hold ? topHolding() : tks.find(inCard) || topHolding()) || '持仓';
    const asked = new Set([...document.querySelectorAll('#chatThread .bubble-user')].map(b => b.textContent.trim()));
    return [...new Set(list.map(q => q.replace('{top}', top)))].filter(q => !asked.has(q)).slice(0, 2);
  }

  // 按卡片生成的回答，开头标一行来源
  const badgeFor = (a) => (state.built && /^(pf|checkup)/.test(a.topic || '')
    ? `<button type="button" class="pf-based" data-cap-open>${ic('card')}<span>基于你的投资卡片 · ${esc(holdSummary())}</span></button>` : '');

  // 回答结束：记入卡片 + 追问建议。数据挂在节点上，卡片状态变化时重绘
  const extras = new WeakMap();
  let pendingBox = null;
  function afterAnswer(m, question, answer) {
    const tp = answer.topic || '';
    if (tp.startsWith('hot-') || newsTitles[tp]) lastTopic = { topic: tp, title: tp.startsWith('hot-') ? (D.hotTrades.find(h => 'hot-' + h.id === tp) || {}).title || '' : newsTitles[tp] };
    else if (!/^pf/.test(tp)) lastTopic = { topic: null, title: '' };
    const box = document.createElement('div');
    box.className = 'msg-extras';
    const tickers = [...new Set([...(answer.tickers || []), ...(tp === 'mention' ? [] : detect(question))])].filter(t => U[t] && !U[t].cash);
    const data = { answer, tickers, entry: null, builtBefore: state.built, mention: tp === 'mention' ? mention : null };
    data.hadNudge = !state.built && (tickers.length > 0 || tp === 'portfolio' || tp === 'card-intro' || !!data.mention);
    if (state.built) data.entry = capture(tickers, tp.startsWith('hot-') ? '来自热点' : '来自对话');
    extras.set(box, data);
    renderExtras(box);
    m.appendChild(box);
    if (data.entry) changed();
  }

  function capture(tickers, from) {
    const fresh = tickers.filter(t => !inCard(t));
    if (!fresh.length) return null;
    const entry = { id: 'l' + Date.now() + Math.random().toString(36).slice(2, 5), tickers: fresh, from, day: state.day, hm: hm(), undone: false };
    state.log.unshift(entry);
    state.watch.push(...fresh);
    return entry;
  }

  function renderExtras(box) {
    const d = extras.get(box);
    if (!d) return;
    let html = '';
    if (d.entry) html += capturePill(d.entry);
    else if (state.built && !d.builtBefore && box === pendingBox) {
      html += `<button type="button" class="pf-nudge is-done" data-cap-open>${ic('check')}<span>卡片已生成，下面的追问会按它来</span>${ic('chev')}</button>`;
    } else if (state.built && d.mention && !d.saved) {
      html += `<button type="button" class="pf-nudge" data-nudge="save">${ic('card')}<span>用这个比例更新卡片</span>${ic('chev')}</button>`;
    } else if (!state.built && d.hadNudge) {
      const label = d.mention ? `把 ${d.mention.map(x => x.t).join('、')} 存进投资卡片`
        : d.tickers.length ? `建投资卡片，Bobby 会记住你关心的 ${d.tickers[0]}` : '不用开户：截一张持仓图建投资卡片';
      html += `<button type="button" class="pf-nudge" data-nudge="${d.mention ? 'save' : 'build'}">${ic('card')}<span>${esc(label)}</span>${ic('chev')}</button>`;
    }
    const fu = followupsFor(d.answer);
    if (fu.length) html += `<div class="fu"><div class="fu-label">接着问</div>${fu.map(q => `<button type="button" class="fu-item" data-fu="${esc(q)}"><span>${esc(q)}</span>${ic('arrow')}</button>`).join('')}</div>`;
    box.innerHTML = html;
  }

  let lastBuilt = false;
  function refreshExtras() {
    const flip = lastBuilt !== state.built;
    lastBuilt = state.built;
    let added = false;
    // 从提示建卡：把那条回答涉及的股票补记进卡片，兑现「会记住」
    if (flip && state.built && pendingBox) {
      const d = extras.get(pendingBox);
      if (d && d.tickers.length && !d.entry) { d.entry = capture(d.tickers, '来自对话'); added = !!d.entry; }
    }
    document.querySelectorAll('#chatThread .msg-extras').forEach(box => {
      const d = extras.get(box);
      if (d && (flip || d.entry)) renderExtras(box);
    });
    if (flip && !state.built) pendingBox = null;
    if (added) setTimeout(changed);
  }

  const capturePill = (l) => {
    if (!state.built) return `<div class="pf-cap is-undone"><span class="pf-cap-main"><span class="pf-cap-ico">${ic('card')}</span><span class="pf-cap-text">卡片已清空</span></span></div>`;
    const text = l.removed ? `${l.tickers.join('、')} 已从卡片移除` : l.undone ? `已撤销，${l.tickers.join('、')} 不会记入卡片` : `已加入你的卡片 · 关注 ${l.tickers.join('、')}`;
    return `
    <div class="pf-cap${l.undone || l.removed ? ' is-undone' : ''}" data-log="${l.id}">
      <button type="button" class="pf-cap-main" data-cap-open>
        <span class="pf-cap-ico">${ic('card')}</span>
        <span class="pf-cap-text">${text}</span>
      </button>
      ${l.undone || l.removed ? '' : `<button type="button" class="pf-cap-undo" data-undo="${l.id}">撤销</button>`}
    </div>`;
  };

  function undo(id) {
    const l = state.log.find(x => x.id === id);
    if (!l || l.undone || l.removed) return;
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
      const n = e.target.closest('[data-nudge]');
      if (!n) return;
      pendingBox = n.closest('.msg-extras');
      const d = extras.get(pendingBox);
      if (n.dataset.nudge === 'save' && d && d.mention) {
        if (state.built) state.updated = new Date();
        d.saved = true;
        state.holdings = d.mention.map(x => ({ ...x }));
        state.source = 'chat';
        renderExtras(pendingBox);
        ctx = {}; stack = [];
        flow.classList.add('open');
        build();
        go('reveal');
        return;
      }
      openFlow('start', null, {});
    });
  }

  /* ---------- 演示控制 ---------- */
  function setDay(d) { state.day = d; changed(); }
  function setExp(id) { if (id) { state.prefs.exp = id; changed(); } }
  function seedDemo() {
    state.holdings = K.demoImport.holdings.map(x => ({ ...x }));
    state.source = 'import';
    state.watch = [];
    build();
  }
  function reset() {
    const exp = state.prefs.exp;
    Object.assign(state, { built: false, source: null, holdings: [], watch: [], prefs: exp ? { exp } : {}, log: [], created: null, updated: null });
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
    answerFor, afterAnswer, badgeFor, adapt, hotScore, briefData, setDay, setExp, seedDemo, reset, analyze,
    isOpen: () => page.classList.contains('open') || flow.classList.contains('open'),
  };
})();
