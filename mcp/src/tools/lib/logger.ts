const isDebug = process.env.DEBUG === "true" || process.env.LOG_LEVEL === "debug";

function timestamp(): string {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

export const logger = {
  /** Always printed — minimal operational info */
  info(tag: string, msg: string): void {
    console.log(`${timestamp()} [${tag}] ${msg}`);
  },

  /** Only printed when DEBUG=true — detailed trace */
  debug(tag: string, msg: string): void {
    if (isDebug) {
      console.log(`${timestamp()} [${tag}] ${msg}`);
    }
  },

  /** Always printed */
  error(tag: string, msg: string, err?: unknown): void {
    const detail = err instanceof Error ? ` — ${err.message}` : err ? ` — ${String(err)}` : "";
    console.error(`${timestamp()} [${tag}] ERROR ${msg}${detail}`);
  },
};
