# Test Cases for MD Code Fixes

## Running Tests
  node test/test_main_cjs.js
  node test/test_app_js.js
Or double-click: test/run_tests.cmd

## main.cjs Tests (17 tests)
- accepts .md files
- accepts .markdown files
- accepts .mdx files (new)
- accepts .txt files (new)
- rejects URLs
- rejects flags
- rejects bare strings
- accepts forward-slash paths
- rejects non-md extensions
- pendingOpenFilesQueue exists
- did-finish-load handler exists
- flushPendingFiles exists
- isLoading helper exists
- second-instance handler exists
- open-file event handler exists
- source includes .mdx
- source includes .txt extension

## app.js Tests (14 tests)
- preview-collapsed class removed on file open
- localStorage collapsed state cleared
- _lastCursorOffset tracker exists
- insertAtCursor uses tracked position
- alert on file read failure
- showToast function exists
- toast element in DOM
- nativePath used for dedup
- search-replace-toggle handler
- syncCursorPos exists
- no hardcoded Ln 1, Col 1 in finally
- renderExplorerDOM exists
- braces balanced
- parentheses balanced

## Visual Tests (open test_visual.html in browser)
1. Preview pane visible after file open
2. Toast on second-instance open
3. Search/replace toggle button
4. Cursor position tracking
5. File deduplication by full path
6. IPC timing (open while loading)
7. Error alert on file read failure
8. PDF export preserves cursor
