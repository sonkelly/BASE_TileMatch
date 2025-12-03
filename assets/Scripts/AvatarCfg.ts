import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { BUNDLE_NAMES } from './AssetRes';
import { IMAGE_HEAD_PATH } from './Prefabs';
import { AssetMgr } from './AssetMgr';
import { Utils } from './Utils';
import { AvatarUnlockType } from './Const';
import { MgrGame } from './MgrGame';
import { MgrUser } from './MgrUser';
import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('AvatarCfg')
export class AvatarCfg extends ICfgParse {
    private static _instance: AvatarCfg;
    private _avatarIds: number[] = [];
    private _avatarArrayCfgs: any[] = [];

    constructor() {
        super();
        this.jsonFileName = 'avatar';
    }

    loaded(): void {
        const self = this;
        each(this._cfg, (cfg: any) => {
            self._avatarIds.push(cfg.id);
            self._avatarArrayCfgs.push(cfg);
        });
    }

    get(id: number): any {
        return this.cfg[id];
    }

    getDefaultHeadId(): number {
        return this._avatarIds[0];
    }

    loadHeadSpriteframe(id: number): Promise<any> | null {
        const cfg = this.get(id);
        return cfg ? AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, `${IMAGE_HEAD_PATH}/head${cfg.photo}`) : 
            (console.error('no cfg by headId:', id), null);
    }

    getRandomHeadId(): number {
        const randomIndex = Utils.randomRange(1, this._avatarIds.length);
        return this._avatarIds[randomIndex];
    }

    getRandomCntExceptAndNotRepeat(exceptId: number, count: number): number[] {
        const filteredIds = this._avatarIds.filter(id => id !== exceptId);
        
        if (count >= filteredIds.length) {
            return filteredIds;
        }

        const result: number[] = [];
        const usedIndices = new Set<number>();
        
        while (result.length < count) {
            const randomIndex = Math.floor(Math.random() * filteredIds.length);
            if (!usedIndices.has(randomIndex)) {
                result.push(filteredIds[randomIndex]);
                usedIndices.add(randomIndex);
            }
        }
        return result;
    }

    isUnlock(id: number): boolean {
        const cfg = this.get(id);
        if (!cfg) {
            console.warn('no cfg by headId:', id);
            return false;
        }

        switch (cfg.unlockType) {
            case AvatarUnlockType.Default:
                return true;
            case AvatarUnlockType.Level:
                return MgrGame.Instance.gameData.maxLv >= cfg.unlockNum;
            case AvatarUnlockType.Coin:
            case AvatarUnlockType.RewardAd:
                return MgrUser.Instance.userData.unlockHead.includes(cfg.id);
            default:
                return false;
        }
    }

    getAvatarSortArray(): any[] {
        const self = this;
        this._avatarArrayCfgs.sort((a, b) => {
            const aUnlocked = self.isUnlock(a.id);
            const bUnlocked = self.isUnlock(b.id);
            
            if ((aUnlocked && bUnlocked) || (!aUnlocked && !bUnlocked)) {
                return a.id - b.id;
            }
            return aUnlocked ? -1 : 1;
        });
        
        return this._avatarArrayCfgs;
    }

    public static get Instance(): AvatarCfg {
        if (!AvatarCfg._instance) {
            AvatarCfg._instance = new AvatarCfg().load();
        }
        return AvatarCfg._instance;
    }
}