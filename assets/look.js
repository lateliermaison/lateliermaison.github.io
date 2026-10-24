/* L'Atelier Maison : comportement des pages (24/10/2026).
   - pastilles <-> articles (le numéro touché montre l'aperçu de son article, un seul à la fois), flèche flottante « revenir à l'image » ;
   - passage d'un look à l'autre au doigt, façon carrousel : le look voisin apparaît pendant qu'on glisse, sans rechargement ;
   - ouverture hors de l'appli Pinterest (Safari) et des liens Amazon dans l'appli Amazon. */
(function () {
  var UA = navigator.userAgent, IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && 'ontouchend' in document);
  var PINTEREST = /Pinterest/i.test(UA), ANDROID = /Android/i.test(UA);
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cache = {};

  /* ---------- Sortir de l'appli Pinterest ---------- */
  // Ouvrir une adresse hors de l'appli Pinterest : iPhone/iPad -> navigateur du téléphone (Safari), Android -> navigateur par défaut.
  function versNavigateur(url) {
    if (ANDROID) return 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=' + encodeURIComponent(url) + ';end';
    return 'x-safari-' + url;
  }
  function bandeauPinterest() {
    if (!PINTEREST || !(IOS || ANDROID) || document.querySelector('.bandeau-safari')) return;
    var d = document.createElement('div');
    d.className = 'bandeau-safari';
    d.innerHTML = '<span>Acheter sur l\u2019appli Amazon\u00a0?</span>' +
      '<a class="bandeau-safari-btn" href="' + versNavigateur(location.href) + '">Ouvrir dans le navigateur</a>';
    document.body.insertBefore(d, document.body.firstChild);
  }

  /* ---------- Liens Amazon ---------- */
  function liensAmazon(racine) {
    if (!IOS && !ANDROID) return;
    racine.querySelectorAll('a[href*="amazon."]').forEach(function (a) {
      if (a.dataset.pret) return; a.dataset.pret = '1';
      if (IOS) a.removeAttribute('target');  // dans Safari, un lien amazon.fr ouvre l'appli Amazon si elle est installée
      if (!PINTEREST) return;
      // Dans l'appli Pinterest : ouvrir directement la fiche Amazon hors de Pinterest (choix d'AIRKATE, 24/10/2026) ;
      // sur Android, l'appli Amazon s'ouvre si elle est installée, sinon le navigateur.
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        location.href = versNavigateur(a.href);
      });
    });
  }

  function arriveeAmazon(main) {
    var m = /[?&]amazon=(\d+)/.exec(location.search);
    if (!m || PINTEREST) return;
    var li = main.querySelector('#article-' + m[1]);
    if (!li) return;
    li.classList.add('actif');
    var note = document.createElement('p'); note.className = 'note-amazon';
    note.textContent = 'Touche \u00ab Voir sur Amazon \u00bb pour l\u2019ouvrir dans l\u2019appli Amazon.';
    var bas = li.querySelector('.article-bas'); if (bas) bas.appendChild(note);
    setTimeout(function () { li.scrollIntoView({ block: 'center' }); }, 60);
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }

  /* ---------- Flèche flottante ---------- */
  var haut = null, obs = null;
  function fleche(main) {
    var visuel = main.querySelector('.look-visuel');
    if (!haut) {
      haut = document.createElement('button');
      haut.className = 'haut'; haut.type = 'button'; haut.setAttribute('aria-label', 'Revenir à l’image du look'); haut.innerHTML = '&#8593;';
      haut.addEventListener('click', function () { var v = document.querySelector('main .look-visuel'); if (v) v.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); });
      document.body.appendChild(haut);
    }
    haut.classList.remove('visible');
    if (obs) obs.disconnect();
    if (!visuel || !('IntersectionObserver' in window)) return;
    obs = new IntersectionObserver(function (es) { haut.classList.toggle('visible', !es[0].isIntersecting && es[0].boundingClientRect.top < 0); });
    obs.observe(visuel);
  }

  /* ---------- Pastilles ---------- */
  function pastilles(main) {
    main.querySelectorAll('.pastille').forEach(function (b) {
      b.addEventListener('click', function () {
        var li = main.querySelector('#article-' + b.dataset.n);
        main.querySelectorAll('.actif').forEach(function (x) { x.classList.remove('actif'); });
        main.querySelectorAll('.article.ouvert').forEach(function (x) { if (x !== li) x.classList.remove('ouvert'); });
        b.classList.add('actif'); if (!li) return; li.classList.add('actif'); li.classList.add('ouvert');  // aperçu de cet article seulement
        li.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      });
    });
    main.querySelectorAll('.article').forEach(function (li) {
      ['mouseenter', 'focusin'].forEach(function (ev) {
        li.addEventListener(ev, function () {
          var p = main.querySelector('.pastille[data-n="' + li.dataset.n + '"]');
          main.querySelectorAll('.pastille.actif').forEach(function (x) { x.classList.remove('actif'); });
          if (p) p.classList.add('actif');
        });
      });
    });
  }

  /* ---------- Carrousel entre looks ---------- */
  function charger(url) {
    if (!url) return Promise.resolve(null);
    if (!cache[url]) cache[url] = fetch(url).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
      var doc = new DOMParser().parseFromString(t, 'text/html'), m = doc.querySelector('main');
      if (!m) throw 0;
      m.querySelectorAll('img').forEach(function (i) { var x = new Image(); x.src = new URL(i.getAttribute('src'), new URL(url, location.href)).href; });
      return { titre: doc.title, main: m };
    }).catch(function () { delete cache[url]; return null; });
    return cache[url];
  }
  function voisins() { var a = document.querySelector('main .look'); return a ? { g: a.dataset.prec || '', d: a.dataset.suiv || '' } : { g: '', d: '' }; }
  function prechargerVoisins() { var v = voisins(); charger(v.g); charger(v.d); }

  function carrousel() {
    if (!document.querySelector('main .look')) return;
    var x0 = null, y0 = 0, dx = 0, mode = null, W = innerWidth, fantome = null, page = null, enCours = false, hautFantome = 0;
    function bouger(els, v, anim) { els.forEach(function (el) { if (!el) return; el.style.transition = anim ? 'transform .26s cubic-bezier(.2,.7,.2,1)' : 'none'; el.style.transform = v === null ? '' : 'translateX(' + v + 'px)'; }); }
    function actuels() { return [document.querySelector('main .look')]; }
    function creerFantome(sens) {
      var v = voisins(), url = sens < 0 ? v.d : v.g;
      if (!url) return;
      charger(url).then(function (p) {
        if (!p || mode !== 'h' || fantome) return;
        page = { url: url, p: p, sens: sens };
        var look = document.querySelector('main .look'), nouveau = p.main.querySelector('.look');
        if (!look || !nouveau) return;
        hautFantome = Math.max(look.getBoundingClientRect().top, 0);
        fantome = document.createElement('div'); fantome.className = 'fantome';
        fantome.style.top = hautFantome + 'px';
        var w = document.createElement('div'); w.className = 'wrap'; w.appendChild(nouveau.cloneNode(true));
        fantome.appendChild(w);
        document.body.appendChild(fantome);
        bouger([fantome], (sens < 0 ? W : -W) + dx, false);
      });
    }
    document.addEventListener('touchstart', function (ev) {
      if (enCours || ev.touches.length !== 1) { x0 = null; return; }
      x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; dx = 0; mode = null; W = innerWidth;
    }, { passive: true });
    document.addEventListener('touchmove', function (ev) {
      if (x0 === null) return;
      var mx = ev.touches[0].clientX - x0, my = ev.touches[0].clientY - y0;
      if (!mode) { if (Math.abs(mx) < 8 && Math.abs(my) < 8) return; mode = Math.abs(mx) > Math.abs(my) * 1.2 ? 'h' : 'v'; }
      if (mode !== 'h') return;
      var v = voisins(), cible = mx < 0 ? v.d : v.g;
      dx = cible ? mx : mx * .25;
      if (page && Math.sign(dx) !== Math.sign(page.sens) && dx !== 0) { if (fantome) fantome.remove(); fantome = null; page = null; }
      if (cible && !fantome) creerFantome(mx < 0 ? -1 : 1);
      bouger(actuels(), dx, false);
      if (fantome && page) bouger([fantome], (page.sens < 0 ? W : -W) + dx, false);
    }, { passive: true });
    function fin() {
      if (x0 === null) return; x0 = null;
      if (mode !== 'h') return;
      if (fantome && page && Math.abs(dx) > W * .2) {
        enCours = true;
        bouger(actuels(), page.sens < 0 ? -W : W, true);
        bouger([fantome], 0, true);
        var pp = page;
        setTimeout(function () { basculer(pp); }, 270);
      } else if (!fantome && Math.abs(dx) > W * .2 && (dx < 0 ? voisins().d : voisins().g)) {
        location.href = dx < 0 ? voisins().d : voisins().g;  // page voisine pas encore chargée : navigation classique
      } else {
        bouger(actuels(), 0, true);
        if (fantome) { var f = fantome, s = page ? page.sens : -1; bouger([f], s < 0 ? W : -W, true); setTimeout(function () { f.remove(); }, 280); }
        fantome = null; page = null;
        setTimeout(function () { bouger(actuels(), null, false); }, 280);
      }
    }
    function basculer(pp) {
      var ancien = document.querySelector('main'), neuf = pp.p.main.cloneNode(true), y = window.scrollY;
      ancien.parentNode.replaceChild(neuf, ancien);
      document.title = pp.p.titre;
      try { history.pushState({ look: pp.url }, '', pp.url); } catch (e) {}
      var nl = neuf.querySelector('.look');
      // même position à l'écran que la page qui vient d'arriver en glissant : rien ne saute
      if (hautFantome > 0 || !nl) window.scrollTo(0, y);
      else window.scrollTo(0, nl.getBoundingClientRect().top + window.scrollY);
      if (fantome) fantome.remove(); fantome = null; page = null; enCours = false;
      initPage(neuf);
      if (window.goatcounter && window.goatcounter.count) try { window.goatcounter.count({ path: location.pathname }); } catch (e) {}
    }
    document.addEventListener('touchend', fin);
    document.addEventListener('touchcancel', fin);
    addEventListener('popstate', function () { location.reload(); });
  }

  function initPage(main) {
    pastilles(main); fleche(main); liensAmazon(main); arriveeAmazon(main); prechargerVoisins();
  }

  function demarrer() {
    bandeauPinterest();
    var main = document.querySelector('main');
    if (main) { if (main.querySelector('.look')) initPage(main); else liensAmazon(main); }
    carrousel();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
