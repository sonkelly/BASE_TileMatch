import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { toNumber, each } from 'lodash-es';
import { ShopCfg } from './ShopCfg';

const { ccclass, property } = _decorator;

@ccclass('GiftPushCfg')
export class GiftPushCfg extends ICfgParse {
    private static _instance: GiftPushCfg;
    private triggerIdGifts: { [key: number]: number[] } = {};
    private popPosGifts: { [key: number]: number[] } = {};
    private limitCycleGifts: { [key: number]: number[] } = {};
    private shopGift: { [key: number]: any } = {};

    constructor() {
        super();
        this.jsonFileName = 'GiftPush';
    }

    public static get Instance(): GiftPushCfg {
        if (!this._instance) {
            this._instance = new GiftPushCfg().load() as GiftPushCfg;
        }
        return this._instance;
    }

    public convert(): void {
        Object.keys(this.cfg).forEach((key: string) => {
            const config = this.cfg[key];
            
            const orEvents: any[] = [];
            if (config.popTriggerEventOr?.length > 0) {
                config.popTriggerEventOr.forEach((eventStr: string) => {
                    const parts = eventStr.split('|');
                    orEvents.push({
                        id: toNumber(parts[0]),
                        compare: toNumber(parts[1]),
                        count: toNumber(parts[2])
                    });
                });
                config.popTriggerEventOr = orEvents;
            }

            const andEvents: any[] = [];
            if (config.popTriggerEventAnd?.length > 0) {
                config.popTriggerEventAnd.forEach((eventStr: string) => {
                    const parts = eventStr.split('|');
                    andEvents.push({
                        id: toNumber(parts[0]),
                        compare: toNumber(parts[1]),
                        count: toNumber(parts[2])
                    });
                });
                config.popTriggerEventAnd = andEvents;
            }
        });
    }

    public loaded(): void {
        const allConfigs = this.getAll();
        
        each(allConfigs, (config: any) => {
            const andEvents = config.popTriggerEventAnd;
            const orEvents = config.popTriggerEventOr;

            if (andEvents?.length > 0) {
                for (let i = 0; i < andEvents.length; i++) {
                    const triggerId = andEvents[i].id;
                    const gifts = this.getTiggerGifts(triggerId);
                    if (gifts.indexOf(config.id) < 0) {
                        gifts.push(config.id);
                    }
                }
            }

            if (orEvents?.length > 0) {
                for (let i = 0; i < orEvents.length; i++) {
                    const triggerId = orEvents[i].id;
                    const gifts = this.getTiggerGifts(triggerId);
                    if (gifts.indexOf(config.id) < 0) {
                        gifts.push(config.id);
                    }
                }
            }

            const activePositions = config.activePos;
            if (activePositions?.length > 0) {
                activePositions.forEach((pos: number) => {
                    this.getPopPosGifts(pos).push(config.id);
                });
            }

            const limitCycleType = ShopCfg.Instance.get(config.shopId)?.limitCycleType;
            this.getLimitCycleGifts(limitCycleType).push(config.id);
        });
    }

    public get(id: number): any {
        return this.cfg[id];
    }

    public getLimitCycleGifts(cycleType: number): number[] {
        if (!this.limitCycleGifts[cycleType]) {
            this.limitCycleGifts[cycleType] = [];
        }
        return this.limitCycleGifts[cycleType];
    }

    public getTiggerGifts(triggerId: number): number[] {
        if (!this.triggerIdGifts[triggerId]) {
            this.triggerIdGifts[triggerId] = [];
        }
        return this.triggerIdGifts[triggerId];
    }

    public getPopPosGifts(position: number): number[] {
        if (!this.popPosGifts[position]) {
            this.popPosGifts[position] = [];
        }
        return this.popPosGifts[position];
    }

    public getShopGift(shopId: number): any {
        return this.shopGift[shopId];
    }
}