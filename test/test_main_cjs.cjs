const fs = require("fs");
const path = require("path");
const source = fs.readFileSync(path.join(__dirname, "..", "electron", "main.cjs"), "utf8");

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch(e) { failed++; console.log("  FAIL: " + name); console.log("        " + e.message); }
}
function assert(c, m) { if (!c) throw new Error(m || "Assertion failed"); }

console.log("\\n=== main.cjs tests ===\\n");

function getFilePathFromArgs(args) {
  for (const a of args) {
    const lower = a.toLowerCase();
    if (lower.startsWith("--") || lower.startsWith("-")) continue;
    if (lower.startsWith("http://") || lower.startsWith("https://")) continue;
    if (lower.startsWith("/") || lower.startsWith("\\\\")) continue;
    if (/^[a-z]:[\\/]/.test(lower)) {
      if (lower.endsWith(".md") || lower.endsWith(".markdown") || lower.endsWith(".mdx") || lower.endsWith(".txt"))
        return a;
    }
  }
  return null;
}

test("accepts .md files", () => assert(getFilePathFromArgs(["C:\\\\test.md"]) === "C:\\\\test.md"));
test("accepts .markdown files", () => assert(getFilePathFromArgs(["C:\\\\test.markdown"]) === "C:\\\\test.markdown"));
test("accepts .mdx files (new)", () => assert(getFilePathFromArgs(["C:\\\\test.mdx"]) === "C:\\\\test.mdx"));
test("accepts .txt files (new)", () => assert(getFilePathFromArgs(["C:\\\\test.txt"]) === "C:\\\\test.txt"));
test("rejects URLs", () => assert(getFilePathFromArgs(["https://example.com"]) === null));
test("rejects flags", () => assert(getFilePathFromArgs(["--flag"]) === null));
test("rejects bare strings", () => assert(getFilePathFromArgs(["readme"]) === null));
test("accepts forward-slash paths", () => assert(getFilePathFromArgs(["C:/Users/test.md"]) === "C:/Users/test.md"));
test("rejects non-md extensions", () => { assert(getFilePathFromArgs(["C:\\\\test.js"]) === null); assert(getFilePathFromArgs(["C:\\\\test.html"]) === null); });
test("pendingOpenFilesQueue exists", () => assert(source.includes("pendingOpenFilesQueue"), "pendingOpenFilesQueue"));
test("did-finish-load handler exists", () => assert(source.includes("did-finish-load"), "did-finish-load"));
test("isLoading helper exists", () => assert(source.includes("isLoading"), "isLoading"));
test("second-instance handler exists", () => assert(source.includes("second-instance"), "second-instance"));
test("open-file event handler exists", () => assert(source.includes("open-file"), "open-file"));
test("source includes .mdx", () => assert(source.includes(".mdx"), ".mdx"));
test("source includes .txt extension", () => assert(source.includes(".txt"), ".txt"));

console.log("\\nResults: " + passed + " passed, " + failed + " failed\\n");
process.exit(failed > 0 ? 1 : 0);
