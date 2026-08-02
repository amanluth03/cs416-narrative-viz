# Essay: Legendary by the Numbers

**URL:** https://amanluth03.github.io/cs416-narrative-viz/

## Messaging

Legendary status, not Pokémon type, is what actually predicts a Pokémon's combat stats. Legendaries average 220 more total base stats than every other Pokémon — a bigger gap than exists between the strongest and weakest types.

## Narrative Structure

Martini glass. Scenes 1–2 are strictly author-driven: the only controls are Back/Next, there is no hover or filtering, and each scene states one claim with a number to back it. Scene 3 is the bowl — the reader can hover any of 800 points for details and click the legend to filter to one group, with no further guidance from the author beyond the opening scatter plot.

## Visual Structure

Every scene shares one template: an HTML title/caption block above a fixed 760×480 SVG, same margins, same type, same two-color system (blue = baseline, orange = whatever that scene wants you to notice). That consistency lets the reader read a new scene without re-learning the chart. Each scene's single d3-annotation callout points straight at the number that proves the scene's claim, so the eye goes there first. The color mapping is what carries the reader between scenes: orange marks "the notable type" in scene 1, then becomes "Legendary" in scene 2, then keeps that exact meaning into scene 3's scatter — so by scene 3 the color already means something before the reader touches anything.

## Scenes

1. **Average Stats by Type** — bar chart, average total stats by primary type, sorted descending, Dragon called out as highest.
2. **Legendary vs. Everyone Else** — same chart grammar collapsed to two bars: Legendary vs. everyone else.
3. **Attack vs. Defense, Individually** — scatter of all 800 Pokémon, Attack vs. Defense, colored by legendary status.

Order goes broad → binary → individual: first show that types differ, then show the split that actually matters, then hand over the raw data so the reader can verify both claims themselves. Each scene narrows the lens by an order of magnitude (18 types → 2 groups → 800 points).

## Annotations

All three scenes use the same d3-annotation template: `annotationCalloutCircle`, bold title + one short note line, thin connector, open circle on the subject. Same font, ink color, and stroke everywhere. Each annotation states the specific number driving that scene's claim (551, +220, 180/160) instead of a generic label, so it argues the point rather than just decorating the chart. Annotations don't change within scenes 1–2 (they're static, part of the author-driven stem). In scene 3, the annotation is the one piece of state that reacts to reader input: filtering out the Legendary group hides it, since its subject (Primal Groudon) is no longer on screen.

## Parameters

- `state.scene` (0–2): selects which render function draws the chart, and sets the title/caption text.
- `state.legendFilter` (`{true, false}`, scene 3 only): which of Legendary/Everyone-else is visible. Drives dot visibility, legend opacity, the "Showing X of 800" count, and whether the standout annotation renders at all.

## Triggers

- Back/Next buttons, the scene-counter dots, and Left/Right arrow keys all call `goToScene()`, which updates `state.scene` and redraws.
- Hovering a scatter point (`mouseenter`/`mousemove`/`mouseleave`) shows/moves/hides the tooltip.
- Clicking a legend row toggles `state.legendFilter` and calls `applyLegendFilter()`.

Affordances: the scene counter and Back/Next are always visible, so navigation is obvious from scene 1. A pill reading "This scene is free to explore" appears only in scene 3, telling the reader exactly when hover and filtering become available — not before. Legend rows use a pointer cursor and dim when toggled off, signaling they're clickable controls, not just a static key.
