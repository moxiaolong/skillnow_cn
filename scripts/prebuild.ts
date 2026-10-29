import { execSync } from "node:child_process";

execSync("pnpm validate:content", { stdio: "inherit" });
execSync("pnpm build:search", { stdio: "inherit" });
execSync("pnpm build:skills", { stdio: "inherit" });
execSync("pnpm build:og", { stdio: "inherit" });
