import { _decorator } from 'cc';
import {ICfgParse} from './ICfgParse';
import { each } from 'lodash-es';
import { Utils } from './Utils';
import { BUNDLE_NAMES } from './AssetRes';
import { AssetMgr } from './AssetMgr';
import { IMAGE_HEAD_FRAME_PATH } from './Prefabs';

const { ccclass, property } = _decorator;

@ccclass('AvatarFrameCfg')
export class AvatarFrameCfg extends ICfgParse {
    private static _instance: AvatarFrameCfg | null = null;
    private _sortCfg: any[] = [];
    public jsonFileName: string = 'avatarFrame';

    public loaded(): void {
        each(this._cfg, (cfgItem: any) => {
            this._sortCfg.push(cfgItem);
        });

        this._sortCfg.sort((a: any, b: any) => {
            return a.avatarLevel - b.avatarLevel;
        });
    }

    public get(id: string): any {
        return this.cfg[id];
    }

    public loadAvatarFrameSpriteframe(frameId: string): any {
        const cfgItem = this.get(frameId);
        if (cfgItem) {
            return AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, `${IMAGE_HEAD_FRAME_PATH}/avatarFrame${cfgItem.photo}`);
        } else {
            console.error('no cfg by frameId:', frameId);
            return null;
        }
    }

    public getRandomAvatarFrameId(): string {
        const randomIndex = Utils.randomRange(0, this._sortCfg.length);
        return this._sortCfg[randomIndex].id;
    }

    public getHightestLvInArray(frameIds: string[]): string | null {
        if (frameIds.length <= 0) {
            console.error('frameIds err!');
            return null;
        }

        frameIds.sort((a: string, b: string) => {
            const cfgA = this.get(a);
            const cfgB = this.get(b);
            return cfgA.avatarLevel - cfgB.avatarLevel;
        });

        return frameIds[frameIds.length - 1];
    }

    public static get Instance(): AvatarFrameCfg {
        if (!this._instance) {
            this._instance = new AvatarFrameCfg();
            this._instance.load();
        }
        return this._instance;
    }

    public get sortCfg(): any[] {
        return this._sortCfg;
    }
}

export default AvatarFrameCfg;