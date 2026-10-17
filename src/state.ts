export type Kind = 'stone' | 'bonsai' | 'cherry' | 'flowers' | 'lantern' | 'pond' | 'bridge';
export interface Item {
    id: string;
    kind: Kind;
    x: number;
    z: number;
    rotation: number;
}
export interface Stroke {
    points: {
        x: number;
        z: number;
    }[];
}
export interface GardenState {
    items: Item[];
    strokes: Stroke[];
}
export const catalog: Record<Kind, {
    name: string;
    symbol: string;
    radius: number;
}> = { stone: { name: 'River stones', symbol: '◒', radius: .8 }, bonsai: { name: 'Cloud bonsai', symbol: '♧', radius: 1.3 }, cherry: { name: 'Cherry blossom', symbol: '❀', radius: 1.35 }, flowers: { name: 'Meadow flowers', symbol: '✿', radius: .62 }, lantern: { name: 'Stone lantern', symbol: '灯', radius: .45 }, pond: { name: 'Koi pond', symbol: '≈', radius: 1.65 }, bridge: { name: 'Wooden bridge', symbol: '⌒', radius: 1.22 } };
export const fresh = (): GardenState => ({ items: [{ id: 'cherry', kind: 'cherry', x: -2.8, z: -1.5, rotation: 0 }, { id: 'bonsai', kind: 'bonsai', x: 2.8, z: -1.8, rotation: .4 }, { id: 'pond', kind: 'pond', x: 1, z: .9, rotation: 0 }, { id: 'bridge', kind: 'bridge', x: 1, z: .9, rotation: .15 }, { id: 'stone', kind: 'stone', x: -1.5, z: 1.3, rotation: .3 }, { id: 'lantern', kind: 'lantern', x: -3.3, z: 2.6, rotation: 0 }, { id: 'flowers', kind: 'flowers', x: .2, z: -2.5, rotation: 0 }], strokes: [] });
export function snap(n: number) { return Math.round(n * 4) / 4; }
export function valid(item: Item, items: Item[], ignore = item.id) { let r = catalog[item.kind].radius; if (!Number.isFinite(item.x) || !Number.isFinite(item.z) || Math.abs(item.x) + r > 4.75 || Math.abs(item.z) + r > 3.75)
    return false; return items.every(o => o.id === ignore || ((item.kind === 'bridge' && o.kind === 'pond') || (item.kind === 'pond' && o.kind === 'bridge')) || Math.hypot(o.x - item.x, o.z - item.z) >= (catalog[o.kind].radius + r) * .72); }
export function sanitize(value: unknown): GardenState { if (!value || typeof value !== 'object')
    return fresh(); let data = value as GardenState; if (!Array.isArray(data.items) || !Array.isArray(data.strokes))
    return fresh(); let items: Item[] = []; for (let item of data.items.slice(0, 50)) {
    if (!item || !Object.hasOwn(catalog, item.kind) || typeof item.id !== 'string' || items.some(i => i.id === item.id))
        continue;
    let i = { id: item.id.slice(0, 80), kind: item.kind, x: snap(Number(item.x)), z: snap(Number(item.z)), rotation: Number.isFinite(item.rotation) ? item.rotation : 0 };
    if (valid(i, items))
        items.push(i);
} let strokes = data.strokes.slice(-80).map(s => ({ points: Array.isArray(s?.points) ? s.points.slice(0, 500).filter(p => p && typeof p === 'object' && Number.isFinite(p.x) && Number.isFinite(p.z) && Math.abs(p.x) < 4.8 && Math.abs(p.z) < 3.8) : [] })).filter(s => s.points.length > 1); return { items, strokes }; }
export class History {
    past: GardenState[] = [];
    future: GardenState[] = [];
    state: GardenState;
    constructor(state: GardenState) { this.state = state; }
    commit(next: GardenState) { this.past.push(structuredClone(this.state)); this.past = this.past.slice(-40); this.state = structuredClone(next); this.future = []; }
    undo() { let previous = this.past.pop(); if (!previous)
        return false; this.future.push(this.state); this.state = previous; return true; }
    redo() { let next = this.future.pop(); if (!next)
        return false; this.past.push(this.state); this.state = next; return true; }
}
