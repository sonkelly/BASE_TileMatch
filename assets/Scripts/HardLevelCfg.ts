import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('HardLevelCfg')
export class HardLevelCfg extends ICfgParse {
    private static _instance: HardLevelCfg | null = null;

    constructor(...args: any[]) {
        super(...args);
        this.jsonFileName = 'hardLevel';
    }

    public loaded(): void {}

    public get(key: string|number): any {
        return this.cfg[key];
    }

    public static get Instance(): HardLevelCfg {
        if (!this._instance) {
            this._instance = new HardLevelCfg().load();
        }
        return this._instance;
    }
}