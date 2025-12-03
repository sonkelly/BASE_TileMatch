import { _decorator, cclegacy } from 'cc';
import { Tools } from './Tools';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('RankNameCfg')
export class RankNameCfg extends ICfgParse {
    public static _instance: RankNameCfg | null = null;
    public rankIds: number[] = [];
    public jsonFileName: string = 'RankName';

    public static get Instance(): RankNameCfg {
        if (!RankNameCfg._instance) {
            RankNameCfg._instance = new RankNameCfg().load();
        }
        return RankNameCfg._instance;
    }

    public loaded(): void {
        for (const key in this.cfg) {
            this.rankIds.push(this.cfg[key].id);
        }
    }

    public get(id: number): any {
        return this.cfg[id];
    }

    public getRandomName(): string {
        const index = Math.floor(Math.random() * this.rankIds.length);
        const id = this.rankIds[index];
        return this.get(id).name;
    }

    public getRandomId(): number {
        const index = Math.floor(Math.random() * this.rankIds.length);
        return this.rankIds[index];
    }

    public radomAiNameIds(count: number): number[] {
        count = Math.min(count, this.rankIds.length);
        return Tools.getRandomArrayElements(this.rankIds, count);
    }
}