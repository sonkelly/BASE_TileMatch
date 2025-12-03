import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('NotifyCfg')
export default class NotifyCfg extends ICfgParse {
    private static _instance: NotifyCfg | null = null;

    constructor(...args: any[]) {
        super(...args);
        this.jsonFileName = 'notify';
    }

    public get(key: string): any {
        return this.cfg[key];
    }

    public static get Instance(): NotifyCfg {
        if (!NotifyCfg._instance) {
            NotifyCfg._instance = new NotifyCfg().load();
        }
        return NotifyCfg._instance;
    }
}