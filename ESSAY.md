# Essay: Legendary by the Numbers

**URL:** https://amanluth03.github.io/cs416-narrative-viz/

## Messaging

The message that i'm trying to communicate with the narrative visualization is that some normal Pokemon are just as strong as Legendary Pokemon. They don't just have the title of a "Legendary Pokemon", they have it for a reason. On average legendary pokemon dominate, but there are 48 ordinary Pokemon (6% of the original roster) who match up with Legendary Pokemon in total stats.

## Narrative Structure

The narrative structure that I chose for my narrative visualization was the Martini Glass. The first two scenes are author-driven as the only controls are Back/Next, also there is no hover or filtering, and each scene states one claim with a number to back it. Scene 3 is the bowl, which is because the reader can hover any of 800 points for details and click the legend to filter to one group, with no further guidance from the author beyond the opening scatter plot.

## Visual Structure

The visual structure I used for each scene is the same template: a title and caption sitting above a fixed size SVG chart, with the same margins, same fonts, and the same two colors used across every scene (blue for ordinary Pokemon, orange for Legendary Pokemon). This consistency is what lets the viewer understand and navigate each scene, since they don't have to relearn the chart every time a new scene loads. To highlight the important parts of the data, each scene has one annotation that points directly at the number backing up that scene's claim, so the viewer's eye goes there first. To help the viewer transition between scenes, I used color to connect them, the same blue/orange mapping from the bar chart in scene 1 carries into the beeswarm in scene 2 and then into the scatter plot in scene 3, so by scene 3 the colors already mean something to the viewer before they even start interacting.

## Scenes

The three scenes in my narrative visualization are The Reputation, The Overlap, and The Exceptions. The Reputation is a bar chart showing the average total stats of Legendary Pokemon versus everyone else, which is about a 220 point gap. The Overlap is a beeswarm chart plotting the total stats of all 800 Pokemon, with a line marking where the weakest Legendary Pokemon falls, showing that 48 ordinary Pokemon reach that same range on their own. The Exceptions is a scatter plot of every Pokemon's Attack and Defense stats, colored by Legendary status, with Slaking called out specifically since it's an ordinary Pokemon with 670 total stats. I ordered the scenes this way because it follows the argument I'm making, not just the data, first I state the assumption that legendaries are stronger, then I complicate that assumption with evidence, and then I let the reader go explore the raw data themselves to find more exceptions.

## Annotations

The template I used for my annotations is the same across all three scenes, using d3-annotation's `annotationCalloutCircle` type, which is a bold title, a short line of text, a thin connector line, and an open circle marking the exact data point. I chose this template because it keeps every scene looking the same, so the reader always knows where to look for the takeaway. Each annotation supports the messaging by stating the exact number backing up that scene's claim (+220, 48, 670) instead of just describing the chart, so it's making an argument instead of just decorating it. The annotations don't change within scenes 1 and 2 since those are part of the author-driven stem, but in scene 3 it does change, if the reader filters out "Everyone else" from the legend, the annotation disappears too, since its subject (Slaking) is an ordinary Pokemon that belongs to that group.

## Parameters

The parameters in my narrative visualization are `state.scene` and `state.legendFilter`. `state.scene` is a number from 0 to 2 that decides which of the three scenes is showing, and it controls which render function gets called along with the title and caption text. `state.legendFilter` is only used in scene 3, and it's an object that tracks whether the Legendary group and the Everyone else group are each turned on or off. This parameter controls which dots are visible, how faded the legend rows look, the "Showing X of 800" counter, and whether the Slaking annotation shows up at all.

## Triggers

The triggers in my narrative visualization connect what the user does to changes in state. Clicking the Back or Next buttons, the scene-counter dots, or pressing the Left/Right arrow keys all call a function called `goToScene()`, which updates `state.scene` and redraws the chart. Hovering over a point in the scatter plot triggers the tooltip to show up, move with the cursor, and disappear once the mouse leaves. Clicking a row in the legend triggers `state.legendFilter` to toggle and updates the display to match. To communicate these options to the reader, I made sure the scene counter and Back/Next buttons are always visible, so navigation is obvious from the first scene. I also added a pill of text that only shows up in scene 3, so the reader knows exactly when they're able to hover and filter. The legend rows also use a pointer cursor and dim slightly when toggled off, which signals to the reader that they're actually clickable controls and not just a static key.
