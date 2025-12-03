import { _decorator, error, SpriteFrame, isValid, Texture2D, Asset, assetManager } from 'cc';
import { CacheInfo } from './AssetRes';
import { AssetMgr } from './AssetMgr';
import { BundleMgr } from './BundleMgr';

const { ccclass, property } = _decorator;

class BundleCache {
    private _caches: Map<string, CacheInfo> = new Map();
    public name: string = 'UNKNOWN';

    constructor(name: string) {
        this.name = name;
    }

    public get(key: string, checkValid: boolean = true): CacheInfo | null {
        if (this._caches.has(key)) {
            const cache = this._caches.get(key);
            return checkValid && cache && cache.isInValid ? (this.remove(key), null) : cache;
        }
        return null;
    }

    public set(key: string, value: CacheInfo): void {
        this._caches.set(key, value);
    }

    public remove(key: string): boolean {
        return this._caches.delete(key);
    }

    public removeUnuseCaches(): void {
        this._caches.forEach((cache, key) => {
            if (Array.isArray(cache.assets)) {
                let inUse = false;
                for (let i = 0; i < cache.assets.length; i++) {
                    if (cache.assets[i] && cache.assets[i].refCount > 0) {
                        inUse = true;
                        break;
                    }
                }
                !inUse && this._caches.delete(key);
            } else {
                cache.assets && cache.assets.refCount <= 0 && this._caches.delete(key);
            }
        });
    }

    public print(): void {
        this._caches.forEach((cache, key) => {
            // Print implementation
        });
    }

    get size(): number {
        return this._caches.size;
    }
}

class RemoteCache {
    private _caches: Map<string, CacheInfo> = new Map();
    private _spriteFrameCaches: Map<string, CacheInfo> = new Map();
    private _resMap: Map<string, CacheInfo> = new Map();

    public get(key: string): CacheInfo | null {
        return this._caches.has(key) ? this._caches.get(key) : null;
    }

    public getSpriteFrame(key: string): CacheInfo | null {
        if (this._spriteFrameCaches.has(key)) {
            const cache = this._spriteFrameCaches.get(key);
            return this.get(key) ? cache : (this.remove(key), null);
        }
        return null;
    }

    public setSpriteFrame(key: string, texture: Texture2D): SpriteFrame | null {
        if (texture && texture instanceof Texture2D) {
            let cache = this.getSpriteFrame(key);
            if (cache) return cache.assets as SpriteFrame;

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            
            cache = new CacheInfo();
            cache.assets = spriteFrame;
            cache.isLoaded = true;
            cache.setResInfo(key, SpriteFrame);
            
            return spriteFrame;
        }
        return null;
    }

    public set(key: string, cacheInfo: CacheInfo): void {
        cacheInfo.resInfo.url = key;
        this._caches.set(key, cacheInfo);
    }

    public getCacheInfo(key: string): CacheInfo {
        if (!this._resMap.has(key)) {
            const cache = new CacheInfo();
            cache.setResInfo(key);
            this._resMap.set(key, cache);
        }
        return this._resMap.get(key)!;
    }

    public retainAsset(key: string): void {
        const cache = this.getCacheInfo(key);
        if (cache && cache.assets) {
            cache.retain = true;
            cache.assets.addRef();
        }
    }

    public releaseAsset(key: string): void {
        const cache = this._caches.has(key) ? this._caches.get(key) : null;
        if (cache && cache.assets) {
            if (cache.retain) return;
            
            const asset = cache.assets;
            asset.decRef(true);
            asset.refCount <= 0 && this.remove(cache.resInfo.url);
        }
    }

    public remove(key: string): boolean {
        this._resMap.delete(key);
        
        if (this._spriteFrameCaches.has(key)) {
            this._spriteFrameCaches.get(key)!.assets!.decRef(true);
            this._spriteFrameCaches.delete(key);
        }

        const cache = this._caches.has(key) ? this._caches.get(key) : null;
        if (cache && cache.assets instanceof Asset) {
            cache.assets.decRef(true);
            assetManager.releaseAsset(cache.assets);
        }
        
        return this._caches.delete(key);
    }

    public print(): void {
        this._spriteFrameCaches.forEach((cache, key) => {});
        this._caches.forEach((cache, key) => {});
        this._resMap.forEach((cache, key) => {});
    }
}

@ccclass('CacheMgr')
export class CacheMgr {
    private _bundles: Map<string, BundleCache> = new Map();
    private _remoteCaches: RemoteCache = new RemoteCache();
    private static _instance: CacheMgr | null = null;

    public get(bundle: string, key: string, checkValid: boolean = true): CacheInfo | null {
        const bundleName = BundleMgr.Instance.getBundleName(bundle);
        return bundleName && this._bundles.has(bundleName) ? 
            this._bundles.get(bundleName)!.get(key, checkValid) : null;
    }

    public set(bundle: string, key: string, cacheInfo: CacheInfo): void {
        const bundleName = BundleMgr.Instance.getBundleName(bundle);
        if (bundleName) {
            if (this._bundles.has(bundleName)) {
                this._bundles.get(bundleName)!.set(key, cacheInfo);
            } else {
                const bundleCache = new BundleCache(bundleName);
                bundleCache.set(key, cacheInfo);
                this._bundles.set(bundleName, bundleCache);
            }
        }
    }

    public remove(bundle: string, key: string): boolean {
        const bundleName = BundleMgr.Instance.getBundleName(bundle);
        return !!(bundleName && this._bundles.has(bundleName) && 
            this._bundles.get(bundleName)!.remove(key));
    }

    public removeWithResInfo(cacheInfo: CacheInfo): boolean {
        if (!cacheInfo || !cacheInfo.assets) return true;

        if (Array.isArray(cacheInfo.assets)) {
            let canRemove = true;
            for (let i = 0; i < cacheInfo.assets.length; i++) {
                cacheInfo.assets[i].decRef(true);
                if (cacheInfo.assets[i].refCount > 0) {
                    canRemove = false;
                    break;
                }
            }
            if (canRemove) {
                this.remove(cacheInfo.resInfo.bundle, cacheInfo.resInfo.url);
                return true;
            }
        } else {
            cacheInfo.assets.decRef(true);
            if (cacheInfo.assets.refCount === 0) {
                this.remove(cacheInfo.resInfo.bundle, cacheInfo.resInfo.url);
                return true;
            }
        }
        return false;
    }

    public removeBundle(bundle: string): void {
        const bundleName = BundleMgr.Instance.getBundleName(bundle);
        bundleName && this._bundles.has(bundleName) && this._bundles.delete(bundleName);
    }

    private _removeUnuseCaches(): void {
        this._bundles.forEach((bundleCache, bundleName) => {
            bundleCache && bundleCache.removeUnuseCaches();
        });
    }

    public getCacheAsset(key: string, assetType: typeof Asset, bundle: string): Promise<Asset | null> {
        return new Promise((resolve) => {
            const cache = this.get(bundle, key);
            cache?.isLoaded ? 
                (cache.assets instanceof assetType ? resolve(cache.assets) : resolve(null)) : 
                cache?.handlers.push(resolve);
        });
    }

    public async getCacheAssetByAsync(key: string, assetType: typeof Asset, bundle: string): Promise<Asset | null> {
        const cachedAsset = await this.getCacheAsset(key, assetType, bundle);
        if (cachedAsset && cachedAsset instanceof assetType) {
            return cachedAsset;
        }
        
        return new Promise((resolve) => {
            AssetMgr.Instance.load(bundle, key, assetType, null, (cacheInfo) => {
                cacheInfo?.assets && cacheInfo.assets instanceof assetType ? 
                    resolve(cacheInfo.assets) : 
                    (error(`加载${key}失败`), resolve(null));
            });
        });
    }

    public async getSpriteFrameByAsync(key: string, bundle: string): Promise<{url: string, spriteFrame: SpriteFrame | null, isTryReload?: boolean}> {
        const spriteFrame = await this.getCacheAssetByAsync(key, SpriteFrame, bundle);
        if (spriteFrame) {
            if (isValid(spriteFrame)) {
                return { url: key, spriteFrame: spriteFrame as SpriteFrame };
            } else {
                const cacheInfo = new CacheInfo();
                cacheInfo.setResInfo(key, SpriteFrame, bundle);
                cacheInfo.assets = spriteFrame;
                AssetMgr.Instance.releaseCache(cacheInfo);
                return { url: key, spriteFrame: null, isTryReload: true };
            }
        }
        return { url: key, spriteFrame: null };
    }

    public print(): void {
        this._bundles.forEach((bundleCache, bundleName) => {
            bundleCache.print();
        });
        this.remoteCachs.print();
    }

    get remoteCachs(): RemoteCache {
        return this._remoteCaches;
    }

    static get Instance(): CacheMgr {
        return this._instance || (this._instance = new CacheMgr());
    }
}