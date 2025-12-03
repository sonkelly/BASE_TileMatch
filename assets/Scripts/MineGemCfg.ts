import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { MINE_GEM_PATH } from './Prefabs';
import { MgrMine } from './MgrMine';

const { ccclass, property } = _decorator;

@ccclass('MineGemCfg')
export class MineGemCfg extends ICfgParse {
    private static _instance: MineGemCfg | null = null;

    constructor() {
        super();
        this.jsonFileName = 'mineGem';
    }

    public static get Instance(): MineGemCfg {
        if (!this._instance) {
            this._instance = new MineGemCfg().load();
        }
        return this._instance;
    }

    public get(gemId: number): any {
        return this.cfg[gemId];
    }

    public loadGemSpriteframe(gemId: number): Promise<any> | null {
        const config = this.get(gemId);
        if (config) {
            return AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, `${MINE_GEM_PATH}/${config.icon}`);
        }
        console.error('no cfg by gemId:', gemId);
        return null;
    }

    public loadGemBgSpriteframe(gemId: number, stage: number): Promise<any> | null {
        const config = this.get(gemId);
        if (!config) {
            console.error('no cfg by gemId:', gemId);
            return null;
        }
        const suffix = MgrMine.Instance.getStageGemBgSuffixByStage(stage);
        return AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, `${MINE_GEM_PATH}/${config.icon}_bg${suffix}`);
    }
}