# Scene 1: The First Breath

## Purpose

Creates the opening cinematic pause for NIDUS Experience V2. The visitor should feel the seriousness of the journey before any explanation begins.

## Public API

- `FirstBreathScene`

The scene expects to be rendered inside `ExperienceShell` so it can use the shared scene registration and scroll progress engine.

## Asset Placeholders

Uses `experienceSceneAssets.firstBreathGround`. This is a replaceable placeholder for final NIDUS dawn training-ground photography.

## Extension Points

- Replace the placeholder image from the central media registry.
- Adjust chapter metadata outside this scene when the full landing experience is assembled.
- Keep the scene CTA-free.
