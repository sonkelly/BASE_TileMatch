import { _decorator, error, Texture2D, assetManager, Prefab, ImageAsset, SpriteFrame, sp, JsonAsset, TextAsset, cclegacy } from 'cc';
import { Singleton } from './Singleton';
import { CacheStatus, CacheInfo, ResourceType, BUNDLE_NAMES } from './AssetRes';
import { BundleMgr } from './BundleMgr';
import { CacheMgr } from './CacheMgr';

const { ccclass } = _decorator;

@ccclass('AssetMgr')
export class AssetMgr extends Singleton {

    static get Instance(): AssetMgr {
        return AssetMgr.getInstance();
    }

    public load(bundleName: string, url: string, type: any, onProgress: Function | null, callback: (cacheInfo : CacheInfo)=>void): void {
        const cacheInfo = CacheMgr.Instance.get(bundleName, url);
        
        if (cacheInfo) {
            if (cacheInfo.isLoaded) {
                if (cacheInfo.status === CacheStatus.WAITTING_FOR_RELEASE) {
                    cacheInfo.status = CacheStatus.Loaded;
                }
                callback(cacheInfo);
            } else {
                if (cacheInfo.status !== CacheStatus.WAITTING_FOR_RELEASE) {
                    cacheInfo.status = CacheStatus.Loading;
                }
                cacheInfo.handlers.push(callback);
            }
        } else {
            const newCacheInfo = new CacheInfo();
            newCacheInfo.setResInfo(url, type, bundleName);
            CacheMgr.Instance.set(bundleName, url, newCacheInfo);
            
            const bundle = BundleMgr.Instance.getBundle(bundleName);
            if (!bundle) {
                const err = new Error(`${bundleName} Not loaded, please load first`);
                this._onLoadComplete(newCacheInfo, callback, err, null);
                return;
            }
            
            const asset = bundle.get(url, type);
            if (asset) {
                this._onLoadComplete(newCacheInfo, callback, null, asset);
            } else if (onProgress) {
                bundle.load(url, type, onProgress, this._onLoadComplete.bind(this, newCacheInfo, callback));
            } else {
                bundle.load(url, type, this._onLoadComplete.bind(this, newCacheInfo, callback));
            }
        }
    }

    public loadAsync(bundleName: string, url: string, type: any): Promise<CacheInfo> {
        return new Promise((resolve, reject) => {
            const cacheInfo = CacheMgr.Instance.get(bundleName, url);
            
            if (cacheInfo) {
                if (cacheInfo.isLoaded) {
                    if (cacheInfo.status === CacheStatus.WAITTING_FOR_RELEASE) {
                        cacheInfo.status = CacheStatus.Loaded;
                    }
                    resolve(cacheInfo);
                } else {
                    if (cacheInfo.status !== CacheStatus.WAITTING_FOR_RELEASE) {
                        cacheInfo.status = CacheStatus.Loading;
                    }
                    cacheInfo.handlers.push(resolve);
                }
            } else {
                const newCacheInfo = new CacheInfo();
                newCacheInfo.setResInfo(url, type, bundleName);
                CacheMgr.Instance.set(bundleName, url, newCacheInfo);
                
                const bundle = BundleMgr.Instance.getBundle(bundleName);
                if (!bundle) {
                    const err = new Error(`${bundleName} Not loaded, please load first`);
                    this._onLoadComplete(newCacheInfo, resolve, err, null);
                    return;
                }
                
                const asset = bundle.get(url, type);
                if (asset) {
                    this._onLoadComplete(newCacheInfo, resolve, null, asset);
                } else {
                    bundle.load(url, type, this._onLoadComplete.bind(this, newCacheInfo, resolve));
                }
            }
        });
    }

    public loadDir(bundleName: string, url: string, type: any, onProgress: Function | null, callback: (cacheInfo : CacheInfo)=>void | null): void {
        const cacheInfo = CacheMgr.Instance.get(bundleName, url);
        
        if (cacheInfo) {
            if (cacheInfo.isLoaded) {
                if (cacheInfo.status === CacheStatus.WAITTING_FOR_RELEASE) {
                    cacheInfo.status = CacheStatus.Loaded;
                }
                callback && callback(cacheInfo);
            } else {
                if (cacheInfo.status !== CacheStatus.WAITTING_FOR_RELEASE) {
                    cacheInfo.status = CacheStatus.Loading;
                }
                callback && cacheInfo.handlers.push(callback);
            }
        } else {
            const newCacheInfo = new CacheInfo();
            newCacheInfo.setResInfo(url, type, bundleName);
            CacheMgr.Instance.set(bundleName, url, newCacheInfo);
            
            const bundle = BundleMgr.Instance.getBundle(bundleName);
            if (!bundle) {
                const err = new Error(`loadDir ${bundleName} Not loaded, please load first`);
                this._onLoadComplete(newCacheInfo, callback, err, null);
                return;
            }
            
            const asset = bundle.get(url, type);
            if (asset) {
                this._onLoadComplete(newCacheInfo, callback, null, asset);
            } else if (onProgress) {
                bundle.loadDir(url, type, onProgress, this._onLoadComplete.bind(this, newCacheInfo, callback));
            } else {
                bundle.loadDir(url, type, this._onLoadComplete.bind(this, newCacheInfo, callback));
            }
        }
    }

    private _onLoadComplete(cacheInfo: CacheInfo, callback: (cacheInfo : CacheInfo) =>void | null, err: Error | null, asset: any): void {
        if (err) {
            error(`Failed to load resource: ${cacheInfo.resInfo.url} reason: ${err.message ? err.message : 'unknow'}`);
            cacheInfo.assets = null;
            CacheMgr.Instance.remove(cacheInfo.resInfo.bundle, cacheInfo.resInfo.url);
            callback && callback(cacheInfo);
        } else {
            cacheInfo.assets = asset;
            callback && callback(cacheInfo);
        }
        
        cacheInfo.doHanlder();
        
        if (cacheInfo.status === CacheStatus.WAITTING_FOR_RELEASE) {
            cacheInfo.status = CacheStatus.NONE;
            if (cacheInfo.assets) {
                this.releaseCache(cacheInfo);
            }
        } else {
            cacheInfo.status = CacheStatus.Loaded;
            cacheInfo.isLoaded = true;
        }
    }

    public async loadRemoteImage(url: string, useCache: boolean = true): Promise<SpriteFrame | null> {
        if (!url || url.length <= 0) {
            return null;
        }
        
        if (useCache) {
            const cachedSpriteFrame = CacheMgr.Instance.remoteCachs.getSpriteFrame(url);
            if (cachedSpriteFrame && cachedSpriteFrame.assets) {
                return cachedSpriteFrame.assets;
            }
            CacheMgr.Instance.remoteCachs.remove(url);
        }
        
        const texture = await this._loadRemoteRes(url, Texture2D);
        const cacheInfo = CacheMgr.Instance.remoteCachs.get(url);
        
        if (texture && cacheInfo) {
            return CacheMgr.Instance.remoteCachs.setSpriteFrame(url, texture);
        } else {
            return null;
        }
    }

    private _loadRemoteRes(url: string, type: any): Promise<any> {
        return new Promise((resolve) => {
            const cacheInfo = CacheMgr.Instance.remoteCachs.get(url);
            
            if (cacheInfo) {
                if (cacheInfo.isLoaded) {
                    resolve(cacheInfo.assets);
                } else {
                    cacheInfo.handlers.push(resolve);
                }
            } else {
                const newCacheInfo = new CacheInfo();
                newCacheInfo.resInfo.resourceType = ResourceType.Remote;
                newCacheInfo.resInfo.type = type;
                CacheMgr.Instance.remoteCachs.set(url, newCacheInfo);
                
                newCacheInfo.status = CacheStatus.Loading;
                
                assetManager.loadRemote(url, (err, asset) => {
                    if (asset) {
                        asset.addRef();
                        newCacheInfo.isLoaded = true;
                        newCacheInfo.status = CacheStatus.Loaded;
                        newCacheInfo.assets = asset;
                    }
                    
                    newCacheInfo.doHanlder();
                    resolve(newCacheInfo.assets);
                });
            }
        });
    }

    public loadPrefabAsync(bundleName: string, url: string, onProgress?: Function): Promise<Prefab> {
        return new Promise((resolve, reject) => {
            this.load(bundleName, url, Prefab, onProgress, (cacheInfo: CacheInfo) => {
                if (cacheInfo && cacheInfo.assets && cacheInfo.assets instanceof Prefab) {
                    resolve(cacheInfo.assets);
                } else {
                    reject(`加载prefab: ${url} 失败`);
                }
            });
        });
    }

    public loadAssetAsync(bundleName: string, url: string, type: any, onProgress?: Function): Promise<any> {
        return new Promise((resolve, reject) => {
            this.load(bundleName, url, type, onProgress, (cacheInfo: CacheInfo) => {
                if (cacheInfo && cacheInfo.assets && cacheInfo.assets instanceof type) {
                    resolve(cacheInfo.assets);
                } else {
                    reject(`Failed to load resource: ${url} fail`);
                }
            });
        });
    }

    public getDirAssetAsync(bundleName: string, url: string, type: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const cacheKey = `${url}/_dir_${type}`;
            const cacheInfo = CacheMgr.Instance.get(bundleName, cacheKey);
            
            if (cacheInfo) {
                resolve(cacheInfo.assets);
            } else {
                this.loadDir(bundleName, url, type, null, (dirCacheInfo: CacheInfo) => {
                    if (dirCacheInfo && dirCacheInfo.assets) {
                        AssetMgr.Instance.retainAsset(url, bundleName);
                        
                        if (Array.isArray(dirCacheInfo.assets)) {
                            dirCacheInfo.assets.forEach((asset: any) => {
                                const assetCacheKey = `${url}/_dir_${asset.name}`;
                                const assetCacheInfo = CacheMgr.Instance.get(bundleName, assetCacheKey);
                                
                                if (assetCacheInfo) {
                                    assetCacheInfo.assets = asset;
                                    if (assetCacheInfo.status === CacheStatus.WAITTING_FOR_RELEASE) {
                                        assetCacheInfo.status = CacheStatus.NONE;
                                        if (assetCacheInfo.assets) {
                                            AssetMgr.Instance.releaseCache(assetCacheInfo);
                                        }
                                    } else {
                                        assetCacheInfo.status = CacheStatus.Loaded;
                                        assetCacheInfo.isLoaded = true;
                                    }
                                } else {
                                    const newCacheInfo = new CacheInfo();
                                    newCacheInfo.assets = asset;
                                    newCacheInfo.isLoaded = true;
                                    newCacheInfo.setResInfo(cacheKey, type, bundleName);
                                    CacheMgr.Instance.set(bundleName, cacheKey, newCacheInfo);
                                }
                            });
                            
                            const finalCacheInfo = CacheMgr.Instance.get(bundleName, cacheKey);
                            if (!finalCacheInfo?.assets) {
                                error(`can't find asset: ${cacheKey}`);
                            }
                            resolve(finalCacheInfo?.assets);
                        } else {
                            resolve(dirCacheInfo.assets);
                        }
                    } else {
                        reject(`加载prefab: ${url} 失败`);
                    }
                });
            }
        });
    }

    public async loadRemoteTexture(url: string, useCache: boolean = true): Promise<SpriteFrame | null> {
        if (!url || url.length <= 0) {
            return null;
        }
        
        if (useCache) {
            const cachedSpriteFrame = CacheMgr.Instance.remoteCachs.getSpriteFrame(url);
            if (cachedSpriteFrame && cachedSpriteFrame.assets) {
                return cachedSpriteFrame.assets;
            }
            CacheMgr.Instance.remoteCachs.remove(url);
        }
        
        const texture = await this._downloadRemoteTexture(url);
        const cacheInfo = CacheMgr.Instance.remoteCachs.get(url);
        
        if (texture && cacheInfo) {
            return CacheMgr.Instance.remoteCachs.setSpriteFrame(url, texture);
        } else {
            return null;
        }
    }

    private _downloadRemoteTexture(url: string): Promise<Texture2D> {
        return new Promise((resolve) => {
            const cacheInfo = CacheMgr.Instance.remoteCachs.get(url);
            
            if (cacheInfo) {
                if (cacheInfo.isLoaded) {
                    resolve(cacheInfo.assets);
                } else {
                    cacheInfo.handlers.push(resolve);
                }
            } else {
                const newCacheInfo = new CacheInfo();
                newCacheInfo.resInfo.resourceType = ResourceType.Remote;
                newCacheInfo.resInfo.type = Texture2D;
                CacheMgr.Instance.remoteCachs.set(url, newCacheInfo);
                
                newCacheInfo.status = CacheStatus.Loading;
                
                assetManager.downloader.downloadDomImage(url, { ext: '.jpg' }, (err, image) => {
                    if (!err) {
                        const imageAsset = new ImageAsset(image);
                        imageAsset.addRef();
                        
                        const texture = new Texture2D();
                        texture.image = imageAsset;
                        texture.addRef();
                        
                        newCacheInfo.isLoaded = true;
                        newCacheInfo.status = CacheStatus.Loaded;
                        newCacheInfo.assets = texture;
                    }
                    
                    newCacheInfo.doHanlder();
                    resolve(newCacheInfo.assets);
                });
            }
        });
    }

    public loadSpriteFrame(bundleName: string, url: string, onProgress?: Function): Promise<SpriteFrame> {
        const spriteFrameUrl = `${url}/spriteFrame`;
        return new Promise((resolve, reject) => {
            this.load(bundleName, spriteFrameUrl, SpriteFrame, onProgress, (cacheInfo: CacheInfo) => {
                if (cacheInfo && cacheInfo.assets && cacheInfo.assets instanceof SpriteFrame) {
                    resolve(cacheInfo.assets);
                } else {
                    reject(`加载spriteframe: ${spriteFrameUrl} 失败`);
                }
            });
        });
    }

    public getSpriteFrame(bundleName: string, url: string): SpriteFrame | null {
        const spriteFrameUrl = `${url}/spriteFrame`;
        const cacheInfo = CacheMgr.Instance.get(bundleName, spriteFrameUrl);
        
        if (cacheInfo && cacheInfo.isLoaded) {
            return cacheInfo.assets;
        } else {
            error(`Can't find spriteFrame. bundle: ${bundleName} url:${spriteFrameUrl}`);
            return null;
        }
    }

    public getJsonAsset(bundleName: string, url: string): JsonAsset | null {
        const cacheInfo = CacheMgr.Instance.get(bundleName, url);
        
        if (cacheInfo && cacheInfo.isLoaded) {
            return cacheInfo.assets;
        } else {
            error(`Can't find JsonAsset. bundle: ${bundleName} url:${url}`);
            return null;
        }
    }

    public async loadSkeleton(bundleName: string, url: string): Promise<sp.SkeletonData> {
        const cacheInfo = await this.loadAsync(bundleName, url, sp.SkeletonData);
        
        if (cacheInfo && cacheInfo.assets && cacheInfo.assets instanceof sp.SkeletonData) {
            return cacheInfo.assets;
        } else {
            throw new Error(`加载动画data: ${url} 失败`);
        }
    }

    public getSkeleton(bundleName: string, url: string): sp.SkeletonData | null {
        const cacheInfo = CacheMgr.Instance.get(bundleName, url);
        return cacheInfo && cacheInfo.isLoaded ? cacheInfo.assets : null;
    }

    public async loadRemoteSkeleton(baseUrl: string, skeletonName: string): Promise<sp.SkeletonData | null> {
        if (!baseUrl || !skeletonName) {
            return null;
        }
        
        const cacheKey = `${baseUrl}/${skeletonName}`;
        const textureUrl = `${baseUrl}/${skeletonName}.png`;
        const atlasUrl = `${baseUrl}/${skeletonName}.atlas`;
        const jsonUrl = `${baseUrl}/${skeletonName}.json`;
        
        let cacheInfo = CacheMgr.Instance.remoteCachs.get(cacheKey);
        
        if (cacheInfo) {
            if (cacheInfo.isLoaded) {
                if (cacheInfo.status === CacheStatus.WAITTING_FOR_RELEASE) {
                    cacheInfo.status = CacheStatus.Loaded;
                }
                return cacheInfo.assets;
            } else {
                if (cacheInfo.status !== CacheStatus.WAITTING_FOR_RELEASE) {
                    cacheInfo.status = CacheStatus.Loading;
                }
                return new Promise((resolve) => {
                    cacheInfo.handlers.push((asset: any) => {
                        resolve(asset);
                    });
                });
            }
        } else {
            cacheInfo = new CacheInfo();
            cacheInfo.setResInfo(cacheKey, sp.SkeletonData);
            CacheMgr.Instance.remoteCachs.set(cacheKey, cacheInfo);
        }
        
        // Load texture
        const texture = await this._loadRemoteRes(textureUrl, Texture2D);
        if (!texture || !(texture instanceof Texture2D)) {
            throw new Error(`加载贴图: ${textureUrl} 失败`);
        }
        
        // Load JSON data
        const jsonData = await this._loadRemoteRes(jsonUrl, JsonAsset);
        if (!jsonData || !(jsonData instanceof JsonAsset)) {
            throw new Error(`加载动画data: ${jsonUrl} 失败`);
        }
        
        // Load atlas data
        const atlasData = await this._loadRemoteRes(atlasUrl, TextAsset);
        if (!atlasData || !(atlasData instanceof TextAsset)) {
            throw new Error(`加载动画data: ${atlasUrl} 失败`);
        }
        
        // Create skeleton data
        const skeletonData = new sp.SkeletonData();
        skeletonData.skeletonJson = jsonData.json;
        skeletonData.atlasText = atlasData.text;
        skeletonData.textures = [texture];
        skeletonData.name = cacheKey;
        
        cacheInfo.assets = skeletonData;
        cacheInfo.isLoaded = true;
        cacheInfo.doHanlder();
        
        return skeletonData;
    }

    public releaseBundleAllRes(bundleName: string): void {
        BundleMgr.Instance.removeBundle(bundleName);
    }

    public releaseBundleRes(bundleName: string, url: string): void {
        const cacheInfo = CacheMgr.Instance.get(bundleName, url);
        this.releaseCache(cacheInfo);
    }

    public releaseAsset(cacheInfo: CacheInfo): void {
        const bundle = BundleMgr.Instance.getBundle(cacheInfo.resInfo.bundle);
        if (bundle) {
            if (Array.isArray(cacheInfo.assets)) {
                for (let i = 0; i < cacheInfo.assets.length; i++) {
                    const asset = cacheInfo.assets[i];
                    const assetUrl = `${cacheInfo.resInfo.url}/${asset.name}`;
                    bundle.release(assetUrl, cacheInfo.resInfo.type);
                }
            } else {
                bundle.release(cacheInfo.resInfo.url, cacheInfo.resInfo.type);
            }
        }
    }

    public releaseCache(cacheInfo: CacheInfo | null): void {
        if (!cacheInfo || !cacheInfo.resInfo.bundle) {
            return;
        }
        
        if (cacheInfo.isInValid) {
            return;
        }
        
        if (cacheInfo.isLoaded) {
            if (cacheInfo.retain) {
                return;
            }
            
            if (CacheMgr.Instance.removeWithResInfo(cacheInfo)) {
                this.releaseAsset(cacheInfo);
            } else {
                // Handle array assets reference counting
                if (Array.isArray(cacheInfo.assets)) {
                    for (let i = 0; i < cacheInfo.assets.length; i++) {
                        // Check refCount if needed
                        const refCount = (cacheInfo.assets[i] as any).refCount;
                        // Additional ref counting logic if needed
                    }
                }
            }
        } else {
            cacheInfo.status = CacheStatus.WAITTING_FOR_RELEASE;
        }
    }

    public retainAsset(url: string, bundleName: string): void {
        const cacheInfo = CacheMgr.Instance.get(bundleName, url);
        
        if (cacheInfo) {
            if (Array.isArray(cacheInfo.assets)) {
                for (let i = 0; i < cacheInfo.assets.length; i++) {
                    const asset = cacheInfo.assets[i];
                    asset && asset.addRef();
                }
            } else {
                cacheInfo.assets.addRef();
            }
        } else {
            error('retainAsset cache is null');
        }
    }

    public addPersistAsset(url: string, bundleName: string): void {
        const cacheInfo = CacheMgr.Instance.get(bundleName, url);
        
        if (cacheInfo) {
            cacheInfo.retain = true;
            
            if (Array.isArray(cacheInfo.assets)) {
                for (let i = 0; i < cacheInfo.assets.length; i++) {
                    const asset = cacheInfo.assets[i];
                    asset && asset.addRef();
                }
            } else {
                cacheInfo.assets.addRef();
            }
        } else {
            error('addPersistAsset cache is null');
        }
    }
}