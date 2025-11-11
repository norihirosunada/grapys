import type { App } from "vue";

export interface Meta<TComponent = unknown> {
  title?: string;
  component?: TComponent;
  tags?: readonly string[];
  parameters?: Record<string, unknown>;
  args?: Record<string, unknown>;
  argTypes?: Record<string, unknown>;
}

export type StoryRenderContext = { app: App } & Record<string, unknown>;

export type StoryObj<TMeta = Meta> = {
  render?: (args: Record<string, unknown>, context: StoryRenderContext) => unknown;
  args?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  play?: (context: { canvasElement: HTMLElement }) => Promise<void> | void;
} & Record<string, unknown>;
