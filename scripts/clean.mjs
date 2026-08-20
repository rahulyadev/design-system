import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
const distPath = path.resolve(repositoryRoot, "dist");
const filesystemRoot = path.parse(repositoryRoot).root;

if (
  repositoryRoot.length === 0 ||
  repositoryRoot === filesystemRoot ||
  distPath.length === 0 ||
  distPath === filesystemRoot ||
  distPath === repositoryRoot ||
  path.dirname(distPath) !== repositoryRoot ||
  !distPath.startsWith(`${repositoryRoot}${path.sep}`)
) {
  throw new Error(`Refusing to remove unsafe build path: ${distPath}`);
}

await rm(distPath, { force: true, recursive: true });
