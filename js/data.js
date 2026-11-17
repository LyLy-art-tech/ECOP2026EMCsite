/* =========================================================================
   ECO.P — contenus du site
   -------------------------------------------------------------------------
   C'est ICI qu'on modifie les sorties, les lieux repérés, les chiffres
   d'impact et le budget. Règle d'or : pas de guillemets droits " dans les
   textes (utiliser « » à la place). Les apostrophes ' ne posent pas de souci.
   ========================================================================= */
window.ECOP_DATA = {

  /* Date de référence pour « prochaines sorties ».
     null = date du jour. Pour une démo figée : "2026-09-23". */
  aujourdhui: null,

  /* Activités : libellé, photo et texte alternatif de la photo */
  activites: {
    kayak: { label: "Canoë-kayak",    photo: "images/activite-kayak.webp", alt: "Une personne pagaie en kayak rouge sur un lac calme au coucher du soleil" },
    voile: { label: "Bateau à voile", photo: "images/activite-voile.webp", alt: "Un voilier blanc navigue sur un grand lac sous un ciel bleu" },
    rando: { label: "Randonnée",      photo: "images/activite-rando.webp", alt: "Des randonneurs avec bâtons montent un sentier de montagne rocailleux" },
    accro: { label: "Accrobranche",   photo: "images/activite-accro.webp", alt: "Une personne casquée avance sur un parcours d'accrobranche entre les sapins" },
    raquette: { label: "Raquettes",         photo: "images/activite-raquette.webp", alt: "Trois paires de raquettes à neige plantées dans la neige devant une forêt de sapins" },
    balade:   { label: "Balade dans la neige", photo: "images/activite-balade.webp", alt: "Une adulte et un enfant marchent main dans la main dans la neige, le long d'une forêt" },
    luge:     { label: "Luge",              photo: "images/activite-luge.webp",     alt: "Une personne casquée descend une pente enneigée sur une luge" },
    bonhomme: { label: "Bonhomme de neige", photo: "images/activite-bonhomme.webp", alt: "Un bonhomme de neige avec chapeau et écharpe devant des sapins" }
  },

  /* Programme des sorties — coord : [longitude, latitude] */
  sorties: [
    { id: "s1", type: "kayak", date: "2026-09-26", horaire: "9h30 – 12h30", places: 18, coord: [5.34, 46.05],
      titre: "Descente en canoë sur la rivière d'Ain", lieu: "Pont-d'Ain (01)",
      acces: "Transfert assisté, canoës biplaces stables",
      desc: "Descente tranquille de 6 km, avec ramassage des déchets coincés dans les berges." },
    { id: "s2", type: "rando", date: "2026-09-26", horaire: "14h00 – 16h30", places: 16, coord: [6.02, 46.37],
      titre: "Randonnée douce au col de la Faucille", lieu: "Gex (01)",
      acces: "Sentier large, joëlette disponible",
      desc: "Boucle de 3 km face au Léman et au Mont-Blanc, pauses fréquentes, sacs de collecte fournis." },
    { id: "s3", type: "voile", date: "2026-10-03", horaire: "9h00 – 13h00", places: 12, coord: [6.37, 46.37],
      titre: "Sortie voile sur le Léman", lieu: "Nernier (74)",
      acces: "Embarquement assisté, gilets adaptés",
      desc: "Navigation encadrée par un club partenaire, avec repêchage des plastiques flottants." },
    { id: "s4", type: "accro", date: "2026-10-10", horaire: "13h30 – 17h00", places: 14, coord: [5.82, 46.10],
      titre: "Accrobranche adapté au Crêt d'Eau", lieu: "Valserhône (01)",
      acces: "Parcours bas, harnais adaptés, moniteurs formés",
      desc: "Parcours dans les sapins, hauteur au choix, encadrement rapproché du début à la fin." },
    { id: "s5", type: "kayak", date: "2026-10-17", horaire: "10h00 – 15h00", places: 20, coord: [5.61, 46.15],
      titre: "Kayak sur le lac de Nantua", lieu: "Nantua (01)",
      acces: "Ponton accessible en fauteuil",
      desc: "Matinée sur l'eau au pied des falaises, pique-nique tiré du sac, nettoyage de la rive sud l'après-midi." },
    { id: "s6", type: "rando", date: "2026-10-24", horaire: "9h30 – 12h30", places: 22, coord: [5.75, 45.82],
      titre: "Marche et collecte au marais de Lavours", lieu: "Ceyzérieu (01)",
      acces: "Platelage en bois, entièrement accessible",
      desc: "Sentier sur pilotis dans l'une des dernières tourbières de France, avec un garde du marais." },
    { id: "s7", type: "accro", date: "2026-11-07", horaire: "13h00 – 16h30", places: 16, coord: [6.13, 46.36],
      titre: "Accrobranche & nettoyage de la forêt", lieu: "Divonne-les-Bains (01)",
      acces: "Parcours au sol possible pour les accompagnants",
      desc: "Une heure dans les arbres, une heure à ramasser au pied : les deux comptent autant." },
    { id: "s8", type: "voile", date: "2026-11-21", horaire: "10h00 – 14h00", places: 10, coord: [6.32, 46.37],
      titre: "Voile d'automne et nettoyage des rives", lieu: "Yvoire (74)",
      acces: "Bateau stable, sortie annulée si vent fort",
      desc: "Sortie courte pour les personnes fatiguées, suivie du nettoyage des rives du lac." },

    /* Sorties neige — hiver 2026-2027 */
    { id: "n1", type: "raquette", date: "2026-12-12", horaire: "10h00 – 15h00", places: 14, coord: [6.03, 46.39],
      titre: "Raquettes sur les crêtes du Jura", lieu: "La Vattay, Mijoux (01)",
      acces: "Raquettes fournies, boucle plate de 4 km, joëlette des neiges disponible",
      desc: "Première neige face au Mont-Blanc, pique-nique au chaud dans un refuge et ramassage des déchets laissés au bord des pistes." },
    { id: "n2", type: "balade", date: "2027-01-09", horaire: "14h00 – 16h30", places: 20, coord: [5.94, 46.30],
      titre: "Balade douce dans la neige à Lélex", lieu: "Lélex (01)",
      acces: "Chemin damé, accessible en fauteuil tout-terrain, pauses fréquentes",
      desc: "Promenade au fond de la vallée de la Valserine, chocolat chaud au retour, sacs de collecte pour les déchets cachés sous la neige." },
    { id: "n3", type: "luge", date: "2027-01-23", horaire: "13h30 – 16h30", places: 16, coord: [5.88, 46.18],
      titre: "Après-midi luge à Menthières", lieu: "Chézery-Forens (01)",
      acces: "Pente douce réservée, luges biplaces avec accompagnant, tapis de remontée",
      desc: "Descentes sur une piste réservée au groupe, puis nettoyage du parking et des abords de la station." },
    { id: "n4", type: "bonhomme", date: "2027-02-06", horaire: "10h00 – 12h30", places: 24, coord: [5.68, 46.03],
      titre: "Concours de bonhommes de neige", lieu: "Les Plans d'Hotonnes (01)",
      acces: "Espace plat près du parking, possible assis, abri chauffé à proximité",
      desc: "Construction par équipes avec des matériaux de récupération ramassés sur place : rien ne reste dans la nature après le concours." }
  ],

  /* Lieux repérés, pas encore programmés */
  lieuxReperes: [
    { nom: "Plateau de Retord",      lieu: "Le Grand-Abergement (01)", coord: [5.72, 46.08], note: "Alpages et sentiers larges — repérage fait, reste à trouver un transport" },
    { nom: "Lac Genin",              lieu: "Charix (01)",              coord: [5.62, 46.19], note: "Le « petit Canada » du Jura, idéal pour une sortie kayak calme" },
    { nom: "Vallée de la Valserine", lieu: "Bellegarde (01)",          coord: [5.87, 46.22], note: "Première rivière labellisée sauvage de France — collecte à organiser" },
    { nom: "Grand Colombier",        lieu: "Culoz (01)",               coord: [5.73, 45.90], note: "Montée en joëlette, nécessite 12 porteurs" },
    { nom: "Marais de Chautagne",    lieu: "Chindrieux (73)",          coord: [5.83, 45.85], note: "Zone humide, chantier nature au printemps" },
    { nom: "Plateau d'Hauteville",   lieu: "Hauteville-Lompnes (01)",  coord: [5.60, 45.98], note: "Contact pris avec un centre de rééducation" }
  ],

  /* Chiffres affichés sur l'accueil */
  impact: { kg: 1248, sorties: 36, participants: 412, benevoles: 58 },

  /* Répartition du budget (en %) */
  budget: [
    { poste: "Transport adapté",        part: 34 },
    { poste: "Encadrement & formation", part: 28 },
    { poste: "Matériel & sécurité",     part: 22 },
    { poste: "Assurance",               part: 9 },
    { poste: "Administratif",           part: 7 }
  ],

  /* Formulaires : durée de conservation en mode démo (minutes) */
  conservationMinutes: 20
};

/* =========================================================================
   Libellés de la carte
   min / max = niveau de zoom (1 = vue « Ain ») à partir duquel / jusqu'auquel
   le libellé s'affiche. k = type de libellé (voir style.css, .am-*)
   ========================================================================= */
window.ECOP_MAP_LABELS = [
  { t: "MASSIF DU JURA", c: [6.30, 46.88], k: "massif", rot: -47, max: 0.8 },
  { t: "AIN", c: [5.33, 46.16], k: "terr big", max: 0.8 },
  { t: "JURA", c: [5.60, 46.525], k: "terr", min: 0.8 }, { t: "JURA", c: [5.70, 46.86], k: "terr", max: 0.8 },
  { t: "DOUBS", c: [6.08, 47.40], k: "terr" }, { t: "HAUTE-SAÔNE", c: [6.05, 47.62], k: "terr" },
  { t: "CÔTE-D'OR", c: [4.98, 47.32], k: "terr" }, { t: "SAÔNE-ET-LOIRE", c: [4.80, 46.47], k: "terr" },
  { t: "RHÔNE", c: [4.74, 45.95], k: "terr" }, { t: "ISÈRE", c: [5.30, 45.62], k: "terr" },
  { t: "SAVOIE", c: [6.02, 45.62], k: "terr" }, { t: "HAUTE-SAVOIE", c: [6.30, 46.07], k: "terr" },
  { t: "SUISSE", c: [6.24, 46.47], k: "terr", min: 0.8 }, { t: "SUISSE", c: [7.25, 46.88], k: "terr", max: 0.8 },

  { t: "Bresse", c: [5.13, 46.36], k: "region", min: 0.8 }, { t: "Dombes", c: [5.04, 46.02], k: "region", min: 0.8 },
  { t: "Revermont", c: [5.47, 46.30], k: "region", min: 0.8 }, { t: "Bugey", c: [5.58, 45.84], k: "region", min: 0.8 },
  { t: "Pays de Gex", c: [6.10, 46.275], k: "region", min: 1.3 }, { t: "Côtière", c: [5.04, 45.86], k: "region", min: 0.8 },
  { t: "Haut-Jura", c: [5.98, 46.56], k: "region" }, { t: "Franches-Montagnes", c: [7.02, 47.25], k: "region", max: 1.3 },

  { t: "la Saône", c: [4.86, 46.17], k: "water", rot: -78 }, { t: "le Rhône", c: [5.47, 45.73], k: "water", rot: -10 },
  { t: "l'Ain", c: [5.385, 46.145], k: "water", rot: -66, min: 0.8 },
  { t: "la Valserine", c: [5.96, 46.235], k: "water", rot: -55, min: 1.3 },
  { t: "le Doubs", c: [5.76, 47.17], k: "water", rot: 18 },
  { t: "Lac Léman", c: [6.34, 46.39], k: "water", rot: -15, min: 0.8 }, { t: "Lac Léman", c: [6.62, 46.445], k: "water", rot: -6, max: 0.8 },
  { t: "Lac du Bourget", c: [5.87, 45.70], k: "water", rot: -75, min: 0.8 },
  { t: "Lac de Neuchâtel", c: [6.84, 46.90], k: "water", rot: -37 },

  { t: "Crêt de la Neige", c: [5.938, 46.272], k: "peak", alt: "1 720", min: 0.8 },
  { t: "Grand Colombier", c: [5.762, 45.903], k: "peak", alt: "1 534", min: 0.8 },
  { t: "La Dôle", c: [6.099, 46.426], k: "peak", alt: "1 677", min: 1.3 },
  { t: "Mont Tendre", c: [6.309, 46.594], k: "peak", alt: "1 679" },
  { t: "Mont d'Or", c: [6.355, 46.730], k: "peak", alt: "1 463", min: 0.5 },
  { t: "Chasseral", c: [7.059, 47.133], k: "peak", alt: "1 607" },

  { t: "Bourg-en-Bresse", c: [5.225, 46.205], k: "city pref", dx: 9, dy: -7 },
  { t: "Lyon", c: [4.835, 45.764], k: "city" }, { t: "Genève", c: [6.143, 46.204], k: "city", dy: 14 },
  { t: "Mâcon", c: [4.830, 46.307], k: "city" }, { t: "Chambéry", c: [5.918, 45.566], k: "city" },
  { t: "Annecy", c: [6.129, 45.899], k: "city" }, { t: "Lausanne", c: [6.633, 46.520], k: "city" },
  { t: "Besançon", c: [6.024, 47.238], k: "city pref" }, { t: "Lons-le-Saunier", c: [5.554, 46.674], k: "city pref" },
  { t: "Neuchâtel", c: [6.931, 46.990], k: "city", a: "end", dx: -9 }, { t: "Bâle", c: [7.588, 47.559], k: "city" },
  { t: "Bienne", c: [7.247, 47.137], k: "city", min: 0.6 }, { t: "Pontarlier", c: [6.355, 46.904], k: "city", min: 0.6 },
  { t: "Saint-Claude", c: [5.864, 46.387], k: "city", min: 0.6, dy: -6 }, { t: "Dole", c: [5.490, 47.092], k: "city", min: 0.6 },
  { t: "Oyonnax", c: [5.655, 46.257], k: "city", min: 0.8, dy: -6 },
  { t: "Nantua", c: [5.607, 46.153], k: "city", min: 0.8, a: "end", dx: -13, dy: -8 },
  { t: "Ambérieu-en-Bugey", c: [5.358, 45.958], k: "city", min: 0.8, a: "end", dx: -9 },
  { t: "Belley", c: [5.688, 45.759], k: "city", min: 0.8 },
  { t: "Gex", c: [6.058, 46.333], k: "city", min: 0.8, a: "end", dx: -9, dy: 14 },
  { t: "Valserhône", c: [5.825, 46.108], k: "city", min: 0.8, dx: 13, dy: 15 }
];
