# ECO.P — site de démonstration

Site statique (HTML, CSS, JavaScript), sans dépendance externe : les polices, les images et la carte sont dans le dossier.

## Structure

```
index.html          structure et textes des pages
css/style.css       toute la mise en forme (variables en tête de fichier)
js/data.js          sorties, lieux repérés, chiffres d'impact, budget, libellés de la carte
js/map-data.js      géométrie de la carte (fichier généré, ne pas modifier)
js/app.js           comportement : navigation, calendrier, formulaires, carte, animations
images/             photos, logo, relief de la carte, crêtes du Jura, texture de grain
fonts/              polices auto-hébergées (licence SIL OFL)
```

## Modifier un texte

- **Textes des pages** (accueil, l'asso, bénévoles, soutenir, contact) : dans `index.html`, chercher la phrase (Ctrl + F) et la remplacer.
- **Sorties, lieux repérés, chiffres, budget** : dans `js/data.js`. Chaque sortie tient sur quelques lignes (`titre`, `lieu`, `date`, `desc`…).
- Ne jamais mettre de guillemets droits `"` à l'intérieur d'un texte de `data.js` : utiliser « ».
- **Couleurs, tailles, espacements** : variables en haut de `css/style.css`.

## Mettre en ligne (GitHub Pages)

1. Créer un dépôt public et y déposer **tout le contenu de ce dossier** (pas seulement `index.html`).
2. Settings → Pages → Branch `main` → Save.
3. Le site est en ligne quelques minutes plus tard. Pour le retirer : supprimer le dépôt.

On peut aussi ouvrir `index.html` en double-cliquant dessus : tout fonctionne, en mode démonstration.

## Formulaires

En mode démonstration, les réponses restent dans l'onglet du navigateur et sont effacées à sa fermeture, ou au bout de 20 minutes. Rien n'est envoyé nulle part.

## Crédits

- Carte : départements IGN – Admin Express (Licence Ouverte 2.0) via france-geojson ; frontières, cantons, cours d'eau et lacs Natural Earth (domaine public) ; relief estompé extrait de NASA Blue Marble Shaded Relief (NASA Earth Observatory, via FreeTiler).
- Polices : Bricolage Grotesque, Karla, IBM Plex Mono — SIL Open Font License 1.1.
- Photos des activités : Canva.
