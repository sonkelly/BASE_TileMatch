import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';
import { set, get, each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('WinStreakCfg')
export class WinStreakCfg extends ICfgParse {
    private static _instance: WinStreakCfg | null = null;
    
    public jsonFileName: string = 'winStreak';
    public streakList: any[] = [];
    public maxCount: number = 0;
    public maxId: number = 0;
    public levelList: number[] = [];
    public cfgByLevel: Record<number, any> = {};

    public loaded(): void {
        const allData = this.getAll();
        
        this.levelList = [];
        this.cfgByLevel = {};
        
        each(allData, (item: any) => {
            this.streakList.push(item);
            this.maxCount = Math.max(this.maxCount, item.winnum);
            this.maxId = Math.max(this.maxId, item.id);
            set(this.cfgByLevel, item.winnum, item);
        });

        for (let i = 1; i <= this.maxCount; i++) {
            this.levelList.push(i);
        }
        
        this.levelList.reverse();
    }

    public getStreakList(): any[] {
        return this.streakList;
    }

    public getMaxNum(): number {
        return this.maxCount;
    }

    public getMaxId(): number {
        return this.maxId;
    }

    public getLevelList(): number[] {
        return this.levelList;
    }

    public getCfgByLevel(level: number): any | null {
        return get(this.cfgByLevel, level) || null;
    }

    public get(id: number): any {
        return this.cfg[id];
    }

    public static get Instance(): WinStreakCfg {
        if (!this._instance) {
            this._instance = new WinStreakCfg().load();
        }
        return this._instance;
    }
}