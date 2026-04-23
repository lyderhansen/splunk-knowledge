# viz_packs — reserved for Aurora v2 custom visualization extensions

This directory is intentionally empty in Aurora v1. It is reserved for
Aurora v2 custom visualization packs that extend Dashboard Studio beyond
what native viz types can deliver (pulsing alerts, gradient text, custom
animations).

Aurora v2 design (not in v1):
- `viz_packs/<name>/` contains a Canvas 2D custom viz generated via
  the `splunk-viz` skill, packaged as a Splunk app.
- `aurora.register_viz_pack(name)` wires it into the theme engine.
- `ds-create --viz-pack <name> --theme noc` installs the app and emits
  `"type": "<name>.gauge"` in panel specs.

Do not add code here without bumping the plugin to v0.11+ and updating
the Aurora spec.
