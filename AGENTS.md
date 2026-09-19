# Project conventions

## Scope

- Build only abstractions required by current behavior. Do not add placeholder services, stores, routers, or domain layers for anticipated features.
- The application targets current mobile browsers, with portrait phone layouts as the primary design target.

## Styling

- Use Tailwind utilities backed by the project-owned theme in `src/index.css`.
- Do not add a component library or import a generic visual theme.
- Reuse existing theme tokens before adding new ones. Add a shared token only when it represents a recurring design decision; keep intrinsically local values local.
- Avoid arbitrary-value utilities when a theme value expresses the same intent.
- Dedicated CSS is appropriate for complex, art-directed visuals and animation. Keep it near the owning feature rather than growing a global utility collection.
