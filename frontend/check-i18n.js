// Validates that every t("key") call resolves against its nearest useTranslations namespace
// in every locale message file.
const fs = require("fs");
const path = require("path");

const locales = ["uk", "ru", "en"];
const messages = {};
for (const l of locales) {
  messages[l] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "src", "messages", `${l}.json`), "utf8")
  );
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const srcFiles = walk(path.join(__dirname, "src"));
const problems = [];

for (const file of srcFiles) {
  const code = fs.readFileSync(file, "utf8");
  const tokens = [];
  const nsRe = /(?:const|let|var)\s+(\w+)\s*=\s*useTranslations\(\s*["']([\w.]+)["']/g;
  let m;
  while ((m = nsRe.exec(code))) tokens.push({ index: m.index, varName: m[1], ns: m[2] });
  // only collect calls made through a registered translator variable
  const translatorVars = new Set(tokens.map((x) => x.varName));
  for (const v of translatorVars) {
    const callRe = new RegExp(`(?<![.\\w])${v}\\(\\s*["']([\\w.]+)["']`, "g");
    while ((m = callRe.exec(code))) tokens.push({ index: m.index, varName: v, key: m[1] });
  }
  tokens.sort((a, b) => a.index - b.index);

  const currentNs = new Map(); // varName -> namespace
  for (const tok of tokens) {
    if (tok.ns !== undefined) {
      currentNs.set(tok.varName, tok.ns);
      continue;
    }
    const ns = currentNs.get(tok.varName);
    if (!ns) continue;
    const id = `${ns}.${tok.key}`;
    for (const l of locales) {
      let cur = messages[l];
      for (const p of id.split(".")) cur = cur && cur[p];
      if (cur === undefined) {
        problems.push(`${l}: MISSING ${id} (used in ${path.relative(__dirname, file)})`);
      }
    }
  }
}

if (problems.length) {
  console.log([...new Set(problems)].join("\n"));
  process.exit(1);
}
console.log("All translation keys OK");

