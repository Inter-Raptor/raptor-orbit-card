/* 
   -------------------------------------------------------------------------
   Raptor Orbit Card - par Inter-Raptor (Vivien Jardot)
   -------------------------------------------------------------------------
   Carte Lovelace personnalisée pour Home Assistant.
   - Affiche jusqu'à 8 entités sous forme de "bulles" orbitant autour d'un disque.
   - Gère plusieurs types d'entités : climate, sensor, cover, switch, gauge.
   - Permet de swiper horizontalement ou d'utiliser des flèches pour changer d'élément.
   - Le clic / appui long déclenche des actions configurables (toggle, more-info, etc.).
   - Design pensé pour un style "dashboard moderne" avec un disque oblique et effet 3D.

   Utilisation typique dans Lovelace :
   type: custom:raptor-orbit-card
   title: Chauffage RDC
   entities:
     - entity: climate.thermostat_rdc
     - entity: cover.volet_salon
     - entity: switch.prise_radiateur
     - entity: sensor.temperature_salon

   Auteur : Inter-Raptor (Vivien Jardot)
   Version : 1.0 (bêta maison)
   -------------------------------------------------------------------------
*/

/* Logo "Raptor" (ASCII art) --------------------------------------------- */
//                                   .,.                                          
//                       *******                        *#### (#####              
//                  ******                          / ########     .#####.        
//              ,*****                          //////##########   #####  /####   
//           .*****                           // /////*#####################  ##  
//         ******                             //// /// ######*      *############ 
//       ******                               ////// /   ###########,             
//     .*****                                 ////////     ##################     
//    ******                                  //////// #                          
//   *****.                                  ## ////// ###                        
//  *****,                              #########/ /// #####/                  ,  
// ,*****                           ################ /.######                     
// *****                       (####################   (#####                   * 
// ******                   #####   ########   ////////   ###                   .*
//,******             .*** ######### #####*   /////////     # /                  *
// *********    .******* ############ ###### ////////       ////                 *
//  ******************* (############# #####///////      *///// ##               *
//   ****************** //// ,######### ###  /########       #########          **
//     ****************  ////////  #####/(       #######.          ####         **
//                       /////// /////  ##     //    (####           ###       ***
//                        ///// //////////, /////     .####       /*(##       *** 
//                       ////// ///////    / ////   ## ###         ,         ,**  
//                     ////////////       // ///      #                     ***.  
//    .              /////////,         ////,/                             ***    
//                   ///               ......                            ****     
//       ,           ,///##              /////                         ****.      
//         *.         // ###              ,/// /                     *****        
//           ,*       / ####                /*/// ///             *****           
//              **,    ####( ####             ///// ///        ******             
//                 ****  ##### #####                      ,*******                
//                     ******.                      **********                    
//                           ***************************                          

// ---- Raptor Orbit Card - multi-usage (climate / sensor / cover / switch / gauge) ----
const LitBase =
  window.LitElement ||
  Object.getPrototypeOf(
    customElements.get("ha-panel-lovelace") ||
      customElements.get("hui-view")
  );

const html =
  (LitBase.prototype && LitBase.prototype.html)
    ? LitBase.prototype.html
    : LitBase.html;

const css =
  (LitBase.prototype && LitBase.prototype.css)
    ? LitBase.prototype.css
    : LitBase.css;

// -------------------- DEFINITION DE LA CARTE --------------------

class RaptorOrbitCard extends LitBase {
  // Déclaration des propriétés réactives (gestion interne de l'état de la carte)
  static get properties() {
    return {
      hass: {},           // Contexte Home Assistant (entités, services, etc.)
      _config: {},        // Configuration de la carte
      _activeIndex: { type: Number },   // Index de l'élément actuellement centré
      _primaryIndex: { type: Number },  // Index de l'entité principale ("home")
      _autoTimer: {},     // Timer pour revenir automatiquement à l'entité principale
      _holdTimer: {},     // Timer pour différencier tap / hold
      _holdFired: { type: Boolean }, // True si le hold a été déclenché
    };
  }

  constructor() {
    super();
    // Je fixe les indices de départ
    this._activeIndex = 0;
    this._primaryIndex = 0;
    // Timers de swipe / auto center / hold
    this._autoTimer = null;
    this._holdTimer = null;
    this._holdFired = false;
  }

  // Configuration de la carte (appelé par Home Assistant)
  setConfig(config) {
    const items = config.entities || config.items;

    // Je m'assure qu'au moins 1 entité est définie
    if (!items || !Array.isArray(items) || items.length < 1) {
      throw new Error("Tu dois definir au moins 1 entite dans 'entities'.");
    }
    // Je limite volontairement à 8 pour garder le rendu propre
    if (items.length > 8) {
      throw new Error("Maximum 8 entites dans cette carte.");
    }

    // Normalisation des items : string -> { entity: ... }
    const norm = items.map((it) => {
      if (typeof it === "string") return { entity: it };
      if (!it.entity) {
        throw new Error("Chaque item doit avoir une propriete 'entity'.");
      }
      return { ...it };
    });

    // Définition de l'entité principale (celle sur laquelle on recentre)
    const primaryEntity =
      config.primary_entity || (norm[0] && norm[0].entity);
    const primaryIndex = norm.findIndex((it) => it.entity === primaryEntity);

    // Je stocke toutes les options dans _config, avec valeurs par défaut
    this._config = {
      // affichage global
      title: config.title || "",
      compact: config.compact ?? false,
      transparent: config.transparent ?? false,
      show_arrows: config.show_arrows ?? true,
      show_hint: config.show_hint ?? true,
      show_title: config.show_title ?? true,
      show_status: config.show_status ?? true,
      invert_swipe: config.invert_swipe ?? false,
      invert_temps: config.invert_temps ?? false,

      primary_entity: primaryEntity,
      auto_center_timeout: config.auto_center_timeout ?? 0, // 0 = désactivé
      main_scale: config.main_scale ?? 1.1,                 // taille bulle centrale

      // thème par défaut noir + orange
      color_on: config.color_on || "#ff9800",
      color_off: config.color_off || "#37474f",

      disc_color: config.disc_color || "#263238",
      disc_color_dark: config.disc_color_dark || "#111318",
      nav_color: config.nav_color || "#455a64",

      cover_fill_color: config.cover_fill_color || "#00bcd4",
      gauge_default_color: config.gauge_default_color || "#4caf50",
      gauge_direction: config.gauge_direction || "bottom_to_top",

      // texte global
      text_color: config.text_color || "#f5f5f5",
      text_color_secondary:
        config.text_color_secondary || "rgba(245,245,245,0.78)",

      // style global des bulles
      shape: config.shape || "circle",          // circle | square | hex
      pattern: config.pattern || "solid",       // solid | stripes | dots
      edge_style: config.edge_style || "liquid",// liquid | straight

      // couleurs spécifiques climate
      climate_color_heat:
        config.climate_color_heat || config.color_on || "#ff9800",
      climate_color_cool: config.climate_color_cool || "#00bcd4",
      climate_color_idle:
        config.climate_color_idle || config.color_off || "#37474f",

      // couleurs spécifiques switch/binary
      switch_color_on:
        config.switch_color_on || config.color_on || "#ff9800",
      switch_color_off:
        config.switch_color_off || config.color_off || "#37474f",

      // tailles de police (multiplicateurs)
      font_header: config.font_header ?? 1,
      font_label: config.font_label ?? 1,
      font_temp: config.font_temp ?? 1,
      font_current: config.font_current ?? 1,
      label_bold: config.label_bold ?? false,   // option pour mettre les noms en gras

      // liste d'entités normalisées
      entities: norm,
    };

    // Je calcule l'index de l'entité principale
    this._primaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

    // Je corrige _activeIndex si besoin
    if (this._activeIndex === undefined) {
      this._activeIndex = this._primaryIndex;
    } else if (this._activeIndex >= norm.length) {
      this._activeIndex = 0;
    }

    // Je nettoie le timer d'auto-center au changement de config
    this._clearAutoTimer();
  }

  // -------------------- STYLES --------------------

  static get styles() {
    return css`
      /* Conteneur principal de la carte */
      ha-card {
        padding: 12px 14px 10px;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: radial-gradient(circle at 20% 0%, #252a32, #15171c 70%);
        --raptor-text-main: #f5f5f5;
        --raptor-text-secondary: rgba(245,245,245,0.78);
      }

      ha-card.compact {
        padding: 8px 8px 6px;
      }

      ha-card.transparent {
        background: none;
        box-shadow: none;
      }

      /* En-tête (titre + statut) */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--raptor-text-main);
      }

      .sub {
        font-size: 0.75rem;
        opacity: 0.7;
        color: var(--raptor-text-secondary);
      }

      /* Zone du disque + bulles */
      .wheel-wrapper {
        position: relative;
        width: 100%;
        height: 220px;
        overflow: visible;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      ha-card.compact .wheel-wrapper {
        height: 190px;
      }

      /* Disque principal légèrement oblique (effet 3D/ellipse) */
      .wheel {
        position: relative;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        background:
          radial-gradient(circle at 30% 20%, rgba(255,255,255,0.16), transparent 55%),
          radial-gradient(circle at 70% 80%, rgba(0,0,0,0.75), transparent 60%);
        box-shadow:
          inset 0 0 10px rgba(0,0,0,0.8);
        transform: rotate(-18deg) scaleY(0.85);
        transition: transform 0.35s ease-out;
      }

      .wheel-disc {
        position: absolute;
        inset: 18px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 20%, var(--disc-color), var(--disc-color-dark));
      }

      /* Bulle générique (slot) */
      .slot {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 88px;
        height: 88px;
        background: linear-gradient(145deg, #313640, #181b21);
        box-shadow:
          0 8px 16px rgba(0,0,0,0.6),
          inset 0 0 8px rgba(255,255,255,0.05);
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--raptor-text-main);
        text-align: center;
        font-size: 0.7rem;
        padding: 4px;
        cursor: pointer;
        opacity: 0.84;
        transition:
          transform 0.35s ease-out,
          opacity 0.25s ease-out,
          box-shadow 0.25s ease-out,
          background 0.25s ease-out,
          border-color 0.25s ease-out;
        border: 2px solid transparent;
        overflow: hidden;
      }

      /* Contenu interne de la bulle (je contre-rotate pour lisibilité) */
      .slot-inner {
        transform: rotate(18deg) scaleY(1.15);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        position: relative;
        z-index: 2;
      }

      /* Bande de remplissage (gauge / cover / états ON/OFF) */
      .slot-fill {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        border-radius: inherit;
        opacity: 0.9;
        z-index: 1;
        background: var(--fill-color, #ff9800);
      }

      .slot .label {
        font-size: 0.65rem;
        opacity: 0.8;
        color: var(--raptor-text-secondary);
      }

      .temps {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0px;
      }

      .temp-target {
        font-size: 1.45rem;
        font-weight: 700;
        color: var(--raptor-text-main);
      }

      .temp-current {
        font-size: 0.7rem;
        opacity: 0.9;
        color: var(--raptor-text-secondary);
      }

      /* Etats visuels actifs / ON / OFF */
      .slot.active.on {
        opacity: 1;
        box-shadow:
          0 16px 32px rgba(0,0,0,0.9),
          0 0 18px rgba(255,160,80,0.9);
        border-color: rgba(255,200,140,0.9);
      }

      .slot.active.off {
        opacity: 1;
        box-shadow:
          0 14px 30px rgba(0,0,0,0.85),
          0 0 16px rgba(255,140,70,0.8);
        border-color: rgba(255,160,80,0.9);
      }

      .slot.on:not(.active) {
        box-shadow:
          0 10px 20px rgba(0,0,0,0.7),
          0 0 10px rgba(255,140,60,0.55);
        opacity: 0.95;
      }

      .slot.off:not(.active) {
        opacity: 0.7;
      }

      /* Formes de bulles (configurable) */
      .shape-circle {
        border-radius: 999px;
      }

      .shape-square {
        border-radius: 22px;
      }

      .shape-hex {
        clip-path: polygon(
          25% 5%,
          75% 5%,
          100% 50%,
          75% 95%,
          25% 95%,
          0 50%
        );
      }

      /* Motifs de remplissage (configurable) */
      .pattern-solid {
        background: var(--fill-color);
      }

      .pattern-stripes {
        background-image: repeating-linear-gradient(
          -45deg,
          rgba(0,0,0,0.20),
          rgba(0,0,0,0.20) 4px,
          rgba(255,255,255,0.18) 4px,
          rgba(255,255,255,0.18) 8px
        );
        background-color: var(--fill-color);
      }

      .pattern-dots {
        background-image: radial-gradient(circle, rgba(255,255,255,0.22) 2px, transparent 2px);
        background-size: 8px 8px;
        background-color: var(--fill-color);
      }

      /* Style de bord (net ou liquide/flou) */
      .edge-straight {
        filter: none;
      }

      .edge-liquid {
        filter: blur(3px);
      }

      /* Boutons de navigation gauche/droite */
      .nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 34px;
        height: 70%;
        border-radius: 999px;
        background: radial-gradient(circle at 50% 50%, #232731, #111318 80%);
        box-shadow: 0 8px 20px rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        opacity: 0.9;
        transition: opacity 0.2s ease-out, transform 0.2s ease-out, background 0.2s;
        color: #f5f5f5;
      }

      .nav-left {
        left: 4px;
      }
      .nav-right {
        right: 4px;
      }

      .nav span {
        font-size: 1.6rem;
        line-height: 1;
        transform: translateY(-2px);
      }

      .nav:hover {
        opacity: 1;
        transform: translateY(-50%) scale(1.02);
      }

      /* Petit texte d'aide sous la carte */
      .hint {
        text-align: center;
        font-size: 0.7rem;
        opacity: 0.55;
        margin-top: 2px;
        color: var(--raptor-text-secondary);
      }
    `;
  }

  // -------------------- HELPERS --------------------

  // Je supprime le timer d'auto recentrage
  _clearAutoTimer() {
    if (this._autoTimer) {
      clearTimeout(this._autoTimer);
      this._autoTimer = null;
    }
  }

  // Je programme le retour automatique sur l'entité principale après X secondes
  _scheduleAutoCenter() {
    this._clearAutoTimer();
    const timeoutSec = this._config.auto_center_timeout;
    if (!timeoutSec || timeoutSec <= 0) return;
    this._autoTimer = setTimeout(() => {
      this._activeIndex = this._primaryIndex ?? 0;
    }, timeoutSec * 1000);
  }

  // Rotation des bulles (delta = +1 ou -1)
  _rotate(delta) {
    const len = this._config.entities.length;
    const realDelta = this._config.invert_swipe ? -delta : delta;
    this._activeIndex = (this._activeIndex + realDelta + len) % len;
    this._scheduleAutoCenter();
  }

  // Ouvre la pop-up "plus d'info" de l'entité
  _openMoreInfo(entityId) {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId },
      })
    );
  }

  // Toggle switch / light / input_boolean / cover sinon more-info
  _toggleEntity(entityId) {
    if (!this.hass) return;
    const stateObj = this.hass.states[entityId];
    if (!stateObj) return;

    const [domain] = entityId.split(".");
    if (
      domain === "switch" ||
      domain === "light" ||
      domain === "input_boolean"
    ) {
      this.hass.callService(domain, "toggle", { entity_id: entityId });
    } else if (domain === "cover") {
      const open = stateObj.state === "open";
      this.hass.callService("cover", open ? "close_cover" : "open_cover", {
        entity_id: entityId,
      });
    } else {
      this._openMoreInfo(entityId);
    }
  }

  // Détermine si l'entité est considérée comme "ON" pour le rendu visuel
  _isOn(stateObj, mode) {
    if (!stateObj) return false;
    const domain = stateObj.entity_id.split(".")[0];

    if (mode === "climate" || domain === "climate") {
      // ON uniquement quand ça chauffe ou refroidit vraiment
      const action = stateObj.attributes.hvac_action;
      return action === "heating" || action === "cooling";
    }

    if (
      mode === "binary" ||
      domain === "switch" ||
      domain === "light" ||
      domain === "input_boolean"
    ) {
      return stateObj.state === "on";
    }

    if (mode === "cover" || domain === "cover") {
      const pos =
        stateObj.attributes.current_position ??
        stateObj.attributes.position;
      return typeof pos === "number" && pos > 0;
    }

    return false;
  }

  // Déduit le "mode" de la bulle à partir du domaine + config item
  _getMode(item, stateObj) {
    if (item.mode) return item.mode;
    if (!stateObj) return "sensor";

    const domain = stateObj.entity_id.split(".")[0];
    if (domain === "climate") return "climate";
    if (domain === "cover") return "cover";
    if (
      domain === "switch" ||
      domain === "light" ||
      domain === "input_boolean"
    )
      return "binary";
    if (domain === "sensor") return "sensor";
    return "sensor";
  }

  // Je prépare toutes les infos d'affichage pour une entité
  _getDisplayData(item) {
    const stateObj = this.hass && this.hass.states[item.entity];
    if (!stateObj) {
      return {
        name: item.name || item.entity,
        current: null,
        target: null,
        unit: "",
        stateObj: null,
        mode: item.mode || "sensor",
        percent: null,
        climate_phase: null,
      };
    }

    const mode = this._getMode(item, stateObj);
    const attr = stateObj.attributes;

    let name =
      item.name ||
      attr.friendly_name ||
      item.entity;

    let current = null;
    let target = null;
    let unit = attr.unit_of_measurement || "";
    let percent = null;
    let climate_phase = null;

    // Cas climate
    if (mode === "climate") {
      current = attr.current_temperature ?? null;
      target =
        attr.temperature ??
        attr.target_temp ??
        attr.target_temp_high ??
        attr.target_temp_low ??
        null;
      if (!unit) unit = "°";

      const action = attr.hvac_action;
      if (action === "heating") {
        climate_phase = "heat";
      } else if (action === "cooling") {
        climate_phase = "cool";
      } else {
        climate_phase = "idle";
      }
    // Cas cover (position en %)
    } else if (mode === "cover") {
      const pos = attr.current_position ?? attr.position;
      if (typeof pos === "number") {
        current = pos;
        percent = Math.max(0, Math.min(1, pos / 100));
        if (!unit) unit = "%";
      }
    // Cas gauge (valeur numérique avec min/max)
    } else if (mode === "gauge") {
      const raw = parseFloat(stateObj.state);
      if (!isNaN(raw)) {
        current = raw;
        const min = item.min ?? 0;
        const max = item.max ?? 100;
        if (max > min) {
          percent = Math.max(0, Math.min(1, (raw - min) / (max - min)));
        }
      } else {
        current = stateObj.state;
      }
    // Cas binaire on/off
    } else if (mode === "binary") {
      current = stateObj.state;
    // Cas sensor générique (optionnellement gauge)
    } else {
      const raw = parseFloat(stateObj.state);
      if (!isNaN(raw) && (item.min !== undefined || item.max !== undefined)) {
        current = raw;
        const min = item.min ?? 0;
        const max = item.max ?? 100;
        if (max > min) {
          percent = Math.max(0, Math.min(1, (raw - min) / (max - min)));
        }
      } else {
        current = stateObj.state;
      }
    }

    // mapping de valeur (par ex. home -> "maison")
    if (item.value_map && typeof current === "string") {
      const mapped = item.value_map[current];
      if (mapped !== undefined) {
        current = mapped;
      }
    }

    return { name, current, target, unit, stateObj, mode, percent, climate_phase };
  }

  // Gestion des actions tap / hold sur une bulle
  _handleAction(type, index, item, info) {
    const stateObj = info.stateObj;
    const mode = info.mode;

    // premier tap : recentrage sur la bulle
    if (type === "tap" && index !== this._activeIndex) {
      this._activeIndex = index;
      this._scheduleAutoCenter();
      return;
    }

    if (!stateObj) return;

    // comportement par défaut selon le type
    const defaultTap =
      mode === "binary" || mode === "cover" ? "toggle" : "more-info";

    const tapAction = item.tap_action || defaultTap;
    const holdAction = item.hold_action || "more-info";

    const action = type === "tap" ? tapAction : holdAction;

    if (action === "toggle") {
      this._toggleEntity(stateObj.entity_id);
    } else if (action === "more-info") {
      this._openMoreInfo(stateObj.entity_id);
    }
  }

  // POINTEUR : début d'appui (possibilité de hold)
  _onSlotPointerDown(ev, index, item, info) {
    if (ev.button !== undefined && ev.button !== 0) return;
    this._holdFired = false;
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
    this._holdTimer = setTimeout(() => {
      this._holdFired = true;
      this._handleAction("hold", index, item, info);
    }, 600);
  }

  // POINTEUR : fin d'appui (si pas hold -> tap)
  _onSlotPointerUp(ev, index, item, info) {
    if (ev.button !== undefined && ev.button !== 0) return;
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
    if (!this._holdFired) {
      this._handleAction("tap", index, item, info);
    }
  }

  // POINTEUR : sortie de la bulle -> j'annule le hold
  _onSlotPointerLeave() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  // -------------------- RENDER DES BULLES --------------------

  _renderSlots() {
    const entities = this._config.entities;
       const count = entities.length;
    const baseAngle = 360 / count; // angle entre chaque bulle
    const radius = 90 * (this._config.compact ? 0.95 : 1); // rayon de l'orbite

    return entities.map((item, index) => {
      const info = this._getDisplayData(item);
      const { name, current, target, unit, stateObj, mode, percent, climate_phase } = info;

      // offset circulaire par rapport à la bulle active
      const offset = ((index - this._activeIndex) % count + count) % count;
      const angle = offset * baseAngle + 90;
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;

      const isActive = offset === 0;
      const isOn = this._isOn(stateObj, mode);

      const mainScale = this._config.main_scale || 1.1;
      const scale = isActive ? mainScale : 0.82;

      const style = `
        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale});
        z-index: ${isActive ? 20 : 10};
      `;

      const classes = ["slot"];
      classes.push(isOn ? "on" : "off");

      const shape =
        item.shape || this._config.shape || "circle";
      classes.push(`shape-${shape}`);

      if (isActive) classes.push("active");

      // valeurs à afficher (big = principal, small = secondaire)
      let big = target ?? current ?? (stateObj ? stateObj.state : "");
      let small =
        current != null && target != null && current !== target
          ? current
          : null;

      // inverser l'affichage des températures (option)
      if (this._config.invert_temps && current != null && target != null) {
        big = current;
        small = target;
      }

      const mainValue =
        typeof big === "number"
          ? big.toLocaleString(undefined, { maximumFractionDigits: 1 })
          : big;
      const smallValue =
        typeof small === "number"
          ? small.toLocaleString(undefined, { maximumFractionDigits: 1 })
          : small;

      let unitText = unit || "";
      if (unitText === "°" || unitText === "Â°") unitText = "°";

      // ---------------- REMPLISSAGE (slot-fill) ----------------
      let fillStyle = "";
      let fillPercent = percent;
      let fillColor = null;

      // cover -> remplissage en fonction de la position (%)
      if (mode === "cover") {
        fillColor =
          item.cover_fill_color ||
          this._config.cover_fill_color ||
          this._config.color_on;

      // gauge -> remplissage en fonction de la valeur
      } else if (mode === "gauge") {
        fillColor =
          item.gauge_color ||
          this._config.gauge_default_color ||
          this._config.color_on;

      // binaire -> rempli à 100% avec color_on / color_off
      } else if (mode === "binary") {
        if (isOn) {
          fillPercent = 1;
          fillColor =
            item.color_on ||
            this._config.switch_color_on ||
            this._config.color_on;
        } else {
          fillPercent = 1;
          fillColor =
            item.color_off ||
            this._config.switch_color_off ||
            this._config.color_off;
        }

      // climate -> rempli à 100% avec couleur selon phase (heat/cool/idle)
      } else if (mode === "climate") {
        fillPercent = 1;
        if (climate_phase === "heat") {
          fillColor =
            item.heat_color ||
            this._config.climate_color_heat ||
            this._config.color_on;
        } else if (climate_phase === "cool") {
          fillColor =
            item.cool_color ||
            this._config.climate_color_cool ||
            "#00bcd4";
        } else {
          // phase idle / off -> couleur neutre
          fillColor =
            item.idle_color ||
            this._config.climate_color_idle ||
            this._config.color_off;
        }
      }

      // severities pour gauge ou sensor (numérique)
      if (
        (mode === "gauge" || mode === "sensor") &&
        typeof current === "number" &&
        Array.isArray(item.severities)
      ) {
        const sev = item.severities.find(
          (s) =>
            typeof s.from === "number" &&
            typeof s.to === "number" &&
            current >= s.from &&
            current < s.to
        );
        if (sev && sev.color) {
          // on garde fillPercent basé sur min/max, on change seulement la couleur
          fillColor = sev.color;
        }
      }

      // Je calcule le style CSS de la zone remplie
      if (fillPercent != null && fillPercent > 0 && fillColor) {
        const pct = Math.round(
          Math.max(0, Math.min(1, fillPercent)) * 100
        );

        const dir =
          item.gauge_direction ||
          this._config.gauge_direction ||
          (mode === "cover" ? "bottom_to_top" : "left_to_right");

        let sizePart = "";

        if (dir === "left_to_right") {
          sizePart = `
            height: 100%;
            width: ${pct}%;
            left: 0;
            bottom: 0;
          `;
        } else if (dir === "right_to_left") {
          sizePart = `
            height: 100%;
            width: ${pct}%;
            right: 0;
            left: auto;
            bottom: 0;
          `;
        } else {
          // bottom_to_top par défaut
          sizePart = `
            width: 100%;
            height: ${pct}%;
            left: 0;
            bottom: 0;
          `;
        }

        fillStyle = `
          ${sizePart}
          --fill-color:${fillColor};
        `;
      }

      // couleurs de texte (override par item possible)
      const textMain =
        item.text_color || this._config.text_color || "#f5f5f5";
      const textSecondary =
        item.text_color_secondary ||
        this._config.text_color_secondary ||
        "rgba(245,245,245,0.78)";

      const labelStyle = `font-size:${0.65 * (this._config.font_label || 1)}rem;color:${textSecondary};${this._config.label_bold ? "font-weight:600;" : ""}`;
      const bigStyle = `font-size:${1.45 * (this._config.font_temp || 1)}rem;color:${textMain};`;
      const smallStyle = `font-size:${0.7 * (this._config.font_current || 1)}rem;color:${textSecondary};`;

      const edge = item.edge_style || this._config.edge_style || "liquid";
      const pattern = item.pattern || this._config.pattern || "solid";

      // Handlers pour pointer (tap/hold)
      const handleDown = (ev) =>
        this._onSlotPointerDown(ev, index, item, info);
      const handleUp = (ev) =>
        this._onSlotPointerUp(ev, index, item, info);
      const handleLeave = () => this._onSlotPointerLeave();

      return html`
        <div
          class="${classes.join(" ")}"
          style="${style}"
          @pointerdown=${handleDown}
          @pointerup=${handleUp}
          @pointercancel=${handleLeave}
          @pointerleave=${handleLeave}
        >
          ${fillStyle
            ? html`<div
                class="slot-fill edge-${edge} pattern-${pattern}"
                style="${fillStyle}"
              ></div>`
            : null}
          <div class="slot-inner">
            ${name
              ? html`<div class="label" style="${labelStyle}">
                  ${name}
                </div>`
              : null}
            <div class="temps">
              <div class="temp-target" style="${bigStyle}">
                ${mainValue}${unitText}
              </div>
              ${small != null
                ? html`<div class="temp-current" style="${smallStyle}">
                    ${smallValue}${unitText}
                    ${mode === "climate"
                      ? this._config.invert_temps
                        ? " consigne"
                        : " actuel"
                      : ""}
                  </div>`
                : null}
            </div>
          </div>
        </div>
      `;
    });
  }

  // -------------------- LIFE CYCLE --------------------

  // Premier rendu : j'ajoute la gestion du swipe horizontal
  firstUpdated() {
    const zone = this.renderRoot.querySelector(".wheel-wrapper");
    if (!zone) return;
    let startX = null;

    zone.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
    });

    zone.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const thr = 40; // seuil de mouvement pour considérer un swipe

      // inversion du sens
      if (dx > thr) this._rotate(1);
      if (dx < -thr) this._rotate(-1);

      startX = null;
    });
  }

  // Rendu principal de la carte (appelé régulièrement par HA)
  render() {
    if (!this._config || !this.hass) return html``;

    const cardClasses = [];
    if (this._config.compact) cardClasses.push("compact");
    if (this._config.transparent) cardClasses.push("transparent");

    const activeItem = this._config.entities[this._activeIndex];
    const info = this._getDisplayData(activeItem);
    const { name, stateObj, mode } = info;
    const isOn = this._isOn(stateObj, mode);

    // Variables CSS pour la couleur du disque et du texte
    const discStyle = `
      --disc-color: ${this._config.disc_color};
      --disc-color-dark: ${this._config.disc_color_dark};
      --raptor-text-main: ${this._config.text_color || "#f5f5f5"};
      --raptor-text-secondary: ${
        this._config.text_color_secondary || "rgba(245,245,245,0.78)"
      };
    `;

    const headerScale = this._config.font_header || 1;
    const headerStyle = `font-size:${0.95 * headerScale}rem;`;

    return html`
      <ha-card class="${cardClasses.join(" ")}">
        ${this._config.show_title || this._config.show_status
          ? html`
              <div class="header" style="${headerStyle}">
                <div>
                  ${this._config.show_title ? this._config.title || "" : ""}
                </div>
                <div class="sub">
                  ${this._config.show_status && stateObj
                    ? html`${name || activeItem.entity}
                        • ${isOn ? "En chauffe / actif" : "A l'arret"}`
                    : ""}
                </div>
              </div>
            `
          : null}

        <div class="wheel-wrapper">
          ${this._config.show_arrows
            ? html`
                <div
                  class="nav nav-left"
                  style="background:${this._config.nav_color};"
                  @click=${() => this._rotate(-1)}
                >
                  <span>&lt;</span>
                </div>
                <div
                  class="nav nav-right"
                  style="background:${this._config.nav_color};"
                  @click=${() => this._rotate(1)}
                >
                  <span>&gt;</span>
                </div>
              `
            : null}

          <div class="wheel" style="${discStyle}">
            <div class="wheel-disc"></div>
            ${this._renderSlots()}
          </div>
        </div>

        ${this._config.show_hint
          ? html`<div class="hint">
              Glisse de gauche a droite ou utilise les fleches pour changer
              d'element. Clique sur l'element principal pour les details
              (ou selon tap_action / hold_action).
            </div>`
          : null}
      </ha-card>
    `;
  }

  // Taille "estimée" de la carte pour Lovelace (en unités de lignes)
  getCardSize() {
    return 4;
  }
}

// -------------------- ENREGISTREMENT DE LA CARTE --------------------

// Enregistrement du custom element si pas déjà fait
if (!customElements.get("raptor-orbit-card")) {
  customElements.define("raptor-orbit-card", RaptorOrbitCard);
}

// Déclaration pour l'aperçu dans l'éditeur Lovelace (liste des cartes custom)
window.customCards = window.customCards || [];
window.customCards.push({
  type: "raptor-orbit-card",
  name: "Raptor Orbit Card",
  description:
    "Carte orbitale multi-usages (climate, sensor, cover, switch, gauge).",
});
