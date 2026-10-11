// Sestaví rozšíření pro Safari do build/safari/extension/ a na Macu z něj vytvoří projekt
// pro Xcode (build/safari/<název aplikace>/). Safari rozšíření distribuuje jen uvnitř aplikace
// pro macOS, kterou je potřeba sestavit a podepsat v Xcode.
//
//   node scripts/safari.mjs             rozšíření + projekt Xcode (jen macOS)
//   node scripts/safari.mjs --no-xcode  jen rozšíření (funguje na libovolném systému)
//   node scripts/safari.mjs --ios       projekt Xcode i pro iPhone a iPad
//
// Identifikátor aplikace lze změnit proměnnou SAFARI_BUNDLE_ID (např. podle vlastního týmu v Apple Developer).
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { build } from "esbuild";
import { toSafariManifest, SAFARI_MIN_VERSION } from "./safari-manifest.mjs";

const APP_NAME = "Shrnuti stranky";
const BUNDLE_ID = process.env.SAFARI_BUNDLE_ID || "cz.petrkrapek.shrnuti-stranky";
const OUT = "build/safari";
const EXT = `${OUT}/extension`;

const args = new Set(process.argv.slice(2));

rmSync(EXT, { recursive: true, force: true });
mkdirSync(EXT, { recursive: true });

// Statické soubory beze změny; sestavený JavaScript pro Chrome (dist/) nahradí build pro Safari.
cpSync("extension", EXT, { recursive: true, filter: (src) => !/(^|\/)(dist|\.[^/]*)$/.test(src) });

const manifest = JSON.parse(readFileSync("extension/manifest.json", "utf8"));
writeFileSync(`${EXT}/manifest.json`, `${JSON.stringify(toSafariManifest(manifest), null, 2)}\n`);

await build({
  entryPoints: ["src/popup.js", "src/options.js"],
  bundle: true,
  format: "esm",
  target: `safari${SAFARI_MIN_VERSION}`,
  minify: true,
  outdir: `${EXT}/dist`,
  logLevel: "warning",
});
console.log(`Rozšíření pro Safari ${manifest.version}: ${EXT}`);

if (args.has("--no-xcode")) process.exit(0);

if (process.platform !== "darwin") {
  console.log("Projekt pro Xcode lze vytvořit jen na macOS s nainstalovaným Xcode.");
  process.exit(0);
}

// Převodník je součástí Xcode; --force přepíše dřívější projekt, --copy-resources zkopíruje
// soubory rozšíření do projektu, takže nezávisí na build/safari/extension.
execFileSync(
  "xcrun",
  [
    "safari-web-extension-converter",
    EXT,
    "--project-location",
    OUT,
    "--app-name",
    APP_NAME,
    "--bundle-identifier",
    BUNDLE_ID,
    "--swift",
    ...(args.has("--ios") ? [] : ["--macos-only"]),
    "--copy-resources",
    "--no-open",
    "--no-prompt",
    "--force",
  ],
  { stdio: "inherit" },
);
console.log(`Projekt pro Xcode: ${OUT}/${APP_NAME}/${APP_NAME}.xcodeproj`);
