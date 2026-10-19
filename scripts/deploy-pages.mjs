/**
 * Publiceert de app op GitHub Pages.
 *
 * De build komt als losse commit op de branch `gh-pages` te staan; die branch
 * bevat alleen het resultaat, niet de broncode. Draaien met:
 *
 *   npm run deploy
 *
 * Werkt met een gewoon GitHub-token. Wil je dat het automatisch gaat bij elke
 * push naar main, gebruik dan de workflow in .github/workflows/deploy.yml;
 * daarvoor heeft je token de scope `workflow` nodig.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

function run(command, args, options = {}) {
  return execFileSync(command, args, { stdio: "inherit", ...options });
}

function capture(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

const remote = capture("git", ["remote", "get-url", "origin"]);
const repoPath = remote.replace(/^.*github\.com[:/]/, "").replace(/\.git$/, "");
const basePath = `/${repoPath.split("/")[1]}/`;

console.log(`Bouwen voor ${remote} met basispad ${basePath}`);
run("npm", ["run", "build"], { env: { ...process.env, BASE_PATH: basePath } });

// Een lege map met alleen de build, zodat de werkmap onaangeroerd blijft.
const staging = mkdtempSync(join(tmpdir(), "pages-"));
try {
  cpSync("dist", staging, { recursive: true });
  // Zonder dit bestand negeert GitHub Pages mappen die met een _ beginnen.
  writeFileSync(join(staging, ".nojekyll"), "");

  // Bestanden van eerdere builds blijven staan. Een geïnstalleerde app draait
  // tot de gebruiker op "Bijwerken" tikt nog op de oude versie; als die een
  // bestand mist in zijn cache, moet het nog van de server te halen zijn.
  const carried = carryOverOldAssets(staging);
  if (carried > 0) console.log(`${carried} bestanden van eerdere builds behouden`);

  const git = (...args) => run("git", ["-C", staging, ...args]);
  git("init", "-q", "-b", "gh-pages");
  git("add", "-A");
  git(
    "-c",
    "user.name=deploy",
    "-c",
    "user.email=deploy@local",
    "commit",
    "-q",
    "-m",
    `Build van ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
  );
  git("push", "-q", "--force", remote, "gh-pages:gh-pages");

  console.log(`Gepubliceerd: https://${repoPath.split("/")[0].toLowerCase()}.github.io${basePath}`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}

function carryOverOldAssets(target) {
  try {
    execFileSync("git", ["fetch", "-q", remote, "gh-pages"], { stdio: "ignore" });
  } catch {
    return 0; // Eerste publicatie: er is nog niets om te bewaren.
  }
  const files = capture("git", ["ls-tree", "-r", "--name-only", "FETCH_HEAD", "assets/"])
    .split("\n")
    .filter(Boolean);
  let count = 0;
  for (const file of files) {
    const destination = join(target, file);
    if (existsSync(destination)) continue;
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, execFileSync("git", ["show", `FETCH_HEAD:${file}`]));
    count += 1;
  }
  return count;
}
