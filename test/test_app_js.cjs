const fs = require("fs");
const path = require("path");
const source = fs.readFileSync(path.join(__dirname, "..", "src", "app.js"), "utf8");

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch(e) { failed++; console.log("  FAIL: " + name); console.log("        " + e.message); }
}
function assert(c, m) { if (!c) throw new Error(m || "Assertion failed"); }

console.log("\n=== app.js tests ===\n");

test("preview-collapsed class removed on file open", () => {
  assert(source.includes("md-studio-preview-collapsed"), "preview-collapsed referenced");
  assert(source.includes("classList.remove"), "classList.remove used");
});
test("localStorage collapsed state cleared", () => {
  assert(source.includes("localStorage.removeItem") && source.includes("md-studio-preview-collapsed"), "localStorage.removeItem for preview-collapsed");
});
test("_lastCursorOffset tracker exists", () => {
  assert(source.includes("_lastCursorOffset"), "_lastCursorOffset found");
});
test("insertAtCursor uses tracked position", () => {
  const fn = source.match(/function insertAtCursor[\s\S]*?^}/m);
  assert(fn, "insertAtCursor function found");
  assert(fn[0].includes("_lastCursorOffset"), "uses _lastCursorOffset");
});
test("alert on file read failure", () => {
  assert(source.includes("alert(") && source.includes("Failed to open"), "alert for read failure");
});
test("showToast function exists", () => {
  assert(source.includes("showToast"), "showToast found");
});
test("toast element in DOM", () => {
  assert(source.includes("toast-notification") || source.includes("toast-popup"), "toast element");
});
test("nativePath used for dedup", () => {
  assert(source.includes("nativePath"), "nativePath for dedup");
});
test("search-replace-toggle handler", () => {
  assert(source.includes("search-replace-toggle"), "search-replace-toggle referenced");
});
test("syncCursorPos exists", () => {
  assert(source.includes("syncCursorPos"), "syncCursorPos found");
});
test("no hardcoded Ln 1, Col 1 in finally", () => {
  const blocks = source.match(/finally\s*\{[^}]+\}/g) || [];
  const hasHardcoded = blocks.some(b => b.includes("Ln 1, Col 1"));
  assert(!hasHardcoded, "no hardcoded cursor in finally blocks");
});
test("renderExplorerDOM exists", () => {
  assert(source.includes("renderExplorerDOM"), "renderExplorerDOM found");
});
test("braces balanced", () => {
  const o = (source.match(/\{/g)||[]).length;
  const c = (source.match(/\}/g)||[]).length;
  assert(o === c, "braces: " + o + " open, " + c + " close");
});
test("parentheses balanced", () => {
  const o = (source.match(/\(/g)||[]).length;
  const c = (source.match(/\)/g)||[]).length;
  assert(o === c, "parens: " + o + " open, " + c + " close");
});

console.log("\nResults: " + passed + " passed, " + failed + " failed\n");
process.exit(failed > 0 ? 1 : 0);
