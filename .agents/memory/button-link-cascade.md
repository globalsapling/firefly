---
name: Button vs inline-link cascade
description: Why bordered .btn links lose their padding/border to the generic paragraph-link rule, and how to keep them independent.
---

The action buttons are anchors (`<a class="btn">`) placed inside `<p class="action-row">` within `.section-body`. The generic inline-link styling `.section-body p a { padding-bottom: 1px; border-bottom: ... }` therefore also matches the buttons.

`.section-body p a` has specificity (0,1,2) which beats `.btn` (0,1,0) and even `.action-row .btn` (0,2,0) for the `padding-bottom`/`border-bottom` longhands. Result: buttons silently got `padding-bottom: 1px` plus a stray rust bottom border, pinning the label to the bottom edge and breaking vertical centering — and no padding value on `.btn` could win the cascade.

**Why:** A user reported button text "sticking to the bottom"; tweaking `.btn` padding/line-height did nothing because the longhand override always won.

**How to apply:** When styling links inside `.section-body p`, scope the rule to `.section-body p a:not(.btn)` so the inline-underline treatment never leaks onto buttons. More broadly, before fiddling with a component's padding to fix alignment, check getComputedStyle (or measure in-browser) for a higher-specificity longhand override rather than assuming the component's own rule is in effect.
