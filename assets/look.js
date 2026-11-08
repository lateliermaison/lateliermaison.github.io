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

  // arrivée depuis la recherche sur un article : …/look-010.html#article-3 -> l'article est choisi et montré
  function arriveeArticle(main) {
    var m = /^#article-(\d+)$/.exec(location.hash);
    if (!m) return;
    var p = main.querySelector('.pastille[data-n="' + m[1] + '"]'), li = main.querySelector('#article-' + m[1]);
    if (p) setTimeout(function () { p.click(); }, 80);
    else if (li) setTimeout(function () { li.click(); li.scrollIntoView({ block: 'center' }); }, 80);
  }

  function initPage(main) {
    adapterNavigation(main); pastilles(main); fleche(main); liensAmazon(main); arriveeAmazon(main); arriveeArticle(main); prechargerVoisins();
  }


  /* Accueil : filtres par pièce et tri (31/10/2026). Adresse : index.html?piece=salon&tri=anciens */
  var appliquerFiltre = null, filtrerRecherche = null;

  /* Barre des pièces sur une seule ligne (05/11/2026) : fondu sur les bords et flèches (ordinateur) quand ça déborde ;
     la loupe de la barre apparaît quand le champ de recherche du haut n'est plus visible. */
  function rail() {
    var r = document.querySelector('.filtres-rail'); if (!r) return;
    var l = r.querySelector('.filtres-liste'), g = r.querySelector('.filtres-fleche.gauche'), d = r.querySelector('.filtres-fleche.droite');
    function maj() {
      var max = l.scrollWidth - l.clientWidth, x = l.scrollLeft;
      var bg = max > 2 && x > 2, bd = max > 2 && x < max - 2;
      r.classList.toggle('deborde-g', bg); r.classList.toggle('deborde-d', bd);
      if (g) g.hidden = !bg; if (d) d.hidden = !bd;
    }
    function pousser(s) { l.scrollBy({ left: s * Math.max(160, l.clientWidth * .6), behavior: RM ? 'auto' : 'smooth' }); }
    if (g) g.addEventListener('click', function () { pousser(-1); });
    if (d) d.addEventListener('click', function () { pousser(1); });
    l.addEventListener('scroll', maj, { passive: true }); addEventListener('resize', maj); maj();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(maj);
    var barre = document.querySelector('.filtres'), champ = document.querySelector('.accueil-recherche'), loupe = document.querySelector('.filtres-loupe');
    if (barre && champ && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { var v = !es[0].isIntersecting; barre.classList.toggle('colle', v); if (loupe) loupe.tabIndex = v ? 0 : -1; }).observe(champ);
    }
    if (loupe) loupe.addEventListener('click', function () { ouvrirRecherche(); });
  }
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
    var annuler = document.querySelector('.recherche-annuler'), rechercheIds = null, rechercheTexte = '';
    function appliquer(cat, ordre, garderAdresse) {
      cat = cat || 'tous'; ordre = ordre || (tri ? tri.value : 'recents');
      if (cat !== 'recherche') { rechercheIds = null; rechercheTexte = ''; }
      if (tri) tri.value = ordre;
      cartes.sort(function (a, b) {
        var x = (a.dataset.date || '') + String(1000 + +a.dataset.num), y = (b.dataset.date || '') + String(1000 + +b.dataset.num);
        return ordre === 'anciens' ? (x < y ? -1 : 1) : (x < y ? 1 : -1);
      });
      var n = 0;
      cartes.forEach(function (c) {
        var ok = cat === 'recherche' ? rechercheIds.indexOf(c.dataset.id) >= 0
          : cat === 'tous' || (' ' + c.dataset.cats + ' ').indexOf(' ' + cat + ' ') >= 0;
        c.hidden = !ok; if (ok) n++;
        if (c.dataset.href) c.setAttribute('href', c.dataset.href + (cat === 'tous' || cat === 'recherche' ? '' : '?piece=' + cat));
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
      if (compte) compte.textContent = n + (n > 1 ? ' looks' : ' look') + (cat === 'recherche' ? ' pour \u00ab\u00a0' + rechercheTexte + '\u00a0\u00bb' : '');
      if (annuler) annuler.hidden = cat !== 'recherche';
      if (!garderAdresse && history.replaceState) {
        var q = [];
        if (cat === 'recherche') q.push('q=' + encodeURIComponent(rechercheTexte));
        else if (cat !== 'tous') q.push('piece=' + cat);
        if (ordre !== 'recents') q.push('tri=' + ordre);
        history.replaceState(history.state, '', location.pathname + (q.length ? '?' + q.join('&') : ''));
      }
    }
    appliquerFiltre = changer;
    // résultat d'une recherche affiché dans la grille (« Voir les 3 looks pour « rose » »)
    filtrerRecherche = function (ids, texte, garderAdresse) {
      rechercheIds = ids; rechercheTexte = texte;
      if (garderAdresse) appliquer('recherche', null, true); else changer('recherche', null, true);
    };
    if (annuler) annuler.addEventListener('click', function () { changer('tous'); var c = document.querySelector('.accueil-recherche input'); if (c) { c.value = ''; c.dispatchEvent(new Event('input')); } });
    var p = new URLSearchParams(location.search);
    var depart = p.get('piece') || 'tous';
    if (!liens.some(function (a) { return a.dataset.cat === depart; })) depart = 'tous';
    appliquer(depart, p.get('tri') === 'anciens' ? 'anciens' : 'recents', true);
    rail();
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


  /* ---------- Recherche intelligente (05/11/2026) ----------
     Cherche dans les pièces, les looks et leurs articles. Tolère les fautes de frappe (« balkon », « sale de bin »),
     les accents oubliés, les pluriels et les mots du quotidien (« sdb », « sapin », « hall », « canapé »…).
     Suggestions au fil de la frappe, flèches du clavier + Entrée, Échap pour fermer, ⌘K / Ctrl K ou « / » pour chercher.
     Index : recherche.json (généré par build.py), chargé seulement quand on cherche. */
  var RACINE = document.documentElement.getAttribute('data-racine') || '';
  var INDEX = null, indexPromesse = null;
  var VIDES = ' de la le les et du des d l a au aux un une pour en avec sur ce cet cette mon ma mes ton ta tes son sa ses look looks article articles deco idee idees style ambiance chez moi toi pas tres plus ';
  function norm(t) {
    return String(t || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function racineMot(m) { return m.length > 3 ? m.replace(/(eaux|aux)$/, 'al').replace(/[sx]$/, '') : m; }
  function mots(t) {
    return norm(t).split(' ').filter(function (m) { return m && VIDES.indexOf(' ' + m + ' ') < 0; }).map(racineMot);
  }
  // distance d'édition (avec inversion de deux lettres), arrêt rapide au-delà de max
  function distance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 1; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      var mini = max + 1;
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < mini) mini = d[i][j];
      }
      if (mini > max) return max + 1;
    }
    return d[a.length][b.length];
  }
  // ressemblance entre un mot tapé et un mot de l'index : 1 = identique, 0 = rien à voir
  function ressemblance(q, t) {
    if (q === t) return 1;
    if (q.length >= 2 && t.indexOf(q) === 0) return q.length >= 3 ? .9 : .75;  // début de mot (on est en train de taper)
    // fautes tolérées : 1 pour les mots courts (« bin » -> « bain »), 2 ou 3 pour les longs ;
    // au-delà d'une faute, la première lettre doit être la bonne (« balkon » ne doit pas donner « salon »)
    var max = q.length <= 2 ? 0 : q.length <= 5 ? 1 : q.length <= 8 ? 2 : 3;
    if (!max || (q.length === 3 && (t.length < 4 || t[0] !== q[0]))) return 0;
    var dd = distance(q, t, max);
    if ((dd > 1 || q.length <= 5) && dd > 0 && t[0] !== q[0] && !(dd === 1 && q.length === t.length && q[0] === t[1] && q[1] === t[0])) return 0;
    if (dd <= max) return .86 - .12 * dd;
    if (q.length >= 4 && t.length > q.length) {  // début de mot avec une faute (« balk » -> « balcon »)
      dd = distance(q, t.slice(0, q.length), 1);
      if (dd <= 1) return .62;
    }
    return 0;
  }
  function preparer(d) {
    function champ(liste) { var out = []; liste.forEach(function (x) { mots(x[0]).forEach(function (m) { out.push([m, x[1]]); }); }); return out; }
    var pieces = {};
    d.pieces.forEach(function (p) {
      pieces[p.id] = p;
      p._m = champ([[p.nom, 3]].concat(p.alias.map(function (a) { return [a, 2.6]; })));
      p._phrases = [norm(p.nom)].concat(p.alias.map(norm));
    });
    d.looks.forEach(function (l) {
      var f = [[l.titre, 3], [l.piece, 2.4], [l.intro, .9]];
      l.cats.forEach(function (c) { if (pieces[c]) f = f.concat(pieces[c].alias.map(function (a) { return [a, 1.8]; })); });
      l.articles.forEach(function (a) { f.push([a, 1.3]); });
      l._m = champ(f);
      l._articles = l.articles.map(function (a, k) { return { nom: a, n: k + 1, look: l, _m: champ([[a, 3], [l.titre, .4]]) }; });
    });
    d._vocab = {};
    function vocab(liste) { liste.forEach(function (x) { d._vocab[x[0]] = 1; }); }
    d.pieces.forEach(function (p) { vocab(p._m); }); d.looks.forEach(function (l) { vocab(l._m); });
    return d;
  }
  function charger_index() {
    if (!indexPromesse) indexPromesse = fetch(RACINE + 'recherche.json').then(function (r) { return r.json(); })
      .then(function (d) { INDEX = preparer(d); return INDEX; }).catch(function () { indexPromesse = null; return null; });
    return indexPromesse;
  }
  // note d'un élément pour les mots tapés : tous les mots doivent trouver quelque chose (sinon note réduite)
  function noter(m, q) {
    var total = 0, trouves = 0;
    q.forEach(function (w) {
      var best = 0;
      m.forEach(function (x) { var r = ressemblance(w, x[0]); if (r) { r *= x[1]; if (r > best) best = r; } });
      if (best) trouves++;
      total += best;
    });
    if (!trouves) return 0;
    return trouves === q.length ? total : total * .35 * trouves / q.length;
  }
  // « Tu voulais dire… » : on remplace chaque mot mal tapé par le mot le plus proche de l'index
  function correction(texte) {
    var change = false, out = norm(texte).split(' ').map(function (brut) {
      if (VIDES.indexOf(' ' + brut + ' ') >= 0) return brut;
      var w = racineMot(brut);
      if (INDEX._vocab[w] || w.length < 4) return brut;
      var best = null, bs = 0;
      for (var v in INDEX._vocab) { var r = ressemblance(w, v); if (r > bs && r < .9) { bs = r; best = v; } }
      if (best && bs >= .62 && best.indexOf(w) !== 0) { change = true; return best; }
      return brut;
    });
    return change ? out.join(' ') : '';
  }
  function chercher(texte) {
    var q = mots(texte), nt = norm(texte), phrase = '';
    if (!q.length) return null;
    var pieces = INDEX.pieces.map(function (p) {
      var sc = noter(p._m, q);
      // la phrase entière ressemble au nom de la pièce (« sale de bin », « salle a mange »)
      if (p._phrases.some(function (ph) {
        if (!ph) return false;
        if (nt === ph || (nt.length >= 4 && ph.indexOf(nt) === 0)) return true;
        if (ph.indexOf(' ') > 0 && nt.length >= 6 && distance(nt, ph, Math.floor(ph.length / 5)) <= Math.floor(ph.length / 5)) { phrase = p.nom.toLowerCase(); return true; }
        return false;
      })) sc += 4;
      return { p: p, sc: sc };
    }).filter(function (x) { return x.sc >= 2.2; }).sort(function (a, b) { return b.sc - a.sc; });
    var exacte = INDEX.pieces.filter(function (p) { return p._phrases.indexOf(nt) >= 0; })[0];
    var looks = INDEX.looks.map(function (l) { return { l: l, sc: noter(l._m, q) }; })
      .filter(function (x) { return x.sc >= 1.6 * q.length && (!exacte || x.l.cats.indexOf(exacte.id) >= 0); }).sort(function (a, b) { return b.sc - a.sc || (a.l.date < b.l.date ? 1 : -1); });
    // thème connu (« sapin », « sapin de Noël »…) : la liste des looks vient des règles du site (build.py), pas d'un mot isolé
    var theme = (INDEX.themes || []).filter(function (t) { return t.alias.indexOf(nt) >= 0; })[0];
    if (theme) looks = theme.ids.map(function (id) {
      var l = INDEX.looks.filter(function (x) { return x.id === id; })[0];
      return l ? { l: l, sc: noter(l._m, q) || 1 } : null;
    }).filter(Boolean).sort(function (a, b) { return b.sc - a.sc || (a.l.date < b.l.date ? 1 : -1); });
    var articles = [];
    INDEX.looks.forEach(function (l) { l._articles.forEach(function (a) { var sc = noter(a._m, q); if (sc >= 2.4 * q.length) articles.push({ a: a, sc: sc }); }); });
    articles.sort(function (a, b) { return b.sc - a.sc; });
    return { pieces: pieces.slice(0, 3), looks: looks, articles: articles.slice(0, 5), q: q, correction: phrase || correction(texte) };
  }
  function echapper(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // souligne les mots trouvés dans un titre
  function souligner(titre, q) {
    return titre.split(/(\s+)/).map(function (m) {
      var n = racineMot(norm(m));
      return n && q.some(function (w) { return ressemblance(w, n) >= .62; }) ? '<mark>' + echapper(m) + '</mark>' : echapper(m);
    }).join('');
  }
  function compterRecherche(texte) {
    var gc = window.goatcounter; if (!gc || exclu() || !texte) return;
    try {
      if (gc.filter && gc.filter()) return;
      var v = { path: 'recherche/' + norm(texte).slice(0, 40).replace(/ /g, '-'), title: 'Recherche : ' + texte.slice(0, 60), event: true };
      var u = gc.url && gc.url(v); if (u && navigator.sendBeacon) navigator.sendBeacon(u); else if (gc.count) gc.count(v);
    } catch (e) {}
  }

  var surAccueil = !!document.getElementById('grille');
  function ouvrirRecherche(texte) {
    var accueil = document.querySelector('.accueil-recherche input');
    if (surAccueil && accueil) {
      accueil.closest('.accueil-titre').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      if (texte != null) { accueil.value = texte; }
      setTimeout(function () { accueil.focus(); accueil.dispatchEvent(new Event('input')); }, RM ? 0 : 250);
      return;
    }
    var pan = document.getElementById('recherche-panneau'); if (!pan) return;
    pan.hidden = false; void pan.offsetWidth; pan.classList.add('ouvert');
    document.documentElement.classList.add('recherche-active');
    var b = document.querySelector('.recherche-bouton'); if (b) b.setAttribute('aria-expanded', 'true');
    var i = pan.querySelector('input'); if (texte != null) i.value = texte;
    setTimeout(function () { i.focus(); i.dispatchEvent(new Event('input')); }, 30);
  }
  function fermerPanneau() {
    var pan = document.getElementById('recherche-panneau'); if (!pan || pan.hidden) return;
    pan.classList.remove('ouvert'); document.documentElement.classList.remove('recherche-active');
    var b = document.querySelector('.recherche-bouton'); if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
    setTimeout(function () { if (!pan.classList.contains('ouvert')) pan.hidden = true; }, RM ? 0 : 300);
  }

  function rechercheChamp(bloc) {
    var input = bloc.querySelector('input'), liste = bloc.querySelector('.recherche-resultats');
    var effacer = bloc.querySelector('.recherche-effacer'), raccourci = bloc.querySelector('.recherche-raccourci');
    var dansPanneau = !!bloc.closest('.recherche-panneau'), options = [], actif = -1, minuteurCompte = null;
    if (raccourci && !dansPanneau) { raccourci.textContent = /Mac|iPhone|iPad/.test(navigator.platform || UA) ? '⌘ K' : 'Ctrl K'; raccourci.hidden = false; }
    function lien(href) { return RACINE + href; }
    function option(o) {
      var vign = o.img ? '<span class="rs-vignette"><img src="' + RACINE + echapper(o.img) + '" alt="" loading="lazy"></span>' : '<span class="rs-pastille">' + (o.pastille || '') + '</span>';
      return '<a class="rs-option ' + (o.cls || '') + '" role="option" id="' + o.id + '" href="' + echapper(o.href) + '" data-action="' + (o.action || '') + '" data-val="' + echapper(o.val || '') + '" aria-selected="false">'
        + vign + '<span class="rs-texte"><span class="rs-titre">' + o.titre + '</span>' + (o.sous ? '<span class="rs-sous">' + echapper(o.sous) + '</span>' : '') + '</span>'
        + (o.nb ? '<span class="rs-nb">' + echapper(o.nb) + '</span>' : '') + '</a>';
    }
    function afficher(html) {
      liste.innerHTML = html; liste.hidden = !html;
      input.setAttribute('aria-expanded', html ? 'true' : 'false');
      options = Array.prototype.slice.call(liste.querySelectorAll('.rs-option')); actif = -1; input.removeAttribute('aria-activedescendant');
    }
    function selection(k) {
      options.forEach(function (o, i) { o.setAttribute('aria-selected', i === k ? 'true' : 'false'); });
      actif = k;
      if (k >= 0) { input.setAttribute('aria-activedescendant', options[k].id); options[k].scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    }
    var uid = 0;
    function suggestionsVides() {
      var h = '<p class="rs-groupe">Les pièces</p>';
      INDEX.pieces.slice(0, 6).forEach(function (p) {
        h += option({ id: 'rs' + (uid++), img: p.img, titre: echapper(p.nom), nb: p.nb + (p.nb > 1 ? ' looks' : ' look'), href: lien('index.html?piece=' + p.id), action: 'piece', val: p.id });
      });
      h += '<p class="rs-groupe">Les derniers looks</p>';
      INDEX.looks.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3).forEach(function (l) {
        h += option({ id: 'rs' + (uid++), img: l.img, titre: echapper(l.titre), sous: 'Look n°' + l.num + ', ' + l.piece, href: lien('looks/' + l.id + '.html'), action: 'look' });
      });
      return h;
    }
    function rendre() {
      var texte = input.value;
      if (effacer) effacer.hidden = !texte;
      if (!INDEX) { charger_index().then(function (d) { if (d) rendre(); }); return; }
      if (!norm(texte)) { afficher(document.activeElement === input ? suggestionsVides() : ''); return; }
      var r = chercher(texte); if (!r) { afficher(''); return; }
      var h = '';
      if (r.correction && !r.looks.length && !r.pieces.length) {
        var r2 = chercher(r.correction);
        if (r2 && (r2.looks.length || r2.pieces.length)) { h += '<p class="rs-correction">Résultats pour <b>' + echapper(r.correction) + '</b></p>'; r = r2; }
      } else if (r.correction) h += '<p class="rs-correction">Tu voulais dire <b>' + echapper(r.correction) + '</b> ?</p>';
      if (r.pieces.length) {
        h += '<p class="rs-groupe">Pièces</p>';
        r.pieces.forEach(function (x) { h += option({ id: 'rs' + (uid++), img: x.p.img, titre: echapper(x.p.nom), nb: x.p.nb + (x.p.nb > 1 ? ' looks' : ' look'), href: lien('index.html?piece=' + x.p.id), action: 'piece', val: x.p.id }); });
      }
      if (r.looks.length) {
        h += '<p class="rs-groupe">Looks</p>';
        r.looks.slice(0, 4).forEach(function (x) { h += option({ id: 'rs' + (uid++), img: x.l.img, titre: souligner(x.l.titre, r.q), sous: 'Look n°' + x.l.num + ', ' + x.l.piece + ', ' + x.l.articles.length + ' articles', href: lien('looks/' + x.l.id + '.html'), action: 'look' }); });
      }
      if (r.articles.length) {
        h += '<p class="rs-groupe">Articles</p>';
        r.articles.forEach(function (x) { h += option({ id: 'rs' + (uid++), cls: 'rs-article', pastille: x.a.n, titre: souligner(x.a.nom, r.q), sous: 'Dans le look n°' + x.a.look.num + ' : ' + x.a.look.titre, href: lien('looks/' + x.a.look.id + '.html#article-' + x.a.n), action: 'article' }); });
      }
      if (r.looks.length > 1) {
        var ids = r.looks.map(function (x) { return x.l.id; }).join(' ');
        h += option({ id: 'rs' + (uid++), cls: 'rs-tout', pastille: LOUPE_MINI, titre: 'Voir les ' + r.looks.length + ' looks pour « ' + echapper(texte.trim()) + ' »', href: lien('index.html?q=' + encodeURIComponent(texte.trim())), action: 'tout', val: ids });
      }
      if (!h || (!r.pieces.length && !r.looks.length && !r.articles.length)) {
        h = '<p class="rs-vide">Aucun look pour « ' + echapper(texte.trim()) + ' ». Essaie une pièce :</p><div class="rs-vide-pieces">'
          + INDEX.pieces.slice(0, 6).map(function (p) { return '<button type="button" data-q="' + echapper(p.nom) + '">' + echapper(p.nom) + '</button>'; }).join('') + '</div>';
      }
      afficher(h);
      if (options.length && norm(texte).length >= 2) selection(0);
      clearTimeout(minuteurCompte); minuteurCompte = setTimeout(function () { compterRecherche(texte.trim()); }, 1500);
    }
    function choisir(o, ev) {
      var action = o.dataset.action;
      clearTimeout(minuteurCompte); compterRecherche(input.value.trim());
      if (surAccueil && (action === 'piece' || action === 'tout')) {
        if (ev) ev.preventDefault();
        afficher(''); if (dansPanneau) fermerPanneau(); input.blur();
        if (action === 'piece' && appliquerFiltre) appliquerFiltre(o.dataset.val, null, true);
        if (action === 'tout' && filtrerRecherche) filtrerRecherche(o.dataset.val.split(' '), input.value.trim());
        return;
      }
      if (!ev) location.href = o.href;  // Entrée au clavier ; un clic suit le lien normalement
    }
    input.addEventListener('input', rendre);
    input.addEventListener('focus', function () { charger_index().then(function () { rendre(); }); });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); if (liste.hidden) rendre(); else selection(Math.min(options.length - 1, actif + 1)); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); selection(Math.max(-1, actif - 1)); }
      else if (ev.key === 'Enter') { ev.preventDefault(); var o = options[actif >= 0 ? actif : 0]; if (o) choisir(o); }
      else if (ev.key === 'Escape') { if (!liste.hidden && input.value) { input.value = ''; rendre(); } else if (dansPanneau) fermerPanneau(); else { afficher(''); input.blur(); } }
    });
    liste.addEventListener('mousedown', function (ev) { ev.preventDefault(); });  // garde le champ actif pendant le clic
    liste.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-q]');
      if (b) { input.value = b.dataset.q; input.focus(); rendre(); return; }
      var o = ev.target.closest('.rs-option'); if (o) choisir(o, ev);
    });
    liste.addEventListener('mousemove', function (ev) { var o = ev.target.closest('.rs-option'); if (o) selection(options.indexOf(o)); });
    if (effacer) effacer.addEventListener('click', function () { input.value = ''; input.focus(); rendre(); });
    var idees = bloc.parentNode.querySelector('.idees');
    // un clic hors de la barre ferme la liste, sauf un clic sur une idée (08/11/2026 : la liste se refermait aussitôt)
    if (!dansPanneau) document.addEventListener('click', function (ev) { if (!bloc.contains(ev.target) && !(idees && idees.contains(ev.target))) afficher(''); });
    /* Clic sur une idée (08/11/2026) : sur l'accueil, la grille se filtre tout de suite, à chaque clic.
       Une pièce (Salle de bain, Noël…) -> même effet que la barre des pièces ; un thème (Doré, Velours…) -> les looks trouvés. */
    var ideeEnCours = 0;
    function choisirIdee(q, piece, ids) {
      var tour = ++ideeEnCours;
      clearTimeout(minuteurCompte); compterRecherche(q);
      afficher('');
      // thème : la liste exacte des looks est calculée à la construction du site (build.py, THEMES_IDEES)
      if (surAccueil && ids && ids.length && filtrerRecherche) {
        input.value = q; if (effacer) effacer.hidden = false; input.blur();
        filtrerRecherche(ids, q);
        return;
      }
      if (surAccueil && piece && appliquerFiltre) {
        input.value = ''; if (effacer) effacer.hidden = true; input.blur();
        appliquerFiltre(piece, null, true);
        return;
      }
      input.value = q; if (effacer) effacer.hidden = false;
      charger_index().then(function (d) {
        if (tour !== ideeEnCours) return;  // un autre clic est arrivé entre-temps
        var r = d ? chercher(q) : null, ids = r ? r.looks.map(function (x) { return x.l.id; }) : [];
        // un thème présent seulement dans des articles (« Velours ») : on montre aussi les looks de ces articles
        if (r) INDEX.looks.forEach(function (l) {
          if (ids.indexOf(l.id) < 0 && l._articles.some(function (a) { return noter(a._m, r.q) >= 2.4 * r.q.length; })) ids.push(l.id);
        });
        if (surAccueil && filtrerRecherche && ids.length) { input.blur(); filtrerRecherche(ids, q); }
        else { input.focus(); rendre(); }
      });
    }
    if (idees) idees.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-q]'); if (!b) return;
      ev.preventDefault(); choisirIdee(b.dataset.q, b.dataset.piece || '', (b.dataset.ids || '').split(' ').filter(Boolean));
    });
    return input;
  }
  var LOUPE_MINI = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.4 15.4 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function rechercheSite() {
    document.querySelectorAll('[data-recherche]').forEach(rechercheChamp);
    var bouton = document.querySelector('.recherche-bouton'), pan = document.getElementById('recherche-panneau');
    if (bouton) bouton.addEventListener('click', function () { ouvrirRecherche(); });
    if (pan) pan.addEventListener('click', function (ev) { if (ev.target.closest('[data-fermer-recherche]')) fermerPanneau(); });
    document.addEventListener('keydown', function (ev) {
      var cible = ev.target, saisie = cible && (cible.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName));
      if ((ev.key === 'k' || ev.key === 'K') && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); ouvrirRecherche(); }
      else if (ev.key === '/' && !saisie) { ev.preventDefault(); ouvrirRecherche(); }
      else if (ev.key === 'Escape' && pan && !pan.hidden) fermerPanneau();
    });
    // accueil ouvert avec ?q=… (lien « Voir les looks pour … » depuis une autre page)
    var q = null; try { q = new URLSearchParams(location.search).get('q'); } catch (e) {}
    if (q && surAccueil) charger_index().then(function (d) {
      if (!d || !filtrerRecherche) return;
      var r = chercher(q), ids = r ? r.looks.map(function (x) { return x.l.id; }) : [];
      var champ = document.querySelector('.accueil-recherche input'); if (champ) champ.value = q;
      if (ids.length) filtrerRecherche(ids, q, true);
    });
  }


  /* ---------- Idées sous la recherche, qui changent toutes seules (08/11/2026) ----------
     Au chargement : 4 idées tirées au hasard, en favorisant les pièces que le visiteur a déjà regardées
     (mémorisées sur cet appareil seulement, clé « am_gouts ») et Noël en novembre-décembre.
     Ensuite, une idée est remplacée toutes les 6 secondes (fondu), et après 40 secondes le titre devient
     « Et pourquoi pas… » avec des idées pas encore montrées. Pause quand on survole, quand le champ est actif
     ou quand l'onglet est caché. */
  function lireGouts() { try { return JSON.parse(localStorage.getItem('am_gouts') || '{}') || {}; } catch (e) { return {}; } }
  function noterGouts(cats) {
    try { var g = lireGouts(); cats.forEach(function (c) { g[c] = Math.min(20, (g[c] || 0) + 1); }); localStorage.setItem('am_gouts', JSON.stringify(g)); } catch (e) {}
  }
  function ideesVivantes() {
    var bloc = document.querySelector('.idees[data-idees]');
    if (!bloc) return;
    var liste = bloc.querySelector('.idees-liste'), titre = bloc.querySelector('.idees-titre');
    var pool; try { pool = JSON.parse(bloc.getAttribute('data-idees')); } catch (e) { return; }
    if (!liste || !pool || pool.length < 5) return;
    var gouts = lireGouts(), mois = new Date().getMonth(), saison = mois === 10 || mois === 11;
    var vues = {}, debut = Date.now(), pause = false, place = 0;
    function poids(x) {
      var p = 1;
      (x.cats || []).forEach(function (c) { p += Math.min(4, gouts[c] || 0) * .8; });
      if (saison && x.saison) p += 1.5;
      if (Date.now() - debut > 40000 && !vues[x.q]) p += 3;  // après un moment : des idées nouvelles
      return p;
    }
    function tirer(exclus) {
      var choix = pool.filter(function (x) { return exclus.indexOf(x.q) < 0; });
      if (!choix.length) return null;
      var total = 0; choix.forEach(function (x) { total += poids(x); });
      var r = Math.random() * total;
      for (var i = 0; i < choix.length; i++) { r -= poids(choix[i]); if (r <= 0) return choix[i]; }
      return choix[choix.length - 1];
    }
    function bouton(x) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.q = x.q; if (x.piece) b.dataset.piece = x.piece; if (x.ids) b.dataset.ids = x.ids.join(' '); b.textContent = x.q; vues[x.q] = 1; return b;
    }
    // premier tirage
    var montres = [];
    for (var k = 0; k < 4; k++) { var x = tirer(montres); if (x) montres.push(x.q); }
    liste.innerHTML = '';
    montres.forEach(function (q) { liste.appendChild(bouton(pool.filter(function (x) { return x.q === q; })[0])); });
    if (RM) return;  // mouvements réduits : pas de rotation automatique
    bloc.addEventListener('mouseenter', function () { pause = true; });
    bloc.addEventListener('mouseleave', function () { pause = false; });
    var calme = 0;  // après un toucher ou un clic, les idées ne bougent plus pendant 15 s (le doigt ne tombe pas sur une autre)
    bloc.addEventListener('pointerdown', function () { calme = Date.now(); });
    var champ = bloc.parentNode.querySelector('input');
    function tourner() {
      if (pause || Date.now() - calme < 15000 || document.hidden || (champ && document.activeElement === champ) || bloc.contains(document.activeElement)) return;
      if (titre && Date.now() - debut > 40000 && titre.textContent !== 'Et pourquoi pas…') {
        titre.classList.add('sort'); setTimeout(function () { titre.textContent = 'Et pourquoi pas…'; titre.classList.remove('sort'); }, 350);
      }
      var actuels = [].map.call(liste.children, function (b) { return b.dataset.q; });
      var x = tirer(actuels); if (!x) return;
      var vieux = liste.children[place % liste.children.length]; place++;
      if (!vieux) return;
      vieux.classList.add('sort');
      setTimeout(function () {
        var b = bouton(x); b.classList.add('entre'); liste.replaceChild(b, vieux);
        requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.remove('entre'); }); });
      }, 350);
    }
    // les idées s'arrêtent de changer après 10 changements (environ 1 minute) : pas de mouvement sans fin
    var tours = 0, rotation = setInterval(function () { if (++tours > 10) { clearInterval(rotation); return; } tourner(); }, 6000);
  }


  /* ---------- Page À propos : « Comment naît un look » en cinématique (09/11/2026, en test) ----------
     La scène est collée en haut de l'écran ; le défilement de la page fait avancer une valeur p de 0 à 4 :
     0→1 la planche couchée se redresse, 1→2 elle pivote et laisse place à la pièce, 2→3 le calque se trace,
     3→4 les numéros apparaissent un par un. Toucher une étape fait défiler jusqu'à elle.
     Le look change à chaque visite (jamais deux fois de suite le même, clé « am_atelier ») ; « Un autre exemple » passe au suivant. */
  function demoAtelier() {
    var s = document.querySelector('.cine[data-atelier]');
    if (!s) return;
    var d; try { d = JSON.parse(s.getAttribute('data-atelier')); } catch (e) { return; }
    var V = d.variantes || []; if (!V.length) return;
    var pas = [].slice.call(s.querySelectorAll('.cine-pas')), textes = [].slice.call(s.querySelectorAll('.cine-etape'));
    var planche = s.querySelector('.cine-planche'), decor = s.querySelector('.cine-decor');
    var imgP = planche.querySelector('img'), imgD = decor.querySelector('img'), calque = s.querySelector('.couche-calque');
    var couche = s.querySelector('.couche-numeros'), balai = s.querySelector('.cine-balayage'), zone = s.querySelector('.atelier-article');
    var lienLook = s.querySelector('.atelier-lien'), autre = s.querySelector('.atelier-autre');
    var v = null, iv = 0, choisi = 1, etape = 0, attente = false, choixManuel = false;
    function echap(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function borne(x, a, b) { return Math.max(a, Math.min(b, x)); }
    function adoucir(t) { return 1 - Math.pow(1 - t, 3); }  // départ vif, arrivée douce
    function fiche() {
      var a = v.articles[choisi - 1];
      zone.innerHTML = '<div class="atelier-fiche"><img src="' + RACINE + echap(a.img) + '" alt="" width="60" height="60">'
        + '<div><p class="atelier-fiche-nom">' + a.n + '. ' + echap(a.nom) + '</p>'
        + '<p class="atelier-fiche-prix">' + echap(a.prix) + ' · <a href="' + RACINE + echap(v.lien) + '#article-' + a.n + '">Voir l\'article</a></p></div></div>';
      [].forEach.call(couche.children, function (b, i) { b.classList.toggle('actif', i + 1 === choisi); });
    }
    function charger(k) {
      iv = (k + V.length) % V.length; v = V[iv]; choisi = 1; choixManuel = false;
      try { localStorage.setItem('am_atelier', v.look); } catch (e) {}
      imgP.src = RACINE + v.planche; imgP.style.background = v.fond;
      imgD.src = RACINE + v.image; imgD.alt = v.alt;
      calque.innerHTML = v.calque;
      if (lienLook) { lienLook.href = RACINE + v.lien; lienLook.textContent = v.titre; }
      couche.innerHTML = ''; zone.innerHTML = '';
      v.articles.forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'pastille'; b.textContent = a.n;
        b.style.left = a.pos[0] + '%'; b.style.top = a.pos[1] + '%';
        b.setAttribute('aria-label', 'Article ' + a.n + ' : ' + a.nom);
        b.addEventListener('click', function () { choisi = a.n; choixManuel = true; fiche(); var f = zone.firstChild; if (f) f.classList.add('vu'); });
        couche.appendChild(b);
      });
      etape = 0; dessiner();
    }
    // position dans la section : p de 0 à 4
    function progres() {
      var r = s.getBoundingClientRect(), h = window.innerHeight, seg = (s.offsetHeight - h) / 4;
      return borne(-r.top / seg, 0, 3.999);
    }
    function dessiner() {
      attente = false;
      var p = RM ? Math.floor(progres()) + .999 : progres();
      var k = Math.floor(p) + 1;
      // 1. la planche se redresse (0→0,7), puis pivote et s'efface (1→1,8)
      var lever = adoucir(borne(p / .7, 0, 1)), tour = adoucir(borne((p - 1) / .8, 0, 1));
      planche.style.transform = 'translateY(' + ((1 - lever) * 10) + '%) rotateX(' + ((1 - lever) * 58) + 'deg) rotateY(' + (-tour * 100) + 'deg) scale(' + (.88 + lever * .12) + ')';
      planche.style.opacity = tour < .55 ? 1 : borne(1 - (tour - .55) / .45, 0, 1);
      // 2. la pièce arrive de l'autre côté
      var arrivee = adoucir(borne((p - 1.15) / .75, 0, 1));
      decor.style.transform = 'rotateY(' + ((1 - arrivee) * 100) + 'deg) scale(' + (1 + (p > 2 && p < 3.2 ? .025 : 0)) + ')';
      decor.style.opacity = p < 1.15 ? 0 : borne(arrivee * 2, 0, 1);
      // 3. le calque se trace et un trait laiton balaie l'image
      var trace = borne((p - 2.1) / .6, 0, 1);
      [].forEach.call(calque.querySelectorAll('.cote'), function (g, i) {
        var t = borne(trace * 2 - i * .6, 0, 1);
        var l = g.querySelector('.cote-trait'); if (l) l.style.strokeDashoffset = 1 - t;
        g.classList.toggle('vu', t > .95);
        g.style.opacity = p > 3.6 ? borne(1 - (p - 3.6) / .3, .0, 1) : 1;
      });
      var bal = borne((p - 2) / .9, 0, 1);
      balai.style.opacity = bal > 0 && bal < 1 ? .9 : 0; balai.style.transform = 'translateY(' + (bal * (decor.offsetHeight - 2)) + 'px)';
      // 4. les numéros apparaissent un par un
      var n = v.articles.length, montres = Math.round(borne((p - 3) / .6, 0, 1) * n);
      [].forEach.call(couche.children, function (b, i) { b.classList.toggle('vu', i < montres); });
      if (montres >= n && !choixManuel) { choisi = 1; }
      if (k !== etape) {
        etape = k; s.setAttribute('data-etape', k);
        textes.forEach(function (t) { t.classList.toggle('actif', +t.dataset.etape === k); });
        if (k === 4) { fiche(); } else { zone.innerHTML = ''; }
      }
      if (k === 4) { var f = zone.firstChild; if (f) f.classList.toggle('vu', montres >= Math.min(n, 3)); }
      pas.forEach(function (b, i) {
        b.classList.toggle('actif', i + 1 === k); b.classList.toggle('fait', i + 1 < k);
        b.querySelector('i').style.setProperty('--remplissage', borne(p - i, 0, 1));
      });
    }
    function demander() { if (!attente) { attente = true; requestAnimationFrame(dessiner); } }
    window.addEventListener('scroll', demander, { passive: true });
    window.addEventListener('resize', demander);
    pas.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = +b.dataset.etape, h = window.innerHeight, seg = (s.offsetHeight - h) / 4;
        var y = window.scrollY + s.getBoundingClientRect().top + (k - 1 + (k === 4 ? .85 : .75)) * seg;
        window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
      });
    });
    if (autre) autre.addEventListener('click', function () { charger(iv + 1); });
    // look de cette visite : au hasard, jamais celui de la visite précédente
    var dernier = null; try { dernier = localStorage.getItem('am_atelier'); } catch (e) {}
    var possibles = V.map(function (x, k) { return k; }).filter(function (k) { return V.length < 2 || V[k].look !== dernier; });
    charger(possibles[Math.floor(Math.random() * possibles.length)]);
  }

  /* ---------- Accueil : bandeau d'introduction (09/11/2026, en test) ----------
     Arches des 5 derniers looks en éventail 3D ; sur l'arche de devant, 3 numéros s'allument l'un après l'autre
     avec l'article et son prix, puis l'éventail tourne vers le look suivant. Pause au survol ou au toucher ;
     arrêt après 2 tours ; rien ne bouge si l'appareil demande moins d'animations. */
  function introAccueil() {
    var s = document.querySelector('.intro[data-intro]');
    if (!s) return;
    var d; try { d = JSON.parse(s.getAttribute('data-intro')); } catch (e) { return; }
    var arches = [].slice.call(s.querySelectorAll('.intro-arche')), scene = s.querySelector('.intro-scene');
    var bulle = s.querySelector('.intro-bulle'), bN = s.querySelector('.intro-bulle-n'), bNom = s.querySelector('.intro-bulle-nom'), bPrix = s.querySelector('.intro-bulle-prix');
    var avant = 0, num = 0, pause = false, tours = 0, minuteur = null, n = arches.length;
    function placer() {
      var etroit = scene.offsetWidth < 600;
      arches.forEach(function (a, i) {
        var o = ((i - avant + n + Math.floor(n / 2)) % n) - Math.floor(n / 2);  // -2 … 2
        var ab = Math.abs(o);
        a.style.transform = 'translate(-50%, -50%) translateX(' + (o * (etroit ? 46 : 40)) + '%) translateZ(' + (-ab * 150) + 'px) rotateY(' + (-o * 24) + 'deg)';
        a.style.zIndex = 10 - ab; a.style.filter = 'brightness(' + (1 - ab * .1) + ') saturate(' + (1 - ab * .15) + ')';
        a.style.opacity = ab > 2 ? 0 : 1;
      });
    }
    function montrerNumero() {
      var look = d[avant], x = look.numeros[num];
      if (!x) return;
      var carte = arches[avant].getBoundingClientRect(), base = scene.getBoundingClientRect();
      var px = carte.left - base.left + carte.width * x.pos[0] / 100, py = carte.top - base.top + carte.height * x.pos[1] / 100;
      bN.textContent = x.n; bNom.textContent = x.nom.length > 46 ? x.nom.slice(0, 44) + '…' : x.nom; bPrix.textContent = x.prix;
      // la bulle part du numéro, vers l'intérieur de la scène
      var droite = px > base.width * .55;
      bulle.style.flexDirection = droite ? 'row-reverse' : 'row';
      var largeur = bulle.offsetWidth || 220;
      var gx = droite ? px - largeur + 15 : px - 15;
      bulle.style.left = borne(gx, 6, base.width - largeur - 6) + 'px'; bulle.style.top = borne(py - 15, 6, base.height - 50) + 'px';
      bulle.classList.add('vu');
    }
    function borne(x, a, b) { return Math.max(a, Math.min(b, x)); }
    function suivant() {
      if (pause || document.hidden) { minuteur = setTimeout(suivant, 1200); return; }
      num++;
      if (num >= d[avant].numeros.length) {
        num = 0; bulle.classList.remove('vu');
        avant = (avant + 1) % n; if (avant === 0) tours++;
        if (tours >= 2) { placer(); setTimeout(montrerNumero, 1000); return; }  // fin : le dernier état reste à l'écran
        placer(); minuteur = setTimeout(function () { montrerNumero(); minuteur = setTimeout(suivant, 2600); }, 1100);
        return;
      }
      bulle.classList.remove('vu');
      setTimeout(montrerNumero, 260);
      minuteur = setTimeout(suivant, 2600);
    }
    arches.forEach(function (a, i) {
      a.addEventListener('click', function (ev) { if (i !== avant) { ev.preventDefault(); avant = i; num = 0; bulle.classList.remove('vu'); placer(); setTimeout(montrerNumero, 900); } });
    });
    scene.addEventListener('mouseenter', function () { pause = true; });
    scene.addEventListener('mouseleave', function () { pause = false; });
    scene.addEventListener('touchstart', function () { pause = true; setTimeout(function () { pause = false; }, 8000); }, { passive: true });
    window.addEventListener('resize', function () { placer(); if (bulle.classList.contains('vu')) montrerNumero(); });
    // le bouton « Commencer à s'inspirer » descend en douceur jusqu'aux looks
    var b = s.querySelector('.intro-bouton'), cible = document.getElementById('les-looks');
    if (b && cible) b.addEventListener('click', function (ev) { ev.preventDefault(); cible.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); });
    // entrée : les arches partent d'une pile et s'ouvrent en éventail (le seul grand mouvement de la page)
    if (RM) { placer(); montrerNumero(); return; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { placer(); }); });
    setTimeout(function () { montrerNumero(); minuteur = setTimeout(suivant, 2600); }, 1300);
  }

  function demarrer() {
    bandeauPinterest(); temoinExclu(); filtres(); menuSite(); rechercheSite(); ideesVivantes(); demoAtelier(); introAccueil();
    // pages de look : on retient les pièces regardées (pour les idées de l'accueil)
    var ordre = document.getElementById('looks-ordre');
    if (ordre && document.querySelector('.look')) {
      try {
        var dd = JSON.parse(ordre.textContent), idl = location.pathname.split('/').pop().replace(/\.html$/, '');
        dd.looks.forEach(function (l) { if (l.id === idl) noterGouts(l.cats); });
      } catch (e) {}
    }
    var main = document.querySelector('main');
    if (main) { if (main.querySelector('.look')) initPage(main); else liensAmazon(main); }
    carrousel();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
