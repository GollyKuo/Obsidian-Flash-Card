const { execFileSync } = require("child_process");

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
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
  console.warn(error);
}
