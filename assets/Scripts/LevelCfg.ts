import { _decorator, cclegacy } from 'cc';
import {ICfgParse } from './ICfgParse';
import { GroupBgCfg } from './GroupBgCfg';
import { config } from './Config';

const { ccclass, property } = _decorator;

@ccclass('LevelCfg')
export class LevelCfg extends ICfgParse {
    private static _instance: LevelCfg | null = null;
    private _lvIds: Record<number, number> = {};

    constructor() {
        super();
        this.jsonFileName = 'level';
    }

    public convert(): void {
        let groupId = 1;
        let groupCfg = this.get(groupId);
        
        for (let levelId = 1; levelId <= 10000; levelId++) {
            if (levelId > groupCfg.end) {
                groupCfg = this.get(++groupId);
            }
            this._lvIds[levelId] = groupId;
        }
    }

    public get(groupId: number): any {
        return this.cfg[groupId];
    }

    public getCfg(levelId: number): any {
        const actualLevelId = 1 + (levelId - 1) % 10000;
        const groupId = this._lvIds[actualLevelId];
        return this.get(groupId);
    }

    public getGroupId(levelId: number): number {
        return this._lvIds[levelId];
    }

    public getLevelBg(levelId: number): string {
        const actualLevelId = 1 + (levelId - 1) % 10000;
        const defaultLanguage = config.defaultLanguage;
        const groupId = LevelCfg.Instance.getGroupId(actualLevelId);
        const groupCfg = GroupBgCfg.Instance.get(groupId);
        
        if (groupCfg) {
            const bg = groupCfg[defaultLanguage];
            if (bg) {
                return bg;
            }
        }
        
        return LevelCfg.Instance.getCfg(actualLevelId).bg;
    }

    public static get Instance(): LevelCfg {
        if (!LevelCfg._instance) {
            LevelCfg._instance = new LevelCfg().load();
        }
        return LevelCfg._instance;
    }
}