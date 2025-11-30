# RAPTOR ORBIT CARD

![Raptor Orbit Card – Aperçu](presentation.gif)

Carte Lovelace personnalisée pour Home Assistant affichant jusqu’à **8 entités**
sous forme de bulles orbitant autour d’un disque central.

- ✅ Supporte : `climate`, `cover`, `switch`, `light`, `input_boolean`,
  `sensor`, `gauge`…
- 🌀 Navigation par **swipe** ou **flèches** gauche / droite.
- 🖱️ Gestion du **tap** et de l’**appui long** (`toggle`, `more-info`, etc.).
- 🎨 Style “dashboard moderne” : disque légèrement oblique, effet 3D, bulles paramétrables.
- 🧩 Installation **HACS** (custom repository) ou manuelle.
- 🔤 Option `label_bold` pour afficher les noms d’entités en **gras**.

Auteur : **Inter-Raptor** (Vivien Jardot)  
Statut : **Bêta maison**

---

## 1. Installation

### 1.1. Via HACS (recommandé)

1. Dans Home Assistant, ouvrir **HACS → Frontend**.
2. Cliquer sur les **⋮ (trois points)** en haut à droite →  
   **Custom repositories**.
3. Ajouter le dépôt :

   - **URL** : `https://github.com/Inter-Raptor/raptor-orbit-card`
   - **Category** : `Frontend`

4. Dans HACS → **Frontend**, trouver **Raptor Orbit Card** et cliquer sur
   **Install**.
5. Redémarrer Home Assistant si nécessaire.

Puis ajouter la ressource (HACS s’en charge normalement tout seul, mais au cas où) :

```yaml
# Paramètres → Tableaux de bord → Ressources
url: /hacsfiles/raptor-orbit-card/raptor-orbit-card.js
type: module
```

---

### 1.2. Installation manuelle

1. Copier `raptor-orbit-card.js` dans :

   ```
   config/www/raptor-orbit-card.js
   ```

2. Ajouter la ressource Lovelace :

   - **Paramètres → Tableaux de bord → Ressources → Ajouter ressource**
   - URL : `/local/raptor-orbit-card.js`
   - Type : `JavaScript Module`

3. Recharger les ressources :

   - soit via **Paramètres → Outils de développement → Recharger les ressources**  
   - soit avec un **CTRL+F5** dans le navigateur.

> ⚠️ Ne pas oublier l’en-tête de commentaire `/* ... */` avant le logo ASCII
> dans le fichier JS, sinon une partie du logo sera interprétée comme du code.

---

## 2. Utilisation de base

Configuration minimale :

```yaml
type: custom:raptor-orbit-card
title: Pilotage maison
entities:
  - entity: climate.thermostat_rdc
  - entity: cover.volet_sejour
  - entity: switch.interrupteur_sejour
  - entity: sensor.thermometre_rdc_temperature
```

- Maximum **8 entités** par carte.
- Toutes les options sont **facultatives** : la carte applique des valeurs
  par défaut si rien n’est précisé.

---

## 3. Comportement général

- Les entités sont affichées en orbite autour d’un disque central.
- **Premier tap** sur une bulle :
  - Si ce n’est pas la bulle centrale → elle devient centrale.
- **Tap** sur la bulle déjà centrale :
  - Exécute `tap_action` (par défaut : `toggle` pour switch/cover,
    `more-info` sinon).
- **Appui long** :
  - Exécute `hold_action` (par défaut : `more-info`).

Le **swipe horizontal** (gauche/droite) permet aussi de changer de bulle active.

---

## 4. Options globales

Exemple complet (tout est optionnel) :

```yaml
type: custom:raptor-orbit-card

title: "Pilotage maison"
primary_entity: climate.thermostat_rdc

compact: false
transparent: false
show_title: true
show_status: true
show_arrows: true
show_hint: true
invert_swipe: false
invert_temps: false
auto_center_timeout: 0      # secondes, 0 = désactivé
main_scale: 1.1             # zoom bulle centrale

color_on: "#ff9800"
color_off: "#37474f"
disc_color: "#263238"
disc_color_dark: "#111318"
nav_color: "#455a64"

cover_fill_color: "#00bcd4"
gauge_default_color: "#4caf50"
gauge_direction: bottom_to_top

text_color: "#f5f5f5"
text_color_secondary: "rgba(245,245,245,0.78)"

shape: circle          # circle | square | hex
pattern: solid         # solid | stripes | dots
edge_style: liquid     # liquid | straight

font_header: 1
font_label: 1
font_temp: 1
font_current: 1

climate_color_heat: "#ff9800"
climate_color_cool: "#00bcd4"
climate_color_idle: "#37474f"

switch_color_on: "#ff9800"
switch_color_off: "#37474f"

label_bold: true       # met les noms d’entités en gras
```

Résumé des principales options :

- **`primary_entity`** : entité principale, utilisée pour le recentrage automatique.
- **`compact`** : `true` → carte plus basse.
- **`transparent`** : `true` → enlève le fond et l’ombre du `ha-card`.
- **`show_title` / `show_status`** : affichage du titre et du texte d’état.
- **`show_arrows`** : affiche les barres de navigation gauche / droite.
- **`show_hint`** : affiche un texte d’aide en bas de la carte.
- **`invert_swipe`** : inverse le sens du swipe.
- **`invert_temps`** (climate) :
  - `false` : consigne en gros, température actuelle en petit.
  - `true` : température actuelle en gros, consigne en petit.
- **`auto_center_timeout`** : délai avant recentrage sur `primary_entity`.
- **`shape` / `pattern` / `edge_style`** : style visuel des bulles.
- **`label_bold``** : met tous les `name` des entités en gras.

---

## 5. Configuration des entités

Chaque entrée dans `entities:` représente une bulle.

```yaml
entities:
  - entity: sensor.xxx
    name: Mon capteur
    mode: climate | cover | binary | sensor | gauge
    shape: circle | square | hex
    pattern: solid | stripes | dots
    edge_style: liquid | straight
    tap_action: more-info
    hold_action: more-info
    text_color: "#ffffff"
    text_color_secondary: "rgba(255,255,255,0.7)"
    value_map:
      home: "maison"
      not_home: "ailleurs"
```

Si `mode` n’est pas défini, la carte devine automatiquement :

- `climate.*` → `mode: climate`
- `cover.*` → `mode: cover`
- `switch.*` / `light.*` / `input_boolean.*` → `mode: binary`
- `sensor.*` → `mode: sensor`

### 5.1. Climate

```yaml
- entity: climate.thermostat_rdc
  name: Chauffage RDC
  mode: climate
  heat_color: "#ff9800"
  cool_color: "#00bcd4"
  idle_color: "#37474f"
  tap_action: more-info
  hold_action: more-info
```

---

### 5.2. Cover (volets)

```yaml
- entity: cover.volet_sejour
  name: Volet séjour
  mode: cover
  shape: hex
  pattern: stripes
  edge_style: straight
  cover_fill_color: "#00bcd4"
  gauge_direction: bottom_to_top
  tap_action: toggle
  hold_action: more-info
```

---

### 5.3. Binaire (switch / light / input_boolean)

```yaml
- entity: switch.interrupteur_sejour
  name: Prise séjour
  mode: binary
  shape: square
  pattern: solid
  edge_style: straight
  color_on: "#ff9800"
  color_off: "#37474f"
  tap_action: toggle
  hold_action: more-info
```

---

### 5.4. Gauge (jauge)

```yaml
- entity: sensor.courant_efficace_instantane
  name: Courant instantané
  mode: gauge
  min: 0
  max: 35
  gauge_direction: left_to_right
  shape: circle
  pattern: dots
  edge_style: straight
  gauge_color: "#4caf50"
  severities:
    - from: 0
      to: 10
      color: "#4caf50"
    - from: 10
      to: 20
      color: "#ff9800"
    - from: 20
      to: 35
      color: "#ff4336"
```

---

### 5.5. Sensor simple

```yaml
- entity: sensor.thermometre_rdc_temperature
  name: Température RDC
  mode: sensor
  min: 10
  max: 30
  severities:
    - from: 0
      to: 18
      color: "#2196f3"
    - from: 18
      to: 23
      color: "#4caf50"
    - from: 23
      to: 40
      color: "#ff4336"
```

---

### 5.6. Person / Tracker avec value_map

```yaml
- entity: person.myriam
  name: Myriam
  mode: sensor
  value_map:
    home: "maison"
    not_home: "ailleurs"
  tap_action: more-info
  hold_action: more-info
```

---

## 6. Exemples avec GIF

### 6.1. Mix – Pilotage général

![Mix](mix.gif)

```yaml
type: custom:raptor-orbit-card
title: Pilotage maison
primary_entity: climate.thermostat_rdc
color_on: "#ff9800"
color_off: "#37474f"
disc_color: "#263238"
disc_color_dark: "#111318"
nav_color: "#455a64"
label_bold: true
entities:
  - entity: climate.thermostat_rdc
    name: Chauffage RDC
    mode: climate
    primary: true
  - entity: sensor.thermometre_rdc_temperature
    name: Température RDC
    mode: sensor
  - entity: cover.volet_sejour
    name: Volet séjour
    mode: cover
  - entity: switch.interrupteur_sejour
    name: Prise séjour
    mode: binary
  - entity: person.myriam
    name: Myriam
    mode: sensor
    value_map:
      home: "maison"
```

---

### 6.2. Thermostat – Groupe de zones

![Thermostat](thermostat.gif)

```yaml
type: custom:raptor-orbit-card
title: Thermostat
primary_entity: climate.thermostat_rdc
invert_swipe: true
label_bold: true
entities:
  - entity: climate.thermostat_rdc
    name: Salon
    mode: climate
    primary: true
  - entity: climate.thermostat_chambre_gl
    name: Salle de jeu
    mode: climate
  - entity: climate.thermostat_sdb
    name: Salle de bain
    mode: climate
  - entity: climate.thermostat_chambre_parents
    name: Parents
    mode: climate
  - entity: climate.thermostat_chambre_maxence
    name: Maxence
    mode: climate
```

---

### 6.3. Commande switch – Atelier / bureau

![Commande bureau](bureau.gif)

```yaml
type: custom:raptor-orbit-card
title: Commande bureau
primary_entity: switch.commande_laser
disc_color: "#00e5ff"
disc_color_dark: "#00171f"
nav_color: "#00ffc3"
color_on: "#00ff7f"
color_off: "#263238"
shape: hex
label_bold: true
entities:
  - entity: switch.commande_laser
    name: Graveur laser
    mode: binary
    primary: true
  - entity: switch.commande_3d_fdm
    name: Imprimante 3D FDM
    mode: binary
  - entity: switch.commande_3d_sla
    name: Imprimante 3D SLA
    mode: binary
  - entity: switch.commande_ventilation
    name: Ventilation
    mode: binary
```

---

### 6.4. Volets RDC

![Volets RDC](chauf.gif)

```yaml
type: custom:raptor-orbit-card
title: Volets RDC
primary_entity: cover.volet_sejour
disc_color: "#4e342e"
disc_color_dark: "#1b1513"
nav_color: "#fbc02d"
color_on: "#fbc02d"
color_off: "#3e2723"
shape: square
pattern: stripes
label_bold: true
entities:
  - entity: cover.volet_cuisine
    name: Cuisine
    mode: cover
  - entity: cover.volet_salon1
    name: Salon 1
    mode: cover
  - entity: cover.volet_salon2
    name: Salon 2
    mode: cover
  - entity: cover.volet_sejour
    name: Séjour
    mode: cover
    primary: true
```

---

## 7. Limites et remarques

- Maximum **8 entités** par carte.
- Certaines entités custom seront traitées comme de simples `sensor`.
- Si une valeur ne peut pas être convertie en nombre, la carte affiche
  simplement le texte sans jauge.
- La carte est encore en **bêta** : n’hésite pas à ouvrir une issue ou proposer
  des idées d’améliorations.

---

Merci d’utiliser **Raptor Orbit Card** 🦖💡
