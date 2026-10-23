import { execSync } from "node:child_process";

function hasBunx() {
  try {
    execSync("bunx --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function run(command) {
  execSync(command, { stdio: "inherit" });
}

const runner = hasBunx() ? "bunx" : "npx";

run(`${runner} prisma generate`);

// Apply production migrations only during Vercel production deployments or explicit opt-in.
if (
  process.env.VERCEL_ENV === "production" ||
  process.env.RUN_PRISMA_MIGRATE_DEPLOY === "true"
) {
  run(`${runner} prisma migrate deploy`);
}

run(`${runner} next build`);

