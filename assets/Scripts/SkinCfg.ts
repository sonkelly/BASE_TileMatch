import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
const { ccclass, property } = _decorator;

@ccclass('SkinCfg')
export default class SkinCfg extends ICfgParse {
    private static _instance: SkinCfg | null = null;

    constructor() {
        super();
        this.jsonFileName = 'skin';
    }

    public get(key: string): any {
        return this.cfg[key];
    }

    public static get Instance(): SkinCfg {
        if (!this._instance) {
            this._instance = new SkinCfg().load();
        }
        return this._instance;
    }
}