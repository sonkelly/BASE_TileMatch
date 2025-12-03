import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { IMAGE_ICON_PATH } from './Prefabs';

const { ccclass, property } = _decorator;

@ccclass('AssetsCfg')
export class AssetsCfg extends ICfgParse {
    private static _instance: AssetsCfg;

    constructor() {
        super();
        this.jsonFileName = 'assets';
    }

    public static get Instance(): AssetsCfg {
        if (!AssetsCfg._instance) {
            AssetsCfg._instance = new AssetsCfg().load();
        }
        return AssetsCfg._instance;
    }

    public loaded(): void {}

    public get(key: string): any {
        return this.cfg[key];
    }

    public getIconSpriteframe(key: string): any {
        return AssetMgr.Instance.getSpriteFrame(
            BUNDLE_NAMES.Game, 
            IMAGE_ICON_PATH + '/' + this.get(key).icon
        );
    }
}