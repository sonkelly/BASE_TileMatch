import { _decorator, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import {get, set, each, parseInt} from 'lodash-es';
import { GameConst } from './GameConst';

const { ccclass, property } = _decorator;

export enum SKIN_STATUS {
    LOCK = 0,
    PROGRESS = 1,
    UNLOCKED = 2
}

@ccclass('SkinData')
export class SkinData extends IDataObject {
    private _currSkinId: number = -1;
    private _skinInfos: Record<number, { status: SKIN_STATUS; used: boolean; progress?: number }> = {};

    constructor() {
        super();
    }

    public deserialized(data: any): void {
        this._skinInfos = {};
        const skinInfosData = get(data, 1);
        
        if (skinInfosData) {
            for (let i = 0; i < skinInfosData.length; i++) {
                const skinData = skinInfosData[i];
                const skinId = skinData[0];
                const status = skinData[1];
                const used = skinData[2] !== 0;
                const progress = skinData[3];
                
                this._skinInfos[skinId] = {
                    status: status,
                    used: used
                };
                
                if (progress) {
                    this._skinInfos[skinId].progress = progress;
                }
            }
        } else {
            this._skinInfos[GameConst.ORIGINAL_TILESET_ID] = {
                status: SKIN_STATUS.UNLOCKED,
                used: true
            };
        }
        
        this.currSkinId = get(data, 0, GameConst.ORIGINAL_TILESET_ID);
    }

    public serializeInfo(): any {
        const result: any = {};
        set(result, 0, this.currSkinId);
        
        const skinInfos: any[] = [];
        each(this._skinInfos, (info, skinId) => {
            const id = parseInt(skinId);
            const used = info.used ? 1 : 0;
            const skinInfo: any[] = [id, info.status, used];
            
            if (info.progress) {
                skinInfo.push(info.progress);
            }
            
            skinInfos.push(skinInfo);
        });
        
        set(result, 1, skinInfos);
        return result;
    }

    public getSkinData(skinId: number): { status: SKIN_STATUS; used: boolean; progress?: number } | undefined {
        return this._skinInfos[skinId];
    }

    public addProgress(skinId: number, amount: number = 1): void {
        const skinData = this.getSkinData(skinId);
        
        if (skinData) {
            skinData.progress = (skinData.progress || 0) + amount;
        } else {
            this._skinInfos[skinId] = {
                status: SKIN_STATUS.PROGRESS,
                progress: amount,
                used: false
            };
        }
        
        this.doDrity();
    }

    public unlock(skinId: number): void {
        this._skinInfos[skinId] = {
            status: SKIN_STATUS.UNLOCKED,
            used: true
        };
        this.doDrity();
    }

    public get currSkinId(): number {
        return this._currSkinId;
    }

    public set currSkinId(value: number) {
        this._currSkinId = value;
        if (this._skinInfos[value]) {
            this._skinInfos[value].used = true;
        }
        this.doDrity();
    }
}