const fs = require("fs");
const path = require("path");

const DOC_FILES = [
  "Manual.md",
  "RoadMap.md",
  "Instruction.md",
  "Retrospective.md",
  "dev_log.md",
  ".codex/skill/SKILL.md",
  "manifest.json",
];

function countPrivateUseChars(text) {
  let count = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0xe000 && code <= 0xf8ff) {
      count += 1;
    }
  }
  return count;
}

const issues = [];
const jsonIssues = [];

for (const relativeFile of DOC_FILES) {
  const fullPath = path.join(process.cwd(), relativeFile);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const text = fs.readFileSync(fullPath, "utf8");
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  const privateUseCount = countPrivateUseChars(text);

  if (replacementCount > 0 || privateUseCount > 0) {
    issues.push({
      file: relativeFile,
      replacementCount,
      privateUseCount,
    });
  }
}

if (issues.length > 0) {
  console.error("Encoding check failed: suspicious characters detected.");
  for (const issue of issues) {
    console.error(
      `- ${issue.file}: U+FFFD=${issue.replacementCount}, PUA=${issue.privateUseCount}`,
    );
  }
  process.exit(1);
}

const jsonFiles = ["manifest.json", "package.json", "package-lock.json"];
for (const relativeFile of jsonFiles) {
  const fullPath = path.join(process.cwd(), relativeFile);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  try {
    JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    jsonIssues.push({
      file: relativeFile,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

if (jsonIssues.length > 0) {
  console.error("JSON validity check failed.");
  for (const issue of jsonIssues) {
    console.error(`- ${issue.file}: ${issue.message}`);
  }
  process.exit(1);
}

console.log("Encoding check passed: no suspicious characters found.");
console.log("JSON validity check passed.");
