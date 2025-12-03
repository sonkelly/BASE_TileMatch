import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('PropBuyCfg')
export default class PropBuyCfg extends ICfgParse {
    private static _instance: PropBuyCfg | null = null;
    
    public jsonFileName: string = 'propBuy';

    public static get Instance(): PropBuyCfg {
        if (!PropBuyCfg._instance) {
            PropBuyCfg._instance = new PropBuyCfg().load();
        }
        return PropBuyCfg._instance;
    }

    public get(key: string): any {
        return this.cfg[key];
    }
}