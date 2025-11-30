RAPTOR ORBIT CARD
=================

Carte Lovelace personnalisée pour Home Assistant, affichant jusqu’à 8 entités
sous forme de bulles orbitant autour d’un disque central.

- Supporte : climate, cover, switch, light, input_boolean, sensor, gauge.
- Navigation par swipe ou flèches gauche / droite.
- Gestion du tap et de l’appui long (toggle, more-info, etc.).
- Thème par défaut noir + orange, entièrement personnalisable.
- Style “dashboard moderne” : disque légèrement oblique, effet 3D, bulles paramétrables.

Auteur : Inter-Raptor (Vivien Jardot)
Statut : Bêta maison


1) INSTALLATION
===============

1. FICHIER DE LA CARTE
----------------------

Créer un fichier (dans Home Assistant) :

  www/raptor-orbit-card.js

Coller dans ce fichier tout le code JavaScript de la carte.

ATTENTION :
Ne pas oublier l’en-tête de commentaire "/* ... */" avant le logo ASCII,
sinon une partie du logo sera interprétée comme du code.


2. RESSOURCE LOVELACE
---------------------

Dans Home Assistant :

1) Aller dans : Paramètres -> Tableaux de bord -> Ressources
2) Ajouter une ressource :
   - URL : /local/raptor-orbit-card.js
   - Type : JavaScript Module
3) Sauvegarder


3. RECHARGER L’INTERFACE
------------------------

- Soit : Paramètres -> Outils de développement -> Recharger les ressources.
- Soit : vider le cache du navigateur / forcer le rechargement (CTRL+F5).


2) UTILISATION DE BASE
======================

Configuration minimale (dans une carte Lovelace) :

  type: custom:raptor-orbit-card
  title: Pilotage maison
  entities:
    - entity: climate.thermostat_rdc
    - entity: cover.volet_sejour
    - entity: switch.interrupteur_sejour
    - entity: sensor.thermometre_rdc_temperature

- Maximum 8 entités par carte.
- Toutes les options (couleurs, formes, etc.) sont facultatives. La carte applique
  des valeurs par défaut si rien n’est précisé.


3) COMPORTEMENT GENERAL
=======================

- Les entités sont affichées en orbite autour d’un disque.
- Premier tap sur une bulle :
    - Si ce n’est pas la bulle centrale -> la bulle devient centrale.
- Tap sur la bulle déjà centrale :
    - Exécute tap_action (par défaut : toggle pour switch/cover, more-info sinon).
- Appui long (hold) sur la bulle :
    - Exécute hold_action (par défaut : more-info).

Le swipe horizontal (gauche/droite) permet aussi de changer de bulle active.


4) OPTIONS GLOBALES
===================

Exemple complet d’options globales (tout est optionnel) :

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
  auto_center_timeout: 0
  main_scale: 1.1

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


DESCRIPTION RAPIDE DES PRINCIPALES OPTIONS
------------------------------------------

title
  Titre affiché en haut à gauche.

primary_entity
  Entité principale (cible du recentrage auto).

compact
  true : carte plus basse.

transparent
  true : enlève le fond et l’ombre du ha-card.

show_title / show_status
  Affichent ou non le titre et le texte de statut en haut à droite.

show_arrows
  Affiche les barres de navigation gauche / droite.

show_hint
  Affiche un texte d’aide en bas de la carte.

invert_swipe
  Inverse le sens du swipe gauche/droite.

invert_temps
  Pour les entités climate :
    - false : consigne en gros, température actuelle en petit.
    - true : température actuelle en gros, consigne en petit.

auto_center_timeout
  0 = désactivé.
  > 0 : nombre de secondes avant que la carte se recentre sur primary_entity.

main_scale
  Zoom de la bulle centrale (1.1 = 10 % plus grande).

shape
  Forme des bulles par défaut : circle, square, hex.

pattern
  Motif de remplissage : solid, stripes, dots.

edge_style
  Bord de la zone remplie : straight (net) ou liquid (flou).


5) CONFIGURATION DES ENTITES
============================

Chaque entrée dans "entities:" représente une bulle.

Structure générique :

  entities:
    - entity: sensor.xxx
      name: Texte affiché (optionnel)
      mode: climate | cover | binary | sensor | gauge
      shape: circle | square | hex
      pattern: solid | stripes | dots
      edge_style: liquid | straight
      tap_action: toggle | more-info
      hold_action: more-info
      text_color: "#ffffff"
      text_color_secondary: "rgba(...)"
      value_map:
        etat1: "Texte 1"
        etat2: "Texte 2"

Détection automatique du "mode" si non défini :
  climate.xxx         -> mode: climate
  cover.xxx           -> mode: cover
  switch/light/input_boolean -> mode: binary
  sensor.xxx          -> mode: sensor


5.1) CLIMATE
------------

Exemple :

  - entity: climate.thermostat_rdc
    name: Chauffage RDC
    mode: climate
    heat_color: "#ff9800"
    cool_color: "#00bcd4"
    idle_color: "#37474f"
    tap_action: more-info
    hold_action: more-info

La carte lit :
  - attributes.current_temperature
  - attributes.temperature / target_temp*
  - attributes.hvac_action (heating, cooling, etc.)

Trois phases :
  - heat  : couleur de chauffe
  - cool  : couleur de refroidissement
  - idle  : couleur neutre quand rien ne chauffe / refroidit


5.2) COVER (VOLETS)
-------------------

Exemple :

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

Utilise current_position ou position en pourcentage.
Le remplissage progresse en fonction de cette valeur.
tap_action par défaut : toggle (ouvrir / fermer).


5.3) BINAIRE (SWITCH / LIGHT / INPUT_BOOLEAN)
---------------------------------------------

Exemple :

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

ON : remplissage complet avec color_on.
OFF : remplissage complet avec color_off.


5.4) GAUGE (JAUGE)
------------------

Exemple :

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
    tap_action: more-info
    hold_action: more-info

La valeur de state doit être numérique.
min et max définissent l’échelle.
severities permet de modifier la couleur en fonction de la valeur.


5.5) SENSOR SIMPLE
------------------

Exemple :

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
    tap_action: more-info
    hold_action: more-info


5.6) PERSON / TRACKER (AVEC VALUE_MAP)
--------------------------------------

Exemple :

  - entity: person.myriam
    name: Myriam
    mode: sensor
    value_map:
      home: "maison"
      not_home: "ailleurs"
    tap_action: more-info
    hold_action: more-info

value_map permet de remplacer un état texte par un libellé personnalisé.


6) EXEMPLE COMPLET
==================

  type: custom:raptor-orbit-card
  title: Pilotage maison
  primary_entity: climate.thermostat_rdc

  color_on: "#ff9800"
  color_off: "#37474f"
  disc_color: "#263238"
  disc_color_dark: "#111318"
  nav_color: "#455a64"
  shape: circle
  pattern: solid
  edge_style: liquid

  entities:
    - entity: climate.thermostat_rdc
      name: Chauffage RDC
      mode: climate
      tap_action: more-info
      hold_action: more-info

    - entity: cover.volet_sejour
      name: Volet séjour
      mode: cover
      shape: hex
      pattern: stripes
      edge_style: straight
      tap_action: toggle
      hold_action: more-info

    - entity: switch.interrupteur_sejour
      name: Prise séjour
      mode: binary
      shape: square
      tap_action: toggle
      hold_action: more-info

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
      tap_action: more-info
      hold_action: more-info

    - entity: person.myriam
      name: Myriam
      mode: sensor
      value_map:
        home: "maison"
      tap_action: more-info
      hold_action: more-info


7) LIMITES ET REMARQUES
=======================

- Maximum 8 entités par carte.
- Certaines entités custom seront traitées comme de simples sensors.
- Si une valeur numérique ne peut pas être convertie en nombre, la carte affiche
  simplement le texte sans jauge.

Fin du document.
