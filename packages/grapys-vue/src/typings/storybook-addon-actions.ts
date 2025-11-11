export const action = (name: string) =>
  (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.info(`[action:${name}]`, ...args);
  };
