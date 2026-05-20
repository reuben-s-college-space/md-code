import { marked } from 'marked'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import './styles.css'

const $ = id => document.getElementById(id)
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const SIDEBAR_MIN = 180, SIDEBAR_MAX = 500, SIDEBAR_DEFAULT = 260
let nextTabId = 1
let activeTab = null
let editorPanes = []
let _syncScroll = true
let fileHistory = []
let folderEntries = {}
let sidebarWidth = SIDEBAR_DEFAULT
let _findIndex = 0
let _findMatches = []
try {
    const raw = JSON.parse(localStorage.getItem('md-studio-file-history') || '[]')
    if (raw.length && typeof raw[0] === 'string') {
        fileHistory = raw.map(n => ({ name: n, dirName: null, virtualPath: n, nativePath: null, lastOpened: Date.now() }))
        localStorage.removeItem('md-studio-recent')
    } else {
        fileHistory = raw
    }
} catch(e) { fileHistory = [] }

marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false })

function newTabState(name, content = '', handle = null) {
    return { id: nextTabId++, name, content, handle, isDirty: false, editorEl: null, previewEl: null, tabEl: null }
}

function renderTabDOM(state, insertBeforeEl = null) {
    const bar = $('tab-bar')
    const tabEl = document.createElement('div')
    tabEl.className = 'tab-item' + (state === activeTab ? ' active' : '') + (state.isDirty ? ' dirty' : '')
    tabEl.dataset.tabId = state.id
    tabEl.innerHTML = `<span class="material-symbols-outlined text-primary dark:text-primary-fixed" style="font-size:14px">description</span>
        <span class="text-system-ui-sm text-on-surface dark:text-inverse-on-surface whitespace-nowrap tab-name">${esc(state.name)}</span>
        <span class="dirty-dot"></span>
        <span class="close-btn material-symbols-outlined text-on-surface-variant dark:text-secondary-fixed-dim cursor-pointer" style="font-size:14px;margin-left:4px" title="Close">close</span>`
    tabEl.querySelector('.close-btn').addEventListener('click', e => { e.stopPropagation(); closeTab(state.id, true) })
    tabEl.addEventListener('click', () => activateTab(state.id))
    if (insertBeforeEl) bar.insertBefore(tabEl, insertBeforeEl)
    else bar.appendChild(tabEl)
    return tabEl
}

function closeTab(id, confirmIfDirty) {
    const idx = editorPanes.findIndex(t => t.id === id)
    if (idx === -1) return
    const state = editorPanes[idx]
    if (confirmIfDirty && state.isDirty) {
        if (!confirm(`Unsaved changes in "${state.name}". Close anyway?`)) return
    }
    if (state === activeTab && editorPanes.length > 1) {
        const next = editorPanes[idx + 1] || editorPanes[idx - 1]
        if (next) activateTab(next.id)
    }
    if (state.tabEl) state.tabEl.remove()
    if (state.editorEl) state.editorEl.remove()
    if (state.previewEl) state.previewEl.remove()
    editorPanes.splice(idx, 1)
    if (editorPanes.length === 0) { activeTab = null; $('editor-pane').innerHTML = '<div class="h-8 flex items-center px-4 bg-surface-container dark:bg-inverse-surface border-b border-outline-variant dark:border-on-secondary-fixed-variant shrink-0"><span class="text-label-caps font-label-caps text-outline dark:text-secondary-fixed-dim uppercase">Markdown Editor</span></div>'; $('preview-pane').innerHTML = '<div class="h-8 flex items-center px-4 bg-surface-container dark:bg-inverse-surface border-b border-outline-variant dark:border-on-secondary-fixed-variant justify-between shrink-0"><span class="text-label-caps font-label-caps text-outline dark:text-secondary-fixed-dim uppercase">Live Preview</span></div>' }
}

function activateTab(id) {
    const prev = activeTab
    if (prev) saveEditorState(prev)
    const state = editorPanes.find(t => t.id === id)
    if (!state) return
    activeTab = state
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'))
    state.tabEl && state.tabEl.classList.add('active')
    mountEditor(state)
    updateStatusBar()
}

function mountEditor(state) {
    ;['editor-pane-content','preview-pane-content'].forEach(id2 => { const el = $(id2); if (el) el.remove() })
    const editorPane = $('editor-pane')
    editorPane.style.display = 'flex'
    const editorWrap = document.createElement('div')
    editorWrap.id = 'editor-pane-content'
    editorWrap.className = 'flex-1 overflow-y-auto custom-scrollbar p-6 font-editor-text text-editor-text text-on-surface dark:text-inverse-on-surface min-h-0 focus:outline-none'
    editorWrap.style.outline = 'none'; editorWrap.style.tabSize = '4'; editorWrap.style.MozTabSize = '4'; editorWrap.style.whiteSpace = 'pre-wrap'; editorWrap.style.wordWrap = 'break-word'; editorWrap.style.userSelect = 'text'
    editorWrap.contentEditable = true; editorWrap.spellcheck = true
    editorWrap.textContent = state.content
    editorPane.appendChild(editorWrap)
    state.editorEl = editorWrap
    const previewPane = $('preview-pane')
    previewPane.style.display = 'flex'
    const previewWrap = document.createElement('div')
    previewWrap.id = 'preview-pane-content'
    previewWrap.className = 'flex-1 overflow-y-auto custom-scrollbar p-10 bg-surface-container-lowest dark:bg-on-secondary-fixed min-h-0'
    previewWrap.innerHTML = marked.parse(state.content)
    previewPane.appendChild(previewWrap)
    state.previewEl = previewWrap
    const currentFont = localStorage.getItem('md-studio-font') || 'system-ui, sans-serif'
    if (currentFont !== 'disable') {
        editorWrap.style.fontFamily = currentFont
        previewWrap.style.fontFamily = currentFont
    }
    attachEditorEvents(editorWrap, state)
    const editorEl = editorWrap; const range = document.createRange(); range.setStart(editorEl, 0); range.collapse(true); const sel = window.getSelection(); if (sel) { sel.removeAllRanges(); sel.addRange(range) }
    syncCursorPos()
}

function attachEditorEvents(el, state) {
    el.addEventListener('input', () => { state.content = el.textContent; setDirty(state, true); state.previewEl && (state.previewEl.innerHTML = marked.parse(state.content || '')); syncCursorPos(); updateStatusBar() })
    el.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText',false,'    ') } })
    el.addEventListener('keyup', syncCursorPos)
    el.addEventListener('click', syncCursorPos)
    el.addEventListener('scroll', () => { if (!_syncScroll || !state.previewEl) return; const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight); state.previewEl.scrollTop = ratio * (state.previewEl.scrollHeight - state.previewEl.clientHeight) })
}

function setDirty(state, dirty) { state.isDirty = dirty; const dot = state.tabEl && state.tabEl.querySelector('.dirty-dot'); if (dot) dot.style.display = dirty ? 'block' : 'none' }
function saveEditorState(state) { if (state && state.editorEl) state.content = state.editorEl.textContent }
function syncCursorPos() { if (!activeTab || !activeTab.editorEl) return; const sel = window.getSelection(); if (!sel.rangeCount) return; const range = sel.getRangeAt(0); const pre = document.createRange(); pre.selectNodeContents(activeTab.editorEl); pre.setEnd(range.startContainer, range.startOffset); const lines = pre.toString().split('\n'); $('status-cursor').textContent = `Ln ${lines.length}, Col ${lines[lines.length-1].length+1}` }

function updateStatusBar() { if (!activeTab) return; const text = activeTab.content || ''; const words = text.trim() ? text.split(/\s+/).length : 0; $('status-words').textContent = words + ' words'; $('status-chars').textContent = text.length + ' chars' }

async function openFileFromHandle(handle) {
    const file = await handle.getFile()
    const existing = editorPanes.find(t => t.name === file.name)
    if (existing) { activateTab(existing.id); return }
    const text = await file.text()
    const state = newTabState(file.name, text, handle)
    editorPanes.push(state)
    state.tabEl = renderTabDOM(state)
    activateTab(state.id)
    const nativePath = window.electronAPI?.isElectron ? window.electronAPI.getPathForFile(file) : null
    recordFileOpen(file.name, null, nativePath)
}

async function openFile() {
    if (window.showOpenFilePicker) {
        try {
            const handles = await window.showOpenFilePicker({ multiple: true, types: [{ description:'Markdown Files', accept:{ 'text/markdown': ['.md','.markdown','.mdx','.txt'] } }] })
            for (const handle of handles) await openFileFromHandle(handle)
        } catch(e) { if (e.name !== 'AbortError') console.error(e) }
    } else { $('file-input').click() }
}

$('file-input').addEventListener('change', async e => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
        const existing = editorPanes.find(t => t.name === file.name)
        if (existing) { activateTab(existing.id); continue }
        const text = await file.text()
        const state = newTabState(file.name, text, null)
        editorPanes.push(state)
        state.tabEl = renderTabDOM(state)
        activateTab(state.id)
        recordFileOpen(file.name, null, null)
    }
    e.target.value = ''
})

function saveCurrentTab() {
    const state = activeTab; if (!state || !state.isDirty) return
    const text = state.editorEl ? state.editorEl.textContent : state.content
    if (state.handle && state.handle.createWritable) {
        state.handle.createWritable().then(w => w.write(text).then(() => w.close())).then(() => { setDirty(state, false) }).catch(e => { console.error(e); saveCurrentTabAs() })
    } else { saveCurrentTabAs() }
}

async function saveCurrentTabAs() {
    const state = activeTab; if (!state) return
    const text = state.editorEl ? state.editorEl.textContent : state.content
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({ suggestedName: state.name, types: [{ description:'Markdown Files', accept:{ 'text/markdown':[ '.md' ] } }] })
            const w = await handle.createWritable(); await w.write(text); await w.close()
            state.handle = handle; state.name = handle.name
            setDirty(state, false)
            const tabNameEl = state.tabEl.querySelector('.tab-name'); if (tabNameEl) tabNameEl.textContent = state.name
        } catch(e) { if (e.name !== 'AbortError') console.error(e) }
    } else {
        const blob = new Blob([text], { type: 'text/markdown' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = state.name; a.click(); URL.revokeObjectURL(a.href)
        setDirty(state, false)
    }
}

function newFile() {
    const state = newTabState('untitled.md', '')
    editorPanes.push(state)
    state.tabEl = renderTabDOM(state)
    activateTab(state.id)
}

function saveFileHistory() { localStorage.setItem('md-studio-file-history', JSON.stringify(fileHistory)) }

function recordFileOpen(name, dirName, nativePath) {
    const virtualPath = dirName ? dirName + '/' + name : name
    const existing = fileHistory.find(f => f.virtualPath === virtualPath)
    if (existing) {
        existing.lastOpened = Date.now()
        if (nativePath) existing.nativePath = nativePath
    } else {
        fileHistory.push({ name, dirName, virtualPath, nativePath: nativePath || null, lastOpened: Date.now() })
    }
    saveFileHistory()
    renderRecentDOM()
    renderExplorerDOM()
}

function renderRecentDOM() {
    const list = $('recent-list')
    if (!list) return
    list.innerHTML = ''
    const recent = [...fileHistory].sort((a, b) => b.lastOpened - a.lastOpened).slice(0, 10)
    recent.forEach(entry => {
        const li = document.createElement('li')
        li.className = 'flex items-center gap-2 p-1 hover:bg-surface-container-high dark:hover:bg-surface-container rounded cursor-pointer group'
        li.innerHTML = `<span class="material-symbols-outlined text-primary text-[16px]">description</span><span class="text-system-ui-sm text-on-surface-variant dark:text-secondary-fixed-dim group-hover:text-on-surface dark:group-hover:text-inverse-on-surface">${esc(entry.virtualPath)}</span>`
        li.addEventListener('click', () => { maybeOpenFromHistory(entry) })
        list.appendChild(li)
    })
}

$('nav-recent').addEventListener('click', e => { e.stopPropagation(); $('recent-files-list').classList.toggle('hidden') })

$('nav-explorer').addEventListener('click', () => {
    const section = $('explorer-section')
    const isOpen = !section.classList.contains('hidden')
    section.classList.toggle('hidden')
    $('nav-explorer').classList.toggle('border-l-2', isOpen)
    $('nav-explorer').classList.toggle('border-primary', isOpen)
    $('nav-explorer').classList.toggle('dark:border-primary-fixed', isOpen)
    $('nav-explorer').classList.toggle('bg-surface', isOpen)
    $('nav-explorer').classList.toggle('dark:bg-on-secondary-fixed-variant', isOpen)
    if (!isOpen) {
        $('recent-files-list').classList.add('hidden')
        $('folder-files-section').classList.add('hidden')
    }
    renderExplorerDOM()
})

async function maybeOpenFromHistory(entry) {
    const handle = folderEntries[entry.name]
    if (handle) { await openFolderEntry(handle, entry.dirName); return }
    alert('"' + entry.virtualPath + '" is not currently accessible.\nUse Open Folder to browse and reopen it.')
}

function renderExplorerDOM() {
    const container = $('explorer-content')
    if (!container || $('explorer-section').classList.contains('hidden') && !container.children.length) return
    container.innerHTML = ''
    if (fileHistory.length === 0) {
        container.innerHTML = '<p class="text-system-ui-sm text-on-surface-variant dark:text-secondary-fixed-dim italic">No files opened yet.</p>'
        return
    }
    const groups = {}
    fileHistory.forEach(entry => {
        const key = entry.dirName || '__standalone__'
        if (!groups[key]) groups[key] = { name: entry.dirName || 'Ungrouped', files: [] }
        groups[key].files.push(entry)
    })
    const keys = Object.keys(groups).sort((a, b) => {
        if (a === '__standalone__') return 1
        if (b === '__standalone__') return -1
        return a.localeCompare(b)
    })
    keys.forEach(key => {
        const group = groups[key]
        const groupEl = document.createElement('div')
        groupEl.className = 'mb-1'
        const sorted = [...group.files].sort((a, b) => b.lastOpened - a.lastOpened)
        const header = document.createElement('div')
        header.className = 'flex items-center gap-2 py-1 cursor-pointer select-none hover:bg-surface-container-high dark:hover:bg-surface-container rounded px-1'
        header.innerHTML = `<span class="material-symbols-outlined text-[16px] text-on-surface-variant dark:text-secondary-fixed-dim">${key === '__standalone__' ? 'folder_off' : 'folder'}</span>
            <span class="text-system-ui-sm text-on-surface dark:text-inverse-on-surface font-medium flex-1">${esc(group.name)}</span>
            <span class="text-label-caps font-label-caps text-outline dark:text-secondary-fixed-dim">${group.files.length}</span>`
        const body = document.createElement('div')
        body.className = 'ml-5 space-y-0.5'
        header.addEventListener('click', () => body.classList.toggle('hidden'))
        sorted.forEach(entry => {
            const fileEl = document.createElement('div')
            fileEl.className = 'flex items-center gap-2 py-0.5 px-1 rounded cursor-pointer hover:bg-surface-container-high dark:hover:bg-surface-container group'
            const pathDisplay = entry.nativePath || entry.virtualPath
            fileEl.innerHTML = `<span class="material-symbols-outlined text-primary text-[14px] flex-shrink-0">description</span>
                <div class="min-w-0 flex-1">
                    <div class="text-system-ui-sm text-on-surface-variant dark:text-secondary-fixed-dim truncate">${esc(entry.name)}</div>
                    <div class="text-[10px] text-outline dark:text-secondary-fixed-dim truncate">${esc(pathDisplay)}</div>
                </div>`
            fileEl.addEventListener('click', () => maybeOpenFromHistory(entry))
            body.appendChild(fileEl)
        })
        groupEl.appendChild(header)
        groupEl.appendChild(body)
        container.appendChild(groupEl)
    })
}
$('btn-open').addEventListener('click', openFile)
$('btn-save').addEventListener('click', saveCurrentTab)

function getTabContent() { const s = activeTab; if (!s) return ''; return s.editorEl ? s.editorEl.textContent : s.content }
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href) }
function getPreviewHTML(state) { return state.previewEl ? state.previewEl.innerHTML : marked.parse(state.content) }

async function collectStyles() {
    let css = ''
    document.querySelectorAll('style').forEach(s => { css += s.textContent + '\n' })
    const links = document.querySelectorAll('link[rel="stylesheet"]')
    for (const link of links) {
        try {
            const res = await fetch(link.href)
            if (res.ok) css += await res.text() + '\n'
        } catch(e) {}
    }
    return css
}

async function capturePreviewFull(state, scale) {
    const html = marked.parse(state.content || '')
    const isDark = document.documentElement.classList.contains('dark')
    const wrapper = document.createElement('div')
    if (isDark) wrapper.className = 'dark'
    wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;height:auto;'
    const tempContainer = document.createElement('div')
    tempContainer.className = 'preview-export'
    tempContainer.innerHTML = html
    const currentFont = localStorage.getItem('md-studio-font') || 'system-ui, sans-serif'
    if (currentFont !== 'disable') tempContainer.style.fontFamily = currentFont
    wrapper.appendChild(tempContainer)
    document.body.appendChild(wrapper)
    await new Promise(resolve => setTimeout(resolve, 150))
    const canvas = await html2canvas(tempContainer, { scale: scale, useCORS: true, height: tempContainer.scrollHeight, windowHeight: tempContainer.scrollHeight })
    document.body.removeChild(wrapper)
    return canvas
}

async function exportHTML() { const md = getTabContent(); const html = marked.parse(md); const name = (activeTab ? activeTab.name : 'untitled').replace(/\.[^.]+$/,''); const styles = await collectStyles(); const doc = '<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"><title>' + name + '</title><style>' + styles + '</style></head><body><div class=\"preview-export\">' + html + '</div></body></html>'; download(new Blob([doc],{type:'text/html'}), name + '.html') }
async function exportPDF(state, scale) { state = state || activeTab; scale = scale || 3; if (!state || !state.content) return alert('Nothing to export.'); try { $('status-cursor').textContent = 'Generating PDF…'; const canvas = await capturePreviewFull(state, scale); const img = canvas.toDataURL('image/png'); const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' }); const pw = pdf.internal.pageSize.getWidth(); const ph = (canvas.height * pw) / canvas.width; const pageH = pdf.internal.pageSize.getHeight(); const overlap = 6; let y = 0; let firstPage = true; while (y < ph) { if (!firstPage) pdf.addPage(); const off = firstPage ? 0 : overlap; pdf.addImage(img, 'PNG', 0, -(y - off), pw, ph); y += pageH; firstPage = false; } pdf.save(state.name.replace(/\.[^.]+$/,'') + '.pdf') } catch(e) { console.error(e); alert('PDF export failed.') } finally { $('status-cursor').textContent = 'Ln 1, Col 1' } }
async function exportImage(fmt, state, scale) { state = state || activeTab; scale = scale || 2; if (!state || !state.content) return alert('Nothing to export.'); try { const canvas = await capturePreviewFull(state, scale); canvas.toBlob(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = state.name.replace(/\.[^.]+$/,'') + '.' + fmt; a.click(); URL.revokeObjectURL(a.href) }, fmt==='jpg'?'image/jpeg':'image/png', 0.92) } catch(e) { console.error(e); alert('Image export failed.') } }
function exportTXT(state) { state = state || activeTab; const md = state ? (state.editorEl ? state.editorEl.textContent : state.content) : ''; const name = state ? state.name.replace(/\.[^.]+$/,'') : 'untitled'; download(new Blob([md],{type:'text/plain'}), name + '.txt') }

function activeEditor() { const s = activeTab; return s ? s.editorEl : null }
function insertAtCursor(before, after, placeholder='text') { const el = activeEditor(); if (!el) return; el.focus(); const sel = window.getSelection(); if (!sel.rangeCount) { el.textContent += before + placeholder + after; return } const range = sel.getRangeAt(0); const text = before + placeholder + after; const node = document.createTextNode(text); range.insertNode(node); range.setStart(node, before.length); range.collapse(true); sel.removeAllRanges(); sel.addRange(range) }
function wrapSelection(openTag, closeTag) { const el = activeEditor(); if (!el) return; el.focus(); const sel = window.getSelection(); const range = sel.rangeCount ? sel.getRangeAt(0) : null; const selected = range ? range.toString() : ''; const noSel = !sel.rangeCount || selected === ''; const text = noSel ? openTag + closeTag : openTag + selected + closeTag; if (range) { const node = document.createTextNode(text); range.deleteContents(); range.insertNode(node); if (!noSel) { range.setStart(node, openTag.length); range.setEnd(node, openTag.length + selected.length) } else { range.setStart(node, openTag.length); range.collapse(true) } } else { el.textContent += text } if (activeTab) setDirty(activeTab, true) }
function insertLinePrefix(prefix) { const el = activeEditor(); const s = activeTab; if (!el || !s) return; const fullText = el.textContent; const off = getOffset(el); const pos = Math.min(off, fullText.length); let lineStart = fullText.lastIndexOf('\n', pos - 1) + 1; let lineEnd = fullText.indexOf('\n', pos); if (lineEnd === -1) lineEnd = fullText.length; const line = fullText.substring(lineStart, lineEnd); if (line.startsWith(prefix)) return; el.textContent = fullText.substring(0, lineStart) + prefix + line + fullText.substring(lineEnd); const newOff = lineStart + prefix.length + (pos - lineStart); const range = document.createRange(); const sel = window.getSelection(); if (el.firstChild) { range.setStart(el.firstChild, Math.min(newOff, el.textContent.length)); range.collapse(true); if (sel) { sel.removeAllRanges(); sel.addRange(range) } }; setDirty(s, true) }
function getOffset(el) { const sel = window.getSelection(); if (!sel || !sel.rangeCount) return 0; const range = sel.getRangeAt(0).cloneRange(); range.selectNodeContents(el); range.setEnd(sel.anchorNode, sel.anchorOffset); return range.toString().length }

async function handleMenuAction(name) {
    switch (name) {
        case 'new': newFile(); break
        case 'open': openFile(); break
        case 'save': saveCurrentTab(); break
        case 'saveas': saveCurrentTabAs(); break
        case 'export-html': await exportHTML(); break
        case 'export-pdf': await exportPDF(); break
        case 'export-png': await exportImage('png'); break
        case 'export-jpg': await exportImage('jpg'); break
        case 'export-txt': exportTXT(); break
        case 'batch-export': openBatchModal(); break
        case 'bold': wrapSelection('**','**'); break
        case 'italic': wrapSelection('*','*'); break
        case 'strikethrough': wrapSelection('~~','~~'); break
        case 'heading': insertLinePrefix('# '); break
        case 'code': wrapSelection('`','`'); break
        case 'codeblock': insertAtCursor('\n```\n', '\n```\n', 'code here'); break
        case 'link': wrapSelection('[','](url)'); break
        case 'ul': insertLinePrefix('- '); break
        case 'ol': insertLinePrefix('1. '); break
        case 'blockquote': insertLinePrefix('> '); break
        case 'hr': insertAtCursor('\n---\n', ''); break
        case 'find': toggleFind(); break
        case 'view-editor': $('editor-pane').style.display='flex'; $('preview-pane').style.display='none'; $('gutter').style.display='none'; break
        case 'view-split': $('editor-pane').style.display='flex'; $('preview-pane').style.display='flex'; $('gutter').style.display='block'; break
        case 'view-preview': $('editor-pane').style.display='none'; $('preview-pane').style.display='flex'; $('gutter').style.display='none'; break
        case 'sync-scroll': _syncScroll = !_syncScroll; localStorage.setItem('md-studio-sync-scroll', _syncScroll); $('sync-scroll-icon').textContent = _syncScroll ? 'sync' : 'sync_disabled'; break
    }
}

document.querySelectorAll('.dropdown-item').forEach(item => { item.addEventListener('click', async e => { e.stopPropagation(); closeAllMenus(); await handleMenuAction(item.dataset.action) }) })
document.querySelectorAll('.export-btn').forEach(btn => { btn.addEventListener('click', async () => await handleMenuAction(btn.dataset.action)) })

function closeAllMenus() { document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show')); document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('bg-surface-container-highest','dark:bg-on-secondary-fixed-variant')) }
document.querySelectorAll('.menu-btn').forEach(btn => { btn.addEventListener('click', e => { e.stopPropagation(); const drop = btn.nextElementSibling; if (!drop || !drop.classList.contains('dropdown-menu')) return; const wasOpen = drop.classList.contains('show'); closeAllMenus(); if (!wasOpen) { drop.classList.add('show'); btn.classList.add('bg-surface-container-highest','dark:bg-on-secondary-fixed-variant') } }) })
document.addEventListener('click', e => { if (!e.target.closest('.menu-btn') && !e.target.closest('.dropdown-menu')) closeAllMenus() })

function _updateFindMatches() {
  const q = $('find-input').value
  if (!q || !activeTab || !activeTab.editorEl) { _findMatches = []; _findIndex = -1; return }
  const text = activeTab.editorEl.textContent
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')
  _findMatches = []; let m
  while ((m = regex.exec(text)) !== null) _findMatches.push({ index: m.index, length: m[0].length })
  _findIndex = _findMatches.length > 0 ? 0 : -1
}
function _selectFindMatch(idx) {
  if (!activeTab || !activeTab.editorEl || idx < 0 || idx >= _findMatches.length) return false
  const m = _findMatches[idx]; const el = activeTab.editorEl; el.focus()
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
  let node, offset = 0
  while (node = walker.nextNode()) {
    const len = node.textContent.length
    if (offset + len > m.index) {
      const startOff = m.index - offset
      const range = document.createRange(); range.setStart(node, startOff); range.setEnd(node, startOff + m.length)
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range)
      return true
    }
    offset += len
  }
  return false
}
function toggleFind() { const bar = $('find-replace-bar'); bar.classList.toggle('hidden'); if (!bar.classList.contains('hidden')) { $('find-input').focus(); _updateFindMatches(); _selectFindMatch(_findIndex) } }
$('find-close').addEventListener('click', () => $('find-replace-bar').classList.add('hidden'))
$('find-next').addEventListener('click', () => { if (!$('find-input').value) return; _updateFindMatches(); if (_findMatches.length === 0) return; _findIndex = (_findIndex + 1) % _findMatches.length; _selectFindMatch(_findIndex); $('find-count').textContent = (_findIndex + 1) + '/' + _findMatches.length })
$('find-prev').addEventListener('click', () => { if (!$('find-input').value) return; _updateFindMatches(); if (_findMatches.length === 0) return; _findIndex = (_findIndex - 1 + _findMatches.length) % _findMatches.length; _selectFindMatch(_findIndex); $('find-count').textContent = (_findIndex + 1) + '/' + _findMatches.length })
$('find-input').addEventListener('input', () => { _updateFindMatches(); if (_findMatches.length > 0) { _selectFindMatch(0); $('find-count').textContent = '1/' + _findMatches.length } else { $('find-count').textContent = '0/0' } })
$('replace-one').addEventListener('click', () => { const f = $('find-input').value, r = $('replace-input').value; if (!f) return; _updateFindMatches(); if (_findIndex < 0 || _findIndex >= _findMatches.length) return; const sel = window.getSelection(); if (!sel.rangeCount) return; if (!sel.toString()) { _selectFindMatch(_findIndex); if (!sel.toString()) return }; document.execCommand('insertText',false,r); if (activeTab) { activeTab.content = activeTab.editorEl ? activeTab.editorEl.textContent : activeTab.content; setDirty(activeTab, true) }; _updateFindMatches() })
$('replace-all').addEventListener('click', () => { const s = activeTab; const f = $('find-input').value, r = $('replace-input').value; if (!s || !f) return; s.content = (s.editorEl ? s.editorEl.textContent : s.content).replace(new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), r); if (s.editorEl) s.editorEl.textContent = s.content; setDirty(s, true) })
$('search-input').addEventListener('keydown', e => { if (e.key === 'Enter') { $('find-replace-bar').classList.remove('hidden'); $('find-input').value = $('search-input').value; _updateFindMatches(); _selectFindMatch(_findIndex) } })

$('btn-copy-html').addEventListener('click', () => { if (!activeTab || !activeTab.editorEl) return; navigator.clipboard.writeText(activeTab.editorEl.textContent).then(() => { $('btn-copy-html').querySelector('.material-symbols-outlined').textContent = 'check'; setTimeout(() => $('btn-copy-html').querySelector('.material-symbols-outlined').textContent = 'content_copy', 1500) }) })

async function openFolderEntry(entry, dirName) {
    const existing = editorPanes.find(t => t.name === entry.name)
    if (existing) { activateTab(existing.id); return }
    try {
        const file = await entry.getFile()
        const content = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.markdown') ? await file.text() : '[Binary file - preview not available]'
        const state = newTabState(entry.name, content, null)
        editorPanes.push(state)
        state.tabEl = renderTabDOM(state)
        activateTab(state.id)
        const nativePath = window.electronAPI?.isElectron ? window.electronAPI.getPathForFile(file) : null
        recordFileOpen(entry.name, dirName, nativePath)
    } catch (e) {
        console.error(e)
        alert('Could not open file: ' + entry.name)
    }
}

$('btn-open-folder')?.addEventListener('click', async () => {
    if (window.showDirectoryPicker) {
        try {
            const dirHandle = await window.showDirectoryPicker()
            $('workspace-path').textContent = dirHandle.name
            const fileEntries = []
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    const ext = '.' + entry.name.split('.').pop().toLowerCase()
                    if (ext === '.md' || ext === '.markdown') {
                        fileEntries.push(entry)
                    }
                }
            }
            if (fileEntries.length === 0) {
                alert('No Markdown (.md) files found in this folder.')
                return
            }
            folderEntries = {}
            const list = $('folder-file-list')
            list.innerHTML = ''
            $('folder-name').textContent = dirHandle.name
            fileEntries.forEach(entry => {
                folderEntries[entry.name] = entry
                const li = document.createElement('li')
                li.className = 'flex items-center gap-2 p-1 rounded group'
                li.innerHTML = `<input type="checkbox" class="folder-file-checkbox accent-primary dark:accent-primary-fixed cursor-pointer flex-shrink-0">
                    <span class="material-symbols-outlined text-primary text-[16px] flex-shrink-0">description</span>
                    <span class="text-system-ui-sm text-on-surface-variant dark:text-secondary-fixed-dim">${esc(entry.name)}</span>`
                li.querySelector('.folder-file-checkbox').dataset.filename = entry.name
                list.appendChild(li)
            })
            $('folder-files-section').classList.remove('hidden')
            $('select-all-folder-files').checked = false
        } catch(e) { if (e.name !== 'AbortError') console.error(e) }
    }
})

$('select-all-folder-files').addEventListener('change', () => {
    const checked = $('select-all-folder-files').checked
    document.querySelectorAll('#folder-file-list .folder-file-checkbox').forEach(cb => cb.checked = checked)
})

$('open-selected-files').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('#folder-file-list .folder-file-checkbox:checked')
    if (checkboxes.length === 0) return alert('Select at least one file to open.')
    const dirName = $('folder-name').textContent
    for (const cb of checkboxes) {
        const entry = folderEntries[cb.dataset.filename]
        if (entry) await openFolderEntry(entry, dirName)
    }
})


function initTheme() { const saved = localStorage.getItem('md-studio-theme'); if (saved === 'dark') { document.documentElement.classList.add('dark'); $('theme-icon').textContent = 'light_mode'; $('settings-theme-icon').textContent = 'light_mode' } else { document.documentElement.classList.remove('dark'); $('theme-icon').textContent = 'dark_mode'; $('settings-theme-icon').textContent = 'dark_mode' } }
$('theme-toggle').addEventListener('click', () => { document.documentElement.classList.toggle('dark'); const dark = document.documentElement.classList.contains('dark'); localStorage.setItem('md-studio-theme', dark ? 'dark' : 'light'); $('theme-icon').textContent = dark ? 'light_mode' : 'dark_mode'; $('settings-theme-icon').textContent = dark ? 'light_mode' : 'dark_mode'; if (activeTab) { activeTab.previewEl && (activeTab.previewEl.innerHTML = marked.parse(activeTab.content)) } })
$('settings-theme-toggle').addEventListener('click', () => { document.documentElement.classList.toggle('dark'); const dark = document.documentElement.classList.contains('dark'); localStorage.setItem('md-studio-theme', dark ? 'dark' : 'light'); $('theme-icon').textContent = dark ? 'light_mode' : 'dark_mode'; $('settings-theme-icon').textContent = dark ? 'light_mode' : 'dark_mode'; if (activeTab) { activeTab.previewEl && (activeTab.previewEl.innerHTML = marked.parse(activeTab.content)) } })

function restoreFontPrefs() { const font = localStorage.getItem('md-studio-font') || 'system-ui, sans-serif'; const size = localStorage.getItem('md-studio-fontsize') || '15'; $('font-select').value = font; $('fontsize-select').value = size; applyFont(font); applySize(size) }
function applyFont(font) {
    localStorage.setItem('md-studio-font', font)
    const fontFamily = font === 'disable' ? '' : font
    document.querySelectorAll('[id^="editor-pane-content"]').forEach(e => e.style.fontFamily = fontFamily)
    document.querySelectorAll('[id^="preview-pane-content"]').forEach(e => e.style.fontFamily = fontFamily)
}
function applySize(size) { localStorage.setItem('md-studio-fontsize', size); const px = parseInt(size); document.querySelectorAll('[id^="editor-pane-content"]').forEach(e => { e.style.fontSize = px + 'px'; e.style.lineHeight = (px * 1.6) + 'px' }) }
$('font-select').addEventListener('change', () => applyFont($('font-select').value))
$('fontsize-select').addEventListener('change', () => applySize($('fontsize-select').value))

const saved = localStorage.getItem('md-studio-split')
if (saved) { $('editor-pane').style.flex = 'none'; $('editor-pane').style.width = saved; $('preview-pane').style.flex = 'none'; $('preview-pane').style.width = `calc(100% - ${saved})` }
_syncScroll = localStorage.getItem('md-studio-sync-scroll') !== 'false'
$('sync-scroll-icon').textContent = _syncScroll ? 'sync' : 'sync_disabled'

const settingsPanel = $('settings-panel')
let settingsOpen = false
function toggleSettings(open) { settingsOpen = open; if (open) settingsPanel.classList.add('open'); else settingsPanel.classList.remove('open') }
$('btn-settings').addEventListener('click', () => toggleSettings(!settingsOpen))
$('settings-close').addEventListener('click', () => toggleSettings(false))

function openBatchModal() {
    const modal = $('batch-modal')
    const list = $('batch-file-list')
    list.innerHTML = ''
    editorPanes.forEach(state => {
        const item = document.createElement('label')
        item.className = 'batch-file-item'
        item.innerHTML = `<input type="checkbox" value="${state.id}" checked><span class="text-system-ui-sm text-on-surface dark:text-inverse-on-surface">${esc(state.name)}</span>`
        list.appendChild(item)
    })
    modal.classList.add('show')
}
function closeBatchModal() { $('batch-modal').classList.remove('show') }
$('batch-modal-close').addEventListener('click', closeBatchModal)
$('batch-cancel').addEventListener('click', closeBatchModal)
$('batch-modal').addEventListener('click', e => { if (e.target === $('batch-modal')) closeBatchModal() })

$('batch-export-btn').addEventListener('click', async () => {
    const checkboxes = $('batch-file-list').querySelectorAll('input[type="checkbox"]:checked')
    const format = $('batch-format').value
    const quality = $('batch-quality').value
    const downloadMode = $('batch-download-mode').value
    const isPdf = format === 'pdf'
    const scale = isPdf ? (quality === 'high' ? 3 : 2) : (quality === 'high' ? 2 : 1)

    if (checkboxes.length === 0) return alert('Please select at least one file.')

    const progress = $('batch-progress')
    const progressBar = $('batch-progress-bar')
    const progressText = $('batch-progress-text')
    progress.classList.remove('hidden')

    const selectedStates = []
    checkboxes.forEach(cb => {
        const state = editorPanes.find(t => t.id == cb.value)
        if (state) selectedStates.push(state)
    })

    const total = selectedStates.length
    let completed = 0

    async function wrapHTML(md, name) { const html = marked.parse(md); const styles = await collectStyles(); return '<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"><title>' + name + '</title><style>' + styles + '</style></head><body><div class=\"preview-export\">' + html + '</div></body></html>' }

        if (downloadMode === 'individual') {
            for (const state of selectedStates) {
            progressText.textContent = `Exporting ${state.name}... (${completed + 1}/${total})`
            progressBar.style.width = ((completed / total) * 100) + '%'
            try {
                switch (format) {
                    case 'html': {
                        const doc = await wrapHTML(state.content, state.name.replace(/\.[^.]+$/, ''))
                        download(new Blob([doc], { type: 'text/html' }), state.name.replace(/\.[^.]+$/, '') + '.html')
                        break
                    }
                    case 'pdf': await exportPDF(state, scale); break
                    case 'png': await exportImage('png', state, scale); break
                    case 'jpg': await exportImage('jpg', state, scale); break
                    case 'txt': exportTXT(state); break
                }
            } catch (e) { console.error(e) }
            completed++
            progressBar.style.width = ((completed / total) * 100) + '%'
            await new Promise(r => setTimeout(r, 300))
        }
    } else {
        const zip = new JSZip()
        const folder = zip.folder('md-code-export')
        for (const state of selectedStates) {
            progressText.textContent = `Processing ${state.name}... (${completed + 1}/${total})`
            progressBar.style.width = ((completed / total) * 100) + '%'
            try {
                switch (format) {
                    case 'html': {
                        const doc = await wrapHTML(state.content, state.name.replace(/\.[^.]+$/, ''))
                        folder.file(state.name.replace(/\.[^.]+$/, '') + '.html', doc)
                        break
                    }
                    case 'pdf': {
                        const canvas = await capturePreviewFull(state, scale)
                        const imgData = canvas.toDataURL('image/png')
                        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
                        const pw = pdf.internal.pageSize.getWidth()
                        const ph = (canvas.height * pw) / canvas.width
                        let y = 0
                        const pageH = pdf.internal.pageSize.getHeight()
                        while (y < ph) { if (y > 0) pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, -y, pw, ph); y += pageH }
                        const pdfBlob = pdf.output('blob')
                        folder.file(state.name.replace(/\.[^.]+$/, '') + '.pdf', pdfBlob)
                        break
                    }
                    case 'png': {
                        const canvas = await capturePreviewFull(state, scale)
                        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
                        folder.file(state.name.replace(/\.[^.]+$/, '') + '.png', blob)
                        break
                    }
                    case 'jpg': {
                        const canvas = await capturePreviewFull(state, scale)
                        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92))
                        folder.file(state.name.replace(/\.[^.]+$/, '') + '.jpg', blob)
                        break
                    }
                    case 'txt': {
                        folder.file(state.name.replace(/\.[^.]+$/, '') + '.txt', state.content)
                        break
                    }
                }
            } catch (e) { console.error(e) }
            completed++
            progressBar.style.width = ((completed / total) * 100) + '%'
        }
        progressText.textContent = 'Creating ZIP archive...'
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        saveAs(zipBlob, 'md-code-export.zip')
    }

    progressText.textContent = 'Export complete!'
    progressBar.style.width = '100%'
    setTimeout(() => { progress.classList.add('hidden'); closeBatchModal() }, 1500)
})

window.addEventListener('beforeunload', e => { if (editorPanes.some(t => t.isDirty)) { e.preventDefault(); e.returnValue = '' } })

if (window.electronAPI?.onOpenFile) {
  window.electronAPI.onOpenFile(async (filePath) => {
    try {
      const content = await window.electronAPI.readFile(filePath)
      if (content == null) { console.error('Failed to read file:', filePath); return }
      const name = window.electronAPI.basename(filePath)
      const existing = editorPanes.find(t => t.name === name)
      if (existing) { activateTab(existing.id); return }
      const state = newTabState(name, content, null)
      editorPanes.push(state)
      state.tabEl = renderTabDOM(state)
      activateTab(state.id)
      recordFileOpen(name, null, filePath)
    } catch (e) {
      console.error(e)
    }
  })
}

document.addEventListener('keydown', e => { const ctrl = e.ctrlKey || e.metaKey; if (ctrl && e.key === 's') { e.preventDefault(); if (e.shiftKey) saveCurrentTabAs(); else saveCurrentTab() } if (ctrl && e.key === 'o') { e.preventDefault(); openFile() } if (ctrl && e.key === 'n') { e.preventDefault(); newFile() } if (ctrl && e.key === 'b') { e.preventDefault(); wrapSelection('**','**') } if (ctrl && e.key === 'i') { e.preventDefault(); wrapSelection('*','*') } if (ctrl && e.key === 'd' && !e.shiftKey) { e.preventDefault(); wrapSelection('~~','~~') } if (ctrl && e.key === 'h') { e.preventDefault(); insertLinePrefix('# ') } if (ctrl && e.key === '`') { e.preventDefault(); wrapSelection('`','`') } if (ctrl && e.shiftKey && e.key === 'K') { e.preventDefault(); insertAtCursor('\n```\n', '\n```\n', 'code here') } if (ctrl && e.key === 'k' && !e.shiftKey) { e.preventDefault(); wrapSelection('[','](url)') } if (ctrl && e.key === 'l' && !e.shiftKey) { e.preventDefault(); insertLinePrefix('- ') } if (ctrl && e.shiftKey && e.key === 'L') { e.preventDefault(); insertLinePrefix('1. ') } if (ctrl && e.key === 'q') { e.preventDefault(); insertLinePrefix('> ') } if (ctrl && e.key === 'f') { e.preventDefault(); toggleFind() } if (e.key === 'Escape') { closeAllMenus(); if (!$('find-replace-bar').classList.contains('hidden')) $('find-replace-bar').classList.add('hidden'); if (settingsOpen) toggleSettings(false); if ($('batch-modal').classList.contains('show')) closeBatchModal() } })

async function initApp() {
  initTheme()
  restoreFontPrefs()
  renderRecentDOM()
  renderExplorerDOM()

  // Remove legacy sidebar state keys
  localStorage.removeItem('md-studio-sidebar-state')
  const old3Editor = localStorage.getItem('md-studio-editor-state')
  if (old3Editor && !localStorage.getItem('md-studio-preview-collapsed')) {
    if (old3Editor !== 'normal') localStorage.setItem('md-studio-preview-collapsed', '1')
    localStorage.removeItem('md-studio-editor-state')
  }

  const openFileParam = new URLSearchParams(window.location.search).get('openFile')
  const openFilePath = openFileParam ? decodeURIComponent(openFileParam) : null
  if (openFilePath && window.electronAPI?.readFile) {
    try {
      const content = await window.electronAPI.readFile(openFilePath)
      if (content == null) {
        console.error('Failed to read file:', openFilePath)
        newFile()
        return
      }
      const name = window.electronAPI.basename(openFilePath)
      const state = newTabState(name, content, null)
      editorPanes.push(state)
      state.tabEl = renderTabDOM(state)
      activateTab(state.id)
      recordFileOpen(name, null, openFilePath)
    } catch (e) {
      console.error(e)
      newFile()
    }
  } else {
    newFile()
  }

  // Restore sidebar width
  const saved = parseInt(localStorage.getItem('md-studio-sidebar-width'), 10)
  if (saved >= SIDEBAR_MIN && saved <= SIDEBAR_MAX) {
    setSidebarWidth(saved)
  }

  // Restore preview collapsed state
  if (localStorage.getItem('md-studio-preview-collapsed')) {
    document.body.classList.add('preview-collapsed')
  }
  updatePreviewToggleIcon()

  // Restore center split
  const savedSplit = localStorage.getItem('md-studio-split')
  if (savedSplit) {
    const pct = parseFloat(savedSplit)
    if (pct > 0 && pct < 100) {
      $('editor-pane').style.flex = 'none'
      $('editor-pane').style.width = pct + '%'
      $('preview-pane').style.flex = 'none'
      $('preview-pane').style.width = (100 - pct) + '%'
    }
  }

  // Mobile fallback — auto collapse preview
  const mq = window.matchMedia('(max-width: 768px)')
  const handleMobile = e => {
    if (e.matches) {
      document.body.classList.add('preview-collapsed')
    }
  }
  mq.addEventListener('change', handleMobile)
  handleMobile(mq)
  updatePreviewToggleIcon()
}
initApp()

function setSidebarWidth(px) {
  sidebarWidth = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, px))
  $('sidebar').style.width = sidebarWidth + 'px'
  $('main-content').style.marginLeft = sidebarWidth + 'px'
  $('sidebar-resizer').style.left = sidebarWidth + 'px'
}

function togglePreview() {
  const collapsed = document.body.classList.toggle('preview-collapsed')
  localStorage.setItem('md-studio-preview-collapsed', collapsed ? '1' : '')
  updatePreviewToggleIcon()
}
function updatePreviewToggleIcon() {
  const icon = document.querySelector('#preview-toggle-btn .material-symbols-outlined')
  if (icon) icon.textContent = document.body.classList.contains('preview-collapsed') ? 'visibility_off' : 'visibility'
}

// Sidebar resizer
;(() => {
  const resizer = document.getElementById('sidebar-resizer')
  if (!resizer) return
  resizer.addEventListener('pointerdown', e => {
    e.preventDefault()
    resizer.setPointerCapture(e.pointerId)
    resizer.classList.add('dragging')
    document.body.classList.add('dragging')
    const startX = e.clientX
    const startW = sidebarWidth
    const move = e => {
      const dx = e.clientX - startX
      setSidebarWidth(startW + dx)
    }
    const up = e => {
      resizer.classList.remove('dragging')
      document.body.classList.remove('dragging')
      localStorage.setItem('md-studio-sidebar-width', sidebarWidth)
      resizer.removeEventListener('pointermove', move)
      resizer.removeEventListener('pointerup', up)
    }
    resizer.addEventListener('pointermove', move)
    resizer.addEventListener('pointerup', up)
  })
})()

// Enhanced center gutter resizer (pointer events + double-click reset)
;(() => {
  const gutter = document.getElementById('gutter')
  if (!gutter) return
  // Double-click → 50/50 split
  gutter.addEventListener('dblclick', e => {
    e.preventDefault()
    $('editor-pane').style.flex = 'none'
    $('editor-pane').style.width = '50%'
    $('preview-pane').style.flex = 'none'
    $('preview-pane').style.width = '50%'
    localStorage.setItem('md-studio-split', '50%')
  })
  gutter.addEventListener('pointerdown', e => {
    e.preventDefault()
    gutter.setPointerCapture(e.pointerId)
    gutter.classList.add('dragging')
    document.body.classList.add('dragging')
    const startX = e.clientX
    const total = $('workspace').offsetWidth
    const getEditorPct = () => {
      const w = $('editor-pane').offsetWidth
      return (w / total) * 100
    }
    const startPct = getEditorPct()
    const move = e => {
      const dx = e.clientX - startX
      const pctPerPx = 100 / total
      let pct = startPct + (dx * pctPerPx)
      pct = Math.max(15, Math.min(85, pct))
      $('editor-pane').style.flex = 'none'
      $('editor-pane').style.width = pct + '%'
      $('preview-pane').style.flex = 'none'
      $('preview-pane').style.width = (100 - pct) + '%'
    }
    const up = e => {
      gutter.classList.remove('dragging')
      document.body.classList.remove('dragging')
      localStorage.setItem('md-studio-split', $('editor-pane').style.width)
      gutter.removeEventListener('pointermove', move)
      gutter.removeEventListener('pointerup', up)
    }
    gutter.addEventListener('pointermove', move)
    gutter.addEventListener('pointerup', up)
  })
})()

// Button wiring
document.addEventListener('DOMContentLoaded', () => {
  const pb = document.getElementById('preview-toggle-btn')
  if (pb) pb.addEventListener('click', togglePreview)
})
