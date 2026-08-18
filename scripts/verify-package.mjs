import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
const distDirectory = path.join(repositoryRoot, "dist");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function listFiles(directory, relativeRoot = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath, relativeRoot)));
    } else if (entry.isFile()) {
      files.push(
        path.relative(relativeRoot, absolutePath).split(path.sep).join("/"),
      );
    } else {
      throw new Error(`Unexpected non-file package output: ${absolutePath}`);
    }
  }

  return files.sort();
}

async function assertFile(relativePath) {
  const file = await stat(path.join(repositoryRoot, relativePath));
  assert(file.isFile(), `Expected file: ${relativePath}`);
}

const sourceModules = [
  "index",
  "components/badge",
  "components/button-styles",
  "components/button",
  "components/card",
  "components/container",
  "components/icon-button",
  "components/index",
  "components/link-button",
  "components/section-heading",
  "components/section",
  "components/skip-link",
  "components/visually-hidden",
  "theme/bootstrap",
  "theme/core",
  "theme/index",
  "theme/provider",
  "theme/theme-toggle",
];

for (const modulePath of sourceModules) {
  await assertFile(`dist/${modulePath}.js`);
  await assertFile(`dist/${modulePath}.js.map`);
  await assertFile(`dist/${modulePath}.d.ts`);
  await assertFile(`dist/${modulePath}.d.ts.map`);
}

for (const cssFile of [
  "tokens.css",
  "base.css",
  "primitives.css",
  "styles.css",
]) {
  await assertFile(`dist/styles/${cssFile}`);
}

const cssSources = await Promise.all(
  ["tokens.css", "base.css", "primitives.css"].map((fileName) =>
    readFile(path.join(repositoryRoot, "src", "styles", fileName)),
  ),
);

for (const [index, fileName] of [
  "tokens.css",
  "base.css",
  "primitives.css",
].entries()) {
  const builtCss = await readFile(path.join(distDirectory, "styles", fileName));
  assert(
    builtCss.equals(cssSources[index]),
    `Built CSS differs from source: ${fileName}`,
  );
}

const expectedCombinedCss = Buffer.concat(
  cssSources.flatMap((source, index) =>
    index === 0 ? [source] : [Buffer.from("\n"), source],
  ),
);
const combinedCss = await readFile(
  path.join(distDirectory, "styles", "styles.css"),
);
assert(
  combinedCss.equals(expectedCombinedCss),
  "Combined CSS order or separator is incorrect.",
);

const rootModule = await import(
  pathToFileURL(path.join(distDirectory, "index.js")).href
);
const themeModule = await import(
  pathToFileURL(path.join(distDirectory, "theme", "index.js")).href
);

const expectedRootExports = [
  "BADGE_VARIANTS",
  "BUTTON_SIZES",
  "BUTTON_VARIANTS",
  "Badge",
  "Button",
  "CARD_VARIANTS",
  "CONTAINER_WIDTHS",
  "Card",
  "Container",
  "IconButton",
  "LinkButton",
  "SECTION_SPACING",
  "Section",
  "SectionHeading",
  "SkipLink",
  "VisuallyHidden",
].sort();
const expectedThemeExports = [
  "DEFAULT_THEME_STORAGE_KEY",
  "SYSTEM_THEME_QUERY",
  "THEME_PREFERENCES",
  "ThemeProvider",
  "ThemeToggle",
  "applyThemeToRoot",
  "createThemeBootstrapScript",
  "getEffectiveTheme",
  "parseThemePreference",
  "persistThemePreference",
  "readThemePreference",
  "useTheme",
].sort();

assert(
  JSON.stringify(Object.keys(rootModule).sort()) ===
    JSON.stringify(expectedRootExports),
  `Unexpected root runtime exports: ${Object.keys(rootModule).sort().join(", ")}`,
);
assert(
  JSON.stringify(Object.keys(themeModule).sort()) ===
    JSON.stringify(expectedThemeExports),
  `Unexpected theme runtime exports: ${Object.keys(themeModule).sort().join(", ")}`,
);

const distFiles = await listFiles(distDirectory);
const javascriptFiles = distFiles.filter((file) => file.endsWith(".js"));
const forbiddenOutputExtensions = [".cjs", ".cts", ".mjs", ".mts"];

assert(
  !distFiles.some((file) =>
    forbiddenOutputExtensions.some((extension) => file.endsWith(extension)),
  ),
  "CommonJS or alternate module output was emitted.",
);

for (const javascriptFile of javascriptFiles) {
  const contents = await readFile(
    path.join(distDirectory, javascriptFile),
    "utf8",
  );
  assert(
    !contents.includes("require("),
    `CommonJS require found: ${javascriptFile}`,
  );
  assert(
    !/(?:from\s*|import\s*)["'][^"']+\.css["']/.test(contents),
    `Automatic CSS import found: ${javascriptFile}`,
  );
}

const outputText = await Promise.all(
  distFiles.map((file) => readFile(path.join(distDirectory, file), "utf8")),
).then((contents) => contents.join("\n"));

for (const forbiddenText of [
  ["rahuly", "theme", "preference"].join("-"),
  ["rahuly", "in"].join("."),
  "/home/parry/projects/website",
]) {
  assert(
    !outputText.includes(forbiddenText),
    `Forbidden source coupling found in built output: ${forbiddenText}`,
  );
}

const packageJson = JSON.parse(
  await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
);
assert(
  packageJson.dependencies === undefined ||
    Object.keys(packageJson.dependencies).length === 0,
  "Runtime dependencies must be absent.",
);
assert(
  packageJson.peerDependencies?.react === "^18.3.1 || ^19.0.0" &&
    packageJson.peerDependencies?.["react-dom"] === "^18.3.1 || ^19.0.0",
  "React peer dependency contract differs.",
);
assert(
  !distFiles.some((file) => file.includes("node_modules/react")),
  "React was copied into dist.",
);
assert(
  !JSON.stringify(packageJson.exports).includes('"require"'),
  "A require export condition is present.",
);

const expectedExportKeys = [
  ".",
  "./theme",
  "./tokens.css",
  "./base.css",
  "./primitives.css",
  "./styles.css",
  "./package.json",
].sort();
assert(
  JSON.stringify(Object.keys(packageJson.exports).sort()) ===
    JSON.stringify(expectedExportKeys),
  "Package exposes an unexpected or missing subpath.",
);

for (const exportValue of Object.values(packageJson.exports)) {
  const targets =
    typeof exportValue === "string"
      ? [exportValue]
      : Object.values(exportValue);

  for (const target of targets) {
    assert(typeof target === "string", "Export target must be a string.");
    await assertFile(target.replace(/^\.\//, ""));
  }
}

const { stdout } = await execFile("npm", ["pack", "--dry-run", "--json"], {
  cwd: repositoryRoot,
  encoding: "utf8",
});
const packResults = JSON.parse(stdout);
assert(
  Array.isArray(packResults) && packResults.length === 1,
  "Expected one npm pack dry-run result.",
);
const packResult = packResults[0];
const packedPaths = packResult.files
  .map(({ path: filePath }) => filePath)
  .sort();
const expectedPackedPaths = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "package.json",
  ...distFiles.map((file) => `dist/${file}`),
].sort();

assert(
  JSON.stringify(packedPaths) === JSON.stringify(expectedPackedPaths),
  `Unexpected packed paths.\nExpected: ${expectedPackedPaths.join(", ")}\nActual: ${packedPaths.join(", ")}`,
);

console.log(
  JSON.stringify(
    {
      distFileCount: distFiles.length,
      package: {
        filename: packResult.filename,
        fileCount: packResult.entryCount,
        name: packResult.name,
        packedSize: packResult.size,
        paths: packedPaths,
        unpackedSize: packResult.unpackedSize,
        version: packResult.version,
      },
      rootExports: Object.keys(rootModule).sort(),
      themeExports: Object.keys(themeModule).sort(),
    },
    null,
    2,
  ),
);
