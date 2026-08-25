/**
 * Git provenance for a run — the short sha and whether the tree is dirty. Used by record.ts to
 * stamp each persisted row. No vitest dependency here.
 */

import { execFileSync } from "node:child_process";

export interface GitInfo {
  sha: string;
  dirty: boolean;
}

export function gitInfo(): GitInfo {
  try {
    const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0;
    return { sha, dirty };
  } catch {
    return { sha: "unknown", dirty: false };
  }
}
