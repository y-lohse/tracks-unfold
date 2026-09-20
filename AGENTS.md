# Project conventions

## Scope

- Build only abstractions required by current behavior. Do not add placeholder services, stores, routers, or domain layers for anticipated features.
- The application targets current mobile browsers, with portrait phone layouts as the primary design target.

## Styling

The visual language is project-owned. Tailwind supplies implementation utilities; it does not supply the design direction.

### Before writing styles

- Read `src/index.css` and the owning feature's existing styles before choosing colors, spacing, typography, radii, shadows, or breakpoints.
- Reuse the established light-mode surface, text, and accent vocabulary unless the task explicitly changes the art direction. Do not casually introduce generic `black`, `white`, or framework-palette colors.
- Check nearby components for an existing pattern before creating another way to express the same visual decision.

### Tailwind and component CSS

- Use Tailwind utilities for layout, spacing, sizing, typography, responsive behavior, and simple interaction states.
- Do not add a component library or import a generic visual theme.
- Avoid arbitrary-value utilities when an existing theme utility expresses the same intent.
- Dedicated CSS is appropriate for complex, art-directed geometry, gradients, masks, layered shadows, pseudo-elements, and animation. Do not force these into unreadable utility strings.
- Put dedicated component styles in a co-located `*.module.css` file and import them as a CSS Module. Do not introduce globally scoped feature class names.
- Keep global CSS in `src/index.css` limited to Tailwind setup, project-wide theme tokens, resets, and true document-level defaults. Never move feature styling there for convenience.
- Mixing Tailwind utilities with a component's CSS Module is expected: Tailwind should handle the ordinary layout; the module should handle only the art-directed portion.

### Token ownership

Classify visual values before adding them:

1. **Project token:** a recurring application-wide design decision. Define it in the `@theme` block in `src/index.css` with a semantic name, then consume it through the generated Tailwind utility or CSS custom property.
2. **Feature token:** a repeated value that gives one art-directed feature its internal visual coherence but is not part of the whole application's language. Define it as a custom property on the root class in that feature's CSS Module.
3. **Local constant:** an intrinsically local geometry or alignment value used once, such as a percentage required to position a particular shape. Keep it as a literal near its use.

Additional rules:

- Name tokens by role and intent (`--color-surface`, `--key-face-light`), not by raw appearance or numbered implementation detail (`--beige`, `--color-3`).
- Reuse an existing token before adding one. Add a project token only when it represents a recurring design decision; do not promote every literal into the global theme.
- Do not leave repeated color literals, shadow colors, gradients, or other palette-defining values scattered through component rules. Give them project or feature ownership.
- Do not hard-code visual constants in TSX `style` props when CSS or a custom property can express them. Inline styles are acceptable only for genuinely data-driven values; pass those values through a typed custom property where practical.
- A value being supported by a Tailwind utility does not automatically make it part of this project's design language. For example, `bg-black` is still an unreviewed color choice if the project theme has no semantic black surface.

### Correcting or extending existing visual work

When touching a visual component that predates these rules, bring the styles you touch into compliance rather than adding another styling convention:

1. Inventory its Tailwind classes, CSS selectors, inline styles, and repeated literals.
2. Separate ordinary layout from art-directed styling.
3. Replace ordinary layout CSS with existing Tailwind theme utilities where that improves clarity.
4. Move the remaining feature CSS into a co-located CSS Module and scope every feature selector.
5. Classify repeated visual values as project tokens or feature tokens; preserve true one-off geometry as local constants.
6. Reuse the established application palette where appropriate instead of preserving accidental generic colors.
7. Keep the refactor behaviorally and visually focused. Do not redesign the component unless the task asks for a redesign.

### Required styling review

Before declaring visual work complete:

- Search the changed TSX and CSS for raw color literals, generic palette utilities, arbitrary-value utilities, global feature selectors, and inline visual styles.
- For every occurrence, either replace it with the correct project/feature token or verify that it is an intentional local constant.
- Confirm the component still works at the primary portrait-phone width and does not regress the existing wider layout.
- Run the project's formatting, linting, tests, and production build. Passing those checks does not by itself prove that the token and ownership rules were followed; perform the review above explicitly.
