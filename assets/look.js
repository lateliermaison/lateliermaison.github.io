/* L'Atelier Maison : comportement des pages (24/10/2026).
   - pastilles <-> articles (le numéro touché montre l'aperçu de son article, un seul à la fois), flèche flottante « revenir à l'image » ;
   - passage d'un look à l'autre au doigt, façon carrousel : le look voisin apparaît pendant qu'on glisse, sans rechargement ;
   - ouverture hors de l'appli Pinterest (Safari) et des liens Amazon dans l'appli Amazon ;
   - clics sur « Voir sur Amazon » comptés dans GoatCounter (événements, 26/10/2026) ;
   - nos appareils exclus des statistiques par …/#ne-pas-compter, sans bascule (27/10/2026). */
(function () {
  var UA = navigator.userAgent, IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && 'ontouchend' in document);
  var PINTEREST = /Pinterest/i.test(UA), ANDROID = /Android/i.test(UA);
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cache = {};

  /* ---------- Nos propres appareils : exclus des statistiques (27/10/2026) ----------
     Le réglage de GoatCounter « #toggle-goatcounter » BASCULE à chaque chargement : si Safari recharge l'onglet
     (souvent sur iPhone au retour de l'appli Amazon) ou si on rouvre l'adresse, le comptage se rallume.
     Ici, une adresse qui ne bascule pas : …/#ne-pas-compter exclut l'appareil (même clé « skipgc » que GoatCounter,
     donc pages vues ET clics) ; …/#compter le réactive. Le # est retiré de l'adresse aussitôt : recharger ne change rien.
     Sur un appareil exclu, une petite ligne en bas de page le confirme (invisible pour les visiteurs). */
  function exclu() { try { return localStorage.getItem('skipgc') === 't'; } catch (e) { return false; } }
  function reglageComptage() {
    var h = location.hash;
    try {
      if (h === '#ne-pas-compter' || h === '#toggle-goatcounter') localStorage.setItem('skipgc', 't');
      else if (h === '#compter') localStorage.removeItem('skipgc');
      else return false;
      history.replaceState(history.state, '', location.pathname + location.search);
    } catch (e) {}
    return true;
  }
  reglageComptage();
  function temoinExclu() {
    var pied = document.querySelector('.pied .wrap');
    if (!pied) return;
    var t = pied.querySelector('.temoin-exclu');
    if (!exclu()) { if (t) t.remove(); return; }
    if (t) return;
    var p = document.createElement('p');
    p.className = 'temoin-exclu';
    p.textContent = 'Cet appareil n\u2019est pas compté dans les statistiques.';
    pied.appendChild(p);
  }
  // adresse modifiée sans rechargement (on ajoute #ne-pas-compter à la page déjà ouverte)
  addEventListener('hashchange', function () { if (reglageComptage()) temoinExclu(); });

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

  /* ---------- Clics vers Amazon comptés dans GoatCounter (anonyme, sans cookie ; 26/10/2026) ----------
     Chaque bouton « Voir sur Amazon » porte data-gc="amazon/look-015/03" : GoatCounter l'affiche comme un événement.
     Nos appareils (#ne-pas-compter) ne sont jamais comptés. */
  function compterClic(a) {
    var gc = window.goatcounter;
    if (!gc || !a.dataset.gc || exclu()) return;  // nos appareils (#ne-pas-compter) : jamais comptés
    try {
      if (gc.filter && gc.filter()) return;  // suivi désactivé dans ce navigateur, robot, aperçu local…
      var v = { path: a.dataset.gc, title: a.dataset.gcTitre || a.textContent, event: true };
      var u = gc.url && gc.url(v);
      if (u && navigator.sendBeacon) navigator.sendBeacon(u);  // part même si la page change tout de suite
      else if (gc.count) gc.count(v);
    } catch (e) {}
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[data-gc]');
    if (a) compterClic(a);
  }, true);

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
    // choisir un article : numéro sur l'image et ligne de la liste allumés, aperçu de cet article seulement
    function choisir(n) {
      var li = main.querySelector('#article-' + n), p = main.querySelector('.pastille[data-n="' + n + '"]');
      main.querySelectorAll('.actif').forEach(function (x) { x.classList.remove('actif'); });
      main.querySelectorAll('.article.ouvert').forEach(function (x) { if (x !== li) x.classList.remove('ouvert'); });
      if (p) p.classList.add('actif');
      if (li) { li.classList.add('actif'); li.classList.add('ouvert'); }
      return li;
    }
    main.querySelectorAll('.pastille').forEach(function (b) {
      b.addEventListener('click', function () {
        var li = choisir(b.dataset.n);
        if (li) li.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      });
    });
    main.querySelectorAll('.article').forEach(function (li) {
      // toucher ou cliquer un article dans la liste : il est choisi (sans faire défiler la page) ; le bouton Amazon garde son rôle
      li.addEventListener('click', function (ev) {
        if (ev.target.closest('a, button')) return;
        var avant = li.getBoundingClientRect().top;
        choisir(li.dataset.n);
        // si l'aperçu qui se ferme était au-dessus, la page ne saute pas : l'article reste sous le doigt
        var ecart = li.getBoundingClientRect().top - avant;
        if (Math.abs(ecart) > 1) window.scrollBy(0, ecart);
      });
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
      if (!exclu() && window.goatcounter && window.goatcounter.count) try { window.goatcounter.count({ path: location.pathname }); } catch (e) {}
    }
    document.addEventListener('touchend', fin);
    document.addEventListener('touchcancel', fin);
    addEventListener('popstate', function () { location.reload(); });
  }

  /* Passer d'un look à l'autre dans la pièce choisie (31/10/2026).
     Venu de l'accueil filtré sur « Noël », l'adresse garde ?piece=noel : les flèches et le glissement
     restent dans les looks de Noël, dans l'ordre de l'accueil. Sans pièce : tous les looks. */
  function pieceChoisie() { try { return new URLSearchParams(location.search).get('piece') || ''; } catch (e) { return ''; } }
  function adapterNavigation(main) {
    var look = main.querySelector('.look'), src = main.querySelector('#looks-ordre');
    if (!look || !src) return;
    var d; try { d = JSON.parse(src.textContent); } catch (e) { return; }
    var cat = pieceChoisie();
    if (!cat || !d.noms || !d.noms[cat]) return;
    var liste = d.looks.filter(function (l) { return l.cats.indexOf(cat) >= 0; });
    var id = location.pathname.split('/').pop().replace(/\.html$/, '');
    var i = -1; liste.forEach(function (l, k) { if (l.id === id) i = k; });
    if (i < 0) return;
    var q = '?piece=' + encodeURIComponent(cat), prec = liste[i - 1], suiv = liste[i + 1];
    look.dataset.prec = prec ? prec.id + '.html' + q : '';
    look.dataset.suiv = suiv ? suiv.id + '.html' + q : '';
    var nav = main.querySelector('.nav-looks');
    if (nav) nav.classList.add('avec-piece');
    if (!nav) { nav = document.createElement('nav'); nav.classList.add('avec-piece'); nav.className = 'nav-looks'; nav.setAttribute('aria-label', 'Autres looks'); var ap = main.querySelector('.note-look'); ap.parentNode.insertBefore(nav, ap); }
    nav.innerHTML = (prec ? '<a class="nav-prec" href="' + prec.id + '.html' + q + '" rel="prev">&#8249; Look n°' + prec.numero + '</a>' : '<span></span>')
      + '<span class="nav-piece">' + d.noms[cat] + ', ' + (i + 1) + ' sur ' + liste.length + '</span>'
      + (suiv ? '<a class="nav-suiv" href="' + suiv.id + '.html' + q + '" rel="next">Look n°' + suiv.numero + ' &#8250;</a>' : '<span></span>');
    var r = main.querySelector('.retour');
    if (r) { r.href = '../index.html' + q; r.textContent = 'Tous les looks ' + d.noms[cat]; }
    var astuce = main.querySelector('.astuce-glisser');
    if (astuce && !prec && !suiv) astuce.remove();
  }

  function initPage(main) {
    adapterNavigation(main); pastilles(main); fleche(main); liensAmazon(main); arriveeAmazon(main); prechargerVoisins();
  }


  /* Accueil : filtres par pièce et tri (31/10/2026). Adresse : index.html?piece=salon&tri=anciens */
  var appliquerFiltre = null;
  function filtres() {
    var grille = document.getElementById('grille');
    if (!grille) return;
    var cartes = Array.prototype.slice.call(grille.querySelectorAll('.carte'));
    var liens = Array.prototype.slice.call(document.querySelectorAll('.filtre'));
    var tri = document.getElementById('tri');
    var compte = document.getElementById('compte');
    var barre = document.querySelector('.filtres'), minuteur = null, DUREE = 550, COURBE = 'cubic-bezier(.33,1,.68,1)';
    // défilement doux, à la même vitesse et avec la même courbe que la grille : la page ne « saute » jamais
    function defiler(cible) {
      var y0 = window.scrollY, d = cible - y0, t0 = null;
      function pas(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / DUREE), e = 1 - Math.pow(1 - k, 3);
        window.scrollTo(0, y0 + d * e);
        if (k < 1) requestAnimationFrame(pas);
      }
      requestAnimationFrame(pas);
    }
    function nettoyer() {
      clearTimeout(minuteur);
      grille.style.height = ''; grille.style.transition = '';
      cartes.forEach(function (c) { c.style.transition = ''; c.style.transform = ''; c.style.opacity = ''; });
    }
    /* Change de pièce sans saut : les cartes qui restent glissent à leur nouvelle place, les nouvelles apparaissent
       en fondu, la hauteur de la grille suit en douceur et la page remonte doucement au début de la liste. */
    function changer(cat, ordre, montrer) {
      if (RM || !window.Map) { appliquer(cat, ordre); if (montrer && barre) grille.scrollIntoView(); return; }
      nettoyer();
      var avant = new Map();
      cartes.forEach(function (c) { if (!c.hidden) avant.set(c, c.getBoundingClientRect()); });
      var hAvant = grille.offsetHeight;
      appliquer(cat, ordre);
      var hApres = grille.offsetHeight;
      var visibles = cartes.filter(function (c) { return !c.hidden; });
      visibles.forEach(function (c, k) {
        var a = avant.get(c), b = c.getBoundingClientRect();
        c.style.transition = 'none';
        if (a) c.style.transform = 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px)';
        else { c.style.opacity = '0'; c.style.transform = 'translateY(18px)'; }
      });
      grille.style.height = hAvant + 'px';
      void grille.offsetHeight;
      var nouvelles = 0;
      visibles.forEach(function (c) {
        var retard = avant.has(c) ? 0 : 60 + Math.min(nouvelles++, 5) * 45;
        c.style.transition = 'transform ' + DUREE + 'ms ' + COURBE + ' ' + retard + 'ms, opacity .4s ease ' + retard + 'ms';
        c.style.transform = ''; c.style.opacity = '';
      });
      grille.style.transition = 'height ' + DUREE + 'ms ' + COURBE;
      grille.style.height = hApres + 'px';
      minuteur = setTimeout(nettoyer, DUREE + 400);
      // si on était descendu dans la liste, on remonte doucement à son début (juste sous la barre des pièces)
      if (barre) {
        var haut = document.querySelector('.filtres-infos') || grille;
        var cible = haut.getBoundingClientRect().top + window.scrollY - barre.offsetHeight - 8;
        if (window.scrollY > cible + 4 || (montrer && Math.abs(window.scrollY - cible) > 4)) defiler(cible);
      }
    }
    function appliquer(cat, ordre, garderAdresse) {
      cat = cat || 'tous'; ordre = ordre || (tri ? tri.value : 'recents');
      if (tri) tri.value = ordre;
      cartes.sort(function (a, b) {
        var x = (a.dataset.date || '') + String(1000 + +a.dataset.num), y = (b.dataset.date || '') + String(1000 + +b.dataset.num);
        return ordre === 'anciens' ? (x < y ? -1 : 1) : (x < y ? 1 : -1);
      });
      var n = 0;
      cartes.forEach(function (c) {
        var ok = cat === 'tous' || (' ' + c.dataset.cats + ' ').indexOf(' ' + cat + ' ') >= 0;
        c.hidden = !ok; if (ok) n++;
        if (c.dataset.href) c.setAttribute('href', c.dataset.href + (cat === 'tous' ? '' : '?piece=' + cat));
        grille.appendChild(c);
      });
      liens.forEach(function (a) {
        if (a.dataset.cat === cat) {
          a.setAttribute('aria-current', 'true');
          var l = a.parentNode;
          if (l.scrollWidth > l.clientWidth) {
            var x = a.offsetLeft - (l.clientWidth - a.offsetWidth) / 2;  // la pièce choisie se place au milieu de la barre
            if (l.scrollTo) l.scrollTo({ left: x, behavior: garderAdresse || RM ? 'auto' : 'smooth' }); else l.scrollLeft = x;
          }
        }
        else a.removeAttribute('aria-current');
      });
      document.querySelectorAll('.menu-liste a').forEach(function (a) { if (a.dataset.cat === cat) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      if (compte) compte.textContent = n + (n > 1 ? ' looks' : ' look');
      if (!garderAdresse && history.replaceState) {
        var q = [];
        if (cat !== 'tous') q.push('piece=' + cat);
        if (ordre !== 'recents') q.push('tri=' + ordre);
        history.replaceState(history.state, '', location.pathname + (q.length ? '?' + q.join('&') : ''));
      }
    }
    appliquerFiltre = changer;
    var p = new URLSearchParams(location.search);
    var depart = p.get('piece') || 'tous';
    if (!liens.some(function (a) { return a.dataset.cat === depart; })) depart = 'tous';
    appliquer(depart, p.get('tri') === 'anciens' ? 'anciens' : 'recents', true);
    liens.forEach(function (a) {
      a.addEventListener('click', function (ev) { ev.preventDefault(); if (a.getAttribute('aria-current')) return; changer(a.dataset.cat); });
    });
    if (tri) tri.addEventListener('change', function () {
      var actif = document.querySelector('.filtre[aria-current]');
      changer(actif ? actif.dataset.cat : 'tous', tri.value);
    });
  }

  /* Bouton Menu : panneau des catégories (31/10/2026) */
  function menuSite() {
    var bouton = document.querySelector('.menu-bouton'), m = document.getElementById('menu');
    if (!bouton || !m) return;
    var panneau = m.querySelector('.menu-panneau'), avant = null;
    function ouvrir() {
      avant = document.activeElement;
      m.hidden = false;
      void m.offsetWidth;
      m.classList.add('ouvert');
      bouton.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('menu-actif');
      var f = m.querySelector('.menu-fermer'); if (f) f.focus();
    }
    function fermer(rendreFocus) {
      if (m.hidden) return;
      m.classList.remove('ouvert');
      bouton.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('menu-actif');
      setTimeout(function () { if (!m.classList.contains('ouvert')) m.hidden = true; }, RM ? 0 : 320);
      if (rendreFocus !== false && avant && avant.focus) avant.focus();
    }
    bouton.addEventListener('click', ouvrir);
    m.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-fermer]')) { fermer(); return; }
      var a = ev.target.closest('.menu-liste a');
      if (a && appliquerFiltre) {
        ev.preventDefault(); fermer(false); appliquerFiltre(a.dataset.cat, null, true);
      }
    });
    document.addEventListener('keydown', function (ev) {
      if (m.hidden) return;
      if (ev.key === 'Escape') { fermer(); return; }
      if (ev.key === 'Tab') {
        var f = panneau.querySelectorAll('a, button');
        if (!f.length) return;
        var premier = f[0], dernier = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === premier) { ev.preventDefault(); dernier.focus(); }
        else if (!ev.shiftKey && document.activeElement === dernier) { ev.preventDefault(); premier.focus(); }
      }
    });
  }

  function demarrer() {
    bandeauPinterest(); temoinExclu(); filtres(); menuSite();
    var main = document.querySelector('main');
    if (main) { if (main.querySelector('.look')) initPage(main); else liensAmazon(main); }
    carrousel();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
