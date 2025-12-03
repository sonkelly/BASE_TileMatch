import { _decorator, Component, Node, Vec3, instantiate, NodePool, warn, error, cclegacy } from 'cc';
import { Singleton } from './Singleton';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import {isNil} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('AssetPool')
export class AssetPool extends Singleton {
    private pools: Map<string, NodePool> = new Map();
    private prefabs: Map<string, Node> = new Map();
    private _v3Pool: Vec3[] = [];

    getV3(): Vec3 {
        return this._v3Pool.length > 0 ? this._v3Pool.pop()! : new Vec3();
    }

    putV3(v3: Vec3): void {
        this._v3Pool.push(v3);
    }

    addPrefab(prefab: Node, key: string, count?: number): void {
        prefab.addRef();
        if (!this.pools.has(key)) {
            this.createPool(key, count);
        }
        this.getPool(key)!.put(instantiate(prefab));
        this.prefabs.set(key, prefab);
    }

    getPrefab(key: string): Node | undefined {
        return this.prefabs.get(key);
    }

    removePrefab(key: string): void {
        const prefab = this.prefabs.get(key);
        if (prefab) {
            prefab.decRef(true);
        }
        this.prefabs.delete(key);
        
        const pool = this.pools.get(key);
        if (pool) {
            pool.clear();
        }
        this.pools.delete(key);
    }

    clearPrefabs(): void {
        this.prefabs.forEach((prefab, key) => {
            prefab.decRef(true);
            const pool = this.pools.get(key);
            if (pool) {
                pool.clear();
            }
            this.pools.delete(key);
        });
        this.prefabs.clear();
    }

    createPool(key: string, count?: number): NodePool {
        const pool = new NodePool(count);
        this.pools.set(key, pool);
        return pool;
    }

    removePool(key: string): void {
        if (this.pools.has(key)) {
            const pool = this.getPool(key);
            if (pool) {
                pool.clear();
            }
            this.pools.delete(key);
        }
    }

    clearPool(key?: string): void {
        if (isNil(key)) {
            this.pools.forEach((pool, poolKey) => {
                pool.clear();
                AssetMgr.Instance.releaseBundleRes(BUNDLE_NAMES.Game, poolKey);
            });
        } else {
            const pool = this.getPool(key);
            pool && pool.clear();
        }
    }

    getPool(key: string, count?: number): NodePool {
        let pool = this.pools.get(key);
        if (!pool) {
            pool = this.createPool(key, count);
        }
        return pool;
    }

    createObjWithPrefab(prefab: Node, key: string): Node {
        const obj = instantiate(prefab);
        (obj as any).__pool__ = key;
        return obj;
    }

    createObject(key: string): Node | null {
        const obj = this.get(key);
        if (obj) {
            return obj;
        }
        const prefab = this.getPrefab(key);
        if (prefab) {
            warn('createObject pool is empty, createObjWithPrefab', key);
            return this.createObjWithPrefab(prefab, key);
        } else {
            warn('Can\'t createObject prefab is null', key);
            return null;
        }
    }

    async createObjAsync(bundle: string, key: string, count?: number): Promise<Node | null> {
        let obj = this.get(key);
        if (obj) {
            return obj;
        }
        let prefab = this.getPrefab(key);
        if (!prefab) {
            prefab = await AssetMgr.Instance.loadPrefabAsync(bundle, key);
            this.addPrefab(prefab!, key, count);
        }
        return this.createObjWithPrefab(prefab!, key);
    }

    clearAll(): void {
        this.clearPool();
        this.clearPrefabs();
    }

    get(key: string, parent?: Node, count?: number): Node | null {
        const pool = this.getPool(key, count);
        let obj: Node | null = null;
        if (pool.size() > 0) {
            obj = pool.get(parent);
            (obj as any).__pool__ = key;
        }
        return obj;
    }

    put(node: Node | Component, key?: string): void {
        if (node instanceof Component) {
            node = node.node;
        }
        key = key || (node as any).__pool__;
        if (key) {
            this.getPool(key)!.put(node);
        } else {
            error('[AssetPool.put] node' + node + ', key is nil!');
        }
    }

    static get Instance(): AssetPool {
        return AssetPool.getInstance();
    }
}