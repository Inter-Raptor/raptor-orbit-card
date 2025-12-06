# Raptor Orbit Card

![Raptor Orbit Card – Preview](presentation.gif)

Custom Lovelace card for Home Assistant displaying up to **8 entities** as bubbles orbiting around a central disc.

- ✅ Supports: `climate`, `cover`, `switch`, `light`, `input_boolean`, `sensor`, `gauge`…
- 🌀 Navigation via **swipe** or **left / right arrows**.
- 🖱️ Handles **tap** and **long-press** (toggle, more-info, etc.).
- 🎨 “Modern dashboard” style: slightly tilted disc, 3D effect, configurable bubbles.
- 🎛 Advanced styling options: shape (`circle`, `square`, `hex`), patterns, “liquid” edges, slot padding / radius / border.
- 🌓 Light / dark visual themes, with automatic mode based on Home Assistant theme.

Author: **Inter-Raptor (Vivien Jardot)**  
Status: **Home beta**

---

## 1. Installation

### 1.1 Via HACS (recommended)

1. In Home Assistant, open **HACS → Frontend**.
2. Click the **⋮ (three dots)** in the top-right → **Custom repositories**.
3. Add a new custom repository:
   - **URL**: `https://github.com/Inter-Raptor/raptor-orbit-card`
   - **Category**: `Frontend`
4. In HACS → **Frontend**, search for **Raptor Orbit Card** and click **Install**.
5. Restart Home Assistant if required.

HACS usually adds the resource automatically.  
If needed, it should look like:

```yaml
# Settings → Dashboards → Resources
url: /hacsfiles/raptor-orbit-card/raptor-orbit-card.js
type: module
```

### 1.2 Manual installation

1. Copy the file `raptor-orbit-card.js` into:

```text
config/www/raptor-orbit-card.js
```

2. Add a Lovelace resource:

- **Settings → Dashboards → Resources → Add resource**
- **URL**: `/local/raptor-orbit-card.js`
- **Type**: `JavaScript Module`

3. Reload resources:

- either **Settings → Developer tools → Reload resources**
- or a hard refresh in your browser (`CTRL+F5`).

> ⚠️ **Important**  
> Do not remove the `/* ... */` comment header before the ASCII logo in the JS file,  
> otherwise part of the logo will be interpreted as code and the card will fail to load.

---

## 2. Basic usage

Minimal configuration:

```yaml
type: custom:raptor-orbit-card
title: Home control
entities:
  - entity: climate.thermostat_rdc
  - entity: cover.volet_sejour
  - entity: switch.interrupteur_sejour
  - entity: sensor.thermometre_rdc_temperature
```

Notes:

- Maximum **8 entities** per card.
- All options are optional: if you don’t set them, sensible defaults are used.

---

## 3. General behaviour

- Entities are displayed as **bubbles** orbiting around a central disc.
- **First tap** on a bubble:
  - if it is *not* the central bubble → that bubble becomes the central one.
- **Tap** on the **already central** bubble:
  - executes `tap_action`  
    - default: `toggle` for `switch` / `light` / `input_boolean` / `cover`,  
      `more-info` for others.
- **Long-press** on a bubble:
  - executes `hold_action` (default: `more-info`).

You can also **swipe horizontally** (left / right) on the wheel area to change the active bubble.

---

## 4. Global options (short)

Example with most options:

```yaml
type: custom:raptor-orbit-card

title: "Home control"
primary_entity: climate.thermostat_rdc

compact: false
transparent: false
show_title: true
show_status: true
show_arrows: true
show_hint: true

invert_swipe: false
invert_temps: false
auto_center_timeout: 0        # seconds, 0 = disabled
main_scale: 1.1               # zoom for the central bubble

theme_mode: auto              # auto | light | dark
tilt: true                    # true = angled disc, false = flat

color_on: "#ff9800"
color_off: "#37474f"
disc_color: "#263238"
disc_color_dark: "#111318"
nav_color: "#455a64"

cover_fill_color: "#00bcd4"
gauge_default_color: "#4caf50"
gauge_direction: bottom_to_top  # bottom_to_top | left_to_right | right_to_left

text_color: "#f5f5f5"
text_color_secondary: "rgba(245,245,245,0.78)"

shape: circle          # circle | square | hex
pattern: solid         # solid | stripes | dots
edge_style: liquid     # liquid | straight

slot_padding: 8
slot_radius: 18
slot_border_color_on: "#ffffff40"
slot_border_color_off: "#00000040"

font_header: 1.0
font_label: 1.0
font_temp: 1.0
font_current: 1.0
label_bold: true

climate_color_heat: "#ff9800"
climate_color_cool: "#00bcd4"
climate_color_idle: "#37474f"

switch_color_on: "#ff9800"
switch_color_off: "#37474f"
```

---

## 5. Entity configuration (short)

```yaml
entities:
  - entity: sensor.xxx
    name: Optional display name
    mode: climate | cover | binary | sensor | gauge
    shape: circle | square | hex
    pattern: solid | stripes | dots
    edge_style: liquid | straight
    tap_action: toggle | more-info
    hold_action: more-info
    value_map:
      raw_state: "Custom label"
```

If `mode` is not set, it is detected automatically:

- `climate.xxx` → `climate`
- `cover.xxx` → `cover`
- `switch.xxx`, `light.xxx`, `input_boolean.xxx` → `binary`
- `sensor.xxx` → `sensor` (default)

---

## 6. Example setup

```yaml
type: custom:raptor-orbit-card
title: Home control
primary_entity: climate.thermostat_rdc
color_on: "#ff9800"
color_off: "#37474f"
disc_color: "#263238"
disc_color_dark: "#111318"
nav_color: "#455a64"
label_bold: true
entities:
  - entity: climate.thermostat_rdc
    name: Heating – Ground floor
    mode: climate
  - entity: sensor.thermometre_rdc_temperature
    name: Ground floor temperature
    mode: sensor
  - entity: cover.volet_sejour
    name: Living room shutter
    mode: cover
  - entity: switch.interrupteur_sejour
    name: Living room plug
    mode: binary
  - entity: person.myriam
    name: Myriam
    mode: sensor
    value_map:
      home: "home"
      not_home: "away"
```

---

## 7. Limits & notes

- Maximum **8 entities** per card.
- Some custom integrations may be treated as simple `sensor` (no special mode).
- If a value cannot be converted to a number, the card falls back to plain text (no gauge).
- The card is still in **home beta** – feedback and suggestions are very welcome.

---

## 8. Feedback & support

If you like this card and want to support the project, the best way is to:

- ⭐ **Star the GitHub repository**  
  <https://github.com/Inter-Raptor/raptor-orbit-card>

- 📝 **Share your feedback or ideas**  
  - Open an issue or share suggestions on GitHub:  
    <https://github.com/Inter-Raptor/raptor-orbit-card/issues>  
  - You can also share screenshots of your setup and how you use the card.

- 🧩 **Check out my other creations (3D models, DIY, etc.)**  
  - 3D models on Cults3D:  
    <https://cults3d.com/fr/utilisateurs/InterRaptor/fichiers-3d>

- 👋 **Say hi or show your setup on Reddit**  
  - Reddit: <https://www.reddit.com/user/Inter-Raptor>

Thank you for using **Raptor Orbit Card** 🦖  
Every comment, idea or screenshot helps me improve the card and create new projects!
