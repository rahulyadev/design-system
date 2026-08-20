import { spawnSync } from "node:child_process";
import {
  cp,
  mkdir,
  readFile,
  realpath,
  rm,
  stat,
  symlink,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IMAGE_TAG = "mcr.microsoft.com/playwright:v1.62.1-noble";
const IMAGE_DIGEST =
  "sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e";
const IMAGE_REFERENCE = `${IMAGE_TAG}@${IMAGE_DIGEST}`;
const CONTAINER_MARKER = "DESIGN_SYSTEM_PLAYWRIGHT_CONTAINER";
const operations = new Map([
  ["browser", "test:browser"],
  ["visual-update", "test:visual:update"],
  ["visual", "test:visual"],
]);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function run(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: options.cwd,
    encoding: options.encoding,
    env: options.env,
    stdio: options.stdio,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

const requestedOperation = process.argv[2];
if (process.argv.length !== 3 || !operations.has(requestedOperation)) {
  fail(
    "Usage: node scripts/run-playwright-container.mjs <browser|visual-update|visual>",
  );
} else if (!IMAGE_REFERENCE.includes("@sha256:")) {
  fail("Refusing an unverified Playwright image reference.");
} else {
  const directScript = operations.get(requestedOperation);

  if (process.env[CONTAINER_MARKER] === "1") {
    console.log(
      `Playwright container marker detected; running direct script ${directScript}.`,
    );
    const directResult = run("npm", ["run", directScript], {
      stdio: "inherit",
    });
    process.exitCode = directResult.status ?? 1;
  } else {
    const repositoryRoot = await realpath(
      path.resolve(fileURLToPath(new URL("..", import.meta.url))),
    );
    const filesystemRoot = path.parse(repositoryRoot).root;
    const packageJson = JSON.parse(
      await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
    );

    if (
      repositoryRoot === filesystemRoot ||
      repositoryRoot.includes(",") ||
      packageJson.name !== "@rahulyadev/design-system" ||
      path.basename(repositoryRoot) === "website"
    ) {
      fail(`Refusing unsafe repository mount: ${repositoryRoot}`);
    } else if (
      typeof process.getuid !== "function" ||
      typeof process.getgid !== "function"
    ) {
      fail("This wrapper requires host UID and GID mapping support.");
    } else {
      const runtimeRoot = path.join(
        repositoryRoot,
        ".tmp",
        "playwright-container",
      );
      const writableDirectories = [
        path.join(runtimeRoot, "home"),
        path.join(runtimeRoot, "npm-cache"),
        path.join(runtimeRoot, "tmp"),
        path.join(runtimeRoot, "xdg-cache"),
      ];
      await Promise.all(
        writableDirectories.map((directory) =>
          mkdir(directory, { recursive: true }),
        ),
      );

      const hostNodeRoot = await realpath(
        path.dirname(path.dirname(process.execPath)),
      );
      const containerNodeDirectoryName = "node-v24.19.0-npm-11.17.0-portable";
      const containerNodeRoot = path.join(
        runtimeRoot,
        containerNodeDirectoryName,
      );
      const hostNpmVersion = run("npm", ["--version"], {
        encoding: "utf8",
      });

      if (
        process.version !== "v24.19.0" ||
        hostNpmVersion.status !== 0 ||
        hostNpmVersion.stdout?.trim() !== "11.17.0"
      ) {
        fail(
          `Exact host Node/npm runtime is unavailable: ${process.version}/${hostNpmVersion.stdout?.trim() ?? "unknown"}`,
        );
      } else {
        try {
          await stat(path.join(containerNodeRoot, "bin", "node"));
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
          console.log(
            `Copying the existing exact host Node/npm runtime into ${path.relative(repositoryRoot, containerNodeRoot)}.`,
          );
          await cp(hostNodeRoot, containerNodeRoot, {
            dereference: true,
            recursive: true,
          });
        }

        const copiedNode = path.join(containerNodeRoot, "bin", "node");
        const copiedNpm = path.join(containerNodeRoot, "bin", "npm");
        await rm(copiedNpm, { force: true });
        await symlink("../lib/node_modules/npm/bin/npm-cli.js", copiedNpm);
        const copiedNodeVersion = run(copiedNode, ["--version"], {
          encoding: "utf8",
        });
        const copiedNpmVersion = run(copiedNpm, ["--version"], {
          encoding: "utf8",
        });

        if (
          copiedNodeVersion.status !== 0 ||
          copiedNodeVersion.stdout?.trim() !== "v24.19.0" ||
          copiedNpmVersion.status !== 0 ||
          copiedNpmVersion.stdout?.trim() !== "11.17.0"
        ) {
          fail(
            "Repository-scoped container Node/npm runtime validation failed.",
          );
        } else {
          const inspection = run(
            "docker",
            [
              "image",
              "inspect",
              "--format",
              "{{json .RepoDigests}}",
              IMAGE_REFERENCE,
            ],
            { encoding: "utf8" },
          );
          const repositoryDigests = inspection.stdout?.trim() ?? "";

          if (
            inspection.status !== 0 ||
            !repositoryDigests.includes(IMAGE_DIGEST)
          ) {
            fail(
              `Verified Playwright image is unavailable locally: ${IMAGE_REFERENCE}`,
            );
          } else {
            const user = `${String(process.getuid())}:${String(process.getgid())}`;
            const containerPath = `/work/.tmp/playwright-container/${containerNodeDirectoryName}/bin`;
            const containerArguments = [
              "run",
              "--rm",
              "--init",
              "--ipc=host",
              "--security-opt",
              "no-new-privileges",
              "--user",
              user,
              "--workdir",
              "/work",
              "--mount",
              `type=bind,source=${repositoryRoot},target=/work`,
              "--env",
              `${CONTAINER_MARKER}=1`,
              "--env",
              "CI=1",
              "--env",
              "TZ=UTC",
              "--env",
              "LANG=C.UTF-8",
              "--env",
              "LC_ALL=C.UTF-8",
              "--env",
              "PLAYWRIGHT_BROWSERS_PATH=/ms-playwright",
              "--env",
              "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1",
              "--env",
              "HOME=/work/.tmp/playwright-container/home",
              "--env",
              "npm_config_cache=/work/.tmp/playwright-container/npm-cache",
              "--env",
              "TMPDIR=/work/.tmp/playwright-container/tmp",
              "--env",
              "XDG_CACHE_HOME=/work/.tmp/playwright-container/xdg-cache",
              "--env",
              `PATH=${containerPath}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
              IMAGE_REFERENCE,
              "npm",
              "run",
              directScript,
            ];

            console.log(`Playwright image: ${IMAGE_REFERENCE}`);
            console.log(`Allowlisted operation: ${requestedOperation}`);
            console.log("Container Node/npm: v24.19.0/11.17.0");
            console.log(`Container user: ${user}`);
            const containerResult = run("docker", containerArguments, {
              cwd: repositoryRoot,
              stdio: "inherit",
            });
            process.exitCode = containerResult.status ?? 1;
          }
        }
      }
    }
  }
}
