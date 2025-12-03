import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { lodash } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('PassCfg')
export default class PassCfg extends ICfgParse {
    private static _instance: PassCfg | null = null;
    private passcfgList: Record<string, any[]> | null = null;

    constructor() {
        super();
        this.jsonFileName = 'pass';
        this.passcfgList = null;
    }

    public static get Instance(): PassCfg {
        if (!PassCfg._instance) {
            PassCfg._instance = new PassCfg().load() as PassCfg;
        }
        return PassCfg._instance;
    }

    public loaded(): void {
        const self = this;
        this.passcfgList = {};
        const allData = this.getAll();
        
        lodash.each(allData, (passData: any[]) => {
            let totalLevel = 0;
            lodash.each(passData, (passConfig: any) => {
                const id = passConfig.id;
                const level = passConfig.level;
                totalLevel += passConfig.stage;
                passConfig.totalLv = totalLevel;

                const passList = lodash.get(self.passcfgList, id, []);
                passList[level] = passConfig;
                lodash.set(self.passcfgList, id, passList);
            });
        });
    }

    public getPassList(id: string): any[] {
        return this.passcfgList![id];
    }

    public get(key: string): any {
        return this.cfg[key];
    }
}