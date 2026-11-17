/* =========================================================================
   ECO.P — comportement du site
   -------------------------------------------------------------------------
   1. Outils              6. Formulaires
   2. État et stockage    7. Espace asso
   3. Navigation          8. Carte zoomable
   4. Rendus              9. Apparition au défilement
   5. Calendrier         10. Démarrage
   Script classique (pas de module) : le site s'ouvre aussi en double-cliquant
   sur index.html, sans serveur.
   ========================================================================= */
(function () {
  "use strict";

  const DATA = window.ECOP_DATA;
  const MAP = window.ECOP_MAP;
  const LABELS = window.ECOP_MAP_LABELS || [];

  /* -----------------------------------------------------------------------
     1. Outils
     ----------------------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const JOURS_COURTS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
  const JOURS_LONGS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

  const parseISO = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const weekday = (d) => (d.getDay() + 6) % 7;                    /* lundi = 0 */
  const fmtShort = (iso) => { const d = parseISO(iso); return `${JOURS_COURTS[weekday(d)]}. ${d.getDate()} ${MOIS[d.getMonth()]}`; };
  const fmtLong = (iso) => { const d = parseISO(iso); return `${JOURS_LONGS[weekday(d)]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`; };
  const nf = (n) => new Intl.NumberFormat("fr-FR").format(n);
  const todayISO = () => DATA.aujourdhui || toISO(new Date());
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showMsg(el, kind, text) {
    el.className = `msg msg--${kind}`;
    el.textContent = text;
  }

  /* -----------------------------------------------------------------------
     2. État et stockage
     Dans Claude : base partagée (window.claude). Ailleurs (GitHub Pages,
     fichier local) : mode démo, stockage de l'onglet (sessionStorage).
     ----------------------------------------------------------------------- */
  const state = {
    db: null,
    assets: null,
    sorties: DATA.sorties.slice(),
    impact: { ...DATA.impact },
    photos: {},
    view: null,            /* mois affiché dans le calendrier */
    selectedDay: null,
    activeSortie: null,
    mapSel: null,
    adminTab: "insc"
  };
  const COLLECTIONS = ["inscriptions", "benevoles", "messages"];
  const TTL_MS = (DATA.conservationMinutes || 20) * 60000;

  const local = {
    mem: {},
    get(c) {
      try { return JSON.parse(sessionStorage.getItem(`ecop_${c}`) || "[]"); }
      catch { return this.mem[c] || []; }
    },
    put(c, arr) {
      this.mem[c] = arr;
      try { sessionStorage.setItem(`ecop_${c}`, JSON.stringify(arr)); } catch { /* stockage indisponible */ }
    },
    add(c, doc) {
      doc.id = `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      this.put(c, [...this.get(c), doc]);
    },
    purge(cut) { COLLECTIONS.forEach((c) => this.put(c, this.get(c).filter((d) => Date.parse(d.createdAt) >= cut))); },
    clear() { COLLECTIONS.forEach((c) => this.put(c, [])); }
  };

  async function save(collection, doc) {
    doc.createdAt = new Date().toISOString();
    if (state.db) { await state.db.collection(collection).add(doc); return "db"; }
    local.add(collection, doc);
    return "local";
  }

  async function listDocs(collection) {
    if (!state.db) return local.get(collection).slice().reverse();
    const snap = await state.db.collection(collection).orderBy("createdAt", "desc").limit(60).get();
    return snap.docs.map((d) => ({ ...(d.data() || {}), id: d.id }));
  }

  async function purgeOld() {
    const cut = Date.now() - TTL_MS;
    local.purge(cut);
    if (!state.db) return;
    for (const c of COLLECTIONS) {
      try {
        const snap = await state.db.collection(c).get();
        await Promise.all(snap.docs
          .filter((d) => !(Date.parse((d.data() || {}).createdAt) >= cut))
          .map((d) => state.db.collection(c).doc(d.id).delete().catch(() => {})));
      } catch { /* lecture refusée : rien à purger depuis cette vue */ }
    }
  }

  async function wipeAll() {
    local.clear();
    if (!state.db) return;
    for (const c of COLLECTIONS) {
      try {
        const snap = await state.db.collection(c).get();
        await Promise.all(snap.docs.map((d) => state.db.collection(c).doc(d.id).delete().catch(() => {})));
      } catch { /* ignoré */ }
    }
  }

  /* -----------------------------------------------------------------------
     3. Navigation (une page = une section, adresse #nom-de-page)
     ----------------------------------------------------------------------- */
  const pages = $$("[data-page]");
  const PAGE_IDS = pages.map((p) => p.id);
  const navToggle = $(".nav-toggle");
  const menu = $("#menu");

  function setMenu(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  }

  function showPage(id, { focus = true } = {}) {
    if (!PAGE_IDS.includes(id) || (id === "espace" && $("#navEspace").hidden)) id = "accueil";
    pages.forEach((p) => { p.hidden = p.id !== id; });
    $$("#menu a").forEach((a) => {
      if (a.getAttribute("href") === `#${id}`) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = id === "accueil" ? "ECO.P — Préserver le monde jurassien"
      : `${$(`#${id} h1`).textContent.split(/[.:]/)[0].trim()} — ECO.P`;
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (focus) $(`#${id} h1`)?.focus({ preventScroll: true });
    if (id === "sorties") mapShown();
    if (id === "espace") renderAdmin();
    revealVisible();
  }

  function routeFromHash(opts) {
    const id = location.hash.slice(1);
    if (PAGE_IDS.includes(id)) showPage(id, opts);
  }

  navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); navToggle.focus(); }
  });
  window.addEventListener("hashchange", () => routeFromHash());

  /* -----------------------------------------------------------------------
     4. Rendus
     ----------------------------------------------------------------------- */
  function renderImpact() {
    $$("[data-impact]").forEach((dd) => { dd.textContent = nf(state.impact[dd.dataset.impact] ?? 0); });
  }

  function renderBudget() {
    $("#budget").innerHTML = DATA.budget.map((b) => `
      <li>
        <span>${esc(b.poste)}</span>
        <span class="budget__track" aria-hidden="true"><span class="budget__fill" style="width:${Number(b.part)}%"></span></span>
        <span class="budget__pc">${Number(b.part)} %</span>
      </li>`).join("");
  }

  const tplSortie = $("#tpl-sortie");

  function sortieCard(s, i = 0) {
    const node = tplSortie.content.firstElementChild.cloneNode(true);
    const act = DATA.activites[s.type] || { label: "Sortie", photo: "", alt: "" };
    const slot = (name) => $(`[data-slot="${name}"]`, node);
    const img = $("img", node);
    img.src = state.photos[s.id] || act.photo;
    img.alt = state.photos[s.id] ? `Photo de la sortie : ${s.titre}` : act.alt;
    node.style.setProperty("--i", i);
    slot("type").textContent = act.label;
    slot("titre").textContent = s.titre;
    slot("quand").innerHTML = `<time datetime="${esc(s.date)}">${esc(fmtShort(s.date))}</time> · ${esc(s.horaire)}`;
    slot("lieu").textContent = s.lieu;
    slot("desc").textContent = s.desc || "";
    slot("acces").textContent = s.acces || "À préciser";
    slot("places").textContent = `${s.places} places`;
    slot("srtitre").textContent = ` : ${s.titre}, ${fmtLong(s.date)}`;
    $("[data-sortie]", node).dataset.sortie = s.id;
    return node;
  }

  function fillGrid(container, list, emptyText) {
    container.replaceChildren();
    if (!list.length) { container.innerHTML = `<p class="empty-note">${esc(emptyText)}</p>`; return; }
    list.forEach((s, i) => container.appendChild(sortieCard(s, i)));
    observeReveal(container);
  }

  const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  function renderNext() {
    const today = todayISO();
    let list = state.sorties.filter((s) => s.date >= today).sort(byDate).slice(0, 3);
    if (!list.length) list = state.sorties.slice().sort(byDate).slice(-3);
    fillGrid($("#nextSorties"), list, "Le prochain programme arrive bientôt.");
  }

  function renderSpots() {
    const today = todayISO();
    const next = state.sorties.filter((s) => s.coord && s.date >= today).sort(byDate).slice(0, 4);
    $("#spotList").innerHTML =
      next.map((s) => `
        <li><button class="spot" type="button" data-pin="${esc(s.id)}">
          <span class="spot__mark" aria-hidden="true"></span>${esc(s.lieu)}
          <small>${esc(fmtShort(s.date))} · ${esc(s.titre)}</small>
        </button></li>`).join("") +
      DATA.lieuxReperes.map((l, i) => `
        <li><button class="spot spot--repere" type="button" data-spot="${i}">
          <span class="spot__mark" aria-hidden="true"></span>${esc(l.lieu)}
          <small>Lieu repéré · ${esc(l.nom)} — ${esc(l.note)}</small>
        </button></li>`).join("");
  }

  /* -----------------------------------------------------------------------
     5. Calendrier
     ----------------------------------------------------------------------- */
  const sortiesDu = (iso) => state.sorties.filter((s) => s.date === iso);

  function renderCalendar() {
    const y = state.view.getFullYear(), m = state.view.getMonth();
    $("#calTitle").textContent = `${MOIS[m]} ${y}`;
    const offset = weekday(new Date(y, m, 1));
    const nDays = new Date(y, m + 1, 0).getDate();
    const today = todayISO();
    let html = JOURS_COURTS.map((j, i) => `<span class="cal__dow" aria-hidden="true" title="${JOURS_LONGS[i]}">${j}</span>`).join("");
    html += '<span class="day day--blank" aria-hidden="true"></span>'.repeat(offset);
    for (let d = 1; d <= nDays; d++) {
      const iso = toISO(new Date(y, m, d));
      const n = sortiesDu(iso).length;
      const current = iso === today ? ' aria-current="date"' : "";
      const label = `${fmtLong(iso)} : ${n ? `${n} sortie${n > 1 ? "s" : ""}` : "pas de sortie"}`;
      html += `<button class="day${n ? " day--has" : ""}" type="button" data-day="${iso}" aria-pressed="${state.selectedDay === iso}"${current}
             aria-label="${esc(label)}">${d}${n ? '<span class="day__dot" aria-hidden="true"></span>' : ""}</button>`;
    }
    $("#calGrid").innerHTML = html;
  }

  function selectDay(iso) {
    state.selectedDay = iso;
    renderCalendar();
    const list = sortiesDu(iso);
    $("#dayTitle").textContent = list.length
      ? `${list.length} sortie${list.length > 1 ? "s" : ""} le ${fmtShort(iso)}`
      : "Aucune sortie ce jour-là";
    if (list.length) { fillGrid($("#dayList"), list, ""); return; }
    const next = state.sorties.filter((s) => s.date > iso).sort(byDate)[0];
    $("#dayList").innerHTML = next
      ? `<div class="card">
           <p class="muted">Pas de sortie prévue ce jour-là.</p>
           <p class="mt-2">Prochaine sortie : <strong>${esc(fmtShort(next.date))}</strong> — ${esc(next.titre)}.</p>
           <div class="cta-row mt-3"><button class="btn btn--small" type="button" data-day-go="${esc(next.date)}">Voir ce jour</button></div>
         </div>`
      : '<p class="empty-note">Pas de sortie prévue ce jour-là, ni après pour l\'instant.</p>';
  }

  function showMonthOf(iso) {
    const d = parseISO(iso);
    state.view = new Date(d.getFullYear(), d.getMonth(), 1);
  }

  $("#calGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-day]");
    if (b) selectDay(b.dataset.day);
  });
  $("#dayList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-day-go]");
    if (b) { showMonthOf(b.dataset.dayGo); selectDay(b.dataset.dayGo); }
  });
  $("#prevMonth").addEventListener("click", () => { state.view.setMonth(state.view.getMonth() - 1); renderCalendar(); });
  $("#nextMonth").addEventListener("click", () => { state.view.setMonth(state.view.getMonth() + 1); renderCalendar(); });

  function goToSortie(s, { openForm = false } = {}) {
    if (location.hash !== "#sorties") { history.replaceState(null, "", "#sorties"); showPage("sorties", { focus: false }); }
    state.mapSel = s.id;
    showMonthOf(s.date);
    selectDay(s.date);
    drawOverlay();
    if (openForm) openInscription(s);
    else $("#sortiesLayout").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  }

  /* -----------------------------------------------------------------------
     6. Formulaires
     ----------------------------------------------------------------------- */
  function openInscription(s) {
    state.activeSortie = s;
    $("#inscTitre").textContent = `Inscription : ${s.titre}`;
    $("#inscSub").textContent = `${fmtLong(s.date)} · ${s.horaire} · ${s.lieu}`;
    $("#formInscription").hidden = false;
    $("#inscMsg").textContent = "";
    $("#inscriptionBox").classList.add("is-active");
    $("#inscription").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    setTimeout(() => $("#i-nom").focus({ preventScroll: true }), reduceMotion() ? 0 : 400);
  }

  $("#cancelInsc").addEventListener("click", () => {
    $("#formInscription").hidden = true;
    $("#inscriptionBox").classList.remove("is-active");
    $("#inscTitre").textContent = "Choisis d'abord une sortie";
    $("#inscSub").textContent = "Clique sur « Je m'inscris » dans une des cartes ci-dessus.";
    state.activeSortie = null;
  });

  function formData(form) {
    const out = {};
    Array.from(form.elements).forEach((el) => {
      if (el.name) out[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
    });
    return out;
  }

  function bindForm(formId, collection, msgId, okText, enrich) {
    const form = document.getElementById(formId);
    const msg = document.getElementById(msgId);
    const btn = $('button[type="submit"]', form);
    const label = btn.textContent;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        const first = $(":invalid", form);
        showMsg(msg, "err", "Certains champs obligatoires sont vides ou incorrects.");
        first?.focus();
        form.reportValidity();
        return;
      }
      btn.disabled = true; btn.textContent = "Envoi…";
      const doc = formData(form);
      if (enrich) enrich(doc);
      try {
        const where = await save(collection, doc);
        showMsg(msg, "ok", where === "db" ? okText
          : `${okText} (Mode démonstration : la réponse reste sur cet appareil et disparaît à la fermeture de l'onglet.)`);
        form.reset();
      } catch (err) {
        showMsg(msg, "err", `L'envoi a échoué (${err?.code || "erreur"}). Réessaie ou écris-nous à contact@ecop-asso.fr.`);
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
  }

  bindForm("formInscription", "inscriptions", "inscMsg", "Inscription enregistrée. On te confirme la place par e-mail sous 48 h.", (d) => {
    const s = state.activeSortie;
    if (s) Object.assign(d, { sortieId: s.id, sortieTitre: s.titre, sortieDate: s.date, sortieLieu: s.lieu });
  });
  bindForm("formBenevole", "benevoles", "benevMsg", "Candidature reçue. On te rappelle sous une semaine.");
  bindForm("formContact", "messages", "contactMsg", "Message envoyé. Réponse sous 48 h en général.");

  /* Copier une adresse ou un numéro */
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    const status = $("#copyStatus");
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      b.textContent = "Copié";
      status.textContent = "Copié dans le presse-papiers.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById(b.getAttribute("aria-describedby")));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      status.textContent = "Texte sélectionné : utilise Ctrl + C pour le copier.";
    }
    setTimeout(() => { b.textContent = "Copier"; }, 2000);
  });

  /* Clics : « Je m'inscris », pins de la carte et liste des lieux */
  document.addEventListener("click", (e) => {
    if (mapView.dragged && e.target.closest("#jmap")) return;
    const ins = e.target.closest("[data-sortie]");
    if (ins) { const s = state.sorties.find((x) => x.id === ins.dataset.sortie); if (s) goToSortie(s, { openForm: true }); return; }
    const pin = e.target.closest("[data-pin]");
    if (pin) { const s = state.sorties.find((x) => x.id === pin.dataset.pin); if (s) goToSortie(s); return; }
    const spot = e.target.closest("[data-spot]");
    if (spot) showRepere(DATA.lieuxReperes[Number(spot.dataset.spot)]);
  });

  function showRepere(l) {
    if (!l) return;
    $("#dayTitle").textContent = `${l.nom} — ${l.lieu}`;
    $("#dayList").innerHTML = `
      <div class="card">
        <p class="eyebrow">Lieu repéré</p>
        <p class="mt-2">${esc(l.note)}</p>
        <p class="muted mt-2">Pas encore de date. Tu veux nous aider à l'organiser ?</p>
        <div class="cta-row mt-3"><a class="btn btn--small" href="#contact">Proposer une date</a></div>
      </div>`;
    $("#sortiesLayout").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  }

  /* -----------------------------------------------------------------------
     7. Espace asso (onglets accessibles : flèches gauche / droite)
     ----------------------------------------------------------------------- */
  const tabs = () => $$('#adminTabs [role="tab"]').filter((t) => !t.hidden);

  function selectTab(tab, focus) {
    tabs().forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    $("#adminPanel").setAttribute("aria-labelledby", tab.id);
    state.adminTab = tab.dataset.tab;
    if (focus) tab.focus();
    renderAdmin();
  }

  $("#adminTabs").addEventListener("click", (e) => { const t = e.target.closest('[role="tab"]'); if (t) selectTab(t); });
  $("#adminTabs").addEventListener("keydown", (e) => {
    const list = tabs(), i = list.indexOf(document.activeElement);
    if (i < 0) return;
    const go = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (go === undefined) return;
    e.preventDefault();
    selectTab(list[(go + list.length) % list.length], true);
  });

  async function renderAdmin() {
    const panel = $("#adminPanel");
    const tab = state.adminTab;

    if (tab === "add") {
      panel.innerHTML = `
        <div class="form-box">
          <h2 class="h3-size">Ajouter une sortie au calendrier</h2>
          <form id="formSortie" class="mt-4">
            <div class="form-row">
              <div class="field"><label for="a-titre">Titre</label><input id="a-titre" name="titre" required></div>
              <div class="field"><label for="a-lieu">Lieu</label><input id="a-lieu" name="lieu" placeholder="Commune (dép.)" required></div>
            </div>
            <div class="form-row">
              <div class="field"><label for="a-date">Date</label><input id="a-date" name="date" type="date" required></div>
              <div class="field"><label for="a-horaire">Horaire</label><input id="a-horaire" name="horaire" placeholder="9h30 – 12h30" required></div>
            </div>
            <div class="form-row">
              <div class="field"><label for="a-type">Activité</label>
                <select id="a-type" name="type">${Object.entries(DATA.activites).map(([k, a]) => `<option value="${k}">${esc(a.label)}</option>`).join("")}</select></div>
              <div class="field"><label for="a-places">Places</label><input id="a-places" name="places" type="number" min="1" value="20"></div>
            </div>
            <div class="field"><label for="a-acces">Accessibilité</label><input id="a-acces" name="acces" placeholder="Fauteuil, rythme doux…"></div>
            <div class="field"><label for="a-desc">Description</label><textarea id="a-desc" name="desc"></textarea></div>
            <button class="btn" type="submit">Publier la sortie</button>
            <div class="msg" id="addMsg" role="status"></div>
          </form>
        </div>`;
      $("#formSortie").addEventListener("submit", async (e) => {
        e.preventDefault();
        const d = formData(e.target);
        d.places = Number(d.places) || 20;
        d.createdAt = new Date().toISOString();
        try {
          if (state.db) { const ref = await state.db.collection("activites").add(d); d.id = ref.id; }
          else d.id = `m${Date.now().toString(36)}`;
          state.sorties.push(d);
          renderCalendar(); renderNext(); renderSpots(); drawOverlay();
          showMsg($("#addMsg"), "ok", state.db ? "Sortie ajoutée au calendrier." : "Sortie ajoutée (mode démonstration : elle disparaît au rechargement).");
          e.target.reset();
        } catch (err) { showMsg($("#addMsg"), "err", `Échec : ${err?.code || "erreur"}`); }
      });
      return;
    }

    if (tab === "stats") {
      const i = state.impact;
      const field = (k, l) => `<div class="field"><label for="st-${k}">${l}</label><input id="st-${k}" name="${k}" type="number" min="0" value="${i[k]}"></div>`;
      panel.innerHTML = `
        <div class="form-box">
          <h2 class="h3-size">Chiffres affichés sur la page d'accueil</h2>
          <form id="formStats" class="mt-4">
            <div class="form-row">${field("kg", "Kg collectés")}${field("sorties", "Sorties")}</div>
            <div class="form-row">${field("participants", "Participants")}${field("benevoles", "Bénévoles")}</div>
            <button class="btn" type="submit">Enregistrer</button>
            <div class="msg" id="statMsg" role="status"></div>
          </form>
        </div>`;
      $("#formStats").addEventListener("submit", async (e) => {
        e.preventDefault();
        const d = formData(e.target);
        const next = { kg: +d.kg, sorties: +d.sorties, participants: +d.participants, benevoles: +d.benevoles };
        try {
          if (state.db) await state.db.doc("stats/impact").set(next);
          state.impact = next; renderImpact();
          showMsg($("#statMsg"), "ok", state.db ? "Chiffres mis à jour." : "Chiffres mis à jour (mode démonstration).");
        } catch (err) { showMsg($("#statMsg"), "err", `Échec : ${err?.code || "erreur"}`); }
      });
      return;
    }

    if (tab === "photos") {
      panel.innerHTML = `
        <div class="form-box">
          <h2 class="h3-size">Photo d'une sortie</h2>
          <p class="muted">La photo remplace l'image de l'activité sur la carte de la sortie. JPG ou PNG, 20 Mo maximum.</p>
          <form id="formPhoto" class="mt-4">
            <div class="field"><label for="ph-sortie">Sortie</label>
              <select id="ph-sortie">${state.sorties.map((s) => `<option value="${esc(s.id)}">${esc(fmtShort(s.date))} — ${esc(s.titre)}</option>`).join("")}</select></div>
            <div class="field"><label for="ph-file">Fichier</label><input id="ph-file" type="file" accept="image/*" required></div>
            <button class="btn" type="submit">Envoyer la photo</button>
            <div class="msg" id="phMsg" role="status"></div>
          </form>
        </div>`;
      $("#formPhoto").addEventListener("submit", async (e) => {
        e.preventDefault();
        const file = $("#ph-file").files[0], id = $("#ph-sortie").value;
        if (!file || !state.assets) return;
        showMsg($("#phMsg"), "warn", "Envoi en cours…");
        try {
          const a = await state.assets.upload(file);
          await state.db.doc(`photos/${id}`).set({ url: a.url, assetId: a.id });
          state.photos[id] = a.url;
          renderNext(); if (state.selectedDay) selectDay(state.selectedDay);
          showMsg($("#phMsg"), "ok", "Photo ajoutée à la sortie.");
        } catch (err) { showMsg($("#phMsg"), "err", `Échec : ${err?.code || "erreur"}`); }
      });
      return;
    }

    /* Listes : inscriptions, bénévoles, messages */
    const coll = { insc: "inscriptions", benev: "benevoles", msg: "messages" }[tab];
    const head = `
      <div class="msg msg--warn cta-row cta-row--center">
        <span>Mode démo : tout ce qui date de plus de ${DATA.conservationMinutes} minutes est effacé automatiquement${state.db ? "." : ", et tout disparaît à la fermeture de l'onglet."}</span>
        <button class="btn btn--small" type="button" id="wipeNow">Tout effacer maintenant</button>
      </div>`;
    panel.innerHTML = '<p class="empty-note">Chargement…</p>';
    try {
      const docs = await listDocs(coll);
      const line2 = (d) => coll === "inscriptions"
        ? [d.sortieTitre, d.sortieDate && fmtShort(d.sortieDate), `${d.participants || 1} pers.`, d.besoin, d.transport]
        : coll === "benevoles" ? [d.departement, d.role, d.dispo] : [d.sujet];
      panel.innerHTML = head + (docs.length
        ? `<p class="eyebrow">${docs.length} entrée${docs.length > 1 ? "s" : ""}</p>` + docs.map((d) => `
          <article class="entry">
            <div class="entry__head"><span>${esc(d.nom || "—")}</span><span class="muted">${d.createdAt ? esc(new Date(d.createdAt).toLocaleString("fr-FR")) : ""}</span></div>
            <p class="muted">${esc(d.email || "")}${d.tel ? ` · ${esc(d.tel)}` : ""}</p>
            <p class="muted">${line2(d).filter(Boolean).map(esc).join(" · ")}</p>
            ${d.message || d.competences ? `<p class="mt-2">${esc(d.message || d.competences)}</p>` : ""}
          </article>`).join("")
        : '<p class="empty-note">Rien pour le moment.</p>');
      $("#wipeNow").addEventListener("click", async (ev) => {
        ev.currentTarget.disabled = true;
        await wipeAll();
        renderAdmin();
      });
    } catch (err) {
      panel.innerHTML = `<div class="msg msg--err">Lecture impossible (${esc(err?.code || "erreur")}).</div>`;
    }
  }

  /* -----------------------------------------------------------------------
     8. Carte zoomable
     Molette + Ctrl (ou pincer) pour zoomer, glisser pour se déplacer,
     clavier : flèches, + / −, 0 pour revenir à l'Ain.
     ----------------------------------------------------------------------- */
  const LABEL_PX = { massif: 24, terr: 11, "terr big": 15, region: 13.5, water: 11.5, peak: 10.5, city: 12, "city pref": 13 };
  const mapView = { vb: null, refW: 1, moved: false, dragged: false, built: false, preset: "ain" };
  const pj = (c) => [(c[0] - MAP.lon0) * MAP.ck * MAP.k, (MAP.lat1 - c[1]) * MAP.k];
  const mapBox = () => document.getElementById("jmapBox");
  const mapAspect = () => { const el = mapBox(); return el && el.clientWidth ? el.clientHeight / el.clientWidth : 0.75; };

  function fitBox(b) {
    const p0 = pj([b[0], b[3]]), p1 = pj([b[2], b[1]]);
    let w = p1[0] - p0[0], h = p1[1] - p0[1];
    const cx = (p0[0] + p1[0]) / 2, cy = (p0[1] + p1[1]) / 2, asp = mapAspect();
    if (h / w > asp) w = h / asp; else h = w * asp;
    return [cx - w / 2, cy - h / 2, w, h];
  }

  function clampVB(v) {
    const asp = mapAspect();
    const w = Math.min(Math.max(v[2], mapView.refW / 3), Math.min(MAP.w, MAP.h / asp)), h = w * asp;
    const cx = v[0] + v[2] / 2, cy = v[1] + v[3] / 2;
    return [Math.min(Math.max(cx - w / 2, 0), MAP.w - w), Math.min(Math.max(cy - h / 2, 0), MAP.h - h), w, h];
  }

  function setVB(v) {
    mapView.vb = clampVB(v);
    $("#jmap")?.setAttribute("viewBox", mapView.vb.map((n) => n.toFixed(1)).join(" "));
    drawOverlay();
  }

  function goPreset(name) {
    mapView.preset = name;
    mapView.refW = fitBox(MAP.presets.ain)[2];
    setVB(fitBox(MAP.presets[name]));
  }

  function zoomAt(f, px, py) {
    const v = mapView.vb, el = mapBox();
    if (!v || !el) return;
    const cw = el.clientWidth || 1, ch = el.clientHeight || 1;
    if (px == null) { px = cw / 2; py = ch / 2; }
    const mx = v[0] + (px / cw) * v[2], my = v[1] + (py / ch) * v[3];
    const w = v[2] / f, h = v[3] / f;
    mapView.moved = true; mapView.preset = null;
    setVB([mx - (px / cw) * w, my - (py / ch) * h, w, h]);
  }

  function pan(dx, dy) {
    const v = mapView.vb;
    mapView.moved = true; mapView.preset = null;
    setVB([v[0] + dx * v[2], v[1] + dy * v[3], v[2], v[3]]);
  }

  function drawOverlay() {
    const g = document.getElementById("jover"), el = mapBox();
    if (!g || !mapView.vb) return;
    let u = mapView.vb[2] / ((el && el.clientWidth) || 1000);          /* unités de carte par pixel */
    if (el && el.clientWidth && el.clientWidth < 600) u *= 0.86;
    const z = mapView.refW / mapView.vb[2];
    const n = (v) => (v * u).toFixed(2);
    const f1 = (v) => v.toFixed(1);
    let out = "";

    LABELS.forEach((l) => {
      if ((l.min != null && z < l.min) || (l.max != null && z > l.max)) return;
      const [x, y] = pj(l.c), kind = l.k.split(" ")[0];
      let tx = x, ty = y, anchor = "middle";
      if (kind === "city") {
        out += l.k.includes("pref")
          ? `<rect x="${f1(x - 4.5 * u)}" y="${f1(y - 4.5 * u)}" width="${n(9)}" height="${n(9)}" fill="var(--map-label)" stroke="var(--map-halo)" stroke-width="${n(1.5)}"/>`
          : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${n(3.6)}" fill="var(--map-label)" stroke="var(--map-halo)" stroke-width="${n(1.4)}"/>`;
        tx = x + (l.dx ?? 9) * u; ty = y + (l.dy ?? 4) * u; anchor = l.a || "start";
      } else if (kind === "peak") {
        out += `<path d="M${f1(x)},${f1(y - 6 * u)} l${n(6)},${n(10)} h${n(-12)} Z" fill="var(--map-peak)"/>`;
        tx = x + (l.dx ?? 9) * u; ty = y + (l.dy ?? 3) * u; anchor = l.a || "start";
      }
      const rot = l.rot ? ` transform="rotate(${l.rot} ${f1(tx)} ${f1(ty)})"` : "";
      const cls = `am-${kind}${l.k.includes("pref") ? " pref" : ""}${l.k.includes("big") ? " big" : ""}`;
      out += `<text x="${f1(tx)}" y="${f1(ty)}" text-anchor="${anchor}" class="${cls}" style="font-size:${n(LABEL_PX[l.k] || 12)}px;stroke-width:${n(kind === "massif" ? 0 : 3.2)}px"${rot}>${esc(l.t)}${l.alt ? ` <tspan class="am-alt">${l.alt} m</tspan>` : ""}</text>`;
    });

    DATA.lieuxReperes.forEach((l, i) => {
      const [x, y] = pj(l.coord);
      out += `<g class="pin" data-spot="${i}" tabindex="0" role="button" aria-label="Lieu repéré : ${esc(l.nom)}, ${esc(l.lieu)}">
        <circle class="pin__head" cx="${f1(x)}" cy="${f1(y)}" r="${n(7.5)}" fill="var(--map-halo)" stroke="var(--lake)" stroke-width="${n(2.8)}"/></g>`;
    });
    state.sorties.filter((s) => s.coord).forEach((s) => {
      const [x, y] = pj(s.coord);
      out += `<g class="pin" data-pin="${esc(s.id)}" tabindex="0" role="button" aria-label="Sortie : ${esc(s.titre)}, ${esc(fmtLong(s.date))}, ${esc(s.lieu)}">
        ${state.mapSel === s.id ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="${n(17)}" fill="#E6A93C" opacity=".35"/>` : ""}
        <circle class="pin__head" cx="${f1(x)}" cy="${f1(y)}" r="${n(8.5)}" fill="#E6A93C" stroke="#173A30" stroke-width="${n(2.2)}"/></g>`;
    });

    g.innerHTML = out;
    const zl = $("#zoomLevel");
    if (zl) zl.textContent = `×${(Math.round(z * 10) / 10).toString().replace(".", ",")}`;
    $$(".map-presets [data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === mapView.preset)));
  }

  function buildMap() {
    $("#mapWrap").innerHTML = `
      <div class="mapstage" id="jmapBox" tabindex="0" role="group"
           aria-label="Carte interactive de l'Ain et du massif du Jura. Flèches pour se déplacer, plus et moins pour zoomer, zéro pour revenir à l'Ain."
           aria-describedby="mapHelp">
        <svg id="jmap" focusable="false" preserveAspectRatio="xMidYMid meet">
          <g id="jbase" aria-hidden="true">${MAP.svg}</g>
          <g id="jover"></g>
        </svg>
        <div class="map-presets" role="group" aria-label="Cadrages">
          <button type="button" data-preset="ain" aria-pressed="true">Ain</button>
          <button type="button" data-preset="jura" aria-pressed="false">Massif du Jura</button>
        </div>
        <div class="map-zoom" role="group" aria-label="Zoom">
          <button type="button" data-zoom="in" aria-label="Zoomer">+</button>
          <span class="map-zoom__level" id="zoomLevel" aria-hidden="true">×1</span>
          <button type="button" data-zoom="out" aria-label="Dézoomer">−</button>
        </div>
        <p class="map-hint" id="mapHint" hidden>Ctrl + molette (ou pincer) pour zoomer · glisser pour se déplacer</p>
        <p class="sr-only" id="mapHelp">La liste des lieux sous la carte donne les mêmes informations.</p>
      </div>`;

    const svg = $("#jmap"), box = mapBox();
    const ptrs = new Map();
    let start = null, hintTimer = null;

    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-preset]");
      if (b) { mapView.moved = true; goPreset(b.dataset.preset); return; }
      const zb = e.target.closest("[data-zoom]");
      if (zb) zoomAt(zb.dataset.zoom === "in" ? 1.5 : 1 / 1.5);
    });

    box.addEventListener("keydown", (e) => {
      const pin = e.target.closest?.(".pin");
      if (pin && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pin.dispatchEvent(new MouseEvent("click", { bubbles: true })); return; }
      if (e.target !== box) return;
      const k = e.key;
      const moves = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] };
      if (moves[k]) { e.preventDefault(); pan(...moves[k]); }
      else if (k === "+" || k === "=") { e.preventDefault(); zoomAt(1.5); }
      else if (k === "-" || k === "_") { e.preventDefault(); zoomAt(1 / 1.5); }
      else if (k === "0") { e.preventDefault(); goPreset("ain"); }
    });

    svg.addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const r = svg.getBoundingClientRect();
        zoomAt(Math.exp(-e.deltaY * 0.004), e.clientX - r.left, e.clientY - r.top);
      } else {
        const hint = $("#mapHint");
        hint.hidden = false;
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => { hint.hidden = true; }, 1600);
      }
    }, { passive: false });

    svg.addEventListener("dblclick", (e) => {
      const r = svg.getBoundingClientRect();
      zoomAt(1.8, e.clientX - r.left, e.clientY - r.top);
    });

    svg.addEventListener("pointerdown", (e) => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) start = { x: e.clientX, y: e.clientY, vb: mapView.vb.slice(), moved: false };
      else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        start = { pinch: true, d: Math.hypot(a.x - b.x, a.y - b.y), vb: mapView.vb.slice(), moved: true };
      }
    });

    svg.addEventListener("pointermove", (e) => {
      if (!ptrs.has(e.pointerId) || !start) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const cw = box.clientWidth || 1, ch = box.clientHeight || 1;
      if (start.pinch && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], r = svg.getBoundingClientRect();
        const f = Math.hypot(a.x - b.x, a.y - b.y) / (start.d || 1);
        const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
        const v = start.vb, w = v[2] / f, h = v[3] / f;
        const gx = v[0] + (mx / cw) * v[2], gy = v[1] + (my / ch) * v[3];
        mapView.moved = true; mapView.preset = null;
        setVB([gx - (mx / cw) * w, gy - (my / ch) * h, w, h]);
      } else if (!start.pinch) {
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!start.moved && Math.hypot(dx, dy) < 5) return;
        if (!start.moved) { try { svg.setPointerCapture(e.pointerId); } catch { /* ignoré */ } }
        start.moved = true;
        svg.classList.add("is-dragging");
        const k = start.vb[2] / cw;
        mapView.moved = true; mapView.preset = null;
        setVB([start.vb[0] - dx * k, start.vb[1] - dy * k, start.vb[2], start.vb[3]]);
      }
    });

    const endPointer = (e) => {
      ptrs.delete(e.pointerId);
      if (start?.moved) { mapView.dragged = true; setTimeout(() => { mapView.dragged = false; }, 0); }
      if (!ptrs.size) { start = null; svg.classList.remove("is-dragging"); }
    };
    svg.addEventListener("pointerup", endPointer);
    svg.addEventListener("pointercancel", endPointer);

    window.addEventListener("resize", () => {
      if (!mapView.vb) return;
      mapView.refW = fitBox(MAP.presets.ain)[2];
      setVB(mapView.vb);
    });
    mapView.built = true;
  }

  function mapShown() {
    if (!mapView.built) return;
    requestAnimationFrame(() => {
      mapView.refW = fitBox(MAP.presets.ain)[2];
      if (!mapView.moved) goPreset("ain"); else setVB(mapView.vb);
    });
  }

  function initMap() {
    buildMap();
    mapView.refW = fitBox(MAP.presets.ain)[2];
    mapView.vb = fitBox(MAP.presets.ain);
    $("#jmap").setAttribute("viewBox", mapView.vb.join(" "));
    drawOverlay();
  }

  /* -----------------------------------------------------------------------
     9. Apparition au défilement
     Les éléments déjà visibles au chargement s'affichent tout de suite ;
     filet de sécurité : tout est visible au bout de 1,5 s quoi qu'il arrive.
     ----------------------------------------------------------------------- */
  const io = "IntersectionObserver" in window && !reduceMotion()
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 })
    : null;

  function observeReveal(root = document) {
    $$(".reveal:not(.is-visible)", root).forEach((el) => {
      if (io) io.observe(el); else el.classList.add("is-visible");
    });
  }
  function revealVisible() {
    const h = window.innerHeight;
    $$(".reveal:not(.is-visible)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.top < h && r.bottom > 0) el.classList.add("is-visible");
    });
  }

  /* -----------------------------------------------------------------------
     10. Démarrage
     ----------------------------------------------------------------------- */
  function firstDayToShow() {
    const today = todayISO();
    const next = state.sorties.filter((s) => s.date >= today).sort(byDate)[0] || state.sorties.slice().sort(byDate)[0];
    return next ? next.date : today;
  }

  function init() {
    renderImpact();
    renderBudget();
    renderNext();
    renderSpots();
    const first = firstDayToShow();
    showMonthOf(first);
    selectDay(first);
    initMap();

    observeReveal();
    const initial = location.hash.slice(1);
    showPage(PAGE_IDS.includes(initial) ? initial : "accueil", { focus: false });
    revealVisible();
    setTimeout(() => $$(".reveal").forEach((el) => el.classList.add("is-visible")), 1500);

    purgeOld();
    setInterval(purgeOld, 60000);

    /* Hors de Claude : l'espace asso fonctionne en mode démo */
    if (!(window.claude && typeof window.claude.use === "function")) {
      $("#navEspace").hidden = false;
      return;
    }
    connectClaude();
  }

  /* Dans Claude : base partagée, photos, droits d'édition */
  async function connectClaude() {
    try {
      const db = await window.claude.use("db");
      if (db) {
        state.db = db;
        purgeOld();
        const st = await db.doc("stats/impact").get().catch(() => null);
        if (st?.exists) { state.impact = { ...DATA.impact, ...st.data() }; renderImpact(); }
        const acts = await db.collection("activites").get().catch(() => null);
        acts?.docs.forEach((d) => { const s = { ...(d.data() || {}), id: d.id }; if (s.date && s.titre) state.sorties.push(s); });
        const ph = await db.collection("photos").get().catch(() => null);
        ph?.docs.forEach((d) => { const v = d.data() || {}; if (v.url) state.photos[d.id] = v.url; });
        renderCalendar(); renderNext(); renderSpots(); drawOverlay();
        if (state.selectedDay) selectDay(state.selectedDay);
      }
    } catch { /* mode démo */ }
    window.claude.use("assets").then((a) => { state.assets = a || null; $("#tab-photos").hidden = !a; }).catch(() => {});
    window.claude.use("user").then(async (u) => {
      if (u && await u.canEdit()) $("#navEspace").hidden = false;
    }).catch(() => {});
  }

  init();
})();
