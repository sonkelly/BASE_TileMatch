import { _decorator, TextAsset, cclegacy } from 'cc';
import { MgrBase } from './MgrBase';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES, CacheInfo } from './AssetRes';
import XXTEA from './xxtea';

const { ccclass, property } = _decorator;

@ccclass('MgrCfg')
export class MgrCfg extends MgrBase {
    private static _instance: MgrCfg;
    private _cfg: any = null;

    public static get Instance(): MgrCfg {
        return this._instance;
    }

    constructor(...args: any[]) {
        super(...args);
        MgrCfg._instance = this;
    }

    public load(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            AssetMgr.Instance.load(BUNDLE_NAMES.Game, 'Cfgs/config', TextAsset, null, (asset: CacheInfo) => {
                const text = asset.assets.text;
                const decryptedText = XXTEA.decryptFromBase64(text, 'fu03f6ck-bfbd-4d');
                this._cfg = JSON.parse(decryptedText);
                resolve();
            });
        });
    }

    public initLoadData(): void {
        // Implementation for initLoadData
    }

    public getConfig(key: string): any {
        const config = this._cfg[key];
        delete this._cfg[key];
        return config;
    }
}