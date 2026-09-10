import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function findTests(dir) {
  const results = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findTests(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      results.push(fullPath);
    }
  }

  return results;
}

const tests = findTests(join(process.cwd(), "tests"));

if (tests.length === 0) {
  console.error("No test files found.");
  process.exit(1);
}

let failed = false;

for (const test of tests) {
  console.log(`\n===== RUNNING ${test} =====`);

  const result = spawnSync(process.execPath, ["--import", "tsx", "--test", test], {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
