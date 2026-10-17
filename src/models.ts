import type { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import type { Kind } from './state';
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export class Artisan {
    materials = new Map<string, StandardMaterial>();
    seed = 12;
    constructor(public scene: Scene) { }
    random() { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 2147483647; }
    material(color: string) { if (this.materials.has(color))
        return this.materials.get(color)!; let m = new StandardMaterial('craft-' + color, this.scene); m.diffuseColor = Color3.FromHexString(color); m.specularColor = new Color3(.1, .1, .1); this.materials.set(color, m); return m; }
    sphere(parent: TransformNode, name: string, p: Vector3, scale: Vector3, color: string, detail = 2) { let m = MeshBuilder.CreateIcoSphere(name, { radius: 1, subdivisions: detail, flat: false }, this.scene); m.parent = parent; m.position = p; m.scaling = scale; m.material = this.material(color); return m; }
    box(parent: TransformNode, name: string, p: Vector3, size: Vector3, color: string) { let m = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, this.scene); m.parent = parent; m.position = p; m.material = this.material(color); return m; }
    tube(parent: TransformNode, name: string, points: Vector3[], radius: number, color: string) { let m = MeshBuilder.CreateTube(name, { path: points, radius, tessellation: 8, cap: Mesh.CAP_ALL }, this.scene); m.parent = parent; m.material = this.material(color); return m; }
    make(kind: Kind, id: string) {
        let root = new TransformNode(id, this.scene);
        this.seed = kind.length * 103;
        if (kind === 'stone') {
            for (let i = 0; i < 3; i++) {
                let m = this.sphere(root, 'weathered-river-stone', v((i - 1) * .35, .18 + (i === 1 ? .12 : 0), Math.sin(i) * .15), v(.38, .24 + i * .04, .3), ['#858e84', '#a3a998', '#707e79'][i], 2);
                let positions = m.getVerticesData(VertexBuffer.PositionKind);
                if (positions) {
                    for (let k = 0; k < positions.length; k += 3) {
                        let factor = 1 + Math.sin(positions[k] * 13 + positions[k + 1] * 9 + positions[k + 2] * 17) * .06;
                        for (let j = 0; j < 3; j++)
                            positions[k + j] *= factor;
                    }
                    m.setVerticesData(VertexBuffer.PositionKind, positions);
                    let normals: number[] = [];
                    VertexData.ComputeNormals(positions, m.getIndices()!, normals);
                    m.setVerticesData(VertexBuffer.NormalKind, normals);
                }
                m.rotation.y = i * 1.3;
            }
            this.sphere(root, 'moss', v(.1, .36, .02), v(.28, .03, .19), '#7d9867');
        }
        if (kind === 'bonsai' || kind === 'cherry') {
            let cherry = kind === 'cherry', trunk = cherry ? 2.6 : 1.6;
            this.sphere(root, 'moss-island', v(0, .035, 0), v(cherry ? .85 : .7, .08, .65), '#91a078');
            this.tube(root, 'twisting-trunk', [v(0, 0, 0), v(-.18, .5, 0), v(.08, trunk * .6, .12), v(-.13, trunk, 0)], cherry ? .12 : .16, '#7c6750');
            for (let i = 0; i < 7; i++) {
                let a = i * 2.4, rr = cherry ? .65 : .58, h = trunk * .65 + (i % 3) * .23;
                let end = v(Math.cos(a) * rr, h + .3, Math.sin(a) * rr);
                this.tube(root, 'branch', [v(0, h * .7, .05), v(end.x * .6, h, end.z * .6), end], .045, '#7c6750');
                let colors = cherry ? ['#e8b8bd', '#f2cbd1', '#d99cae'] : ['#6d8b65', '#91a27c', '#4e765c'];
                if (!cherry)
                    this.sphere(root, 'sculpted-canopy', end.add(v(0, .13, 0)), v(.48, .23, .42), colors[i % 3], 2);
                for (let k = 0; k < (cherry ? 17 : 7); k++) {
                    let a = k * 2.4, rr = .15 + this.random() * .35;
                    this.sphere(root, cherry ? 'blossom-cluster' : 'leaf-cluster', end.add(v(Math.cos(a) * rr, .1 + this.random() * .32, Math.sin(a) * rr * .85)), v(cherry ? .16 : .18, cherry ? .12 : .08, cherry ? .15 : .14), colors[(i + k) % 3], cherry ? 1 : 2);
                }
            }
        }
        if (kind === 'flowers') {
            this.sphere(root, 'flower-moss', v(0, .025, 0), v(.55, .06, .48), '#93a47b');
            for (let i = 0; i < 11; i++) {
                let a = i * 2.4, r = .15 + (i % 3) * .12, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .22 + i % 3 * .12;
                this.tube(root, 'flower-stem', [v(x, 0, z), v(x + .04, h, z)], .012, '#5c8056');
                for (let j = 0; j < 5; j++) {
                    let a = j * Math.PI * 2 / 5;
                    this.sphere(root, 'petal', v(x + .04 + Math.cos(a) * .075, h, z + Math.sin(a) * .075), v(.07, .025, .05), i % 2 ? '#e0b2b3' : '#f3e3b3', 1);
                }
                this.sphere(root, 'pollen', v(x + .04, h + .02, z), v(.035, .025, .035), '#bca06c', 1);
            }
        }
        if (kind === 'lantern') {
            let gray = '#a7ad97';
            this.sphere(root, 'lantern-foot', v(0, .07, 0), v(.42, .12, .36), gray);
            let post = MeshBuilder.CreateCylinder('carved-stone-stem', { diameterTop: .21, diameterBottom: .3, height: .65, tessellation: 8 }, this.scene);
            post.parent = root;
            post.position.y = .44;
            post.material = this.material(gray);
            this.box(root, 'lantern-plinth', v(0, .82, 0), v(.55, .12, .5), gray);
            let glow = this.box(root, 'lantern-paper', v(0, 1.04, 0), v(.33, .33, .29), '#ffda94');
            let gm = this.material('#ffda94');
            gm.emissiveColor = Color3.FromHexString('#f7bc68').scale(.6);
            glow.material = gm;
            for (let x of [-.22, .22])
                for (let z of [-.19, .19])
                    this.box(root, 'lantern-pillar', v(x, 1.05, z), v(.06, .42, .06), gray);
            let roof = MeshBuilder.CreateCylinder('pagoda-roof', { diameterTop: .16, diameterBottom: .9, height: .25, tessellation: 4 }, this.scene);
            roof.parent = root;
            roof.position.y = 1.39;
            roof.rotation.y = Math.PI / 4;
            roof.material = this.material(gray);
            this.sphere(root, 'finial', v(0, 1.62, 0), v(.1, .15, .1), gray);
        }
        if (kind === 'pond') {
            this.sphere(root, 'pond-recess', v(0, .015, 0), v(1.48, .055, 1.2), '#687e78');
            let water = this.sphere(root, 'water', v(0, .07, 0), v(1.32, .025, 1.04), '#7fa9a0', 3);
            let wm = this.material('#7fa9a0');
            wm.specularColor = new Color3(.7, .8, .7);
            wm.specularPower = 100;
            water.material = wm;
            for (let i = 0; i < 16; i++) {
                let a = i * Math.PI / 8;
                this.sphere(root, 'pond-edge', v(Math.cos(a) * 1.35, .1, Math.sin(a) * 1.1), v(.23, .13, .2), i % 2 ? '#9aab96' : '#7c8b82', 1);
            }
            for (let i = 0; i < 3; i++) {
                this.sphere(root, 'lily-pad', v(-.6 + i * .42, .12, .4 + Math.sin(i) * .16), v(.18, .018, .15), '#6c9467', 2);
            }
            for (let i = 0; i < 2; i++) {
                let fish = this.sphere(root, 'koi-' + i, v(-.4 + i * .8, .1, -.2), v(.17, .022, .055), i ? '#f7e7c1' : '#d78e6a', 2);
                fish.rotation.y = i * .9;
            }
            for (let i = 0; i < 3; i++) {
                let ring = MeshBuilder.CreateTorus('pond-ripple', { diameter: .55 + i * .3, thickness: .008, tessellation: 48 }, this.scene);
                ring.parent = root;
                ring.position = v(.35, .115, -.3);
                ring.material = this.material('#c0d6bd');
            }
        }
        if (kind === 'bridge') {
            for (let i = 0; i < 11; i++) {
                let z = (i - 5) * .19, y = .15 + Math.sin(i / 10 * Math.PI) * .32;
                this.box(root, 'cedar-plank', v(0, y, z), v(1.05, .09, .17), i % 2 ? '#9e7959' : '#b08b64');
            }
            for (let x of [-.56, .56]) {
                let path = [];
                for (let i = 0; i < 11; i++)
                    path.push(v(x, .68 + Math.sin(i / 10 * Math.PI) * .32, (i - 5) * .19));
                this.tube(root, 'curved-handrail', path, .045, '#887052');
                for (let i = 0; i < 3; i++)
                    this.box(root, 'bridge-post', v(x, .42, (i - 1) * .9), v(.07, .7, .07), '#887052');
            }
        }
        for (let m of root.getChildMeshes()) {
            m.metadata = { itemId: id };
            m.isPickable = true;
            m.receiveShadows = true;
        }
        return root;
    }
}
