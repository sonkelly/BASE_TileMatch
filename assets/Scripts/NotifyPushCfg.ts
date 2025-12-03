import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';
import each from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('NotifyPushCfg')
class NotifyPushCfg extends ICfgParse {
    private static _instance: NotifyPushCfg | null = null;
    private _notificitaonArray: string[] = [];
    public jsonFileName: string = 'notifyPush';

    constructor(...args: any[]) {
        super(...args);
    }

    public loaded(): void {
        each(this['_cfg'], (cfgItem: any) => {
            this._notificitaonArray.push(cfgItem.id);
        });
    }

    public get(id: string): any {
        return this['cfg'][id];
    }

    public get notificitaonArray(): string[] {
        return this._notificitaonArray;
    }

    public static get Instance(): NotifyPushCfg {
        if (!NotifyPushCfg._instance) {
            NotifyPushCfg._instance = new NotifyPushCfg();
            NotifyPushCfg._instance.load();
        }
        return NotifyPushCfg._instance;
    }
}

export default NotifyPushCfg;