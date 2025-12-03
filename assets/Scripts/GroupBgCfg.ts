import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('GroupBgCfg')
export class GroupBgCfg extends ICfgParse {
    private static _instance: GroupBgCfg | null = null;
    
    constructor(...args: any[]) {
        super(...args);
        this.jsonFileName = 'groupBg';
    }

    public get(key: string): any {
        return this.cfg[key];
    }

    public static get Instance(): GroupBgCfg {
        if (!this._instance) {
            this._instance = new GroupBgCfg().load();
        }
        return this._instance;
    }
}