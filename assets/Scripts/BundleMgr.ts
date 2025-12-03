import { _decorator, cclegacy, AssetManager, assetManager, error } from 'cc';
import { CacheMgr } from './CacheMgr';

const { ccclass } = _decorator;

@ccclass('BundleMgr')
export class BundleMgr {
    private static _instance: BundleMgr;

    public static get Instance(): BundleMgr {
        if (!BundleMgr._instance) {
            BundleMgr._instance = new BundleMgr();
        }
        return BundleMgr._instance;
    }

    public isEngine(bundleName: string): boolean {
        return bundleName === AssetManager.BuiltinBundleName.INTERNAL ||
               bundleName === AssetManager.BuiltinBundleName.MAIN ||
               bundleName === AssetManager.BuiltinBundleName.RESOURCES ||
               bundleName === AssetManager.BuiltinBundleName.START_SCENE;
    }

    public removeLoadedBundle(excludeBundles: string[] = []): void {
        const bundleNames: string[] = [];
        
        assetManager.bundles.forEach((bundle, name) => {
            if (!this.isEngine(name)) {
                bundleNames.push(name);
            }
        });

        for (let i = bundleNames.length - 1; i >= 0; i--) {
            const bundleName = bundleNames[i];
            if (excludeBundles.indexOf(bundleName) === -1) {
                const bundle = this.getBundle(bundleName);
                if (bundle) {
                    this.removeBundle(bundle);
                    assetManager.removeBundle(bundle);
                }
            }
        }
    }

    public removeBundle(bundle: AssetManager.Bundle): void {
        CacheMgr.Instance.removeBundle(bundle);
        const existingBundle = this.getBundle(bundle);
        if (existingBundle) {
            existingBundle.releaseAll();
        }
    }

    public loadBundle(bundleName: string, callback?: (bundle: AssetManager.Bundle) => void): void {
        const bundle = this.getBundle(bundleName);
        if (bundle) {
            callback?.(bundle);
        } else {
            assetManager.loadBundle(bundleName, {
                onFileProgress: () => {}
            }, (err, loadedBundle) => {
                callback?.(loadedBundle);
            });
        }
    }

    public async loadBundleAsync(bundleName: string): Promise<AssetManager.Bundle> {
        const bundle = this.getBundle(bundleName);
        if (bundle) {
            return bundle;
        }
        
        return new Promise((resolve) => {
            assetManager.loadBundle(bundleName, (err, loadedBundle) => {
                resolve(loadedBundle);
            });
        });
    }

    public getBundle(bundle: string | AssetManager.Bundle): AssetManager.Bundle | null {
        if (!bundle) return null;
        
        if (typeof bundle === 'string') {
            return assetManager.getBundle(bundle);
        }
        return bundle;
    }

    public getBundleName(bundle: string | AssetManager.Bundle): string {
        if (!bundle) {
            error('参数错误:' + bundle);
            return '';
        }
        
        if (typeof bundle === 'string') {
            return bundle;
        }
        return bundle.name;
    }
}