/* PRISCO MedCode Solutions – shared behaviour (no dependencies) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- header: scrolled state + mobile menu ---- */
  var hdr = d.querySelector('.hdr');
  function onScroll() { if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  var burger = d.querySelector('.burger');
  if (burger && hdr) {
    burger.addEventListener('click', function () {
      var open = hdr.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    d.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { hdr.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* ---- hero ledger: one orchestrated verification sequence ---- */
  var ledger = d.querySelector('.ledger');
  if (ledger) {
    var rows = ledger.querySelectorAll('.lrow');
    var timers = [];
    var clear = function () { timers.forEach(clearTimeout); timers = []; };
    var play = function () {
      clear();
      ledger.classList.remove('done');
      rows.forEach(function (r) { r.classList.remove('on', 'ok'); });
      rows.forEach(function (r, i) {
        timers.push(setTimeout(function () { r.classList.add('on'); }, 700 + i * 1300));
        timers.push(setTimeout(function () { r.classList.add('ok'); }, 1300 + i * 1300));
      });
      timers.push(setTimeout(function () { ledger.classList.add('done'); }, 1500 + rows.length * 1300));
    };
    if (reduce) {
      rows.forEach(function (r) { r.classList.add('on', 'ok'); });
      ledger.classList.add('done');
    } else {
      play();
      timers.push(setTimeout(function loop() { play(); setTimeout(loop, 16000); }, 16000));
    }
  }

  /* ---- generic tabs ---- */
  d.querySelectorAll('[data-tabs]').forEach(function (wrap) {
    var tabs = wrap.querySelectorAll('[role="tab"]');
    var panels = wrap.querySelectorAll('[role="tabpanel"]');
    function select(i) {
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach(function (p, k) { p.hidden = k !== i; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { select((i + 1) % tabs.length); tabs[(i + 1) % tabs.length].focus(); }
        if (e.key === 'ArrowLeft') { select((i - 1 + tabs.length) % tabs.length); tabs[(i - 1 + tabs.length) % tabs.length].focus(); }
      });
    });
    select(0);
  });

  /* ---- service index (list + detail panel) ---- */
  d.querySelectorAll('[data-svc]').forEach(function (wrap) {
    var items = wrap.querySelectorAll('.svc-item');
    var panels = wrap.querySelectorAll('.svc-panel');
    function select(i) {
      items.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      panels.forEach(function (p, k) { p.hidden = k !== i; });
    }
    items.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('mouseenter', function () { if (window.matchMedia('(hover:hover)').matches) select(i); });
      t.addEventListener('focus', function () { select(i); });
    });
    select(0);
  });

  /* ---- deck viewer ---- */
  var deck = d.querySelector('[data-deck]');
  if (deck) {
    var slides = deck.querySelectorAll('.slide');
    var idx = 0;
    var count = d.querySelector('.deck-bar .count');
    var prog = d.querySelector('.deck-prog i');
    var show = function (i) {
      idx = Math.max(0, Math.min(slides.length - 1, i));
      slides.forEach(function (s, k) { s.classList.toggle('active', k === idx); });
      if (count) count.textContent = (idx + 1) + ' of ' + slides.length;
      if (prog) prog.style.width = ((idx + 1) / slides.length * 100) + '%';
    };
    show(0);
    var prev = d.querySelector('[data-prev]'), next = d.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { show(idx - 1); });
    if (next) next.addEventListener('click', function () { show(idx + 1); });
    d.addEventListener('keydown', function (e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') show(idx + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') show(idx - 1);
    });
    var tsx = null;
    deck.addEventListener('touchstart', function (e) { tsx = e.touches[0].clientX; }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      if (tsx === null) return;
      var dx = e.changedTouches[0].clientX - tsx;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
      tsx = null;
    });
    var fs = d.querySelector('[data-full]');
    if (fs) fs.addEventListener('click', function () {
      var el = deck.querySelector('.deck-stage');
      if (el.requestFullscreen) el.requestFullscreen();
    });
    var pr = d.querySelector('[data-print]');
    if (pr) pr.addEventListener('click', function () { window.print(); });
  }

  /* ---- insights: filter + in-page reader ---- */
  var insights = d.querySelector('[data-insights]');
  if (insights) {
    var chips = insights.querySelectorAll('.chip');
    var cards = insights.querySelectorAll('.post-grid .pcard');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        var f = c.getAttribute('data-filter');
        cards.forEach(function (card) { card.hidden = !(f === 'all' || card.getAttribute('data-cat') === f); });
      });
    });
    var posts = insights.querySelectorAll('.post');
    var route = function () {
      var id = decodeURIComponent((location.hash || '').replace('#', ''));
      var found = null;
      posts.forEach(function (p) { var on = p.id === id; p.classList.toggle('show', on); if (on) found = p; });
      d.body.classList.toggle('reading', !!found);
      if (found) { window.scrollTo(0, 0); setTimeout(function () { window.scrollTo(0, 0); }, 60); d.title = (found.getAttribute('data-title') || d.title); }
    };
    window.addEventListener('hashchange', route);
    route();
  }

  /* ---- forms: compose an email (no counts, no PHI) ---- */
  d.querySelectorAll('form[data-mailto]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var q = new URLSearchParams(window.__QS||location.search);
    var pre = q.get('interest');
    if (pre) {
      var sel = form.querySelector('select[name="interest"]');
      if (sel) Array.prototype.forEach.call(sel.options, function (o) { if (o.value === pre) sel.value = pre; });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var to = form.getAttribute('data-mailto');
      var subject = form.getAttribute('data-subject') || 'Website enquiry';
      var lines = [];
      new FormData(form).forEach(function (v, k) {
        if (!v) return;
        var lab = form.querySelector('[name="' + k + '"]');
        var name = (lab && lab.getAttribute('data-label')) || k;
        lines.push(name + ': ' + v);
      });
      var sel2 = form.querySelector('select[name="interest"],select[name="course"]');
      if (sel2 && sel2.value) subject += ' – ' + sel2.value;
      var body = lines.join('\n') + '\n\n(Sent from the website enquiry form. No patient information included.)';
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (status) status.textContent = 'Your email app should open with the message ready to send. If it does not, write to ' + to + '.';
      window.location.href = href;
    });
  });

  /* ---- year ---- */
  d.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });
})();

/* ===== PRISCO brand: wordmark fit + interactive 3D revenue-cycle ring ===== */
(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- keep the gold sub-line exactly as wide as "Prisco", whichever font renders ---- */
  function fit() {
    d.querySelectorAll('svg.lk').forEach(function (s) {
      var n = s.querySelector('.n'), t = s.querySelector('.s');
      if (!n || !t || !n.getComputedTextLength) return;
      try { var w = n.getComputedTextLength(); if (w > 60) { t.setAttribute('textLength', w.toFixed(1)); t.setAttribute('lengthAdjust', 'spacing'); } } catch (e) {}
    });
  }
  fit();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(fit);

  /* ---- revenue-cycle ring ---- */
  var NS = 'http://www.w3.org/2000/svg';
  var ICON = [
    'M9 4h6v3H9z M7 5.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1h-1 M12 11v6 M9 14h6',
    'M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5 M8 14h2 M12 14h2 M8 17h2',
    'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z M9 12l2.2 2.2L15.5 10',
    'M7 3h8l4 4v14H7z M15 3v4h4 M10 14.5l2 2 3.5-4.5',
    'M12 4a3.2 3.2 0 1 0 0 6.4A3.2 3.2 0 0 0 12 4z M5 20c0-4 3-6.2 7-6.2s7 2.200 7 6.200',
    'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 7.200v9.600 M14.700 9.400c-.5-.9-1.500-1.400-2.700-1.400-1.500 0-2.600.8-2.600 2 0 2.800 5.400 1.400 5.400 4.100 0 1.200-1.100 2-2.800 2-1.300 0-2.400-.6-2.900-1.500',
    'M8.500 8L4.500 12l4 4 M15.500 8l4 4-4 4 M13.200 6l-2.400 12',
    'M3 6h18v12H3z M3.500 7l8.500 6 8.500-6',
    'M12 4v16 M8 20h8 M4 7h16 M6 7l-3 7h6z M18 7l-3 7h6z',
    'M3 7h18v10H3z M12 9.500a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5z M6.500 10v4 M17.500 10v4',
    'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z M12 8v5 M12 15.600v.4',
    'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8v4.500l3 2',
    'M4 20h16 M7 20v-7 M12 20V6 M17 20v-10'
  ];
  var PH = {
    f: { name: 'Front-end', a: ['#22cfcf', '#0aa5a6'], b: ['#12b9ba', '#08898a'], side: '#055f62', ink: '#fff' },
    m: { name: 'Mid-cycle', a: ['#b3191d', '#86090c'], b: ['#9c1014', '#6f0709'], side: '#420405', ink: '#fff' },
    b: { name: 'Back-end', a: ['#dccaa2', '#bfab82'], b: ['#cdb98f', '#ad9a72'], side: '#8a7a4f', ink: '#3b1220' }
  };

  function el(n, a, p) { var e = d.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

  function build(root) {
    var dataEl = root.querySelector('[data-rcm-data]');
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent), steps = data.steps, N = steps.length;
    var svg = root.querySelector('.rcm-svg'), stage = root.querySelector('.rcm-stage');
    var W = 680, H = 440, cx = 340, cy = 188, RX = 312, RIN = 172, K = 0.5, T = 30, GAP = 1.5;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '';
    var defs = el('defs', {}, svg);
    ['f', 'm', 'b'].forEach(function (p) {
      ['a', 'b'].forEach(function (v) {
        var g = el('linearGradient', { id: 'rg-' + p + v, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        el('stop', { offset: 0, 'stop-color': PH[p][v][0] }, g); el('stop', { offset: 1, 'stop-color': PH[p][v][1] }, g);
      });
    });
    var bl = el('filter', { id: 'rg-blur', x: '-20%', y: '-40%', width: '140%', height: '180%' }, defs);
    el('feGaussianBlur', { stdDeviation: 16 }, bl);
    var fl = el('radialGradient', { id: 'rg-floor' }, defs);
    el('stop', { offset: 0, 'stop-color': '#5b1e2e', 'stop-opacity': .14 }, fl);
    el('stop', { offset: 1, 'stop-color': '#5b1e2e', 'stop-opacity': 0 }, fl);

    /* floor + shadow */
    el('ellipse', { cx: cx, cy: cy + T + 8, rx: RX + 40, ry: RX * K + 34, fill: 'url(#rg-floor)' }, svg);
    el('ellipse', { cx: cx, cy: cy + T + 22, rx: RX - 10, ry: RX * K - 20, fill: 'rgba(27,10,16,.32)', filter: 'url(#rg-blur)' }, svg);

    el('ellipse', { cx: cx, cy: cy + T * .55, rx: RIN + 4, ry: RIN * K + 3, fill: '#fbf7f4' }, svg);
    /* hub: the brand lockup sits in the hole */
    var src = d.querySelector('svg.lk');
    if (src) {
      var lk = src.cloneNode(true); lk.removeAttribute('class'); lk.setAttribute('class', 'lk lk-hub');
      lk.setAttribute('x', cx - 120); lk.setAttribute('y', cy + T * .9 - 34); lk.setAttribute('width', 240); lk.setAttribute('height', 68);
      svg.appendChild(lk);
    }

    var S = 360 / N, segs = [];
    function pt(r, a) { var t = a * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * K * Math.sin(t)]; }
    function f2(n) { return n.toFixed(1); }
    for (var i = 0; i < N; i++) {
      var a0 = -90 + i * S + GAP / 2, a1 = -90 + (i + 1) * S - GAP / 2, am = (a0 + a1) / 2;
      var o0 = pt(RX, a0), o1 = pt(RX, a1), i1 = pt(RIN, a1), i0 = pt(RIN, a0);
      var dd = 'M' + f2(o0[0]) + ' ' + f2(o0[1]) + 'A' + RX + ' ' + (RX * K) + ' 0 0 1 ' + f2(o1[0]) + ' ' + f2(o1[1]) +
        'L' + f2(i1[0]) + ' ' + f2(i1[1]) + 'A' + RIN + ' ' + (RIN * K) + ' 0 0 0 ' + f2(i0[0]) + ' ' + f2(i0[1]) + 'Z';
      var id = 'rs' + i; el('path', { id: id, d: dd }, defs);
      var mid = pt((RX + RIN) / 2, am);
      segs.push({ i: i, id: id, mx: mid[0], my: mid[1], y: mid[1] });
    }
    segs.slice().sort(function (p, q) { return p.y - q.y; }).forEach(function (s) {
      var st = steps[s.i], ph = PH[st.ph], v = s.i % 2 ? 'b' : 'a';
      var g = el('g', { 'class': 'seg', 'data-i': s.i, tabindex: 0, role: 'button', 'aria-label': 'Step ' + (s.i + 1) + ': ' + st.name }, svg);
      g.style.setProperty('--d', (s.i * 55) + 'ms');
      var side = el('g', { 'class': 'side', fill: ph.side }, g);
      for (var k = T; k >= 2; k -= 2) el('use', { href: '#' + s.id, y: k }, side);
      el('use', { 'class': 'top', href: '#' + s.id, fill: 'url(#rg-' + st.ph + v + ')', stroke: 'rgba(255,255,255,.38)', 'stroke-width': 1.2 }, g);
      var ic = el('g', { transform: 'translate(' + f2(s.mx - 12 * 1.05) + ' ' + f2(s.my - 20) + ') scale(1.05)', fill: 'none', stroke: ph.ink, 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'pointer-events': 'none' }, g);
      el('path', { d: ICON[s.i] }, ic);
      var tx = el('text', { x: f2(s.mx), y: f2(s.my + 22), 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: ph.ink, 'font-family': 'Montserrat,Segoe UI,Arial,sans-serif', 'pointer-events': 'none' }, g);
      tx.textContent = (s.i + 1 < 10 ? '0' : '') + (s.i + 1);
      s.g = g;
    });

    /* panel */
    var card = root.querySelector('.rcm-card'), list = root.querySelector('.rcm-list'), cur = -1, timer = null, playing = !reduce, held = false;
    var q = function (s) { return card.querySelector(s); };
    var btns = list ? [].slice.call(list.querySelectorAll('button')) : [];
    function select(i, user) {
      i = (i + N) % N; if (i === cur) return; cur = i;
      var st = steps[i], ph = PH[st.ph];
      segs.forEach(function (s) { s.g.classList.toggle('on', s.i === i); });
      btns.forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      root.setAttribute('data-phase', st.ph);
      q('[data-n]').textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      q('[data-ph]').textContent = ph.name;
      q('[data-name]').textContent = st.name;
      var ul = q('[data-bul]'); ul.innerHTML = ''; st.bul.forEach(function (b) { var li = d.createElement('li'); li.textContent = b; ul.appendChild(li); });
      q('[data-help]').textContent = st.help;
      var tg = q('[data-tag]'); if (tg) { tg.hidden = !st.tag; tg.textContent = st.tag || ''; }
      card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
      if (user) { playing = false; sync(); }
    }
    function sync() { var p = root.querySelector('[data-play]'); if (p) { p.setAttribute('aria-pressed', playing ? 'true' : 'false'); p.textContent = playing ? 'Pause' : 'Play'; } }
    function tick() { if (playing && !held) select(cur + 1); }
    segs.forEach(function (s) {
      s.g.addEventListener('click', function () { select(s.i, true); });
      s.g.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { held = true; select(s.i); } });
      s.g.addEventListener('pointerleave', function () { held = false; });
      s.g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.i, true); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); segs[(s.i + 1) % N].g.focus(); select(s.i + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); segs[(s.i - 1 + N) % N].g.focus(); select(s.i - 1, true); }
      });
    });
    btns.forEach(function (b, k) { b.addEventListener('click', function () { select(k, true); }); });
    var pv = root.querySelector('[data-prev]'), nx = root.querySelector('[data-next]'), pl = root.querySelector('[data-play]');
    if (pv) pv.addEventListener('click', function () { select(cur - 1, true); });
    if (nx) nx.addEventListener('click', function () { select(cur + 1, true); });
    if (pl) pl.addEventListener('click', function () { playing = !playing; sync(); });
    root.querySelectorAll('[data-phase-jump]').forEach(function (b) {
      b.addEventListener('click', function () { var ph = b.getAttribute('data-phase-jump'); for (var k = 0; k < N; k++) if (steps[k].ph === ph) { select(k, true); break; } });
    });

    /* depth: gentle tilt toward the pointer (mouse only) */
    if (!reduce && window.matchMedia('(hover:hover)').matches) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        stage.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg'); stage.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      });
      stage.addEventListener('pointerleave', function () { stage.style.setProperty('--ry', '0deg'); stage.style.setProperty('--rx', '0deg'); });
    }

    select(0); sync();
    /* entrance + autoplay only while on screen */
    var start = function () { root.classList.add('in'); setTimeout(function () { root.classList.add('ready'); }, 1500); };
    if ('IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting && !seen) { seen = true; start(); }
          if (x.isIntersecting) { if (!timer) timer = setInterval(tick, 4200); }
          else if (timer) { clearInterval(timer); timer = null; }
        });
      }, { threshold: .3 }).observe(root);
    } else { start(); timer = setInterval(tick, 4200); }
  }

  d.querySelectorAll('[data-rcm]').forEach(build);
})();

(function(){
  // Mobile navigation
  var menu=document.querySelector('.menu'),links=document.querySelector('nav.links');
  if(menu&&links){
    menu.addEventListener('click',function(){var o=links.classList.toggle('open');menu.setAttribute('aria-expanded',o)});
    links.addEventListener('click',function(e){if(e.target.closest('a'))links.classList.remove('open')});
  }
  document.querySelectorAll('[data-year]').forEach(function(n){n.textContent=new Date().getFullYear()});

  // Copy buttons
  document.querySelectorAll('[data-copy]').forEach(function(b){
    b.addEventListener('click',function(){
      var t=b.getAttribute('data-copy');
      var done=function(){var o=b.textContent;b.textContent='Copied';setTimeout(function(){b.textContent=o},1500)};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){})}
    });
  });

  // Claim lifecycle explorer
  var stages=[
    {t:'Patient access',g:'Front-end',n:'Registration and scheduling',leak:'Wrong demographics, missing insurance details, duplicate patient records.',check:'Registration data matches the insurance card, and the payer and plan are recorded correctly.',svc:'End-to-end RCM'},
    {t:'Eligibility and authorization',g:'Front-end',n:'Coverage and prior auth',leak:'Coverage inactive on the date of service, or a procedure done without the required authorization.',check:'Eligibility confirmed before the visit, with authorization numbers attached to the right encounter.',svc:'End-to-end RCM',hot:true},
    {t:'Charge capture',g:'Mid-cycle',n:'Services to charges',leak:'Services documented but never charged, or charged with the wrong units.',check:'Charges reconciled against the schedule and documentation, so nothing is missed or duplicated.',svc:'End-to-end RCM'},
    {t:'Medical coding',g:'Mid-cycle',n:'ICD-10-CM, CPT, HCPCS',leak:'Codes the record does not support, missing modifiers, E/M levels that do not match documentation.',check:'Each code is built from the chart, then a second reviewer audits it before submission.',svc:'Medical coding, QA audits',hot:true},
    {t:'Claim scrub and submit',g:'Mid-cycle',n:'Edits and clearinghouse',leak:'NCCI edit conflicts, missing fields, rejections at the clearinghouse.',check:'Claims are scrubbed against edits and payer rules, and rejections are corrected the same day.',svc:'End-to-end RCM'},
    {t:'Payments and denials',g:'Back-end',n:'Posting, appeals',leak:'Underpayments posted as paid, denials worked late, the same denial repeating every month.',check:'Payments checked against contract terms. Denials are grouped by cause, appealed, and fed back to the front end.',svc:'Denial management',hot:true},
    {t:'A/R follow-up',g:'Back-end',n:'Aging and resolution',leak:'Older balances without a next action, claims that age past filing limits.',check:'Every open claim has an owner and a next step, worked in order of value and age.',svc:'End-to-end RCM'}
  ];
  var host=document.getElementById('life');
  if(host){
    var panel=document.getElementById('lifepanel');
    stages.forEach(function(s,i){
      var b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',i===3?'true':'false');
      b.innerHTML='<span class="n">Step '+(i+1)+'</span><span class="t">'+s.t+'</span><span class="g">'+s.g+'</span>'+(s.hot?'<span class="leak" title="Common denial source"></span>':'');
      b.addEventListener('click',function(){
        host.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false')});
        b.setAttribute('aria-pressed','true');render(s);
      });
      host.appendChild(b);
    });
    function render(s){
      panel.innerHTML='<h3>'+s.t+' <span class="muted" style="font-weight:400;font-size:1rem">('+s.n+')</span></h3>'+
        '<div class="leakbox"><h4>Where claims leak</h4><p>'+s.leak+'</p></div>'+
        '<div><h4>What we check</h4><p>'+s.check+'</p></div>'+
        '<div><h4>PRISCO service line</h4><p><b>'+s.svc+'</b></p></div>';
    }
    render(stages[3]);
  }

  // Forms: posts to data-endpoint when set; otherwise shows a preview message.
  document.querySelectorAll('form.f').forEach(function(form){
    var status=form.querySelector('.status');
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!form.checkValidity()){form.reportValidity();return}
      var ep=form.getAttribute('data-endpoint');
      var data={};new FormData(form).forEach(function(v,k){data[k]=v});
      if(!ep){var to='info@priscomedcodesolutions.com',lines=[];Object.keys(data).forEach(function(k){if(data[k])lines.push(k.replace(/_/g,' ')+': '+data[k])});var subj=(form.getAttribute('data-subject')||'Website enquiry')+(data.need?' - '+data.need:(data.course?' - '+data.course:''));var body=lines.join('\n')+'\n\n(Sent from the website enquiry form. No patient information included.)';status.className='status ok';status.textContent='Your email app should open with the message ready to send. If it does not, write to '+to+'.';window.location.href='mailto:'+to+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);return}
      status.className='status';status.textContent='Sending...';
      fetch(ep,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data)})
        .then(function(r){if(!r.ok)throw new Error();status.className='status ok';status.textContent='Thank you. We will reply from info@priscomedcodesolutions.com within one business day.';form.reset()})
        .catch(function(){status.className='status err';status.textContent='The message was not sent. Please email info@priscomedcodesolutions.com instead.'});
    });
  });
})();


/* ===== v3 · reading progress, hero sequence, scroll reveal ===== */
(function () {
  'use strict';
  var d = document, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (d.querySelector('[data-deck]')) d.body.classList.add('is-deck');

  /* progress bar */
  if (!reduce) {
    var bar = d.createElement('div'); bar.className = 'sprog'; bar.setAttribute('aria-hidden', 'true'); d.body.appendChild(bar);
    var tick = false;
    var upd = function () {
      tick = false;
      var h = d.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0).toFixed(4) + ')';
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* hero: stagger the first column */
  var heroCol = d.querySelector('.hero .hero-grid > div:first-child, .hero .hero-grid > :first-child');
  if (heroCol && !reduce) {
    heroCol.classList.add('hero-seq');
    [].forEach.call(heroCol.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 6)); });
    d.querySelectorAll('.hero .dcard, .hero .ledger').forEach(function (c, i) { c.style.setProperty('--i', Math.min(i, 6)); });
  }

  /* scroll reveal: below-the-fold groups only; content is visible if this never runs */
  if (reduce || !('IntersectionObserver' in window)) return;
  var sel = '.sec-head, .cols-2 > *, .cols-3 > *, .cols-4 > *, .vstep, .step, .pcard, .sol-row, .dcard, .quote-row > *, .formcard, .faq details, .kpi, .modules > *, .course, .tl > *';
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('rv-in'); io.unobserve(x.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  d.querySelectorAll(sel).forEach(function (el) {
    if (el.closest('.hero, [hidden], .rcm, .svc, [data-insights], .deck-stage, .sc, .pa')) return;
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * .92) return;
    var sibs = [].filter.call(el.parentNode.children, function (s) { return s.tagName === el.tagName; });
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 4) * 60 + 'ms');
    el.classList.add('rv'); io.observe(el);
  });
})();

window.PRISCO_KB={"fab": "Ask Prisco", "title": "Prisco assistant", "sub": "Quick answers about our services, pilot and security.", "placeholder": "e.g. How does the pilot work?", "note": "Answers come from this website and are general. Please do not type patient information. We confirm every detail in writing.", "hello": ["Hello, I can answer common questions about our services, the pilot, pricing and how we protect PHI.", "Pick a topic below or type your own question."], "miss": ["I do not have a good answer to that one. The team can answer it directly, usually within one business day.", "Please do not include patient information in your message."], "missLinks": [["Contact the team", "index.html#contact"], ["Email us", "mailto:info@priscomedcodesolutions.com"]], "start": ["services", "solutions", "pilot", "baa", "pricing", "contact"], "items": [{"id": "services", "title": "What services do you offer?", "chip": "Our services", "keys": ["services", "service lines", "what do you do", "what do you offer", "offer", "provide", "outsourcing", "capabilities", "scope"], "a": ["We offer six services: medical coding (professional and facility), denial management, E/M coding for outpatient and inpatient, emergency department coding, coding quality assurance, and revenue cycle management support.", "You can use one service or several, with clear responsibilities and regular reporting."], "links": [["See the services", "index.html#services"]], "next": ["solutions", "pilot", "quality", "pricing"]}, {"id": "solutions", "title": "Which solution fits my problem?", "chip": "Find my solution", "keys": ["solution", "solutions", "problem", "challenge", "struggling", "issue", "which service", "help with", "what fits"], "a": ["Services are what we do. Solutions are what changes for your team. Tell me your biggest challenge and I will point you to the right service."], "links": [["Browse solutions by challenge", "index.html#solutions"]], "next": ["s_denials", "s_backlog", "s_accuracy", "s_payments", "s_ems", "s_test"]}, {"id": "s_denials", "title": "Our denials keep coming back", "chip": "Repeat denials", "keys": ["denial", "denials", "denied", "appeal", "appeals", "rejected", "repeat denial", "root cause"], "a": ["That is the job of denial management. We group denials by cause and payer, prepare appeals, and send each root cause back to the team that can stop it.", "You receive a repeat-denial report so you can see whether the pattern is breaking."], "links": [["Read the denial prevention guide", "denial-guide.html"], ["Solutions by challenge", "index.html#solutions"]], "next": ["pilot", "scorecard", "contact"]}, {"id": "s_backlog", "title": "We have a coding backlog", "chip": "Coding backlog", "keys": ["backlog", "behind", "queue", "turnaround", "capacity", "staffing", "shortage", "volume", "overflow"], "a": ["We can take a defined coding queue, such as professional or facility charts, E/M or emergency department work, and report turnaround and accuracy together so speed is never bought at the expense of quality."], "links": [["Solutions by challenge", "index.html#solutions"]], "next": ["quality", "pilot", "pricing"]}, {"id": "s_accuracy", "title": "I am not sure how accurate our coding is", "chip": "Check our accuracy", "keys": ["accuracy", "accurate", "audit", "errors", "error rate", "second opinion", "check our coding", "quality review"], "a": ["Coding quality assurance gives you an independent review. We sample charts, classify errors by type and severity, and send clear feedback so patterns are fixed, not just counted."], "links": [["See a sample scorecard", "dashboard.html"], ["Solutions by challenge", "index.html#solutions"]], "next": ["scorecard", "pilot", "quality"]}, {"id": "s_payments", "title": "Claims are rejected or paid slowly", "chip": "Slow payments", "keys": ["slow payment", "paid slowly", "days in a/r", "a/r", "ar days", "first pass", "clean claim", "cash flow", "collections", "rejections"], "a": ["Slow payment usually starts upstream. Revenue cycle management support lets us work agreed functions with you, and we track first-pass acceptance and days in A/R on a scorecard."], "links": [["See a sample scorecard", "dashboard.html"], ["Solutions by challenge", "index.html#solutions"]], "next": ["s_denials", "scorecard", "contact"]}, {"id": "s_ems", "title": "We bill ambulance or EMS claims", "chip": "Ambulance / EMS", "keys": ["ambulance", "ems", "transport", "mileage", "medical necessity"], "a": ["We support ambulance and EMS providers. We review documentation and coding with you, and agree scope and quality criteria during discovery, before any live work begins."], "links": [["Solutions by challenge", "index.html#solutions"]], "next": ["pilot", "contact"]}, {"id": "s_test", "title": "I want to test a vendor first", "chip": "Test before committing", "keys": ["test", "trial", "try", "evaluate", "sample", "commit", "commitment", "small start"], "a": ["That is exactly what the pilot is for. You agree a defined scope, we review an authorized sample, and you receive written findings. No long-term commitment is needed to start."], "links": [["See how the pilot works", "index.html#pilot"]], "next": ["pilot", "baa", "pricing"]}, {"id": "pilot", "title": "How does the pilot work?", "chip": "How the pilot works", "keys": ["pilot", "how does it start", "get started", "start", "onboarding", "how do we begin", "first steps", "process"], "a": ["We start small: discover your specialties and systems, define scope and quality criteria, evaluate an authorized sample or pilot, then report findings and improvement opportunities.", "A typical rhythm is discovery in days 1 to 3, the pilot in days 4 to 10, and integration from week 2. We sign a BAA before any PHI is handled."], "links": [["Pilot and onboarding", "index.html#pilot"]], "next": ["baa", "pricing", "contact"]}, {"id": "baa", "title": "Do you sign a BAA?", "chip": "BAA and PHI", "keys": ["baa", "business associate", "hipaa", "phi", "patient data", "protected health"], "a": ["Yes. We sign a Business Associate Agreement before any PHI is handled, including for a sample batch or pilot. You can send your own BAA or use ours."], "links": [["Read the BAA page", "baa.html"], ["Trust and security", "trust.html"]], "next": ["offshore", "security", "pilot"]}, {"id": "offshore", "title": "You are based in India. Is that allowed?", "chip": "Offshore and India", "keys": ["india", "offshore", "overseas", "outside the us", "coimbatore", "abroad", "allowed"], "a": ["HIPAA applies to a Business Associate directly, wherever it is located, and our BAA binds us to it.", "Some payer contracts and state programs restrict offshore access to PHI, so we review yours with you before any work starts."], "links": [["Trust and security", "trust.html"]], "next": ["baa", "security", "contact"]}, {"id": "security", "title": "How do you protect our data?", "chip": "Security controls", "keys": ["security", "secure", "encryption", "vpn", "access", "login", "mfa", "multi factor", "safeguards", "protect", "breach", "where does our phi stay", "ehr"], "a": ["Coders work inside your systems over a secure connection where possible, with unique logins, role-based access and multi-factor sign-in. Data is encrypted in transit and at rest, activity is logged, and idle sessions log off.", "Printing and removable media are disabled on our work systems. Safeguards are confirmed in each client agreement."], "links": [["Trust and security", "trust.html"]], "next": ["baa", "offshore", "contact"]}, {"id": "quality", "title": "Who does the coding and quality checks?", "chip": "Who codes the charts", "keys": ["who codes", "certified", "cpc", "ccs", "coders", "qualified", "credentials", "quality check", "second review", "independent"], "a": ["CPC and CCS certified coders do the coding. An independent quality reviewer checks the work before submission, and error trends go back to the coders weekly."], "links": [["How we work", "index.html#why"]], "next": ["scorecard", "pilot", "s_accuracy"]}, {"id": "pricing", "title": "What does it cost?", "chip": "Pricing", "keys": ["price", "pricing", "cost", "fees", "how much", "quote", "rates", "charge", "budget", "contract"], "a": ["We do not publish a price list because cost depends on specialty, volume and scope. Pricing is agreed in your contract after the pilot, and we do not ask for a long-term commitment to start.", "Tell us about your project and the team will explain the options."], "links": [["Discuss your project", "index.html#contact"]], "next": ["pilot", "contact"]}, {"id": "timezone", "title": "Will you work in our time zone?", "chip": "Time zones", "keys": ["time zone", "timezone", "hours", "overlap", "est", "pst", "availability", "support hours"], "a": ["We arrange overlap with US working hours for questions and escalations, and agree the schedule with you during onboarding."], "links": [["Discuss your project", "index.html#contact"]], "next": ["pilot", "contact"]}, {"id": "scorecard", "title": "What reporting do I get?", "chip": "Reporting", "keys": ["report", "reporting", "scorecard", "dashboard", "metrics", "kpi", "numbers", "visibility"], "a": ["Every client receives a weekly or monthly scorecard covering first-pass acceptance, coding accuracy, denials by cause and days in A/R. Each finding has an owner and a next step.", "The sample scorecard uses illustrative data, not client results."], "links": [["Open the sample scorecard", "dashboard.html"]], "next": ["pilot", "quality", "contact"]}, {"id": "deck", "title": "Do you have a capability deck?", "chip": "Capability deck", "keys": ["deck", "brochure", "presentation", "pdf", "overview", "download", "slides"], "a": ["Yes. The capability deck is a short walk through who we are, how we work and how the pilot runs. You can share it with your team or save it as a PDF."], "links": [["Open the deck", "deck.html"]], "next": ["pilot", "contact"]}, {"id": "academy", "title": "Do you train coders?", "chip": "Training and careers", "keys": ["train", "training", "academy", "learn", "course", "courses", "career", "careers", "job", "hiring", "join your team"], "a": ["Yes. Prisco Academy is our training arm. It prepares learners for CPC, COC and CCS credentials and supports their careers."], "links": [["Visit Prisco Academy", "https://academy.priscomedcodesolutions.com/"]], "next": ["contact"]}, {"id": "channel", "title": "Can I send patient information here?", "chip": "Is this site secure for PHI?", "keys": ["send patient", "send phi", "secure channel", "email phi", "send charts", "send records", "upload"], "a": ["No. Please do not send patient information through this website, this assistant or ordinary email. PHI is shared only after a BAA is signed and a secure channel is agreed."], "links": [["Trust and security", "trust.html"]], "next": ["baa", "pilot", "contact"]}, {"id": "contact", "title": "How do I contact you?", "chip": "Contact the team", "keys": ["contact", "email", "phone", "call", "talk", "speak", "reach", "address", "office", "book", "discovery call", "meeting", "reply"], "a": ["Use the contact form to request a discovery call, or write to info@priscomedcodesolutions.com. We aim to reply within one business day.", "Our office is in Ganapathy, Coimbatore, Tamil Nadu, India."], "links": [["Open the contact form", "index.html#contact"], ["Email us", "mailto:info@priscomedcodesolutions.com"]], "next": ["pilot", "pricing", "baa"]}, {"id": "hello", "title": "Hello", "keys": ["hello", "hi", "hey", "good morning", "good afternoon", "thanks", "thank you"], "a": ["Hello. What would you like to know about our services, the pilot or how we protect PHI?"], "next": ["services", "pilot", "baa", "pricing"]}]};

/* ===== v3 · FAQ assistant (rule-based, runs entirely in the browser; nothing is sent anywhere) ===== */
(function () {
  'use strict';
  var KB = window.PRISCO_KB, d = document;
  if (!KB || !d.body) return;
  var byId = {}; KB.items.forEach(function (it) { byId[it.id] = it; });

  function h(tag, attrs, kids) {
    var e = d.createElement(tag);
    for (var k in (attrs || {})) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.500l1.500-4.600A8 8 0 1 1 21 12z"/><path d="M8.500 11h7M8.500 14h4"/></svg>';

  var root = h('div', { 'class': 'pa' });
  var fab = h('button', { 'class': 'pa-fab', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'pa-panel' });
  fab.innerHTML = ICON + '<span>' + KB.fab + '</span>';
  var panel = h('section', { 'class': 'pa-panel', id: 'pa-panel', role: 'dialog', 'aria-label': KB.title });
  var close = h('button', { 'class': 'pa-x', type: 'button', 'aria-label': 'Close assistant', text: '×' });
  var head = h('div', { 'class': 'pa-head' }, [h('div', {}, [h('b', { text: KB.title }), h('small', { text: KB.sub })]), close]);
  var log = h('div', { 'class': 'pa-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversation' });
  var chips = h('div', { 'class': 'pa-chips', role: 'group', 'aria-label': 'Suggested questions' });
  var input = h('input', { id: 'pa-q', type: 'text', autocomplete: 'off', maxlength: '200', placeholder: KB.placeholder });
  var form = h('form', { 'class': 'pa-form' }, [
    h('label', { 'for': 'pa-q', text: 'Your question' }),
    h('div', { 'class': 'row' }, [input, h('button', { type: 'submit', text: 'Send question' })])
  ]);
  var note = h('p', { 'class': 'pa-note', text: KB.note });
  [head, log, chips, form, note].forEach(function (n) { panel.appendChild(n); });
  root.appendChild(panel); root.appendChild(fab); d.body.appendChild(root);

  function say(who, paras, links) {
    var m = h('div', { 'class': 'pa-msg ' + who });
    (Array.isArray(paras) ? paras : [paras]).forEach(function (p) { m.appendChild(h('p', { text: p })); });
    if (links && links.length) {
      var l = h('div', { 'class': 'pa-links' });
      links.forEach(function (x) { var a = h('a', { href: x[1], text: x[0] }); if (/^https?:/.test(x[1])) { a.target = '_blank'; a.rel = 'noopener'; } l.appendChild(a); });
      m.appendChild(l);
    }
    log.appendChild(m); log.scrollTop = log.scrollHeight;
  }
  function setChips(ids) {
    chips.innerHTML = '';
    ids.forEach(function (id) {
      var it = byId[id]; if (!it) return;
      var b = h('button', { type: 'button', text: it.chip || it.title });
      b.addEventListener('click', function () { say('me', it.title); answer(it); });
      chips.appendChild(b);
    });
  }
  function answer(it) { say('bot', it.a, it.links); setChips((it.next && it.next.length ? it.next : KB.start).slice(0, 6)); }

  function norm(s) { return ' ' + s.toLowerCase().replace(/[^a-z0-9$\/ ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' '; }
  function find(q) {
    var n = norm(q), best = null, bs = 0;
    KB.items.forEach(function (it) {
      var s = 0;
      (it.keys || []).forEach(function (k) {
        var kk = norm(k);
        if (n.indexOf(kk) > -1) { var w = kk.trim().split(' ').length; s += w * w + 1; }
      });
      if (s > bs) { bs = s; best = it; }
    });
    return bs >= 2 ? best : null;
  }
  function ask(q) {
    q = q.trim(); if (!q) return;
    say('me', q);
    var it = find(q);
    if (it) answer(it);
    else { say('bot', KB.miss, KB.missLinks); setChips(KB.start); }
  }

  var opened = false;
  function open() {
    root.classList.add('open'); fab.setAttribute('aria-expanded', 'true');
    if (!opened) { opened = true; say('bot', KB.hello); setChips(KB.start); }
    setTimeout(function () { input.focus(); }, 60);
  }
  function shut(back) { root.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); if (back) fab.focus(); }
  fab.addEventListener('click', function () { root.classList.contains('open') ? shut(true) : open(); });
  close.addEventListener('click', function () { shut(true); });
  form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; ask(v); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) shut(true); });
  /* anything on the page can open it: <a href="#assistant"> or [data-assistant] */
  d.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-assistant], a[href="#assistant"]');
    if (t) { e.preventDefault(); open(); }
  });
})();

/* prefill the contact form from a solution link */
(function(){var d=document;d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-need]');if(!a)return;var s=d.getElementById('pf-need');if(!s)return;var v=a.getAttribute('data-need');[].forEach.call(s.options,function(o){if(o.text===v)s.value=o.value||o.text;});});})();
