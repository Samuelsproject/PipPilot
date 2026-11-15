import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Inspect built files only. Never read environment variables or credential files.
async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? collect(file) : [file];
  }));
  return nested.flat();
}

const files = await collect(path.resolve("dist"));
const findings = [];
for (const file of files.filter((name) => /\.(?:js|css|html|json|map)$/.test(name))) {
  const content = await readFile(file, "utf8");
  if (/SUPABASE_SERVICE_ROLE_KEY|sb_secret_[A-Za-z0-9_-]{12,}/.test(content)) {
    findings.push({ file: path.relative(process.cwd(), file), kind: "server-credential marker" });
  }
  const tokens = content.match(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g) ?? [];
  for (const token of tokens) {
    try {
      const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
      if (claims.role === "service_role") {
        findings.push({ file: path.relative(process.cwd(), file), kind: "privileged JWT" });
      }
    } catch {
      // An arbitrary bundled string is not necessarily a JSON Web Token.
    }
  }
}
if (findings.length) {
  // File names and classification only; never print matching content.
  process.stderr.write(`FAIL: ${findings.length} privileged-credential findings\n`);
  for (const finding of findings) process.stderr.write(`${finding.file}: ${finding.kind}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS: scanned ${files.length} browser build files; no service-role key markers or privileged JWTs found.\n`);
}
