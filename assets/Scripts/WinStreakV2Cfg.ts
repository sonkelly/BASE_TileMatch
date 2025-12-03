import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { lodash } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('WinStreakV2Cfg')
export default class WinStreakV2Cfg extends ICfgParse {
    private static _instance: WinStreakV2Cfg | null = null;
    
    public streakList: any[] = [];
    public maxCount: number = 0;
    public maxId: number = 0;
    public levelList: number[] = [];
    public cfgByLevel: Record<number, any> = {};

    constructor() {
        super();
        this.jsonFileName = 'winStreakV2';
    }

    public loaded(): void {
        const allData = this.getAll();
        
        this.levelList = [];
        this.cfgByLevel = {};
        
        lodash.each(allData, (item: any) => {
            this.streakList.push(item);
            this.maxCount = Math.max(this.maxCount, item.winnum);
            this.maxId = Math.max(this.maxId, item.id);
            lodash.set(this.cfgByLevel, item.winnum, item);
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
        return lodash.get(this.cfgByLevel, level) || null;
    }

    public get(id: any): any {
        return this.cfg[id];
    }

    public static get Instance(): WinStreakV2Cfg {
        if (!this._instance) {
            this._instance = new WinStreakV2Cfg().load();
        }
        return this._instance;
    }
}