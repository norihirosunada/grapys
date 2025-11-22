# GraphAI + GUI + Vue3

## init
```
cd src/config
ln -s game-dev.ts project.ts
```
```
yarn install
```

## Storybook

You can browse and develop the UI components in isolation by launching Storybook:

```
yarn workspace grapys-vue storybook
```

To generate the static Storybook build, run:

```
yarn workspace grapys-vue storybook:build
```

The generated files are emitted to `dist/storybook`, so any Vite preview (`yarn workspace grapys-vue preview`) or Firebase preview deploy will serve Storybook at `/storybook/` alongside the main app.

## OpenAI llm

To use OpenAI's LLM in the browser, please set your OpenAI key in the following environment variable.
This runs entirely within your browser, so your API key is never stored or sent anywhere else.

```
VITE_OPEN_API_KEY=xxxx yarn run dev
```
