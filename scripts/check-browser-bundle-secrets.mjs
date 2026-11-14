import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const bundleDirectory = path.resolve("dist");

function collectFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const filePath = path.join(directory, name);
    return statSync(filePath).isDirectory()
      ? collectFiles(filePath)
      : [filePath];
  });
}

try {
  const files = collectFiles(bundleDirectory);
  if (files.length === 0) {
    throw new Error("The browser build directory is empty.");
  }

  let credentialMatches = 0;
  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    credentialMatches += (
      content.match(/sb_secret_[A-Za-z0-9_-]{16,}/g) ?? []
    ).length;

    const jwtCandidates =
      content.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? [];
    for (const token of jwtCandidates) {
      try {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
        );
        if (payload.role === "service_role") credentialMatches += 1;
      } catch {
        // Ignore non-JWT strings that happen to match the token shape.
      }
    }
  }

  if (credentialMatches > 0) {
    console.error(
      `Browser bundle security check failed: ${credentialMatches} privileged credential pattern(s) detected.`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Browser bundle security check passed (${files.length} files scanned; no privileged credentials found).`,
    );
  }
} catch (error) {
  console.error(
    error instanceof Error
      ? `Browser bundle security check failed: ${error.message}`
      : "Browser bundle security check failed.",
  );
  process.exitCode = 1;
}
