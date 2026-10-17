import '@babylonjs/core/Shaders/default.vertex';
import '@babylonjs/core/Shaders/default.fragment';
import '@babylonjs/core/Shaders/shadowMap.vertex';
import '@babylonjs/core/Shaders/shadowMap.fragment';
import '@babylonjs/core/Culling/ray';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { Artisan } from './models';
import { catalog, valid, type Item, type GardenState, type Kind, type Stroke } from './state';
export const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export class GardenScene {
    angleIndex = 0;
    items: Item[] = [];
    engine: Engine;
    scene: Scene;
    camera: ArcRotateCamera;
    artisan: Artisan;
    roots = new Map<string, TransformNode>();
    sandTexture: DynamicTexture;
    sun: DirectionalLight;
    sky: HemisphericLight;
    shadow: ShadowGenerator;
    ring: Mesh;
    rain: Mesh[] = [];
    mood = 'morning';
    quality = 'medium';
    observer: ResizeObserver;
    resizeHandler = () => this.fit();
    slowSamples = 0;
    lastSample = 0;
    time = 0;
    sandBase?: ImageData;
    corners: Vector3[] = [];
    frameInside = true;
    zoom = 1;
    constructor(public canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true });
        this.engine.setHardwareScalingLevel(1 / Math.min(devicePixelRatio, 1.5));
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(.84, .88, .81, 1);
        this.camera = new ArcRotateCamera('garden-view', 1.08, .95, 22, v(0, 1.2, 0), this.scene);
        this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this.camera.minZ = .1;
        this.camera.maxZ = 100;
        this.sky = new HemisphericLight('sky', v(0, 1, 0), this.scene);
        this.sky.intensity = .65;
        this.sun = new DirectionalLight('sun', v(-.5, -1, .4), this.scene);
        this.sun.position = v(5, 9, -5);
        this.sun.intensity = .8;
        this.shadow = new ShadowGenerator(1024, this.sun);
        this.shadow.usePercentageCloserFiltering = true;
        this.shadow.bias = .001;
        this.shadow.normalBias = .02;
        this.artisan = new Artisan(this.scene);
        this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
        this.scene.imageProcessingConfiguration.exposure = 1.2;
        this.corners = [];
        for (let x of [-5.35, 5.35])
            for (let y of [-.7, 4.2])
                for (let z of [-4.35, 4.35])
                    this.corners.push(v(x, y, z));
        let base = MeshBuilder.CreateBox('garden-base', { width: 10, height: .55, depth: 8 }, this.scene);
        base.position.y = -.35;
        let m = new StandardMaterial('cedar', this.scene);
        m.diffuseColor = Color3.FromHexString('#9b7757');
        base.material = m;
        let sand = MeshBuilder.CreateGround('sand', { width: 9.7, height: 7.7 }, this.scene);
        let sm = new StandardMaterial('sand', this.scene);
        sm.diffuseColor = Color3.FromHexString('#e5d9b9');
        sand.material = sm;
        sand.isPickable = true;
        sand.metadata = { sand: true };
        sand.receiveShadows = true;
        this.sandTexture = new DynamicTexture('raked-sand', { width: 1024, height: 1024 }, this.scene, false);
        sm.diffuseTexture = this.sandTexture;
        sm.specularColor = Color3.Black();
        this.paintSand([]);
        let border = new TransformNode('garden-joinery', this.scene);
        for (let z of [-4, 4])
            this.artisan.box(border, 'cedar-edge', v(0, -.06, z), v(10.15, .18, .13), '#947b5c');
        for (let x of [-5, 5])
            this.artisan.box(border, 'cedar-edge', v(x, -.06, 0), v(.13, .18, 8.15), '#947b5c');
        this.ring = MeshBuilder.CreateTorus('placement-ring', { diameter: 1, thickness: .025, tessellation: 48 }, this.scene);
        this.ring.position.y = .12;
        this.ring.isPickable = false;
        let rm = new StandardMaterial('selection', this.scene);
        rm.diffuseColor = Color3.FromHexString('#537c58');
        rm.emissiveColor = Color3.FromHexString('#537c58').scale(.25);
        this.ring.material = rm;
        this.ring.setEnabled(false);
        for (let i = 0; i < 60; i++) {
            let drop = MeshBuilder.CreateLines('rain', { points: [v(0, 0, 0), v(.04, -.22, 0)] }, this.scene);
            drop.color = Color3.FromHexString('#a7beb9');
            drop.alpha = .4;
            drop.isPickable = false;
            this.rain.push(drop);
        }
        this.scene.onBeforeRenderObservable.add(() => this.animate());
        this.fit();
        this.observer = new ResizeObserver(this.resizeHandler);
        this.observer.observe(canvas);
        visualViewport?.addEventListener('resize', this.resizeHandler);
        this.engine.runRenderLoop(() => this.scene.render());
    }
    fit() { this.engine.resize(); let r = this.canvas.getBoundingClientRect(); if (!r.width || !r.height)
        return; let points: Vector3[] = []; for (let m of this.scene.meshes) {
        if (!m.isEnabled() || m.name === 'placement-ring' || m.name === 'rain' || m.metadata?.itemId === 'preview')
            continue;
        m.computeWorldMatrix(true);
        points.push(...m.getBoundingInfo().boundingBox.vectorsWorld);
    } if (!points.length)
        points = this.corners; let portrait = r.width / r.height < .9; this.camera.alpha = (portrait ? .12 : 1.08) + this.angleIndex * Math.PI / 2; this.camera.beta = portrait ? .62 : .95; let aspect = r.width / r.height, view = this.camera.getViewMatrix(true), vs = points.map(p => Vector3.TransformCoordinates(p, view)), xs = vs.map(p => p.x), ys = vs.map(p => p.y), cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2, halfX = (Math.max(...xs) - Math.min(...xs)) * .56 / this.zoom, halfY = (Math.max(...ys) - Math.min(...ys)) * .56 / this.zoom; if (halfX / halfY > aspect)
        halfY = halfX / aspect;
    else
        halfX = halfY * aspect; this.camera.orthoLeft = cx - halfX; this.camera.orthoRight = cx + halfX; this.camera.orthoTop = cy + halfY; this.camera.orthoBottom = cy - halfY; this.frameInside = xs.every(x => x > cx - halfX && x < cx + halfX) && ys.every(y => y > cy - halfY && y < cy + halfY); this.canvas.dataset.framed = String(this.frameInside); this.canvas.dataset.frameSize = Math.round(r.width) + 'x' + Math.round(r.height); this.diagnostics(); }
    sync(state: GardenState) { this.items = state.items; this.shadow.getShadowMap()!.renderList = []; for (let root of this.roots.values())
        root.dispose(false); this.roots.clear(); for (let item of state.items) {
        let root = this.artisan.make(item.kind, item.id);
        root.position.set(item.x, 0, item.z);
        root.rotation.y = item.rotation;
        let batches = new Map<unknown, Mesh[]>();
        for (let mesh of root.getChildMeshes()) {
            let list = batches.get(mesh.material) || [];
            list.push(mesh as Mesh);
            batches.set(mesh.material, list);
        }
        for (let list of batches.values()) {
            if (list.length < 2) {
                this.shadow.addShadowCaster(list[0]);
                continue;
            }
            let merged = Mesh.MergeMeshes(list, true, true);
            if (merged) {
                merged.setParent(root);
                merged.metadata = { itemId: item.id };
                merged.receiveShadows = true;
                this.shadow.addShadowCaster(merged);
            }
        }
        this.roots.set(item.id, root);
    } this.paintSand(state.strokes); this.fit(); }
    paintSand(strokes: Stroke[]) { let c = this.sandTexture.getContext() as CanvasRenderingContext2D; if (!this.sandBase) {
        c.fillStyle = '#d9cdb0';
        c.fillRect(0, 0, 1024, 1024);
        let seed = 19;
        for (let i = 0; i < 18000; i++) {
            seed = (seed * 16807) % 2147483647;
            let x = seed % 1024;
            seed = (seed * 16807) % 2147483647;
            let y = seed % 1024;
            c.fillStyle = i % 2 ? '#f7edce40' : '#8a765b20';
            c.fillRect(x, y, 1, 1);
        }
        this.sandBase = c.getImageData(0, 0, 1024, 1024);
    }
    else
        c.putImageData(this.sandBase, 0, 0); for (let stroke of strokes) {
        let points = stroke.points;
        if (points.length < 2)
            continue;
        for (let offset of [-12, -6, 0, 6, 12]) {
            c.beginPath();
            for (let i = 0; i < points.length; i++) {
                let p = points[i], x = (p.x / 9.7 + .5) * 1024, y = (.5 + p.z / 7.7) * 1024;
                if (i === 0)
                    c.moveTo(x + offset, y);
                else
                    c.lineTo(x + offset, y);
            }
            c.strokeStyle = '#927e5dcc';
            c.lineWidth = 3.5;
            c.lineCap = 'round';
            c.lineJoin = 'round';
            c.stroke();
            c.translate(1, 1);
            c.strokeStyle = '#fff6dccc';
            c.lineWidth = 2;
            c.stroke();
            c.translate(-1, -1);
        }
    } this.sandTexture.update(false); }
    diagnostics() { this.scene.updateTransformMatrix(true); let rect = this.canvas.getBoundingClientRect(), viewport = this.camera.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight()); let project = (p: Vector3) => { let v = Vector3.Project(p, Matrix.Identity(), this.scene.getTransformMatrix(), viewport); return { px: rect.x + v.x * rect.width / this.engine.getRenderWidth(), py: rect.y + v.y * rect.height / this.engine.getRenderHeight() }; }; let free; for (let x = 3.75; x >= -3.75 && !free; x -= .75)
        for (let z = 2.75; z >= -2.75; z -= .75) {
            let test: Item = { id: 'sample', kind: 'stone', x, z, rotation: 0 };
            if (valid(test, this.items)) {
                free = { x, z, ...project(v(x, 0, z)) };
                break;
            }
        } this.canvas.dataset.renderTargets = JSON.stringify({ free, items: this.items.map(i => ({ ...i, ...project(v(i.x, i.kind === 'stone' ? .3 : .1, i.z + (i.kind === 'stone' ? .13 : 0))) })) }); }
    select(item?: Item, valid = true) { this.ring.setEnabled(!!item); if (!item)
        return; this.ring.position.set(item.x, .14, item.z); this.ring.scaling.setAll(catalog[item.kind].radius * 2.1); let m = this.ring.material as StandardMaterial; m.diffuseColor = Color3.FromHexString(valid ? '#5a855a' : '#b45e53'); }
    point(clientX: number, clientY: number) { let r = this.canvas.getBoundingClientRect(); const pick = this.scene.pick(clientX - r.left, clientY - r.top, m => m.metadata?.sand === true); return pick?.pickedPoint; }
    hit(clientX: number, clientY: number) { let r = this.canvas.getBoundingClientRect(); return this.scene.pick(clientX - r.left, clientY - r.top, m => !!m.metadata?.itemId)?.pickedMesh?.metadata?.itemId as string | undefined; }
    animate() { let dt = Math.min(.1, this.engine.getDeltaTime() / 1000); this.time += dt; let night = this.mood === 'night', rain = this.mood === 'rain', evening = this.mood === 'evening'; let target = night ? .28 : rain ? .55 : evening ? .65 : .9; this.sun.intensity += (target - this.sun.intensity) * dt * 2; this.sky.intensity += ((night ? .35 : rain ? .65 : .7) - this.sky.intensity) * dt * 2; this.sun.diffuse = Color3.Lerp(this.sun.diffuse, Color3.FromHexString(night ? '#8ba8c7' : evening ? '#ffbb80' : '#fff1d0'), dt * 2); this.scene.clearColor = Color4.Lerp(this.scene.clearColor, night ? new Color4(.13, .2, .25, 1) : evening ? new Color4(.72, .65, .53, 1) : new Color4(.84, .88, .81, 1), dt * 2); this.scene.imageProcessingConfiguration.exposure += ((night ? .82 : evening ? 1.15 : 1.2) - this.scene.imageProcessingConfiguration.exposure) * dt * 2; for (let i = 0; i < this.rain.length; i++) {
        let d = this.rain[i];
        d.setEnabled(rain && i < (this.quality === 'low' ? 24 : 60));
        d.position.set(-4.7 + (i * .779 % 9.4), ((i * .83 - this.time * 3) % 5 + 5) % 5, -3.5 + (i * .391 % 7));
    } if (this.time - this.lastSample > 3 && !document.hidden) {
        this.lastSample = this.time;
        if (this.engine.getFps() < 26)
            this.slowSamples++;
        else
            this.slowSamples = 0;
        if (this.slowSamples >= 2) {
            this.engine.setHardwareScalingLevel(Math.min(1.5, this.engine.getHardwareScalingLevel() + .2));
            this.slowSamples = 0;
        }
    } for (let m of this.scene.meshes)
        if (m.name.startsWith('pond-ripple'))
            m.visibility = .65 + Math.sin(this.time * 1.5) * .2; }
    setQuality(q: string) { this.quality = q; this.engine.setHardwareScalingLevel(1 / Math.min(devicePixelRatio, q === 'high' ? 2 : q === 'medium' ? 1.5 : 1)); this.shadow.mapSize = q === 'high' ? 2048 : q === 'low' ? 512 : 1024; this.scene.shadowsEnabled = q !== 'low'; this.fit(); }
    angle() { this.angleIndex = (this.angleIndex + 1) % 4; this.fit(); }
    async capture() { this.scene.render(); let blob = await new Promise<Blob | null>(resolve => this.canvas.toBlob(resolve, 'image/png')); if (!blob)
        throw Error('Photo unavailable'); let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-zen-garden.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); }
    dispose() { this.observer.disconnect(); visualViewport?.removeEventListener('resize', this.resizeHandler); this.scene.dispose(); this.engine.dispose(); }
}
