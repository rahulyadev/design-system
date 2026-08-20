import { describe, expect, it } from "vitest";

import packageJson from "../package.json" with { type: "json" };

const expectedRootExport = {
  types: "./dist/index.d.ts",
  import: "./dist/index.js",
};
const expectedThemeExport = {
  types: "./dist/theme/index.d.ts",
  import: "./dist/theme/index.js",
};

describe("package metadata contract", () => {
  it("uses the public release-candidate package identity", () => {
    expect(packageJson.name).toBe("@rahulyadev/design-system");
    expect(packageJson.version).toBe("1.0.0-rc.0");
    expect("private" in packageJson).toBe(false);
    expect(packageJson.license).toBe("MIT");
    expect(packageJson.type).toBe("module");
    expect(packageJson.packageManager).toBe("npm@11.17.0");
    expect(packageJson.engines).toEqual({
      node: ">=24.19.0 <25",
      npm: ">=11.17.0 <12",
    });
    expect(packageJson.repository).toEqual({
      type: "git",
      url: "https://github.com/rahulyadev/design-system",
    });
  });

  it("declares React only as peers and exact development tools", () => {
    expect("dependencies" in packageJson).toBe(false);
    expect(packageJson.peerDependencies).toEqual({
      react: "^18.3.1 || ^19.0.0",
      "react-dom": "^18.3.1 || ^19.0.0",
    });
    expect(packageJson.devDependencies.react).toBe("19.2.8");
    expect(packageJson.devDependencies["react-dom"]).toBe("19.2.8");
  });

  it("exposes only the documented entry points", () => {
    expect(packageJson.exports).toEqual({
      ".": expectedRootExport,
      "./theme": expectedThemeExport,
      "./tokens.css": "./dist/styles/tokens.css",
      "./base.css": "./dist/styles/base.css",
      "./primitives.css": "./dist/styles/primitives.css",
      "./styles.css": "./dist/styles/styles.css",
      "./package.json": "./package.json",
    });
    expect(JSON.stringify(packageJson.exports)).not.toContain('"require"');
    expect(packageJson.types).toBe("./dist/index.d.ts");
  });

  it("restricts package files and marks CSS side effects", () => {
    expect(packageJson.files).toEqual([
      "dist",
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
    ]);
    expect(packageJson.sideEffects).toEqual(["**/*.css"]);
    expect(packageJson.publishConfig).toEqual({ access: "public" });
  });

  it("contains no publication or version-changing scripts", () => {
    const scripts = Object.entries(packageJson.scripts);

    expect(packageJson.scripts).not.toHaveProperty("prepublishOnly");
    expect(packageJson.scripts).not.toHaveProperty("prepack");
    expect(packageJson.scripts).not.toHaveProperty("postpack");
    expect(scripts).not.toContainEqual(
      expect.arrayContaining([expect.stringMatching(/publish|version/i)]),
    );

    for (const [scriptName, command] of scripts) {
      expect(scriptName).not.toMatch(/publish|version/i);
      expect(command).not.toMatch(/npm\s+(?:publish|version)/i);
    }
  });
});
