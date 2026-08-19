import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
const artifactsDirectory = path.resolve(repositoryRoot, ".artifacts");
const manifestPath = path.join(artifactsDirectory, "manifest.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSafeOwnedDirectory(directory, expectedName) {
  const filesystemRoot = path.parse(repositoryRoot).root;

  assert(repositoryRoot !== filesystemRoot, "Repository root is unsafe.");
  assert(directory !== filesystemRoot, `Unsafe ${expectedName} path.`);
  assert(directory !== repositoryRoot, `Unsafe ${expectedName} path.`);
  assert(
    path.dirname(directory) === repositoryRoot &&
      path.basename(directory) === expectedName,
    `${expectedName} must be a direct repository child.`,
  );
}

async function listFiles(directory, relativeRoot = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path
      .relative(relativeRoot, absolutePath)
      .split(path.sep)
      .join("/");

    assert(!entry.isSymbolicLink(), `Symlink is not allowed: ${relativePath}`);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath, relativeRoot)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(`Unexpected package entry: ${relativePath}`);
    }
  }

  return files.sort();
}

function assertSamePaths(actual, expected, description) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${description} differs.\nExpected: ${expected.join(", ")}\nActual: ${actual.join(", ")}`,
  );
}

assertSafeOwnedDirectory(artifactsDirectory, ".artifacts");
await rm(artifactsDirectory, { force: true, recursive: true });
await mkdir(artifactsDirectory, { recursive: true });

const { stdout } = await execFile(
  "npm",
  [
    "pack",
    "--json",
    "--loglevel=error",
    "--pack-destination",
    artifactsDirectory,
  ],
  { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
);
const packResults = JSON.parse(stdout);
assert(
  Array.isArray(packResults) && packResults.length === 1,
  "Expected exactly one npm pack result.",
);

const packResult = packResults[0];
assert(packResult && typeof packResult === "object", "Invalid pack result.");
assert(
  typeof packResult.filename === "string" &&
    packResult.filename.endsWith(".tgz"),
  "Pack result did not contain one tarball filename.",
);

const tarballPath = path.resolve(artifactsDirectory, packResult.filename);
assert(
  path.dirname(tarballPath) === artifactsDirectory,
  "Tarball escaped the artifacts directory.",
);
assert((await lstat(tarballPath)).isFile(), "Tarball was not created.");

const distFiles = await listFiles(path.join(repositoryRoot, "dist"));
const expectedPackedPaths = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "package.json",
  ...distFiles.map((file) => `dist/${file}`),
].sort();
const packedPaths = packResult.files
  .map(({ path: filePath }) => filePath)
  .sort();

assertSamePaths(packedPaths, expectedPackedPaths, "Packed allowlist");
assert(
  packResult.entryCount === packedPaths.length,
  "Pack entry count does not match the file manifest.",
);

const forbiddenPathPatterns = [
  /(^|\/)src(\/|$)/,
  /(^|\/)tests?(\/|$)/,
  /(^|\/)scripts?(\/|$)/,
  /(^|\/)\.github(\/|$)/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)docs(\/|$)/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)playwright[^/]*$/,
  /(^|\/)tsconfig[^/]*$/,
  /(^|\/)eslint[^/]*$/,
  /(^|\/)vitest[^/]*$/,
  /\.(?:cjs|cts|mts)$/,
];

for (const packedPath of packedPaths) {
  assert(
    !forbiddenPathPatterns.some((pattern) => pattern.test(packedPath)),
    `Forbidden path in tarball: ${packedPath}`,
  );
}

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "design-system-package-"),
);

try {
  await execFile("tar", ["-xzf", tarballPath, "-C", temporaryDirectory], {
    cwd: repositoryRoot,
  });
  const extractedRoot = path.join(temporaryDirectory, "package");
  const extractedPaths = await listFiles(extractedRoot);
  assertSamePaths(
    extractedPaths,
    expectedPackedPaths,
    "Extracted package allowlist",
  );

  for (const relativePath of expectedPackedPaths) {
    const input = await readFile(path.join(repositoryRoot, relativePath));
    const extracted = await readFile(path.join(extractedRoot, relativePath));
    assert(
      input.equals(extracted),
      `Extracted file differs from verified input: ${relativePath}`,
    );
  }

  const packageJson = JSON.parse(
    await readFile(path.join(extractedRoot, "package.json"), "utf8"),
  );
  assert(packageJson.private === true, "Packed package must remain private.");
  assert(
    packageJson.dependencies === undefined ||
      Object.keys(packageJson.dependencies).length === 0,
    "Packed package must not contain runtime dependencies.",
  );
  assert(
    packageJson.peerDependencies?.react === "^18.3.1 || ^19.0.0" &&
      packageJson.peerDependencies?.["react-dom"] === "^18.3.1 || ^19.0.0",
    "Packed React peer dependency contract differs.",
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
  assertSamePaths(
    Object.keys(packageJson.exports).sort(),
    expectedExportKeys,
    "Packed export keys",
  );

  for (const exportValue of Object.values(packageJson.exports)) {
    const targets =
      typeof exportValue === "string"
        ? [exportValue]
        : Object.values(exportValue);

    for (const target of targets) {
      assert(typeof target === "string", "Export target must be a string.");
      const relativeTarget = target.replace(/^\.\//, "");
      const targetPath = path.resolve(extractedRoot, relativeTarget);
      assert(
        targetPath.startsWith(`${extractedRoot}${path.sep}`),
        `Export target escaped the package: ${target}`,
      );
      assert(
        (await lstat(targetPath)).isFile(),
        `Missing export target: ${target}`,
      );
    }
  }

  for (const javascriptPath of extractedPaths.filter((file) =>
    file.endsWith(".js"),
  )) {
    const contents = await readFile(
      path.join(extractedRoot, javascriptPath),
      "utf8",
    );
    assert(!contents.includes("require("), `CommonJS found: ${javascriptPath}`);
    assert(
      !/(?:from\s*|import\s*)["'][^"']+\.css["']/.test(contents),
      `Automatic CSS import found: ${javascriptPath}`,
    );
  }
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

const tarball = await readFile(tarballPath);
const sha256 = createHash("sha256").update(tarball).digest("hex");
const manifest = {
  schemaVersion: 1,
  package: {
    name: packResult.name,
    version: packResult.version,
    private: true,
  },
  tarball: {
    filename: packResult.filename,
    path: tarballPath,
    sha256,
    integrity: packResult.integrity,
    shasum: packResult.shasum,
    fileCount: packResult.entryCount,
    packedSize: packResult.size,
    unpackedSize: packResult.unpackedSize,
  },
  paths: packedPaths,
  verification: {
    allowlist: true,
    byteComparison: true,
    exportTargets: true,
    extractedPackage: true,
    noCommonJs: true,
    noRuntimeDependencies: true,
  },
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
