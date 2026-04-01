const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const SKIP_PREPUSH_VALIDATE_ENV = "FC_SKIP_PREPUSH_VALIDATE";

function printUsage() {
  console.log("Usage: npm run release -- <version> [--dry-run] [--no-commit] [--push]");
  console.log("Example: npm run release -- 0.1.27");
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.error) {
    console.error(`[release] command failed: ${command} ${args.join(" ")}`);
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runNpmCommand(args) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    console.error("[release] npm_execpath is not available in this shell.");
    process.exit(1);
  }

  runCommand(process.execPath, [npmCli, ...args]);
}

function updateManifestVersion(version) {
  const manifestPath = path.join(process.cwd(), "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("manifest.json not found.");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.version = version;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0 || rawArgs.includes("--help")) {
    printUsage();
    process.exit(rawArgs.length === 0 ? 1 : 0);
  }

  const dryRun = rawArgs.includes("--dry-run");
  const noCommit = rawArgs.includes("--no-commit");
  const shouldPush = rawArgs.includes("--push");
  const positionalArgs = rawArgs.filter((arg) => !arg.startsWith("--"));
  const version = positionalArgs[0];

  if (!version || !VERSION_PATTERN.test(version)) {
    console.error(`Invalid version: "${version ?? ""}". Expected format: x.y.z`);
    process.exit(1);
  }

  const gitCommand = "git";

  console.log(`[release] target version: v${version}`);
  console.log("[release] step 1/5: run validation checks");
  runNpmCommand(["run", "validate:prepush"]);

  if (dryRun) {
    console.log("[release] dry-run mode enabled, skip version bump and git actions.");
    process.exit(0);
  }

  console.log("[release] step 2/5: bump package version");
  runNpmCommand(["version", version, "--no-git-tag-version"]);

  console.log("[release] step 3/5: sync manifest version");
  updateManifestVersion(version);

  if (noCommit) {
    console.log("[release] --no-commit mode enabled, stop before git add/commit.");
    process.exit(0);
  }

  console.log("[release] step 4/5: stage and commit release");
  runCommand(gitCommand, ["add", "."]);
  runCommand(gitCommand, ["commit", "-m", `release: v${version}`]);

  if (shouldPush) {
    console.log("[release] step 5/5: push to origin/master");
    runCommand(gitCommand, ["push", "origin", "master"], {
      env: {
        ...process.env,
        [SKIP_PREPUSH_VALIDATE_ENV]: "1",
      },
    });
    return;
  }

  console.log("[release] step 5/5: push skipped (add --push to enable)");
}

main();
