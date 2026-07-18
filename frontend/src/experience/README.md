# NIDUS Experience V2 Foundation

This folder contains the reusable infrastructure for the cinematic NIDUS public experience. It is intentionally separate from the existing dashboard and marketing screens so future scenes can be built without changing Academy OS workflows.

## Architecture

- `design-system/` stores reusable tokens and semantic theme values.
- `motion/` stores shared motion presets, easing, durations, and sequencing helpers.
- `layout/` stores approved scene containers and composition primitives.
- `shared/` stores content-free UI foundations such as typography, buttons, media wrappers, surfaces, quotes, dividers, and statistics.
- `scroll/` stores scene registration and scroll-progress architecture.
- `shell/` stores the permanent experience shell: root layers, navigation, progress, backgrounds, overlays, accessibility, and development diagnostics.
- `providers/` stores the root provider that combines Experience runtime context.
- `hooks/` stores viewport, performance, reduced-motion, lazy reveal, and image intent hooks.
- `utils/` stores scene and viewport helpers.
- `media/` stores media contracts and validation helpers.
- `scenes/` is reserved for future cinematic scene implementations. It intentionally contains no scene UI in this phase.
- `types/` stores shared TypeScript contracts.

## Naming Conventions

- Prefix exported foundations with `Experience` when they are visual primitives.
- Use scene ids created with `createSceneId(sceneNumber, sceneName)`.
- Name future scene files by storyboard order, for example `scene-01-first-breath`.
- Keep tokens semantic. Use `ceremonial`, `trust`, `recovery`, and `immersive` language instead of local color nicknames.

## Adding New Scenes

1. Create the scene under `scenes/` in storyboard order.
2. Wrap the scene in `SceneContainer`.
3. Use `ReadingContainer`, `ContentContainer`, or `VisualContainer` for width.
4. Register the scene with the scroll engine only when it needs progress or pinned behavior.
5. Use motion presets from `motion/`; do not create local easing or duration values.
6. Use shared typography, media, button, and surface primitives.

## Using The Experience Shell

Wrap future cinematic scenes with `ExperienceShell`. The shell owns the permanent framework around the story:

- background layer
- atmosphere layer
- navigation layer
- scroll container
- scene viewport
- progress layer
- accessibility layer
- development-only debug layer

Scenes should not create their own global navigation, page progress, skip links, or background framework.

## Navigation Discovery

Pass `navigationItems` and `chapters` into `ExperienceShell`. Each chapter id should match a real scene element id. The shell tracks scroll position and marks the active chapter when its scene reaches the upper reading zone of the viewport.

Navigation items should be minimal and institutional. They should point to scene anchors or approved public routes.

## Backgrounds And Overlays

Use the `background` prop to choose static, gradient, image, or atmospheric background states. Use `overlays` for subtle noise, paper grain, light, fog, gradient, or color wash.

Overlays are optional and should be used sparingly. They mount after hydration to keep the initial shell light.

## Reusing Animation

- Use `getExperienceMotionPreset` for named reveals.
- Use `createRevealTimeline` for ordered scene reveals.
- Use `mapProgress` for scroll segments.
- Use `createDepthOffset` for controlled parallax depth.
- Respect `usePerformanceGuard` before heavy visual effects.

## Reusing Layout

- Use `SceneContainer` for every cinematic chapter.
- Use `Stack`, `Cluster`, `Grid`, and `Split` for composition.
- Use `SectionSpacer` only for intentional breathing room.
- Do not hardcode container widths in scene files.

## Reusing Tokens

- Use `experienceTokens` for spacing, radius, z-index, blur, elevation, and scene length.
- Use `experienceTheme` for surface, text, border, button, shadow, motion, and scene semantics.
- Avoid inline magic numbers. If a value must repeat, promote it to a token first.

## Performance Rules

- Use `ExperienceImage` for optimized image framing.
- Use `useOptimizedImage` to set image intent.
- Use `useIntersectionObserver` for lazy reveals.
- Use `useReducedMotionSetting` and `usePerformanceGuard` before high-intensity animation.
- Always clean up observers, animation frames, and scroll listeners.

## Common Mistakes To Avoid

- Do not build business content inside foundation primitives.
- Do not add scene-specific animation to `shared/`.
- Do not duplicate motion presets.
- Do not add local hardcoded widths, durations, or z-index values.
- Do not use pinned behavior for normal reading scenes.
- Do not create another design-token source outside `design-system/`.
- Do not import unavailable smooth-scroll or timeline libraries directly; add adapters only when the dependency exists in the project.
