import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
const expectedVersionArgument = process.argv.find((argument) =>
  argument.startsWith("--expected-version="),
);
const expectedVersion = expectedVersionArgument?.slice(
  "--expected-version=".length,
);

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

    assert(!entry.isSymbolicLink(), `Symlink is not allowed: ${absolutePath}`);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath, relativeRoot)));
    } else if (entry.isFile()) {
      files.push(
        path.relative(relativeRoot, absolutePath).split(path.sep).join("/"),
      );
    } else {
      throw new Error(`Unexpected package entry: ${absolutePath}`);
    }
  }

  return files.sort();
}

function assertSame(actual, expected, description) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${description} differs.\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`,
  );
}

assert(expectedVersion, "Expected --expected-version=<version>.");
assert(
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/.test(expectedVersion),
  `Invalid expected version: ${expectedVersion}`,
);

const packageJson = JSON.parse(
  await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
);
const packageLock = JSON.parse(
  await readFile(path.join(repositoryRoot, "package-lock.json"), "utf8"),
);
const changelog = await readFile(
  path.join(repositoryRoot, "CHANGELOG.md"),
  "utf8",
);
const readme = await readFile(path.join(repositoryRoot, "README.md"), "utf8");

assert(
  packageJson.name === "@rahulyadev/design-system",
  "Package name differs.",
);
assert(packageJson.version === expectedVersion, "Package version differs.");
assert(
  packageJson.private === undefined,
  "Release package must not be private.",
);
assert(packageJson.license === "MIT", "License must be MIT.");
assert(packageJson.type === "module", "Package must remain ESM-only.");
assert(
  packageJson.repository?.type === "git" &&
    packageJson.repository?.url ===
      "https://github.com/rahulyadev/design-system",
  "Repository metadata must exactly identify rahulyadev/design-system.",
);
assertSame(
  packageJson.peerDependencies,
  {
    react: "^18.3.1 || ^19.0.0",
    "react-dom": "^18.3.1 || ^19.0.0",
  },
  "Peer dependencies",
);
assert(
  packageJson.dependencies === undefined ||
    Object.keys(packageJson.dependencies).length === 0,
  "Runtime dependencies must be absent.",
);
assertSame(
  packageJson.engines,
  { node: ">=24.19.0 <25", npm: ">=11.17.0 <12" },
  "Engine contract",
);
assertSame(
  packageJson.publishConfig,
  { access: "public" },
  "Publish configuration",
);
assertSame(packageJson.sideEffects, ["**/*.css"], "CSS side effects");
assertSame(
  packageJson.files,
  ["dist", "README.md", "CHANGELOG.md", "LICENSE"],
  "Package file allowlist",
);

const expectedExports = {
  ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
  "./theme": {
    types: "./dist/theme/index.d.ts",
    import: "./dist/theme/index.js",
  },
  "./tokens.css": "./dist/styles/tokens.css",
  "./base.css": "./dist/styles/base.css",
  "./primitives.css": "./dist/styles/primitives.css",
  "./styles.css": "./dist/styles/styles.css",
  "./package.json": "./package.json",
};
assertSame(packageJson.exports, expectedExports, "Public export map");

for (const exportValue of Object.values(packageJson.exports)) {
  const targets =
    typeof exportValue === "string"
      ? [exportValue]
      : Object.values(exportValue);

  for (const target of targets) {
    const targetPath = path.resolve(
      repositoryRoot,
      target.replace(/^\.\//, ""),
    );
    assert(
      targetPath.startsWith(`${repositoryRoot}${path.sep}`),
      `Export escaped repository: ${target}`,
    );
    assert(
      (await stat(targetPath)).isFile(),
      `Missing export target: ${target}`,
    );
  }
}

assert(packageLock.name === packageJson.name, "Lockfile package name differs.");
assert(packageLock.version === expectedVersion, "Lockfile version differs.");
assert(
  packageLock.packages?.[""]?.version === expectedVersion,
  "Lockfile root version differs.",
);
assert(
  changelog.includes(`## ${expectedVersion} - 2026-08-20`),
  `Changelog is missing ${expectedVersion} dated 2026-08-20.`,
);

const documentedVersions = [
  ...readme.matchAll(/@rahulyadev\/design-system@([0-9][0-9A-Za-z.-]*)/g),
].map((match) => match[1]);
assert(documentedVersions.length > 0, "README lacks an exact-version example.");
assert(
  documentedVersions.every((version) => version === expectedVersion),
  `README claims another package version: ${documentedVersions.join(", ")}`,
);
assert(
  readme.includes(
    `npm install --save-exact @rahulyadev/design-system@${expectedVersion}`,
  ),
  "README lacks the exact npm installation command.",
);

const distFiles = await listFiles(path.join(repositoryRoot, "dist"));
const declarationAndMapFiles = distFiles.filter((file) =>
  /(?:\.d\.ts|\.(?:d\.ts|js)\.map)$/.test(file),
);
const forbiddenAbsolutePath =
  /(?:file:\/\/|[A-Za-z]:\\|\/(?:home|Users|workspace|work)\/)/;

for (const relativePath of declarationAndMapFiles) {
  const contents = await readFile(
    path.join(repositoryRoot, "dist", relativePath),
    "utf8",
  );
  assert(
    !contents.includes(repositoryRoot) && !forbiddenAbsolutePath.test(contents),
    `Absolute path found in declaration or map: ${relativePath}`,
  );
}

const expectedPackedPaths = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "package.json",
  ...distFiles.map((file) => `dist/${file}`),
].sort();
const { stdout: dryRunOutput } = await execFile(
  "npm",
  ["pack", "--dry-run", "--json", "--loglevel=error"],
  { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
);
const dryRunResults = JSON.parse(dryRunOutput);
assert(
  Array.isArray(dryRunResults) && dryRunResults.length === 1,
  "Expected one npm pack dry-run result.",
);
assertSame(
  dryRunResults[0].files.map(({ path: filePath }) => filePath).sort(),
  expectedPackedPaths,
  "Dry-run package allowlist",
);

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "design-system-release-verification-"),
);
let packResult;
let tarballSha256;

try {
  const { stdout: packOutput } = await execFile(
    "npm",
    [
      "pack",
      "--json",
      "--loglevel=error",
      "--pack-destination",
      temporaryDirectory,
    ],
    { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  const packResults = JSON.parse(packOutput);
  assert(
    Array.isArray(packResults) && packResults.length === 1,
    "Expected one generated release tarball.",
  );
  packResult = packResults[0];
  assert(packResult.name === packageJson.name, "Packed name differs.");
  assert(packResult.version === expectedVersion, "Packed version differs.");
  assertSame(
    packResult.files.map(({ path: filePath }) => filePath).sort(),
    expectedPackedPaths,
    "Generated package allowlist",
  );

  const tarballPath = path.join(temporaryDirectory, packResult.filename);
  const tarball = await readFile(tarballPath);
  tarballSha256 = createHash("sha256").update(tarball).digest("hex");
  await execFile("tar", ["-xzf", tarballPath, "-C", temporaryDirectory]);
  const extractedPackageJson = JSON.parse(
    await readFile(
      path.join(temporaryDirectory, "package", "package.json"),
      "utf8",
    ),
  );
  assert(
    extractedPackageJson.name === packageJson.name,
    "Tarball name differs.",
  );
  assert(
    extractedPackageJson.version === expectedVersion,
    "Tarball version differs.",
  );
  assert(
    extractedPackageJson.private === undefined,
    "Tarball unexpectedly contains a private guard.",
  );
  assertSame(extractedPackageJson.exports, expectedExports, "Tarball exports");
  assertSame(
    extractedPackageJson.peerDependencies,
    packageJson.peerDependencies,
    "Tarball peers",
  );
  assert(
    extractedPackageJson.dependencies === undefined,
    "Tarball contains runtime dependencies.",
  );
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

let registryState = "absent";

try {
  const { stdout } = await execFile(
    "npm",
    [
      "view",
      `${packageJson.name}@${expectedVersion}`,
      "version",
      "dist.integrity",
      "dist.shasum",
      "--json",
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  const registryMetadata = JSON.parse(stdout);
  assert(
    registryMetadata.version === expectedVersion &&
      registryMetadata.dist?.integrity === packResult.integrity &&
      registryMetadata.dist?.shasum === packResult.shasum,
    `Registry version ${expectedVersion} exists with different bytes or metadata.`,
  );
  registryState = "present-exact";
} catch (error) {
  if (
    error instanceof Error &&
    error.message.includes("exists with different")
  ) {
    throw error;
  }
  const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
  assert(
    /E404|404 Not Found/.test(output),
    `Registry version check failed without an E404: ${output}`,
  );
}

console.log(
  JSON.stringify(
    {
      expectedVersion,
      package: packageJson.name,
      registryState,
      tarball: {
        filename: packResult.filename,
        sha256: tarballSha256,
        integrity: packResult.integrity,
        shasum: packResult.shasum,
        fileCount: packResult.entryCount,
        packedSize: packResult.size,
        unpackedSize: packResult.unpackedSize,
      },
      verification: {
        changelog: true,
        declarationsAndMaps: true,
        exports: true,
        metadata: true,
        noRuntimeDependencies: true,
        packedAllowlist: true,
        peers: true,
        readmeVersion: true,
      },
    },
    null,
    2,
  ),
);
