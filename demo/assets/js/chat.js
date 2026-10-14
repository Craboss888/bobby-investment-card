/* 对话引擎：消息、思考过程、逐字输出 */
window.BobbyChat = (() => {
  const { $, esc, svg } = window.BobbyUI;
  const thread = () => $('#chatThread');
  const scroller = () => $('#chatScroll');

  let run = null;          // 当前生成任务
  let stickBottom = true;  // 是否跟随到底部
  const listeners = { busy: () => {} };

  /* ---------- 行内片段 ---------- */
  const segLen = (segs) => segs.reduce((n, s) => n + s.text.length, 0);
  function segHTML(segs, limit = Infinity) {
    let out = '', left = limit;
    for (const s of segs) {
      if (left <= 0) break;
      const t = esc(s.text.slice(0, left)); left -= s.text.length;
      if (s.href) out += `<a href="${s.href}" onclick="return false">${t}</a>`;
      else if (s.b) out += `<strong>${t}</strong>`;
      else if (s.sub) out += `<span class="sub">${t}</span>`;
      else out += t;
    }
    return out;
  }

  /* ---------- 把回答拆成可逐步输出的单元 ---------- */
  function plan(blocks) {
    const units = [];
    blocks.forEach(b => {
      if (b.t === 'table') { units.push({ kind: 'table', b }); return; }
      if (b.t === 'hr') { units.push({ kind: 'hr', b }); return; }
      if (b.t === 'ol' || b.t === 'ul') { units.push({ kind: 'list', b }); return; }
      units.push({ kind: 'text', b, len: segLen(b.c) });
    });
    return units;
  }

  function blockEl(b) {
    if (b.t === 'h2') return document.createElement('h2');
    if (b.t === 'h3') return document.createElement('h3');
    const p = document.createElement(b.t === 'callout' ? 'div' : 'p');
    if (b.t === 'lead') p.className = 'lead';
    if (b.t === 'callout') p.className = 'callout';
    return p;
  }

  function tableEl(b, rows = b.rows.length) {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    wrap.innerHTML = `<table><thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.slice(0, rows).map(r => `<tr>${r.map((c, i) => `<td class="${i ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    return wrap;
  }

  function renderStatic(md, blocks) {
    blocks.forEach(b => {
      if (b.t === 'table') { md.appendChild(tableEl(b)); return; }
      if (b.t === 'hr') { md.appendChild(document.createElement('hr')); return; }
      if (b.t === 'ol' || b.t === 'ul') {
        const l = document.createElement(b.t);
        l.innerHTML = b.items.map(it => `<li>${segHTML(it)}</li>`).join('');
        md.appendChild(l); return;
      }
      const el = blockEl(b); el.innerHTML = segHTML(b.c); md.appendChild(el);
    });
  }

  /* ---------- 消息 DOM ---------- */
  function userMsg(text) {
    const m = document.createElement('div');
    m.className = 'msg msg-user';
    m.innerHTML = `<div class="bubble-user">${esc(text)}</div>`;
    thread().appendChild(m);
  }

  function bobbyMsg() {
    const m = document.createElement('div');
    m.className = 'msg msg-bobby';
    m.innerHTML = `
      <div class="think">
        <button type="button" class="think-head">
          <span class="think-logo"><img src="assets/img/logo.png" alt=""></span>
          <span class="think-title">正在思考 1s</span>
          <span class="think-meta">· 准备分析</span>
          <span class="think-chev"></span>
        </button>
        <div class="think-progress"><span class="think-bar"></span></div>
        <div class="think-body"><div><div class="think-steps"></div></div></div>
      </div>
      <div class="md"></div>
      <div class="msg-actions">
        <button type="button" class="msg-action" data-act="up" aria-label="赞">${svg('<path d="M7 11v9H4v-9z"/><path d="M7 11l4-7a2 2 0 0 1 3 1.8L13.4 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7"/>')}</button>
        <button type="button" class="msg-action" data-act="down" aria-label="踩">${svg('<path d="M17 13V4h3v9z"/><path d="M17 13l-4 7a2 2 0 0 1-3-1.8l.6-4.2H5a2 2 0 0 1-2-2.3l1.2-6A2 2 0 0 1 6.2 4H17"/>')}</button>
      </div>`;
    thread().appendChild(m);
    const think = m.querySelector('.think');
    think.querySelector('.think-head').addEventListener('click', () => think.classList.toggle('collapsed'));
    return m;
  }

  function finishThink(m, secs) {
    const think = m.querySelector('.think');
    think.querySelector('.think-bar').style.width = '100%';
    think.querySelectorAll('.think-step').forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
    think.querySelectorAll('.think-pulse').forEach(p => p.remove());
    think.classList.add('done', 'collapsed');
    think.querySelector('.think-title').textContent = `已思考 ${secs}s`;
    const n = think.querySelectorAll('.think-step').length;
    think.querySelector('.think-meta').textContent = n ? `· ${n} 步` : '';
  }

  function addStep(m, step, idx, total) {
    const box = m.querySelector('.think-steps');
    box.querySelectorAll('.think-step').forEach(s => { s.classList.remove('active'); s.classList.add('done'); s.querySelector('.think-pulse')?.remove(); });
    const row = document.createElement('div');
    row.className = 'think-step active';
    row.innerHTML = `<span class="think-dot"></span><span class="think-label">${esc(step.label)}<span class="think-pulse"><i></i><i></i><i></i></span></span><span class="think-live">${esc(step.live)}</span>`;
    box.appendChild(row);
    m.querySelector('.think-meta').textContent = '· ' + step.meta;
    m.querySelector('.think-bar').style.width = Math.round(((idx + 1) / (total + 1)) * 100) + '%';
  }

  /* ---------- 滚动 ---------- */
  function toBottom(smooth) {
    const s = scroller();
    s.scrollTo({ top: s.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }
  function onScroll() {
    const s = scroller();
    const gap = s.scrollHeight - s.scrollTop - s.clientHeight;
    stickBottom = gap < 60;
    $('#scrollDownBtn').classList.toggle('show', gap > 160 && thread().children.length > 0);
  }

  /* ---------- 生成 ---------- */
  function ask(question, answer, opts = {}) {
    stop(true);
    document.querySelector('#viewChat').classList.add('has-messages');
    userMsg(question);
    const m = bobbyMsg();
    if (opts.badge) m.querySelector('.md').insertAdjacentHTML('beforebegin', opts.badge);
    stickBottom = true;
    requestAnimationFrame(() => toBottom(true));

    const md = m.querySelector('.md');
    const units = plan(answer.blocks);
    const t0 = performance.now();
    const r = run = { m, stopped: false, timers: [], raf: 0, onDone: opts.onDone };
    listeners.busy(true);

    // 计时
    const titleEl = m.querySelector('.think-title');
    const tick = setInterval(() => {
      if (m.querySelector('.think').classList.contains('done')) return;
      titleEl.textContent = `正在思考 ${Math.max(1, Math.round((performance.now() - t0) / 1000))}s`;
    }, 250);
    r.timers.push(() => clearInterval(tick));

    // 思考步骤
    const stepGap = 950;
    answer.steps.forEach((st, i) => {
      const id = setTimeout(() => { addStep(m, st, i, answer.steps.length); if (stickBottom) toBottom(); }, 350 + i * stepGap);
      r.timers.push(() => clearTimeout(id));
    });
    const startAt = 350 + answer.steps.length * stepGap + 200;
    const sid = setTimeout(() => {
      finishThink(m, Math.max(1, Math.round((performance.now() - t0) / 1000)));
      stream(r, md, units);
    }, startAt);
    r.timers.push(() => clearTimeout(sid));
    return r;
  }

  function stream(r, md, units) {
    let ui = 0, ci = 0, el = null;
    const caret = document.createElement('span');
    caret.className = 'caret';
    const RATE = 0.11;          // 每毫秒输出字数（约每秒 110 字），不随屏幕刷新率变化
    let pauseUntil = 0, lastT = 0, CPS = 2;

    const step = (now) => {
      if (r.stopped) return;
      CPS = lastT ? Math.max(1, Math.round((now - lastT) * RATE)) : 2;
      lastT = now;
      if (now < pauseUntil) { r.raf = requestAnimationFrame(step); return; }
      const u = units[ui];
      if (!u) { done(r); return; }

      if (u.kind === 'hr') {
        const hr = document.createElement('hr'); hr.className = 'fade-in'; md.appendChild(hr); ui++; pauseUntil = now + 80;
      } else if (u.kind === 'table') {
        // 先按完整内容排好列宽（行先隐藏），再逐行显示，避免边出边跳
        if (!el) {
          el = tableEl(u.b); el.classList.add('fade-in'); md.appendChild(el); ci = 0;
          el.querySelectorAll('tbody tr').forEach(tr => tr.classList.add('pending'));
        }
        const rows = el.querySelectorAll('tbody tr');
        if (ci < rows.length) { rows[ci].classList.remove('pending'); rows[ci].classList.add('shown'); ci++; pauseUntil = now + 110; }
        else { ui++; el = null; ci = 0; }
      } else if (u.kind === 'list') {
        if (!el) { el = document.createElement(u.b.t); md.appendChild(el); u.li = 0; ci = 0; u.cur = null; }
        const item = u.b.items[u.li];
        if (!item) { ui++; el = null; }
        else {
          if (!u.cur) { u.cur = document.createElement('li'); el.appendChild(u.cur); }
          ci = Math.min(segLen(item), ci + CPS);
          u.cur.innerHTML = segHTML(item, ci);
          u.cur.appendChild(caret);
          if (ci >= segLen(item)) { u.li++; ci = 0; u.cur = null; }
        }
      } else {
        if (!el) { el = blockEl(u.b); md.appendChild(el); ci = 0; }
        ci = Math.min(u.len, ci + CPS);
        el.innerHTML = segHTML(u.b.c, ci);
        el.appendChild(caret);
        if (ci >= u.len) { ui++; el = null; ci = 0; pauseUntil = now + 60; }
      }
      if (stickBottom) toBottom();
      r.raf = requestAnimationFrame(step);
    };
    r.caret = caret;
    r.raf = requestAnimationFrame(step);
  }

  function done(r) {
    r.caret?.remove();
    r.m.querySelector('.msg-actions').classList.add('show');
    r.timers.forEach(f => f());
    if (run === r) run = null;
    listeners.busy(false);
    // 回答结束后的附加内容（记入卡片、追问建议）
    if (r.onDone) r.onDone(r.m);
    if (stickBottom) setTimeout(() => toBottom(true), 60);
  }

  function stop(silent) {
    const r = run;
    if (!r) return;
    r.stopped = true;
    cancelAnimationFrame(r.raf);
    r.timers.forEach(f => f());
    r.caret?.remove();
    const think = r.m.querySelector('.think');
    if (!think.classList.contains('done')) finishThink(r.m, Math.max(1, parseInt(think.querySelector('.think-title').textContent.replace(/\D/g, '')) || 1));
    r.m.querySelectorAll('.md tr.pending').forEach(tr => tr.remove());
    if (!silent) {
      const n = document.createElement('div');
      n.className = 'msg-stopped';
      n.textContent = '已停止生成';
      r.m.querySelector('.md').after(n);
      r.m.querySelector('.msg-actions').classList.add('show');
    }
    run = null;
    listeners.busy(false);
  }

  /* ---------- 历史对话（直接展示完整内容） ---------- */
  function showStatic(question, answer) {
    stop(true);
    clear();
    document.querySelector('#viewChat').classList.add('has-messages');
    userMsg(question);
    const m = bobbyMsg();
    answer.steps.forEach((st, i) => addStep(m, st, i, answer.steps.length));
    finishThink(m, 6 + answer.steps.length * 2);
    renderStatic(m.querySelector('.md'), answer.blocks);
    m.querySelector('.msg-actions').classList.add('show');
    thread().querySelectorAll('.msg').forEach(x => x.style.animation = 'none');
    requestAnimationFrame(() => { scroller().scrollTop = 0; onScroll(); });
  }

  function clear() {
    stop(true);
    thread().innerHTML = '';
    document.querySelector('#viewChat').classList.remove('has-messages');
    $('#scrollDownBtn').classList.remove('show');
  }

  function init(opts) {
    Object.assign(listeners, opts);
    scroller().addEventListener('scroll', onScroll, { passive: true });
    $('#scrollDownBtn').addEventListener('click', () => { stickBottom = true; toBottom(true); });
    thread().addEventListener('click', (e) => {
      const a = e.target.closest('.msg-action');
      if (!a) return;
      const act = a.dataset.act;
      const box = a.parentElement;
      const was = a.classList.contains('on');
      box.querySelectorAll('[data-act="up"],[data-act="down"]').forEach(x => x.classList.remove('on'));
      if (!was) { a.classList.add('on'); window.BobbyUI.toast(act === 'up' ? '感谢反馈' : '已收到反馈'); }
    });
  }

  return { init, ask, stop, clear, showStatic, toBottom, isBusy: () => !!run };
})();
