# Raptor Orbit Card

![Raptor Orbit Card – Preview](presentation.gif)

Custom Lovelace card for Home Assistant that displays up to **8 entities** as “bubbles” orbiting around a central disc.

- Works great for **climate**, **covers**, **switches/lights**, **sensors** and **gauges**.
- One big “primary” bubble in front, other entities orbit around.
- Swipe on the wheel or use arrows to switch entity.
- Tap / hold actions are fully configurable.
- Built-in **auto theme** support (light / dark / HA / custom) with different colors per mode.
- Optional **transparent** mode to remove the card background (perfect over custom dashboards).

> **Version:** 1.1.6  
> **Author:** Inter-Raptor (Vivien Jardot)  
> **Card type:** `custom:raptor-orbit-card`

---

## 1. Installation

You can install the card **manually** or via **HACS (custom repository)**.

### 1.1. Manual installation

1. Download the compiled JS file from your repository releases, e.g.:

   - `raptor-orbit-card.js` (or similar bundle name)

2. Copy it into your Home Assistant `www` folder:

   ```text
   /config/www/raptor-orbit-card.js
   ```

3. Add the resource in Home Assistant:

   - Go to **Settings → Dashboards → (top right) … → Resources**  
   - Click **Add resource**:
     - URL: `/local/raptor-orbit-card.js`
     - Type: `JavaScript Module`

4. Restart the browser / clear cache if needed.

Now the card type is available as:

```yaml
type: custom:raptor-orbit-card
```

---

### 1.2. HACS (Custom repository)

If you use HACS, you can add this repository as a **custom repository**:

1. In HACS, go to **Frontend → (top right) … → Custom repositories**
2. Add your GitHub repo URL, for example:

   ```text
   https://github.com/Inter-Raptor/raptor-orbit-card
   ```

3. Category: **Lovelace**

4. Install **Raptor Orbit Card** from HACS, then reload resources / Home Assistant UI if needed.

---

## 2. Basic usage

Minimal example with a climate, a cover, a switch and a temperature sensor:

```yaml
type: custom:raptor-orbit-card
title: Ground Floor Heating
entities:
  - entity: climate.thermostat_rdc
  - entity: cover.volet_salon
  - entity: switch.prise_radiateur
  - entity: sensor.temperature_salon
```

- The first entity is used as **primary** by default.
- You can swipe horizontally on the wheel or use the side arrows to switch entity.

---

## 3. Global configuration options

These options are defined at the **root** of the card configuration.

```yaml
type: custom:raptor-orbit-card
title: "My Orbit Card"
theme_mode: auto
# ...
entities:
  - entity: ...
```

### 3.1. Layout & header

- `title: "Text"`  
  Card title in the header (top left).

- `show_title: true | false` (default: `true`)  
  Show or hide the title.

- `show_status: true | false` (default: `true`)  
  Show the **status line** in the header (top right), e.g.  
  `Thermostat • Heating`, `Socket • Active`.

- `show_hint: true | false` (default: `true`)  
  Show the hint text at the bottom of the card.

- `hint_text: "Text"`  
  Custom hint message (shown only if `show_hint: true`).

- `compact: true | false` (default: `false`)  
  Slightly reduces the card height (smaller wheel).

- `transparent: true | false` (default: `false`)  
  If `true`, removes card background and shadow (only the wheel + bubbles are visible).  
  Very useful when placing the card over a custom dashboard background.

- `card_inner_padding: number` (default: `10`)  
  Inner padding of the content (px).

- `tilt: true | false` (default: `true`)  
  - `true`: disc is slightly tilted (3D effect).  
  - `false`: disc is flat (no rotation).

---

### 3.2. Navigation & selection

- `show_arrows: true | false` (default: `true`)  
  Show / hide left and right “wings” used to change entity.

- `invert_swipe: true | false` (default: `false`)  
  Invert swipe direction.

- `primary_entity: entity_id`  
  Entity to be used as “home position” when auto-centering (see below).  
  If not set, the first entity is used.

- `auto_center_timeout: number` (seconds, default: `0`)  
  - `0` or absent: no auto-center.  
  - `> 0`: after this number of seconds without interaction, the card will recenter on `primary_entity`.

- `main_scale: number` (default: `1.1`)  
  Scaling factor applied to the **active** bubble (center front).

- `invert_temps: true | false` (default: `false`)  
  For **climate** entities:
  - `false`: big value = target temp, small value = current temp.
  - `true`: big value = current temp, small value = target.

---

### 3.3. Theme & high-level colors

The card has its own internal theme logic with 2 base modes: **light** and **dark**.  
You can control it via `theme_mode`.

- `theme_mode: auto | light | dark | ha | custom` (default: `auto`)

  - `auto`: follows Home Assistant’s dark mode (`hass.themes.darkMode`).
  - `light`: force light theme for this card.
  - `dark`: force dark theme for this card.
  - `ha`: same as `auto` (linked to HA dark mode).
  - `custom`: like light/dark, but allows overriding CSS vars:
    - `--raptor-card-bg`
    - `--raptor-wheel-bg`
    - `--raptor-slot-bg`
    - `--raptor-slot-shadow`
    - etc.

High-level logical colors:

- `color_on: "#hex"` (default:  
  - Dark theme: orange (`#ff9800`)  
  - Light theme: blue (`#2196f3`))

- `color_off: "#hex"` (default:  
  - Dark theme: dark grey (`#37474f`)  
  - Light theme: soft grey/blue (`#d0d9e6`))

Disc & navigation:

- `disc_color: "#hex"`  
  Base disc color.

- `disc_color_dark: "#hex"`  
  Darker outer disc color.

- `nav_color: "#hex"`  
  Color for navigation “wings”. If omitted, a theme-appropriate color is used.

Gauge & covers:

- `gauge_default_color: "#hex"`  
  Default color for **gauge** and **sensor** fill (when no per-entity color or severities).

- `gauge_direction: "bottom_to_top" | "top_to_bottom" | "left_to_right" | "right_to_left"`  
  Default filling direction for gauges / numeric sensors / covers.

- `cover_fill_color: "#hex"`  
  Default fill color for **covers** (if not overridden per entity).  
  If missing, the card uses theme defaults (blue in light, orange in dark).

---

### 3.4. Climate color palette (global)

For climate entities, the card automatically detects the current phase:

- `hvac_action: heating | cooling | idle`

You can globally override colors for each phase:

- `climate_color_heat: "#hex"`  
  Used when `hvac_action == "heating"`.

- `climate_color_cool: "#hex"`  
  Used when `hvac_action == "cooling"`.

- `climate_color_idle: "#hex"`  
  Used when climate is idle / off.

*(Defaults depend on theme: blue/grey in light, orange/grey in dark.)*

---

### 3.5. Binary palette (global)

For binary entities: `switch`, `light`, `input_boolean` (or `mode: binary`):

- `switch_color_on: "#hex"`  
  ON fill color.

- `switch_color_off: "#hex"`  
  OFF fill color.

If not set, the card uses `color_on` / `color_off`.

---

### 3.6. Global text & font settings

- `text_color: "#hex"`  
  Main text color in slots (labels / primary values).

- `text_color_secondary: "#hex"`  
  Secondary text color (sub values, hints).

- `font_header: number` (default: `1.05`)  
  Scale factor for header text (title / status).

- `font_label: number` (default: `1.15`)  
  Scale factor for the entity label.

- `font_temp: number` (default: `1.1`)  
  Scale factor for the main numeric value.

- `font_current: number` (default: `1.15`)  
  Scale factor for the secondary value.

- `label_bold: true | false` (default: `true`)  
  If `true`, entity labels are bold.

---

### 3.7. Global bubble / slot style

- `shape: circle | square | hex` (default: `circle`)  
  Default shape for all bubbles.

- `pattern: solid | stripes | dots` (default: `solid`)  
  Default pattern used by the fill overlay.

- `edge_style: liquid | straight` (default: `liquid`)  
  - `liquid`: blurred “liquid” edge for the fill.  
  - `straight`: sharp fill edge.

- `slot_padding: number` (default: `4`)  
  Default inner padding of each bubble (px).

- `slot_radius: number`  
  Default border radius (px) if you want to override default circle/square shapes.

- `slot_border_color_on: "#hex"`  
  Default border color used when entity is logically ON.

- `slot_border_color_off: "#hex"`  
  Default border color when logically OFF.

---

## 4. Per-entity configuration (common options)

Each entity in `entities:` can be a string or an object.  
String is the simplest form:

```yaml
entities:
  - climate.thermostat_rdc
  - cover.volet_salon
```

Object form allows full customization:

```yaml
entities:
  - entity: sensor.temperature_salon
    name: "Living room"
    mode: sensor
    shape: square
    pattern: stripes
    edge_style: liquid
    tap_action: toggle
    hold_action: more-info
    text_color: "#000000"
    text_color_secondary: "#555555"
    padding: 4
    radius: 18
    border_color: "#90a4ae"
    gauge_direction: left_to_right
    min: 0
    max: 40
    gauge_color: "#2196f3"
    severities:
      - from: 0
        to: 10
        color: "#2196f3"
      - from: 10
        to: 20
        color: "#4caf50"
      - from: 20
        to: 40
        color: "#f44336"
    value_map:
      unknown: "?"
```

### 4.1. Generic fields

- `entity: "domain.object_id"` **(required)**

- `name: "Text"`  
  Label inside the bubble.  
  If you omit it, the card uses the entity’s `friendly_name`.  
  If you set `name: ""`, no label is displayed (value only).

- `mode: climate | cover | binary | sensor | gauge`  
  Forces the entity mode instead of automatic detection.

  Auto-detection:
  - domain `climate` → `climate`
  - domain `cover` → `cover`
  - domain `switch` / `light` / `input_boolean` → `binary`
  - domain `sensor` → `sensor`
  - otherwise → `sensor`

- `shape: circle | square | hex`  
  Override the global shape.

- `pattern: solid | stripes | dots`  
  Override the global pattern.

- `edge_style: liquid | straight`  
  Override the global edge style.

---

### 4.2. Actions

- `tap_action: toggle | more-info`  

  Default behavior if not set:
  - `binary` / `cover` → `toggle`
  - others → `more-info`

- `hold_action: more-info`  

  On long press, opens the **more-info** dialog by default (and currently the only supported hold action).

---

### 4.3. Text & layout per entity

- `text_color: "#hex"`  
  Override main text color for this slot.

- `text_color_secondary: "#hex"`  
  Override secondary text color.

- `padding: number`  
  Override `slot_padding` for this entity.

- `radius: number`  
  Override `slot_radius` (border radius) for this entity.

- `border_color: "#hex"`  
  Specific border color for this entity.

---

### 4.4. Filling / gauge behavior

These options are used by `mode: gauge`, `mode: sensor` and `mode: cover`:

- `gauge_direction: "bottom_to_top" | "top_to_bottom" | "left_to_right" | "right_to_left"`  
  Filling direction for this entity.  
  Overrides the global `gauge_direction`.

- `min`, `max`  
  Range for numeric values:
  - For `gauge` mode, if absent, defaults to `0` / `100` if not otherwise defined.
  - For `sensor` mode, default is **0 / 100** if `min` / `max` are not set.

- `gauge_min`, `gauge_max`  
  Alternate names usable with `mode: gauge` (internally mapped to `min` / `max`).

- `gauge_color: "#hex"`  
  Fill color if no severity rule matches.

- `severities:`  
  A list of ranges that change the fill color depending on the current numeric value:

  ```yaml
  severities:
    - from: 0
      to: 10
      color: "#2196f3"   # blue
    - from: 10
      to: 20
      color: "#4caf50"   # green
    - from: 20
      to: 40
      color: "#f44336"   # red
  ```

If the current value lies between `from` (inclusive) and `to` (exclusive), that color is used.

> If the entity state is **not numeric**, the card displays the state as text and does **not** render a fill gauge.

---

### 4.5. Value mapping

- `value_map:`  

  Allows mapping raw string states to nicer labels:

  ```yaml
  value_map:
    home: "Home"
    not_home: "Away"
    on: "On"
    off: "Off"
    unavailable: "—"
  ```

If `state` is a string and a key exists in `value_map`, the mapped text is displayed instead.

---

## 5. Type-specific behavior & options

### 5.1. Climate (`mode: climate`)

The card reads:

- `attributes.current_temperature`
- `attributes.temperature` or `target_temp` / `target_temp_high` / `target_temp_low`
- `attributes.hvac_action` (`heating`, `cooling`, others…).

Per-entity options:

- `heat_color: "#hex"`  
  Overrides `climate_color_heat` for this entity.

- `cool_color: "#hex"`  
  Overrides `climate_color_cool`.

- `idle_color: "#hex"`  
  Overrides `climate_color_idle`.

Display logic:

- 100% filled slot (no partial gauge).
- Fill color:
  - `heating` → `heat_color` → `climate_color_heat` → `color_on`.
  - `cooling` → `cool_color` → `climate_color_cool` → `color_on`.
  - otherwise → `idle_color` → `climate_color_idle` → `color_off`.

- Text:
  - Primary value: target or current temperature depending on `invert_temps`.
  - Secondary value: the other temperature (with “current” / “target” label in your language).

---

### 5.2. Covers (`mode: cover`)

The card expects a numeric position:

- `attributes.current_position` or `attributes.position` (0–100)

Per-entity options:

- `cover_fill_color: "#hex"`  
  Overrides global fill color for this cover.

- `gauge_direction: ...`  
  Filling direction (e.g. `top_to_bottom` to indicate “from open to closed”).

Behavior:

- Fill percentage = position / 100.
- Entity is logically ON if position > 0 (used for ON/OFF styles).

---

### 5.3. Binary (`mode: binary`)

Binary entities: `switch`, `light`, `input_boolean`, or any entity you explicitly set to `mode: binary`.

Per-entity options:

- `color_on: "#hex"`  
  Fill color when state is `on`.

- `color_off: "#hex"`  
  Fill color when state is not `on`.

Behavior:

- 100% fill.
- `isOn` = `state == "on"`.

Default actions:

- `tap_action`: `toggle`
- `hold_action`: `more-info`

---

### 5.4. Gauges (`mode: gauge`)

Reads the entity state as a **number**.

- `min`, `max` or `gauge_min`, `gauge_max`  
  Define the numeric range.

- `gauge_direction`  
  Direction of the fill.

- `gauge_color`  
  Base color if no severity rule applies.

- `severities`  
  List of ranges that override the color.

---

### 5.5. Sensors (`mode: sensor`)

Reads the entity state, tries to parse it as a number:

- If numeric: behaves like a **gauge** with default range:
  - `min = 0`, `max = 100` if not overridden.
- If non-numeric: displays state text only, no fill.

You can also combine `severities` and `value_map` to show nice labels when needed.

---

## 6. Example configurations

### 6.1. Simple automatic example

```yaml
type: custom:raptor-orbit-card
title: Ground Floor
theme_mode: auto

entities:
  - climate.thermostat_rdc
  - sensor.thermometre_rdc_temperature
  - cover.volet_sejour
  - switch.prise_salon
```

Everything is automatically detected: climate, sensor, cover, binary.

---

### 6.2. Full climate/sensor/cover example

```yaml
type: custom:raptor-orbit-card
title: Ground Floor
theme_mode: auto
auto_center_timeout: 10
invert_temps: false

entities:
  - entity: climate.thermostat_rdc
    name: "Thermostat RDC"
    mode: climate
    shape: circle
    heat_color: "#2196f3"  # blue when heating
    cool_color: "#2196f3"  # blue when cooling
    idle_color: "#90a4ae"  # grey when idle

  - entity: sensor.thermometre_rdc_temperature
    name: "Temperature"
    mode: sensor
    shape: square
    pattern: stripes
    min: 0
    max: 40
    severities:
      - from: 0
        to: 10
        color: "#2196f3"   # cold = blue
      - from: 10
        to: 20
        color: "#4caf50"   # ok = green
      - from: 20
        to: 40
        color: "#f44336"   # hot = red

  - entity: cover.volet_sejour
    name: "Living Room Shutter"
    mode: cover
    shape: hex
    pattern: stripes
    gauge_direction: top_to_bottom
    cover_fill_color: "#a97b50"   # brown-ish

  - entity: switch.prise_salon
    name: "Living room Plug"
    mode: binary
    shape: circle
    color_on: "#2196f3"
    color_off: "#cbd5e1"
```

---

### 6.3. Transparent + flat disc example

```yaml
type: custom:raptor-orbit-card
transparent: true
compact: true
tilt: false          # flat disc (no 3D tilt)
show_title: false    # hide title
show_hint: false     # hide hint text

entities:
  - climate.thermostat_rdc
  - cover.volet_sejour
  - switch.prise_salon
  - sensor.temperature_salon
```

This configuration is ideal if you want the card to “float” over a background image or a custom dashboard layout.

---

## 7. Custom cards & credits

The Raptor Orbit Card is fully written in JavaScript / LitElement and works as a simple custom element:

```js
customElements.define("raptor-orbit-card", RaptorOrbitCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "raptor-orbit-card",
  name: "Raptor Orbit Card",
  description:
    "Orbit-style multi-purpose card (climate, sensor, cover, switch, gauge).",
});
```

If you like this card or use it in your dashboards, consider starring the repository and sharing screenshots of your setups. 😊
