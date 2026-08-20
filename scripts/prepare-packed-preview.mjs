import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
const generatedConsumer = path.join(repositoryRoot, ".tmp", "packed-preview");
const builtPreview = path.join(repositoryRoot, ".preview");
const trackedPreview = path.join(repositoryRoot, "preview");
const artifactManifestPath = path.join(
  repositoryRoot,
  ".artifacts",
  "manifest.json",
);
const previewResultsPath = path.join(
  repositoryRoot,
  ".artifacts",
  "preview-results.json",
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSafePaths() {
  const temporaryRoot = path.join(repositoryRoot, ".tmp");
  assert(
    path.dirname(generatedConsumer) === temporaryRoot &&
      path.basename(generatedConsumer) === "packed-preview",
    "Generated preview consumer path is unsafe.",
  );
  assert(
    path.dirname(builtPreview) === repositoryRoot &&
      path.basename(builtPreview) === ".preview",
    "Built preview path is unsafe.",
  );
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
    } else {
      throw new Error(`Unsupported built preview entry: ${absolutePath}`);
    }
  }

  return files.sort();
}

assertSafePaths();
const artifactManifest = JSON.parse(
  await readFile(artifactManifestPath, "utf8"),
);
const tarballPath = path.resolve(artifactManifest.tarball.path);
assert(
  path.dirname(tarballPath) === path.join(repositoryRoot, ".artifacts"),
  "Preview tarball is outside .artifacts.",
);
assert((await lstat(tarballPath)).isFile(), "Preview tarball is missing.");
const tarballSha256 = createHash("sha256")
  .update(await readFile(tarballPath))
  .digest("hex");
assert(
  tarballSha256 === artifactManifest.tarball.sha256,
  "Preview tarball hash differs from the artifact manifest.",
);

await rm(generatedConsumer, { force: true, recursive: true });
await rm(builtPreview, { force: true, recursive: true });
await mkdir(generatedConsumer, { recursive: true });
await cp(trackedPreview, path.join(generatedConsumer, "preview"), {
  recursive: true,
});

const consumerPackageJson = {
  name: "packed-design-system-preview",
  version: "0.0.0",
  private: true,
  type: "module",
  dependencies: {
    "@rahulyadev/design-system": `file:${tarballPath}`,
    react: "19.2.8",
    "react-dom": "19.2.8",
  },
  devDependencies: {
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.4",
    typescript: "6.0.3",
    vite: "8.2.1",
  },
};
await writeFile(
  path.join(generatedConsumer, "package.json"),
  `${JSON.stringify(consumerPackageJson, null, 2)}\n`,
);

const consumerTsconfigPath = path.join(
  generatedConsumer,
  "preview",
  "tsconfig.json",
);
const consumerTsconfig = JSON.parse(
  await readFile(consumerTsconfigPath, "utf8"),
);
delete consumerTsconfig.compilerOptions.paths;
await writeFile(
  consumerTsconfigPath,
  `${JSON.stringify(consumerTsconfig, null, 2)}\n`,
);

await run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], {
  cwd: generatedConsumer,
});

const installedVersions = {};
for (const [name, expectedVersion] of [
  ["react", "19.2.8"],
  ["react-dom", "19.2.8"],
  ["@types/react", "19.2.18"],
  ["@types/react-dom", "19.2.4"],
  ["typescript", "6.0.3"],
  ["vite", "8.2.1"],
]) {
  const packageJson = JSON.parse(
    await readFile(
      path.join(generatedConsumer, "node_modules", name, "package.json"),
      "utf8",
    ),
  );
  assert(
    packageJson.version === expectedVersion,
    `Preview installed ${name}@${packageJson.version}, expected ${expectedVersion}.`,
  );
  installedVersions[name] = packageJson.version;
}

const typescriptBinary = path.join(
  generatedConsumer,
  "node_modules/typescript/bin/tsc",
);
await run("node", [typescriptBinary, "-p", "preview/tsconfig.json"], {
  cwd: generatedConsumer,
});

const viteBinary = path.join(
  generatedConsumer,
  "node_modules/vite/bin/vite.js",
);
const ssrOutput = path.join(generatedConsumer, "ssr-output");
await run(
  "node",
  [
    viteBinary,
    "build",
    "preview",
    "--ssr",
    "src/entry-server.tsx",
    "--outDir",
    ssrOutput,
    "--emptyOutDir",
  ],
  { cwd: generatedConsumer },
);

const ssrFiles = await listFiles(ssrOutput);
const ssrEntry = ssrFiles.find((file) => file.endsWith("entry-server.js"));
assert(ssrEntry, `SSR entry was not emitted: ${ssrFiles.join(", ")}`);
const ssrModule = await import(
  `${pathToFileURL(path.join(ssrOutput, ssrEntry)).href}?artifact=${tarballSha256}`
);
assert(
  typeof ssrModule.renderPreview === "function" &&
    typeof ssrModule.getThemeBootstrapScript === "function",
  "SSR entry exports are incomplete.",
);
const serverMarkup = ssrModule.renderPreview();
const bootstrapScript = ssrModule.getThemeBootstrapScript();
assert(
  serverMarkup.includes("Reusable interface primitives"),
  "SSR markup is incomplete.",
);
assert(
  serverMarkup.includes('role="radiogroup"'),
  "SSR theme controls are missing.",
);
assert(
  bootstrapScript.includes("design-system-preview-theme-preference"),
  "Bootstrap uses the wrong storage key.",
);

const templatePath = path.join(
  generatedConsumer,
  "preview",
  "index.template.html",
);
const template = await readFile(templatePath, "utf8");
assert(
  template.includes("/*THEME_BOOTSTRAP*/") &&
    template.includes("<!--SSR_MARKUP-->"),
  "Preview template placeholders are missing.",
);
const generatedHtml = template
  .replace("/*THEME_BOOTSTRAP*/", bootstrapScript)
  .replace("<!--SSR_MARKUP-->", serverMarkup);
await writeFile(
  path.join(generatedConsumer, "preview", "index.html"),
  generatedHtml,
);

await run(
  "node",
  [viteBinary, "build", "preview", "--outDir", builtPreview, "--emptyOutDir"],
  { cwd: generatedConsumer },
);

const builtFiles = await listFiles(builtPreview);
const builtIndexPath = path.join(builtPreview, "index.html");
const builtIndex = await readFile(builtIndexPath, "utf8");
const bootstrapPosition = builtIndex.indexOf('data-testid="theme-bootstrap"');
const stylesheetPosition = builtIndex.indexOf('rel="stylesheet"');
assert(bootstrapPosition >= 0, "Built preview bootstrap is missing.");
assert(
  stylesheetPosition >= 0 && bootstrapPosition < stylesheetPosition,
  "Theme bootstrap must precede the first stylesheet.",
);
assert(
  builtIndex.includes('nonce="design-system-preview-nonce"'),
  "Built preview bootstrap nonce is missing.",
);

const builtText = (
  await Promise.all(
    builtFiles.map((file) => readFile(path.join(builtPreview, file), "utf8")),
  )
).join("\n");
const sourceRepositoryRoot = path.resolve(repositoryRoot, "..", "website");
assert(
  !builtText.includes(repositoryRoot) &&
    !builtText.includes(sourceRepositoryRoot),
  "Built preview leaked a repository path.",
);
assert(
  !builtText.includes(["rahuly", "theme", "preference"].join("-")),
  "Built preview contains the portfolio storage key.",
);
assert(
  builtText.includes("design-system-preview-theme-preference"),
  "Built preview does not contain its documented storage key.",
);

const previewResults = {
  schemaVersion: 1,
  artifact: {
    path: tarballPath,
    sha256: tarballSha256,
  },
  installedVersions,
  storageKey: "design-system-preview-theme-preference",
  nonce: "design-system-preview-nonce",
  serverMarkupBytes: Buffer.byteLength(serverMarkup),
  bootstrapBytes: Buffer.byteLength(bootstrapScript),
  bootstrapBeforeStylesheet: true,
  ssrFiles,
  builtFiles,
  builtDirectory: builtPreview,
};
await writeFile(
  previewResultsPath,
  `${JSON.stringify(previewResults, null, 2)}\n`,
);
console.log(JSON.stringify(previewResults, null, 2));
