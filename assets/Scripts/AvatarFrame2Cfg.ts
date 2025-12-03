import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { IMAGE_HEAD_FRAME2_PATH } from './Prefabs';
import { Utils } from './Utils';
import {each} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('AvatarFrame2Cfg')
export class AvatarFrame2Cfg extends ICfgParse {
    private static _instance: AvatarFrame2Cfg;
    private _sortCfg: any[] = [];

    constructor() {
        super();
        this.jsonFileName = 'avatarFrame2';
    }

    public loaded(): void {
        each(this._cfg, (config: any) => {
            this._sortCfg.push(config);
        });
        this._sortCfg.sort((a, b) => a.avatarLevel - b.avatarLevel);
    }

    public get(id: number): any {
        return this.cfg[id];
    }

    public getAvatarFrameSpriteframe(frameId: number): any {
        const config = this.get(frameId);
        return config ? AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, `${IMAGE_HEAD_FRAME2_PATH}/avatarFrame${config.photo}`) : 
            (console.error('no cfg by frameId:', frameId), null);
    }

    public getRandomAvatarFrameId(): number {
        const randomIndex = Utils.randomRange(0, this._sortCfg.length);
        return this._sortCfg[randomIndex].id;
    }

    public getHightestLvInArray(frameIds: number[]): number | null {
        if (frameIds.length <= 0) {
            console.error('frameIds err!');
            return null;
        }
        
        frameIds.sort((a, b) => {
            const configA = this.get(a);
            const configB = this.get(b);
            return configA.avatarLevel - configB.avatarLevel;
        });
        
        return frameIds[frameIds.length - 1];
    }

    public get sortCfg(): any[] {
        return this._sortCfg;
    }

    public static get Instance(): AvatarFrame2Cfg {
        if (!AvatarFrame2Cfg._instance) {
            AvatarFrame2Cfg._instance = new AvatarFrame2Cfg().load();
        }
        return AvatarFrame2Cfg._instance;
    }
}