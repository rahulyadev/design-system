import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
const sourceDirectory = path.join(repositoryRoot, "src", "styles");
const outputDirectory = path.join(repositoryRoot, "dist", "styles");
const cssFiles = ["tokens.css", "base.css", "primitives.css"];

await mkdir(outputDirectory, { recursive: true });

const sourceBuffers = [];

for (const fileName of cssFiles) {
  const source = await readFile(path.join(sourceDirectory, fileName));
  sourceBuffers.push(source);
  await writeFile(path.join(outputDirectory, fileName), source);
}

const combined = Buffer.concat(
  sourceBuffers.flatMap((source, index) =>
    index === 0 ? [source] : [Buffer.from("\n"), source],
  ),
);

await writeFile(path.join(outputDirectory, "styles.css"), combined);
