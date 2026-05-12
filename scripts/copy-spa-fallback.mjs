import { copyFileSync, existsSync } from "node:fs";

const index = "dist/index.html";
const fallback = "dist/404.html";
if (existsSync(index)) {
  copyFileSync(index, fallback);
}
