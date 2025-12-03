import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
const { ccclass, property } = _decorator;

@ccclass('NotifyContentCfg')
export default class NotifyContentCfg extends ICfgParse {
    private static _instance: NotifyContentCfg | null = null;
    
    constructor(...args: any[]) {
        super(...args);
        this.jsonFileName = 'notifyContent';
    }

    public get(id: any): any {
        return this.cfg[id];
    }

    public static get Instance(): NotifyContentCfg {
        if (!NotifyContentCfg._instance) {
            NotifyContentCfg._instance = new NotifyContentCfg().load();
        }
        return NotifyContentCfg._instance;
    }
}