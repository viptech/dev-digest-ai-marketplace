/**
 * Child-process environment for the SDK. Subscription-only in this subset (no OpenRouter
 * backend copied — see README.md for what was dropped from the source engine).
 */

/**
 * Copy the current env, with any API key stripped so the SDK uses the Claude Code subscription
 * instead of per-token API billing. Without this every eval run would silently bill API tokens.
 */
export function subscriptionEnv(): Record<string, string> {
  const env = { ...process.env } as Record<string, string>;
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  return env;
}
