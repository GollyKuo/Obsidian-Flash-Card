const { spawnSync } = require("child_process");

function runGit(args) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const message = (result.stderr || "").trim() || `git ${args.join(" ")} failed`;
    throw new Error(message);
  }

  return (result.stdout || "").trim();
}

const TARGET_HOOKS_PATH = ".githooks";

try {
  const current = runGit(["config", "--get", "core.hooksPath"]);
  if (current === TARGET_HOOKS_PATH) {
    console.log(`Git hooks path already configured: ${TARGET_HOOKS_PATH}`);
    process.exit(0);
  }
} catch {
  // No current hooksPath configured; continue with setup.
}

try {
  runGit(["config", "core.hooksPath", TARGET_HOOKS_PATH]);
  console.log(`Git hooks path configured: ${TARGET_HOOKS_PATH}`);
} catch (error) {
  console.warn(
    "Could not auto-configure Git hooks path in this environment. " +
      "Please run manually: git config core.hooksPath .githooks"
  );
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[setup-hooks] ${message}`);
}
