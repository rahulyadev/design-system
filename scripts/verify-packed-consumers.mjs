import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
const matrixPath = path.join(repositoryRoot, "tests/package/react-matrix.json");
const fixtureRoot = path.join(repositoryRoot, "tests/package/fixtures");
const generatedRoot = path.join(repositoryRoot, ".tmp", "packed-consumers");
const artifactManifestPath = path.join(
  repositoryRoot,
  ".artifacts",
  "manifest.json",
);
const resultsPath = path.join(
  repositoryRoot,
  ".artifacts",
  "consumer-results.json",
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSafeGeneratedRoot(directory) {
  const temporaryRoot = path.join(repositoryRoot, ".tmp");

  assert(
    path.dirname(directory) === temporaryRoot &&
      path.basename(directory) === "packed-consumers",
    `Refusing to remove unsafe consumer path: ${directory}`,
  );
  assert(
    temporaryRoot !== repositoryRoot &&
      temporaryRoot.startsWith(`${repositoryRoot}${path.sep}`),
    "Temporary root is unsafe.",
  );
}

async function copyTemplates(sourceDirectory, destinationDirectory) {
  await mkdir(destinationDirectory, { recursive: true });
  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationName = entry.name.endsWith(".template")
      ? entry.name.slice(0, -".template".length)
      : entry.name;
    const destinationPath = path.join(destinationDirectory, destinationName);

    if (entry.isDirectory()) {
      await copyTemplates(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await copyFile(sourcePath, destinationPath);
    } else {
      throw new Error(`Unsupported fixture entry: ${sourcePath}`);
    }
  }
}

async function run(command, arguments_, options = {}) {
  try {
    return await execFile(command, arguments_, {
      cwd: options.cwd,
      encoding: "utf8",
      env: options.env,
      maxBuffer: 25 * 1024 * 1024,
    });
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    const stderr = typeof error.stderr === "string" ? error.stderr : "";
    throw new Error(
      `${command} ${arguments_.join(" ")} failed.\n${stdout}\n${stderr}`,
      { cause: error },
    );
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
    }
  }

  return files.sort();
}

async function findRuntimePackages(nodeModulesDirectory) {
  const matches = { react: [], "react-dom": [] };
  const visitedNodeModules = new Set();

  async function visitNodeModules(directory) {
    let canonicalDirectory;

    try {
      canonicalDirectory = await realpath(directory);
    } catch {
      return;
    }

    if (visitedNodeModules.has(canonicalDirectory)) {
      return;
    }
    visitedNodeModules.add(canonicalDirectory);

    const entries = await readdir(directory, { withFileTypes: true });
    const packageDirectories = [];

    for (const entry of entries) {
      if (entry.name === ".bin") {
        continue;
      }

      const entryPath = path.join(directory, entry.name);

      if (entry.name.startsWith("@") && entry.isDirectory()) {
        const scopedEntries = await readdir(entryPath, { withFileTypes: true });
        for (const scopedEntry of scopedEntries) {
          if (scopedEntry.isDirectory() || scopedEntry.isSymbolicLink()) {
            packageDirectories.push(path.join(entryPath, scopedEntry.name));
          }
        }
      } else if (entry.isDirectory() || entry.isSymbolicLink()) {
        packageDirectories.push(entryPath);
      }
    }

    for (const packageDirectory of packageDirectories) {
      try {
        const packageJson = JSON.parse(
          await readFile(path.join(packageDirectory, "package.json"), "utf8"),
        );

        if (packageJson.name === "react" || packageJson.name === "react-dom") {
          matches[packageJson.name].push({
            path: await realpath(packageDirectory),
            version: packageJson.version,
          });
        }
      } catch {
        // A non-package entry beneath node_modules is irrelevant to this scan.
      }

      await visitNodeModules(path.join(packageDirectory, "node_modules"));
    }
  }

  await visitNodeModules(nodeModulesDirectory);
  return matches;
}

function collectDependencyVersions(tree, dependencyName, versions = new Set()) {
  if (!tree || typeof tree !== "object") {
    return versions;
  }

  const dependencies = tree.dependencies;
  if (!dependencies || typeof dependencies !== "object") {
    return versions;
  }

  for (const [name, dependency] of Object.entries(dependencies)) {
    if (name === dependencyName && typeof dependency.version === "string") {
      versions.add(dependency.version);
    }
    collectDependencyVersions(dependency, dependencyName, versions);
  }

  return versions;
}

async function measureOutput(directory) {
  const files = await listFiles(directory);
  const measurements = [];

  for (const relativePath of files) {
    if (!/\.(?:css|js)$/.test(relativePath)) {
      continue;
    }

    const contents = await readFile(path.join(directory, relativePath));
    measurements.push({
      path: relativePath,
      type: path.extname(relativePath).slice(1),
      rawBytes: contents.length,
      gzipBytes: gzipSync(contents).length,
    });
  }

  return {
    files: measurements,
    rawBytes: measurements.reduce((total, file) => total + file.rawBytes, 0),
    gzipBytes: measurements.reduce((total, file) => total + file.gzipBytes, 0),
  };
}

const matrix = JSON.parse(await readFile(matrixPath, "utf8"));
assert(matrix.typescript === "6.0.3", "Unexpected TypeScript matrix version.");
assert(matrix.vite === "8.2.1", "Unexpected Vite matrix version.");
assert(Array.isArray(matrix.entries), "React matrix entries are missing.");

const requestedEntry = process.env["REACT_MATRIX_FILTER"];
const entries = requestedEntry
  ? matrix.entries.filter(({ id }) => id === requestedEntry)
  : matrix.entries;
assert(entries.length > 0, `Unknown React matrix filter: ${requestedEntry}`);

const artifactManifest = JSON.parse(
  await readFile(artifactManifestPath, "utf8"),
);
const tarballPath = path.resolve(artifactManifest.tarball.path);
const artifactsDirectory = path.join(repositoryRoot, ".artifacts");
assert(
  path.dirname(tarballPath) === artifactsDirectory,
  "Artifact manifest tarball is outside .artifacts.",
);
assert((await lstat(tarballPath)).isFile(), "Artifact tarball is missing.");
const tarballHash = createHash("sha256")
  .update(await readFile(tarballPath))
  .digest("hex");
assert(
  tarballHash === artifactManifest.tarball.sha256,
  "Artifact SHA-256 differs from the manifest.",
);

assertSafeGeneratedRoot(generatedRoot);
await rm(generatedRoot, { force: true, recursive: true });
await mkdir(generatedRoot, { recursive: true });

const results = [];

for (const entry of entries) {
  const consumerDirectory = path.join(generatedRoot, entry.id);
  await mkdir(consumerDirectory, { recursive: true });
  await copyTemplates(fixtureRoot, consumerDirectory);

  const consumerPackageJson = {
    name: `packed-consumer-${entry.id}`,
    version: "0.0.0",
    private: true,
    type: "module",
    dependencies: {
      "@rahulyadev/design-system": `file:${tarballPath}`,
      react: entry.react,
      "react-dom": entry.reactDom,
    },
    devDependencies: {
      "@types/react": entry.typesReact,
      "@types/react-dom": entry.typesReactDom,
      typescript: matrix.typescript,
      vite: matrix.vite,
    },
  };
  await writeFile(
    path.join(consumerDirectory, "package.json"),
    `${JSON.stringify(consumerPackageJson, null, 2)}\n`,
  );

  await run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: consumerDirectory,
  });

  const installedVersions = {};
  for (const [name, expectedVersion] of [
    ["react", entry.react],
    ["react-dom", entry.reactDom],
    ["@types/react", entry.typesReact],
    ["@types/react-dom", entry.typesReactDom],
    ["typescript", matrix.typescript],
    ["vite", matrix.vite],
  ]) {
    const installedPackage = JSON.parse(
      await readFile(
        path.join(consumerDirectory, "node_modules", name, "package.json"),
        "utf8",
      ),
    );
    assert(
      installedPackage.version === expectedVersion,
      `${entry.id} installed ${name}@${installedPackage.version}, expected ${expectedVersion}.`,
    );
    installedVersions[name] = installedPackage.version;
  }

  const installedDesignSystemDirectory = path.join(
    consumerDirectory,
    "node_modules",
    "@rahulyadev",
    "design-system",
  );
  const installedDesignSystemPackage = JSON.parse(
    await readFile(
      path.join(installedDesignSystemDirectory, "package.json"),
      "utf8",
    ),
  );
  assert(
    installedDesignSystemPackage.dependencies === undefined,
    `${entry.id} packed package gained runtime dependencies.`,
  );
  assert(
    installedDesignSystemPackage.peerDependencies?.react ===
      "^18.3.1 || ^19.0.0" &&
      installedDesignSystemPackage.peerDependencies?.["react-dom"] ===
        "^18.3.1 || ^19.0.0",
    `${entry.id} packed package does not list React only as the expected peers.`,
  );
  try {
    await stat(path.join(installedDesignSystemDirectory, "node_modules"));
    throw new Error(`${entry.id} packed package contains node_modules.`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const typescriptBinary = path.join(
    consumerDirectory,
    "node_modules/typescript/bin/tsc",
  );
  await run("node", [typescriptBinary, "-p", "nodenext/tsconfig.json"], {
    cwd: consumerDirectory,
  });
  await run("node", [typescriptBinary, "-p", "bundler/tsconfig.json"], {
    cwd: consumerDirectory,
  });

  const ssrResult = await run("node", ["ssr/run.mjs"], {
    cwd: consumerDirectory,
  });
  const ssrEvidence = JSON.parse(ssrResult.stdout.trim());
  assert(
    ssrEvidence.serverSnapshot === "system:light",
    `${entry.id} server snapshot differs.`,
  );

  const viteBinary = path.join(
    consumerDirectory,
    "node_modules/vite/bin/vite.js",
  );
  const bundleEntries = {
    buttonOnly: "button-only.tsx",
    theme: "theme.tsx",
    fullPreview: "full-preview.tsx",
    tokensCss: "tokens.ts",
    baseCss: "base.ts",
    primitivesCss: "primitives.ts",
    combinedCss: "styles.ts",
  };
  const bundles = {};

  for (const [bundleName, fixtureEntry] of Object.entries(bundleEntries)) {
    const outputDirectory = path.join(
      consumerDirectory,
      "bundle-output",
      bundleName,
    );
    const buildResult = await run(
      "node",
      [viteBinary, "build", "--config", "bundler/vite.config.mjs"],
      {
        cwd: consumerDirectory,
        env: {
          ...process.env,
          PACKED_FIXTURE_ENTRY: fixtureEntry,
          PACKED_FIXTURE_OUTPUT: outputDirectory,
        },
      },
    );
    assert(
      !/\b(?:warning|error)\b/i.test(buildResult.stderr),
      `${entry.id} ${bundleName} emitted a Vite warning or error:\n${buildResult.stderr}`,
    );

    const outputFiles = await listFiles(outputDirectory);
    const outputText = (
      await Promise.all(
        outputFiles.map((file) =>
          readFile(path.join(outputDirectory, file), "utf8"),
        ),
      )
    ).join("\n");
    const sourceRepositoryRoot = path.resolve(repositoryRoot, "..", "website");
    assert(
      !outputText.includes(repositoryRoot) &&
        !outputText.includes(sourceRepositoryRoot),
      `${entry.id} ${bundleName} leaked a repository path.`,
    );
    assert(
      !/(?:@import\s+(?:url\()?\s*["']?(?:https?:)?\/\/|url\(\s*["']?(?:https?:)?\/\/|fetch\(\s*["']https?:\/\/|new\s+WebSocket\(\s*["']https?:\/\/)/i.test(
        outputText,
      ),
      `${entry.id} ${bundleName} contains an unexpected remote request.`,
    );

    bundles[bundleName] = {
      files: outputFiles,
      measurements: await measureOutput(outputDirectory),
    };

    if (bundleName === "buttonOnly") {
      assert(
        !outputText.includes("design-system-theme-preference") &&
          !outputText.includes("design-system:theme-change"),
        `${entry.id} button-only output retained theme implementation.`,
      );
      assert(
        !outputFiles.some((file) => file.endsWith(".css")),
        `${entry.id} button-only JavaScript import injected CSS.`,
      );
    }

    if (bundleName === "theme") {
      assert(
        outputText.includes("design-system-theme-preference") &&
          outputText.includes("design-system:theme-change"),
        `${entry.id} theme output omitted expected implementation strings.`,
      );
      assert(
        !outputFiles.some((file) => file.endsWith(".css")),
        `${entry.id} theme JavaScript import injected CSS.`,
      );
    }

    if (bundleName === "fullPreview" || bundleName === "combinedCss") {
      assert(
        outputText.includes("--palette-canvas") &&
          outputText.includes(".ui-button"),
        `${entry.id} combined CSS output is incomplete.`,
      );
    } else if (bundleName === "tokensCss") {
      assert(
        outputText.includes("--palette-canvas") &&
          !outputText.includes(".ui-button"),
        `${entry.id} tokens CSS subpath resolved incorrectly.`,
      );
    } else if (bundleName === "baseCss") {
      assert(
        outputText.includes("box-sizing:border-box") &&
          !outputText.includes(".ui-button"),
        `${entry.id} base CSS subpath resolved incorrectly.`,
      );
    } else if (bundleName === "primitivesCss") {
      assert(
        outputText.includes(".ui-button") &&
          !outputText.includes("--palette-canvas"),
        `${entry.id} primitives CSS subpath resolved incorrectly.`,
      );
    }
  }

  const npmLsResult = await run(
    "npm",
    ["ls", "react", "react-dom", "--all", "--json"],
    { cwd: consumerDirectory },
  );
  const npmLsTree = JSON.parse(npmLsResult.stdout);
  const reactVersions = [...collectDependencyVersions(npmLsTree, "react")];
  const reactDomVersions = [
    ...collectDependencyVersions(npmLsTree, "react-dom"),
  ];
  assert(
    reactVersions.length === 1 && reactVersions[0] === entry.react,
    `${entry.id} npm tree resolved unexpected React versions: ${reactVersions.join(", ")}`,
  );
  assert(
    reactDomVersions.length === 1 && reactDomVersions[0] === entry.reactDom,
    `${entry.id} npm tree resolved unexpected React DOM versions: ${reactDomVersions.join(", ")}`,
  );

  const runtimePackages = await findRuntimePackages(
    path.join(consumerDirectory, "node_modules"),
  );
  assert(
    runtimePackages.react.length === 1 &&
      runtimePackages.react[0].version === entry.react,
    `${entry.id} has duplicate physical React packages: ${JSON.stringify(runtimePackages.react)}`,
  );
  assert(
    runtimePackages["react-dom"].length === 1 &&
      runtimePackages["react-dom"][0].version === entry.reactDom,
    `${entry.id} has duplicate physical React DOM packages: ${JSON.stringify(runtimePackages["react-dom"])}`,
  );

  results.push({
    id: entry.id,
    installedVersions,
    nodeNext: { passed: true, deepImportRejected: true },
    bundler: { passed: true, bundles },
    ssr: { passed: true, ...ssrEvidence },
    npmLs: npmLsTree,
    runtimePackages,
    duplicateReact: false,
    tarballSha256: tarballHash,
  });

  console.log(
    `${entry.id}: NodeNext, Bundler, SSR, CSS exports, and duplicate-React checks passed.`,
  );
}

const output = {
  schemaVersion: 1,
  matrix: {
    typescript: matrix.typescript,
    vite: matrix.vite,
    entries: entries.map((entry) => ({ ...entry })),
  },
  artifact: {
    path: tarballPath,
    sha256: tarballHash,
  },
  results,
};
await writeFile(resultsPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
