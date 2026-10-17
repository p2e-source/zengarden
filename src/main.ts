import './style.css';
import { GardenScene } from './scene';
import { catalog, fresh, sanitize, snap, valid, History, type Item, type Kind, type Stroke } from './state';
import { Soundscape } from './sound';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<div class="shell"><header class="header"><div class="brand"><span class="brand-mark">庭</span><div><h1>zen garden</h1><small>A LITTLE WORLD OF PEACE</small></div></div><nav class="header-actions" aria-label="Garden settings"><button id="atmosphere">Atmosphere</button><button id="settings">Settings</button></nav></header><main class="workspace"><div class="stage"><canvas id="garden" aria-label="Interactive miniature Zen garden"></canvas><div class="scene-label">BREATHE IN. MAKE ROOM FOR QUIET.</div><div id="loading" class="loading">A little world is growing.<small>Preparing your quiet corner…</small></div></div><aside class="tools" aria-label="Garden tools"><div class="tools-title"><span class="overline">YOUR DAILY PAUSE</span><h2>Make a little peace.</h2></div><div class="tool-main"><button id="add"><span class="symbol">＋</span>Add object</button><button id="rake"><span class="symbol">≋</span>Rake sand</button><button id="photo"><span class="symbol">◉</span>Photo mode</button></div><p id="instruction" class="instruction">A little space to arrange, to wander, to simply be.</p><div class="tools-bottom"><div class="history"><button id="undo">↶ Undo</button><button id="redo">↷ Redo</button></div><div class="object-actions"><button id="rotate">↻ Rotate</button><button id="remove">− Remove</button></div></div><button id="save">Save garden</button><div id="photo-bar" class="photo-bar" hidden><button id="angle">Change angle</button><button id="capture">Save PNG</button><button id="hide-ui">Hide controls</button><button id="return">Back to garden</button></div></aside></main><footer class="footer"><a href="https://play2earn.world/" target="_blank" rel="noopener">More free games at Play2Earn.world ↗</a><span id="save-status" class="saved">A quiet beginning.</span></footer></div><button id="show-ui" class="exit-photo">Show controls</button><div id="toast" role="status"></div>`;
export const garden = new GardenScene(document.querySelector<HTMLCanvasElement>('#garden')!);
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let saved: Record<string, unknown> = {};
try {
    saved = JSON.parse(localStorage.getItem('zen-garden-v1') || '{}') || {};
}
catch { }
const history = new History(saved.garden ? sanitize(saved.garden) : fresh());
let selected: string | undefined, placing: Kind | undefined, raking = false, photo = false, ghost: ReturnType<typeof garden.artisan.make> | undefined;
let mood = typeof saved.mood === 'string' && ['morning', 'evening', 'night', 'rain'].includes(saved.mood) ? saved.mood : 'morning';
let volume = typeof saved.volume === 'number' ? Math.max(0, Math.min(1, saved.volume)) : .35, muted = saved.muted === true, quality = typeof saved.quality === 'string' && ['low', 'medium', 'high'].includes(saved.quality) ? saved.quality : (navigator.hardwareConcurrency <= 4 || innerWidth < 700 ? 'low' : 'medium');
const sound = new Soundscape();
let toastTimer: ReturnType<typeof setTimeout>;
function toast(message: string) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2500); }
function save() { try {
    localStorage.setItem('zen-garden-v1', JSON.stringify({ garden: history.state, mood, volume, muted, quality }));
    $('save-status').textContent = `${history.state.items.length} objects · Saved`;
    $('save-status').dataset.objects = String(history.state.items.length);
    $('save-status').dataset.strokes = String(history.state.strokes.length);
}
catch {
    $('save-status').textContent = 'Storage unavailable';
    toast('Your garden stays here for this visit. Browser storage is unavailable.');
} }
function update() { garden.sync(history.state); garden.select(history.state.items.find(i => i.id === selected)); $('undo').toggleAttribute('disabled', !history.past.length); $('redo').toggleAttribute('disabled', !history.future.length); $('rotate').toggleAttribute('disabled', !selected); $('remove').toggleAttribute('disabled', !selected); save(); }
function commit(next: typeof history.state) { history.commit(next); update(); }
function toolReset() { placing = undefined; raking = false; ghost?.dispose(); ghost = undefined; $('rake').setAttribute('aria-pressed', 'false'); garden.select(); }
function select(id?: string) { selected = id; garden.select(history.state.items.find(i => i.id === id)); $('rotate').toggleAttribute('disabled', !id); $('remove').toggleAttribute('disabled', !id); $('instruction').textContent = id ? 'Drag to move. Rotate or remove to make room.' : 'Select a piece, or add something that brings you calm.'; }
const dialogs = document.createElement('div');
dialogs.innerHTML = `<dialog id="objects-dialog"><div class="dialog-head"><h2>Small things. Big calm.</h2><button data-close="objects-dialog" aria-label="Close object collection">×</button></div><div class="palette">${Object.entries(catalog).map(([kind, c]) => `<button data-kind="${kind}"><span class="symbol" aria-hidden="true">${c.symbol}</span>${c.name}</button>`).join('')}</div><p class="note">Choose a piece, then tap or drag onto the sand. The ring turns green where it fits. Up to 30 pieces keeps your world light.</p></dialog><dialog id="mood-dialog"><div class="dialog-head"><h2>A change in the air.</h2><button data-close="mood-dialog" aria-label="Close atmosphere">×</button></div><div class="palette">${[['morning', '☼', 'Sunny morning'], ['evening', '◐', 'Golden evening'], ['night', '☾', 'Moonlit night'], ['rain', '☂', 'Gentle rain']].map(([id, icon, name]) => `<button data-mood="${id}"><span class="symbol" aria-hidden="true">${icon}</span>${name}</button>`).join('')}</div><p class="note">Light and weather change around your garden.</p></dialog><dialog id="settings-dialog"><div class="dialog-head"><h2>Your quiet settings.</h2><button data-close="settings-dialog" aria-label="Close settings">×</button></div><button id="sound-toggle">Enable sound</button><label class="field">Ambient volume<input id="volume" type="range" min="0" max="1" step=".01" value="${volume}"></label><label class="field">Graphics<select id="quality"><option value="low">Low · easier on your phone</option><option value="medium">Medium · balanced</option><option value="high">High · crisp shadows</option></select></label><label class="field">Garden framing<input id="zoom" type="range" min=".75" max="1" step=".01" value="1"></label><p class="note">Zoom stays within a safe range so the whole garden remains visible. Sound begins only when you enable it.</p><button class="danger" id="reset">Reset garden</button></dialog><dialog id="reset-dialog"><div class="dialog-head"><h2>A fresh beginning?</h2></div><p class="note">Restore the original garden and clear your sand patterns. You can undo this change.</p><button id="confirm-reset" class="danger">Reset my garden</button> <button data-close="reset-dialog">Keep my garden</button></dialog>`;
app.append(dialogs);
for (let b of document.querySelectorAll<HTMLButtonElement>('[data-close]'))
    b.onclick = () => ($(b.dataset.close!) as HTMLDialogElement).close();
function open(id: string) { sound.start(volume, muted, mood, false); ($<HTMLDialogElement>(id)).showModal(); }
$('add').onclick = () => { toolReset(); select(); open('objects-dialog'); };
for (let b of document.querySelectorAll<HTMLButtonElement>('[data-kind]'))
    b.onclick = () => { if (history.state.items.length >= 30) {
        toast('Thirty little pieces is plenty. Remove one to make room.');
        return;
    } placing = b.dataset.kind as Kind; ghost = garden.artisan.make(placing, 'preview'); for (let m of ghost.getChildMeshes()) {
        m.isPickable = false;
        m.visibility = .55;
    } ghost.setEnabled(false); ($<HTMLDialogElement>('objects-dialog')).close(); $('instruction').textContent = 'Tap or drag on the sand. Green means there is room.'; toast('Tap the sand to place your ' + catalog[placing].name.toLowerCase()); };
$('rake').onclick = () => { let active = !raking; toolReset(); select(); raking = active; $('rake').setAttribute('aria-pressed', String(active)); $('instruction').textContent = active ? 'One finger. Slow lines. Drag across the sand.' : 'Select a piece or add something peaceful.'; };
$('undo').onclick = () => { toolReset(); select(); if (history.undo())
    update(); };
$('redo').onclick = () => { toolReset(); select(); if (history.redo())
    update(); };
$('rotate').onclick = () => { let next = structuredClone(history.state), item = next.items.find(i => i.id === selected); if (item) {
    item.rotation += Math.PI / 4;
    commit(next);
} };
$('remove').onclick = () => { if (!selected)
    return; let next = structuredClone(history.state); next.items = next.items.filter(i => i.id !== selected); selected = undefined; commit(next); };
$('save').onclick = () => { save(); toast('Your little world is saved on this device.'); };
$('atmosphere').onclick = () => open('mood-dialog');
$('settings').onclick = () => open('settings-dialog');
for (let b of document.querySelectorAll<HTMLButtonElement>('[data-mood]'))
    b.onclick = () => { mood = b.dataset.mood!; garden.mood = mood; sound.update(volume, muted, mood); document.querySelectorAll('[data-mood]').forEach(e => e.classList.toggle('active', e === b)); ($<HTMLDialogElement>('mood-dialog')).close(); save(); };
$<HTMLSelectElement>('quality').value = quality;
$('quality').onchange = () => { quality = $<HTMLSelectElement>('quality').value; garden.setQuality(quality); save(); };
function soundLabel() { $('sound-toggle').textContent = sound.running && !muted ? 'Mute sound' : 'Enable sound'; $('sound-toggle').setAttribute('aria-pressed', String(sound.running && !muted)); }
$('sound-toggle').onclick = async () => { if (!sound.running || muted) {
    muted = false;
    await sound.start(volume, false, mood, true);
}
else {
    muted = true;
    sound.update(volume, true, mood);
} soundLabel(); save(); };
$('volume').oninput = () => { volume = Number($<HTMLInputElement>('volume').value); sound.update(volume, muted, mood); save(); };
$('zoom').oninput = () => { garden.zoom = Number($<HTMLInputElement>('zoom').value); garden.fit(); };
$('reset').onclick = () => open('reset-dialog');
$('confirm-reset').onclick = () => { toolReset(); select(); commit(fresh()); ($<HTMLDialogElement>('reset-dialog')).close(); ($<HTMLDialogElement>('settings-dialog')).close(); };
function setPhoto(active: boolean) { toolReset(); photo = active; document.body.classList.toggle('photo-mode', active); document.body.classList.remove('controls-hidden'); $('photo-bar').hidden = !active; $('save').hidden = active; requestAnimationFrame(() => garden.fit()); }
$('photo').onclick = () => setPhoto(true);
$('return').onclick = () => setPhoto(false);
$('angle').onclick = () => garden.angle();
$('capture').onclick = () => void garden.capture().then(() => toast('Your garden photo is ready.')).catch(() => toast('Photo saving is unavailable. Try a device screenshot.'));
$('hide-ui').onclick = () => { document.body.classList.add('controls-hidden'); requestAnimationFrame(() => garden.fit()); };
$('show-ui').onclick = () => { document.body.classList.remove('controls-hidden'); requestAnimationFrame(() => garden.fit()); };
const canvas = garden.canvas, pointers = new Map<number, {
    x: number;
    y: number;
}>();
let dragging: Item | undefined, start: {
    x: number;
    y: number;
} | undefined, moved = false, stroke: Stroke | undefined, pinch = 0, paintQueued = false, pinching = false;
function preview(x: number, y: number) { let p = garden.point(x, y); if (!p)
    return; let kind = placing || dragging?.kind; if (!kind)
    return; let item: Item = { id: dragging?.id || 'preview', kind, x: snap(p.x), z: snap(p.z), rotation: dragging?.rotation || 0 }; if (ghost) {
    ghost.setEnabled(true);
    ghost.position.set(item.x, 0, item.z);
}
else if (dragging) {
    let root = garden.roots.get(dragging.id);
    root?.position.set(item.x, 0, item.z);
} garden.select(item, valid(item, history.state.items)); return item; }
canvas.addEventListener('pointerdown', e => { if (photo)
    return; canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pointers.size === 2) {
    pinching = true;
    let a = [...pointers.values()];
    pinch = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
    dragging = undefined;
    stroke = undefined;
    update();
    return;
} start = { x: e.clientX, y: e.clientY }; moved = false; if (placing) {
    preview(e.clientX, e.clientY);
    return;
} let p = garden.point(e.clientX, e.clientY); if (raking && p) {
    stroke = { points: [{ x: p.x, z: p.z }] };
    return;
} let id = garden.hit(e.clientX, e.clientY); select(id); if (id)
    dragging = structuredClone(history.state.items.find(i => i.id === id)); });
canvas.addEventListener('pointermove', e => { if (photo)
    return; if (pointers.has(e.pointerId))
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pointers.size === 2) {
    let a = [...pointers.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
    if (pinch) {
        garden.zoom = Math.max(.75, Math.min(1, garden.zoom * d / pinch));
        garden.fit();
    }
    pinch = d;
    return;
} if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5)
    moved = true; if (placing || dragging)
    preview(e.clientX, e.clientY); if (stroke && pointers.size === 1) {
    let p = garden.point(e.clientX, e.clientY);
    if (p && Math.abs(p.x) < 4.75 && Math.abs(p.z) < 3.75) {
        let last = stroke.points.at(-1)!;
        if (Math.hypot(last.x - p.x, last.z - p.z) > .04) {
            stroke.points.push({ x: p.x, z: p.z });
            if (!paintQueued) {
                paintQueued = true;
                requestAnimationFrame(() => { paintQueued = false; if (stroke)
                    garden.paintSand([...history.state.strokes, stroke]); });
            }
        }
    }
} });
canvas.addEventListener('pointerup', e => { let multi = pointers.size > 1; pointers.delete(e.pointerId); if (multi || photo || pinching) {
    if (!pointers.size)
        pinching = false;
    start = undefined;
    return;
} if (stroke) {
    if (stroke.points.length > 1) {
        let next = structuredClone(history.state);
        next.strokes.push(stroke);
        next.strokes = next.strokes.slice(-80);
        commit(next);
    }
    stroke = undefined;
}
else if (placing || dragging && moved) {
    let item = preview(e.clientX, e.clientY);
    if (item && valid(item, history.state.items)) {
        let next = structuredClone(history.state);
        if (placing) {
            item.id = crypto.randomUUID();
            next.items.push(item);
            toolReset();
        }
        else
            next.items = next.items.map(i => i.id === item.id ? item : i);
        selected = item.id;
        commit(next);
    }
    else {
        update();
        toast('Give that piece a little more room.');
    }
} dragging = undefined; start = undefined; });
canvas.addEventListener('pointercancel', () => { pointers.clear(); pinching = false; dragging = undefined; stroke = undefined; start = undefined; update(); });
canvas.addEventListener('wheel', e => { e.preventDefault(); garden.zoom = Math.max(.75, Math.min(1, garden.zoom - e.deltaY * .0006)); garden.fit(); }, { passive: false });
window.addEventListener('keydown', e => { if ((e.target as HTMLElement).matches('input,select,textarea') || document.querySelector('dialog[open]'))
    return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    (e.shiftKey ? $('redo') : $('undo')).click();
} if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    $('redo').click();
} if (e.key === 'Escape') {
    toolReset();
    select();
} if (e.key.toLowerCase() === 'r')
    $('rotate').click(); if (e.key === 'Delete')
    $('remove').click(); });
document.addEventListener('visibilitychange', () => { if (document.hidden)
    sound.suspend();
else if (sound.running && !muted)
    void sound.start(volume, muted, mood, true); });
garden.mood = mood;
garden.setQuality(quality);
update();
$('loading').hidden = true;
soundLabel();
window.addEventListener('beforeunload', () => { save(); sound.dispose(); garden.dispose(); });
