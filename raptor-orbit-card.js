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
   Version : 1.1.4 (wheel_size + card_padding + show_current)
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
  static get properties() {
    return {
      hass: {},
      _config: {},
      _activeIndex: { type: Number },
      _primaryIndex: { type: Number },
      _autoTimer: {},
      _holdTimer: {},
      _holdFired: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._activeIndex = 0;
    this._primaryIndex = 0;
    this._autoTimer = null;
    this._holdTimer = null;
    this._holdFired = false;
  }

  setConfig(config) {
    const items = config.entities || config.items;

    if (!items || !Array.isArray(items) || items.length < 1) {
      throw new Error("Tu dois définir au moins 1 entité dans 'entities'.");
    }
    if (items.length > 8) {
      throw new Error("Maximum 8 entités dans cette carte.");
    }

    const norm = items.map((it) => {
      if (typeof it === "string") return { entity: it };
      if (!it.entity) {
        throw new Error("Chaque item doit avoir une propriété 'entity'.");
      }
      return { ...it };
    });

    const primaryEntity =
      config.primary_entity || (norm[0] && norm[0].entity);
    const primaryIndex = norm.findIndex((it) => it.entity === primaryEntity);

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

      // afficher / masquer la ligne "current"
      show_current: config.show_current ?? true,

      // padding personnalisé du ha-card (nombre ou string CSS)
      card_padding: config.card_padding ?? null,

      // diamètre de la roue (px)
      wheel_size: config.wheel_size ?? 260,

      primary_entity: primaryEntity,
      auto_center_timeout: config.auto_center_timeout ?? 0,
      main_scale: config.main_scale ?? 1.1,

      // gestion de thème
      // auto = suit hass.themes.darkMode
      theme_mode: config.theme_mode || "auto",

      // palette « logique » (sera recolorée par le thème)
      color_on: config.color_on || "#ff9800",
      color_off: config.color_off || "#37474f",

      disc_color: config.disc_color || "#263238",
      disc_color_dark: config.disc_color_dark || "#111318",
      nav_color: config.nav_color || "#455a64",

      cover_fill_color: config.cover_fill_color || "#00bcd4",
      gauge_default_color: config.gauge_default_color || "#4caf50",
      gauge_direction: config.gauge_direction || "bottom_to_top",

      // texte global (sera adapté par thème clair / sombre si non forcé)
      text_color: config.text_color || null,
      text_color_secondary: config.text_color_secondary || null,

      // style global des bulles
      shape: config.shape || "circle",          // circle | square | hex
      pattern: config.pattern || "solid",       // solid | stripes | dots
      edge_style: config.edge_style || "liquid",// liquid | straight

      // orientation disque / slots
      tilt: config.tilt ?? true,                // true = oblique, false = plat

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

      // tailles de police (multiplicateurs) – boost lisibilité
      font_header: config.font_header ?? 1.05,
      font_label: config.font_label ?? 1.15,
      font_temp: config.font_temp ?? 1.1,
      font_current: config.font_current ?? 1.15,
      label_bold: config.label_bold ?? true,

      // style global des slots
      slot_padding: config.slot_padding ?? 4,
      slot_radius: config.slot_radius ?? null,
      slot_border_color_on: config.slot_border_color_on || null,
      slot_border_color_off: config.slot_border_color_off || null,

      // liste d'entités
      entities: norm,
    };

    this._primaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

    if (this._activeIndex === undefined) {
      this._activeIndex = this._primaryIndex;
    } else if (this._activeIndex >= norm.length) {
      this._activeIndex = 0;
    }

    this._clearAutoTimer();
  }

  // -------------------- THEMES --------------------

  _getEffectiveThemeMode() {
    const mode = this._config.theme_mode || "auto";
    if (mode === "light" || mode === "dark") return mode;

    // auto : suivre le mode sombre HA
    const dark =
      this.hass &&
      this.hass.themes &&
      this.hass.themes.darkMode;
    return dark ? "dark" : "light";
  }

  _getThemeVars() {
    const mode = this._getEffectiveThemeMode();

    if (mode === "dark") {
      const textMain =
        this._config.text_color || "#f5f5f5";
      const textSecondary =
        this._config.text_color_secondary || "rgba(245,245,245,0.78)";
      return {
        // fond carte général
        cardBg:
          "radial-gradient(circle at 20% 0%, #252a32, #15171c 70%)",
        // fond de la « sphère »
        wheelBg:
          "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.16), transparent 55%)," +
          "radial-gradient(circle at 70% 80%, rgba(0,0,0,0.75), transparent 60%)",
        // slots
        slotBg: "linear-gradient(145deg, #313640, #181b21)",
        slotShadow:
          "0 8px 16px rgba(0,0,0,0.6), inset 0 0 8px rgba(255,255,255,0.05)",
        // nav
        navBg: this._config.nav_color || "#455a64",
        navText: "#f5f5f5",
        // disque
        discColor: this._config.disc_color || "#263238",
        discColorDark: this._config.disc_color_dark || "#111318",
        // texte
        textMain,
        textSecondary,
      };
    }

    // thème clair
    const textMain =
      this._config.text_color || "#0b1120";
    const textSecondary =
      this._config.text_color_secondary || "#1f2933";

    return {
      cardBg:
        "radial-gradient(circle at 20% -10%, #ffffff, #e6edf7 55%, #d0d9e6 100%)",
      wheelBg:
        "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.95), rgba(219,234,254,0.95))," +
        "radial-gradient(circle at 70% 80%, rgba(148,163,184,0.55), transparent 60%)",
      slotBg: "linear-gradient(145deg, #ffffff, #e5edf7)",
      slotShadow:
        "0 6px 12px rgba(148,163,184,0.65), inset 0 0 6px rgba(255,255,255,0.9)",
      navBg:
        "linear-gradient(180deg,#d0deef,#b3c5e0)",
      navText: "#0b1120",
      discColor: "#f4f7fb",
      discColorDark: "#c9d5e8",
      textMain,
      textSecondary,
    };
  }

  // -------------------- STYLES --------------------

  static get styles() {
    return css`
      ha-card {
        padding: 12px 14px 10px;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 8px;

        background: var(
          --raptor-card-bg,
          radial-gradient(circle at 20% 0%, #252a32, #15171c 70%)
        );

        --raptor-text-main: #f5f5f5;
        --raptor-text-secondary: rgba(245,245,245,0.78);
        --raptor-slot-bg: linear-gradient(145deg, #313640, #181b21);
        --raptor-slot-shadow:
          0 8px 16px rgba(0,0,0,0.6),
          inset 0 0 8px rgba(255,255,255,0.05);
        --raptor-nav-bg: #455a64;
        --raptor-nav-text: #f5f5f5;
        --raptor-wheel-bg:
          radial-gradient(circle at 30% 20%, rgba(255,255,255,0.16), transparent 55%),
          radial-gradient(circle at 70% 80%, rgba(0,0,0,0.75), transparent 60%);
      }

      ha-card.compact {
        padding: 8px 8px 6px;
      }

      ha-card.transparent {
        background: none;
        box-shadow: none;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--raptor-text-main);
      }

      .sub {
        font-size: 0.78rem;
        opacity: 0.9;
        color: var(--raptor-text-secondary);
      }

      .wheel-wrapper {
        position: relative;
        width: 100%;
        height: var(--raptor-wheel-size, 260px); /* même taille que la roue */
        overflow: visible;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      ha-card.compact .wheel-wrapper {
        height: calc(var(--raptor-wheel-size, 260px) - 30px);
      }

      .wheel {
        position: relative;
        width: var(--raptor-wheel-size, 260px);
        height: var(--raptor-wheel-size, 260px);
        border-radius: 50%;
        background: var(--raptor-wheel-bg);
        box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
        transform: rotate(-18deg) scaleY(0.85);
        transition: transform 0.35s ease-out;
      }

      /* Variante "flat" si tilt = false */
      .wheel.flat {
        transform: none;
      }

      .wheel-disc {
        position: absolute;
        inset: 18px;
        border-radius: 50%;
        background: radial-gradient(
          circle at 30% 20%,
          var(--disc-color),
          var(--disc-color-dark)
        );
      }

      .slot {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 88px;
        height: 88px;
        background: var(--raptor-slot-bg);
        box-shadow: var(--raptor-slot-shadow);
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
        opacity: 0.9;
        transition:
          transform 0.35s ease-out,
          opacity 0.25s ease-out,
          box-shadow 0.25s ease-out,
          background 0.25s ease-out,
          border-color 0.25s ease-out;
        border: 2px solid transparent;
        overflow: hidden;
      }

      .slot-inner {
        transform: rotate(18deg) scaleY(1.15);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        position: relative;
        z-index: 2;
      }

      /* Variante "flat" pour le contenu quand tilt = false */
      .slot-inner.flat {
        transform: none;
      }

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
        font-size: 0.9rem;
        opacity: 0.95;
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
        font-size: 0.85rem;
        opacity: 0.95;
        color: var(--raptor-text-secondary);
      }

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
          0 10px 20px rgba(0,0,0,0.45),
          0 0 10px rgba(255,140,60,0.45);
        opacity: 0.96;
      }

      .slot.off:not(.active) {
        opacity: 0.8;
      }

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

      .edge-straight {
        filter: none;
      }

      .edge-liquid {
        filter: blur(3px);
      }

      .nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 34px;
        height: 70%;
        border-radius: 999px;
        background: var(--raptor-nav-bg);
        box-shadow: 0 8px 20px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        opacity: 0.95;
        transition: opacity 0.2s ease-out, transform 0.2s ease-out, background 0.2s;
        color: var(--raptor-nav-text);
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

      .hint {
        text-align: center;
        font-size: 0.7rem;
        opacity: 0.7;
        margin-top: 2px;
        color: var(--raptor-text-secondary);
      }
    `;
  }

  // -------------------- HELPERS --------------------

  _clearAutoTimer() {
    if (this._autoTimer) {
      clearTimeout(this._autoTimer);
      this._autoTimer = null;
    }
  }

  _scheduleAutoCenter() {
    this._clearAutoTimer();
    const timeoutSec = this._config.auto_center_timeout;
    if (!timeoutSec || timeoutSec <= 0) return;
    this._autoTimer = setTimeout(() => {
      this._activeIndex = this._primaryIndex ?? 0;
    }, timeoutSec * 1000);
  }

  _rotate(delta) {
    const len = this._config.entities.length;
    const realDelta = this._config.invert_swipe ? -delta : delta;
    this._activeIndex = (this._activeIndex + realDelta + len) % len;
    this._scheduleAutoCenter();
  }

  _openMoreInfo(entityId) {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId },
      })
    );
  }

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

  _isOn(stateObj, mode) {
    if (!stateObj) return false;
    const domain = stateObj.entity_id.split(".")[0];

    if (mode === "climate" || domain === "climate") {
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
    } else if (mode === "cover") {
      const pos = attr.current_position ?? attr.position;
      if (typeof pos === "number") {
        current = pos;
        percent = Math.max(0, Math.min(1, pos / 100));
        if (!unit) unit = "%";
      }
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
    } else if (mode === "binary") {
      current = stateObj.state;
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

    if (item.value_map && typeof current === "string") {
      const mapped = item.value_map[current];
      if (mapped !== undefined) {
        current = mapped;
      }
    }

    return { name, current, target, unit, stateObj, mode, percent, climate_phase };
  }

  _handleAction(type, index, item, info) {
    const stateObj = info.stateObj;
    const mode = info.mode;

    if (type === "tap" && index !== this._activeIndex) {
      this._activeIndex = index;
      this._scheduleAutoCenter();
      return;
    }

    if (!stateObj) return;

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

  _onSlotPointerLeave() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  // -------------------- RENDER DES BULLES --------------------

  _renderSlots(themeVars) {
    const entities = this._config.entities;
    const count = entities.length;
    const baseAngle = 360 / count;
    const radius = 90 * (this._config.compact ? 0.95 : 1); // rayon des bulles
    const tiltOn = this._config.tilt !== false;

    return entities.map((item, index) => {
      const info = this._getDisplayData(item);
      const { name, current, target, unit, stateObj, mode, percent, climate_phase } = info;

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

      // style supplémentaire (padding / radius / border-color)
      const padding = item.padding ?? this._config.slot_padding;
      const radiusSlot = item.radius ?? this._config.slot_radius;
      const borderColor =
        item.border_color ??
        (isOn ? this._config.slot_border_color_on : this._config.slot_border_color_off);

      let extraStyle = "";
      if (padding != null) extraStyle += `padding:${padding}px;`;
      if (radiusSlot) extraStyle += `border-radius:${radiusSlot};`;
      if (borderColor) extraStyle += `border-color:${borderColor};`;

      const classes = ["slot"];
      classes.push(isOn ? "on" : "off");

      const shape =
        item.shape || this._config.shape || "circle";
      classes.push(`shape-${shape}`);

      if (isActive) classes.push("active");

      let big = target ?? current ?? (stateObj ? stateObj.state : "");
      let small =
        current != null && target != null && current !== target
          ? current
          : null;

      if (this._config.invert_temps && current != null && target != null) {
        big = current;
        small = target;
      }

      // possibilité de cacher complètement la ligne "current"
      const showCurrent =
        item.show_current ?? this._config.show_current ?? true;
      if (!showCurrent) {
        small = null;
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

      let fillStyle = "";
      let fillPercent = percent;
      let fillColor = null;

      if (mode === "cover") {
        fillColor =
          item.cover_fill_color ||
          this._config.cover_fill_color ||
          this._config.color_on;
      } else if (mode === "gauge") {
        fillColor =
          item.gauge_color ||
          this._config.gauge_default_color ||
          this._config.color_on;
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
          fillColor =
            item.idle_color ||
            this._config.climate_color_idle ||
            this._config.color_off;
        }
      }

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
          fillColor = sev.color;
        }
      }

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

      const textMain = themeVars.textMain;
      const textSecondary = themeVars.textSecondary;

      const labelStyle = `font-size:${0.9 * (this._config.font_label || 1)}rem;color:${textSecondary};${this._config.label_bold ? "font-weight:600;" : ""}`;
      const bigStyle = `font-size:${1.45 * (this._config.font_temp || 1)}rem;color:${textMain};`;
      const smallStyle = `font-size:${0.85 * (this._config.font_current || 1)}rem;color:${textSecondary};`;

      const edge = item.edge_style || this._config.edge_style || "liquid";
      const pattern = item.pattern || this._config.pattern || "solid";

      const handleDown = (ev) =>
        this._onSlotPointerDown(ev, index, item, info);
      const handleUp = (ev) =>
        this._onSlotPointerUp(ev, index, item, info);
      const handleLeave = () => this._onSlotPointerLeave();

      return html`
        <div
          class="${classes.join(" ")}"
          style="${style} ${extraStyle}"
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
          <div class="slot-inner ${tiltOn ? "" : "flat"}">
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
      const thr = 40;

      if (dx > thr) this._rotate(1);
      if (dx < -thr) this._rotate(-1);

      startX = null;
    });
  }

  render() {
    if (!this._config || !this.hass) return html``;

    const themeVars = this._getThemeVars();

    const cardClasses = [];
    if (this._config.compact) cardClasses.push("compact");
    if (this._config.transparent) cardClasses.push("transparent");

    const activeItem = this._config.entities[this._activeIndex];
    const info = this._getDisplayData(activeItem);
    const { name, stateObj, mode } = info;
    const isOn = this._isOn(stateObj, mode);

    const headerScale = this._config.font_header || 1;
    const headerStyle = `font-size:${0.95 * headerScale}rem;`;

    const tiltOn = this._config.tilt !== false;
    const wheelClasses = ["wheel"];
    if (!tiltOn) wheelClasses.push("flat");

    let cardStyle = `
      --raptor-card-bg:${themeVars.cardBg};
      --raptor-wheel-bg:${themeVars.wheelBg};
      --raptor-slot-bg:${themeVars.slotBg};
      --raptor-slot-shadow:${themeVars.slotShadow};
      --raptor-nav-bg:${themeVars.navBg};
      --raptor-nav-text:${themeVars.navText};
      --disc-color:${themeVars.discColor};
      --disc-color-dark:${themeVars.discColorDark};
      --raptor-text-main:${themeVars.textMain};
      --raptor-text-secondary:${themeVars.textSecondary};
      --raptor-wheel-size:${this._config.wheel_size || 260}px;
    `;

    // padding personnalisé du ha-card
    if (this._config.card_padding != null) {
      const p = this._config.card_padding;
      const padValue = typeof p === "number" ? `${p}px` : String(p);
      cardStyle += `padding:${padValue};`;
    }

    return html`
      <ha-card class="${cardClasses.join(" ")}" style="${cardStyle}">
        ${this._config.show_title || this._config.show_status
          ? html`
              <div class="header" style="${headerStyle}">
                <div>
                  ${this._config.show_title ? this._config.title || "" : ""}
                </div>
                <div class="sub">
                  ${this._config.show_status && stateObj
                    ? html`${name || activeItem.entity}
                        • ${isOn ? "En chauffe / actif" : "À l'arrêt"}`
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
                  @click=${() => this._rotate(-1)}
                >
                  <span>&lt;</span>
                </div>
                <div
                  class="nav nav-right"
                  @click=${() => this._rotate(1)}
                >
                  <span>&gt;</span>
                </div>
              `
            : null}

          <div class="${wheelClasses.join(" ")}">
            <div class="wheel-disc"></div>
            ${this._renderSlots(themeVars)}
          </div>
        </div>

        ${this._config.show_hint
          ? html`<div class="hint">
              Glisse de gauche à droite ou utilise les flèches pour changer
              d'élément. Clique sur l'élément principal pour les détails
              (ou selon tap_action / hold_action).
            </div>`
          : null}
      </ha-card>
    `;
  }

  getCardSize() {
    return 4;
  }
}

// -------------------- ENREGISTREMENT DE LA CARTE --------------------

if (!customElements.get("raptor-orbit-card")) {
  customElements.define("raptor-orbit-card", RaptorOrbitCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "raptor-orbit-card",
  name: "Raptor Orbit Card",
  description:
    "Carte orbitale multi-usages (climate, sensor, cover, switch, gauge).",
});
