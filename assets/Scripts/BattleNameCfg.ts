import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { each } from 'lodash-es';
const { ccclass, property } = _decorator;

@ccclass('BattleNameCfg')
export class BattleNameCfg extends ICfgParse {
    private static _instance: BattleNameCfg | null = null;
    private _ids: number[] = [];

    constructor() {
        super()
        this.jsonFileName = 'BattleName';
    }

    public loaded(): void {
        const self = this;
        each(this._cfg, (config: any) => {
            self._ids.push(config.id);
        });
    }

    public get(id: number): any {
        return this.cfg[id];
    }

    public getRandomName(): string {
        const randomIndex = Math.floor(Math.random() * this._ids.length);
        const randomId = this._ids[randomIndex];
        return this.get(randomId).name;
    }

    public static get Instance(): BattleNameCfg {
        if (!this._instance) {
            this._instance = new BattleNameCfg().load();
        }
        return this._instance;
    }
}