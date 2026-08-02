# Essay: Legendary by the Numbers

**URL:** https://amanluth03.github.io/cs416-narrative-viz/

## Messaging

Some ordinary Pokémon are just as strong as Legendary Pokémon. They just don't have the title. Legendaries dominate on average, but 48 ordinary Pokémon (6% of the roster) match or beat the weakest legendaries in total stats.

## Narrative Structure

Martini glass. Scenes 1 and 2 are strictly author-driven: Back/Next only, no hover or filtering, and each one states a single claim with a number behind it. Scene 1 sets up the reputation (legendaries win on average); scene 2 delivers the twist (the two groups overlap). Scene 3 is the bowl. The reader can hover any of 800 points for details and click the legend to filter to one group, with no further guidance beyond the opening scatter plot.

## Visual Structure

Every scene shares one template: an HTML title/caption block above a fixed 760×480 SVG, same margins, same type, same two-color system (blue = ordinary, orange = legendary). That consistency lets the reader read a new scene without re-learning the chart. Each scene's single d3-annotation callout points straight at the number that proves that scene's claim, so the eye goes there first. Color is what carries the reader between scenes: the same blue/orange mapping from the bar chart in scene 1 reappears as the two rows in scene 2's beeswarm, then as the two groups in scene 3's scatter, so by scene 3 the color already means something before the reader touches anything.

## Scenes

1. **The Reputation**: bar chart, average total stats, Legendary vs. everyone else (+220 points).
2. **The Overlap**: beeswarm of all 800 Pokémon's total stats, legendary vs. ordinary, with a threshold line at the weakest legendary's score (580) and a callout on the 48 ordinary Pokémon that cross it.
3. **The Exceptions**: scatter of all 800 Pokémon, Attack vs. Defense, colored by legendary status, spotlighting Slaking (670 total, no legendary status).

Order follows the argument, not the data: state the assumption, complicate it with evidence, then hand over the raw data so the reader can find more exceptions themselves.

## Annotations

All three scenes use the same d3-annotation template (`annotationCalloutCircle`): bold title, one short note line, thin connector, open circle on the subject, same font/ink/stroke throughout. Each annotation states the specific number driving that scene's claim (+220, 48, 670) instead of a generic label, so it argues the point rather than decorating the chart. Annotations are static within scenes 1 and 2, part of the author-driven stem. In scene 3, the annotation is the one piece of state that reacts to reader input: filtering out "Everyone else" hides it too, since its subject (Slaking, an ordinary Pokémon) belongs to that group.

## Parameters

- `state.scene` (0–2): selects which render function draws the chart, and sets the title/caption text.
- `state.legendFilter` (`{true, false}`, scene 3 only): which of Legendary/Everyone-else is visible. Drives dot visibility, legend opacity, the "Showing X of 800" count, and whether the Slaking annotation renders at all.

## Triggers

- Back/Next buttons, the scene-counter dots, and Left/Right arrow keys all call `goToScene()`, which updates `state.scene` and redraws.
- Hovering a scatter point (`mouseenter`/`mousemove`/`mouseleave`) shows/moves/hides the tooltip.
- Clicking a legend row toggles `state.legendFilter` and calls `applyLegendFilter()`.

Affordances: the scene counter and Back/Next are always visible, so navigation is obvious from scene 1. A pill reading "Hover for details, click legend to filter" appears only in scene 3, so the reader knows exactly when those interactions unlock. Legend rows use a pointer cursor and dim when toggled off, signaling they're clickable controls, not just a static key.
