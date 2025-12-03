import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('TurntableRewardCfg')
export class TurntableRewardCfg extends ICfgParse {
    private static _instance: TurntableRewardCfg | null = null;
    private _rewardCfgMap: Map<number, number[]> = new Map();
    private _groupIds: number[] = [];

    constructor() {
        super();
        this.jsonFileName = 'TurntableReward';
    }

    public loaded(): void {
        each(this._cfg, (config: any, index: number) => {
            const rewardParts = config.reward.split('|');
            const rewardId = rewardParts[0];
            const rewardCount = rewardParts[1];
            
            config.rewardInfo = {
                id: Number(rewardId),
                count: Number(rewardCount)
            };

            if (!this._rewardCfgMap.has(config.groupId)) {
                this._rewardCfgMap.set(config.groupId, []);
            }
            this._rewardCfgMap.get(config.groupId)!.push(config.id);

            if (!this._groupIds.includes(config.groupId)) {
                this._groupIds.push(config.groupId);
            }
        });
    }

    public get(id: number): any {
        return this.cfg[id];
    }

    public get rewardCfgMap(): Map<number, number[]> {
        return this._rewardCfgMap;
    }

    public get groupIds(): number[] {
        return this._groupIds;
    }

    public static get Instance(): TurntableRewardCfg {
        if (!TurntableRewardCfg._instance) {
            TurntableRewardCfg._instance = new TurntableRewardCfg().load();
        }
        return TurntableRewardCfg._instance;
    }
}