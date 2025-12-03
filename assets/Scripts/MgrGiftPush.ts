import { _decorator, director } from 'cc';
import {MgrBase} from './MgrBase';
import {PushData} from './PushData';
import {Tools} from './Tools';
import {GiftPushCfg} from './GiftPushCfg';
import { GIFT_TRIGGER_ID, GIFT_STATE, HOUR_MILLISECOND, CYCLE_TYPE, GIFT_DAILY_RESET_TRIGGERS, COMPARE_TYPE, IAPTYPE, GIFT_PUSH_POS, ShopPackageType } from './Const';
import {ShopCfg} from './ShopCfg';
import {SdkBridge} from './SdkBridge';
import {MgrShop} from './MgrShop';
import {GlobalEvent as Events} from './Events';
import {AsyncQueue} from './AsyncQueue';
import {MgrUi} from './MgrUi';
import {UIPrefabs} from './Prefabs';
import {VIEW_ANIM_EVENT} from './ViewAnimCtrl';
import {GameConst} from './GameConst';
import {each, maxBy} from 'lodash-es';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;

const { ccclass, property } = _decorator;

@ccclass('MgrGiftPush')
export default class MgrGiftPush extends MgrBase {
    private static _instance: MgrGiftPush;
    private pushData: PushData | null = null;
    private _activeGifts: string[] = [];

    public static get Instance(): MgrGiftPush {
        return this._instance;
    }

    onLoad() {
        this.pushData = new PushData('push-data');
    }

    load() {
        this.pushData.load();
    }

    initLoadData() {
        this._activeGifts.length = 0;
        this.pushData.getStatusGifts(GIFT_STATE.Active, this._activeGifts);
        this.tryResetTriggers();
        this.checkGiftCDState();
        this.scheduleFixedUpdate(this.fixedUpdate, 1);
        director.on(Events.shopBuyPackage, this.onShopBuyPackage, this);
    }

    fixedUpdate(dt: number) {
        this.checkGiftCDState();
    }

    onShopBuyPackage(event: any) {
        this.purchaseProductReceived(event);
    }

    checkGiftCDState() {
        const nowTime = Tools.GetNowTime();
        for (let i = this._activeGifts.length - 1; i >= 0; i--) {
            const giftId = this._activeGifts[i];
            const giftCfg = GiftPushCfg.Instance.get(giftId);
            if (this.pushData.getPushData(giftId).triggerTime + giftCfg.duration * HOUR_MILLISECOND < nowTime) {
                this.pushData.setPushState(giftId, GIFT_STATE.Cd);
                director.emit(Events.gitPushActiveEnd, giftId);
                this._activeGifts.splice(i, 1);
            }
        }
    }

    dailyReset() {
        const limitCycleGifts = GiftPushCfg.Instance.getLimitCycleGifts(CYCLE_TYPE.Daily);
        for (const triggerId of GIFT_DAILY_RESET_TRIGGERS) {
            const preTriggerCount = this.pushData.getPreTriggerCount(triggerId);
            this.pushData.setPreTriggerCount(triggerId, preTriggerCount);
            this.pushData.setTriggerCount(triggerId, 0);
        }
        // tìm triggerId có preTriggerCount lớn nhất
        const maxTriggerId = maxBy(Object.values(GIFT_TRIGGER_ID), (id) =>
            this.pushData.getPreTriggerCount(id)
        );

        if (maxTriggerId !== undefined && this.pushData.getPreTriggerCount(maxTriggerId) > 0) {
        const values = Object.values(GIFT_TRIGGER_ID);
        const maxIndex = values.indexOf(maxTriggerId);

        for (let i = 0; i < values.length; i++) {
            this.pushData.setTriggerCount(values[i], i === maxIndex ? 1 : 0);
        }
        } else {
            for (const triggerId of Object.values(GIFT_TRIGGER_ID)) {
                this.pushData.setTriggerCount(triggerId, 0);
            }
        }
        const goldConsumeCount = this.pushData.getPreTriggerCount(GIFT_TRIGGER_ID.GoldConsume);
        this.pushData.setTriggerCount(GIFT_TRIGGER_ID.PreUseGold, goldConsumeCount);
        if (limitCycleGifts && limitCycleGifts.length > 0) {
            for (const giftId of limitCycleGifts) {
                const giftCfg = GiftPushCfg.Instance.get(giftId);
                this.pushData.clearActiveInfo(giftId);
                const shopId = giftCfg.shopId;
                MgrShop.Instance.resetCyclePackage(shopId);
            }
        }
        this.pushData.dailyPushCnt = 0;
    }

    weekReset() {
        const limitCycleGifts = GiftPushCfg.Instance.getLimitCycleGifts(CYCLE_TYPE.Weekly);
        if (limitCycleGifts && limitCycleGifts.length > 0) {
            for (const giftId of limitCycleGifts) {
                this.pushData.clearActiveInfo(giftId);
                const shopId = GiftPushCfg.Instance.get(giftId).shopId;
                MgrShop.Instance.resetCyclePackage(shopId);
            }
        }
    }

    monthReset() {
        const limitCycleGifts = GiftPushCfg.Instance.getLimitCycleGifts(CYCLE_TYPE.Month);
        if (limitCycleGifts && limitCycleGifts.length > 0) {
            for (const giftId of limitCycleGifts) {
                this.pushData.clearActiveInfo(giftId);
                const shopId = GiftPushCfg.Instance.get(giftId).shopId;
                MgrShop.Instance.resetCyclePackage(shopId);
            }
        }
    }

    tryResetTriggers() {
        const nowTime = Tools.GetNowTime();
        const lastTriggerTime = this.pushData.lastTriggerTime;
        if (moment(lastTriggerTime).isBefore(moment(nowTime).startOf('days'))) {
            this.dailyReset();
            this.pushData.lastTriggerTime = nowTime;
        }
        const lastTriggerWeek = this.pushData.lastTriggerWeek;
        if (lastTriggerWeek === 0 || moment(lastTriggerWeek).isBefore(moment(nowTime).startOf('weeks'))) {
            this.weekReset();
            this.pushData.lastTriggerWeek = nowTime;
        }
        const lastTriggerMonth = this.pushData.lastTrgiggerMonth;
        if (lastTriggerMonth === 0 || moment(lastTriggerMonth).isBefore(moment(nowTime).startOf('month'))) {
            this.monthReset();
            this.pushData.lastTrgiggerMonth = nowTime;
        }
    }

    getTriggerCount(triggerId: string): number {
        return this.pushData.getTriggerCount(triggerId);
    }

    addTriggerCount(triggerId: string, count: number = 1) {
        this.tryResetTriggers();
        count += this.getTriggerCount(triggerId);
        this.pushData.setTriggerCount(triggerId, count);
    }

    setTriggerCount(triggerId: string, count: number) {
        this.tryResetTriggers();
        this.pushData.setTriggerCount(triggerId, count);
    }

    getActiveGifts(): string[] {
        const allGifts = GiftPushCfg.Instance.getAll();
        const activeGifts: string[] = [];
        each(allGifts, (gift) => {
            if (this.pushData.getPushData(gift.id).state === GIFT_STATE.Active) {
                activeGifts.push(gift.id);
            }
        });
        return activeGifts;
    }

    compare(value1: number, value2: number, compareType: COMPARE_TYPE): boolean {
        switch (compareType) {
            case COMPARE_TYPE.Equal:
                return value1 === value2;
            case COMPARE_TYPE.Less:
                return value1 < value2;
            case COMPARE_TYPE.LessEqual:
                return value1 <= value2;
            case COMPARE_TYPE.Greater:
                return value1 > value2;
            case COMPARE_TYPE.GreaterEqual:
                return value1 >= value2;
            default:
                return false;
        }
    }

    calcGiftEnable(giftId: string): boolean {
        const isBuyNoAd = MgrShop.Instance.isBuyNoAd();
        const giftCfg = GiftPushCfg.Instance.get(giftId);
        const popTriggerEventAnd = giftCfg.popTriggerEventAnd;
        const popTriggerEventOr = giftCfg.popTriggerEventOr;
        const groupShops = giftCfg.groupShops;
        const shopId = giftCfg.shopId;
        if (ShopCfg.Instance.get(shopId).iapType === IAPTYPE.OneTimeNoConsumable && isBuyNoAd) {
            return false;
        }
        if (groupShops.length > 0) {
            for (const groupShopId of groupShops) {
                if (MgrShop.Instance.checkLimitBuyCntMax(groupShopId)) {
                    return false;
                }
                if (ShopCfg.Instance.get(groupShopId).iapType === IAPTYPE.OneTimeNoConsumable && isBuyNoAd) {
                    return false;
                }
            }
        }
        if (popTriggerEventOr.length > 0) {
            let orConditionMet = false;
            for (const event of popTriggerEventOr) {
                const eventId = event.id;
                const eventCount = event.count;
                const eventCompare = event.compare;
                const triggerCount = this.pushData.getTriggerCount(eventId);
                if (this.compare(triggerCount, eventCount, eventCompare)) {
                    orConditionMet = true;
                    break;
                }
            }
            if (!orConditionMet) {
                return false;
            }
        }
        if (popTriggerEventAnd.length > 0) {
            let andConditionMet = true;
            for (const event of popTriggerEventAnd) {
                const eventId = event.id;
                const eventCount = event.count;
                const eventCompare = event.compare;
                const triggerCount = this.pushData.getTriggerCount(eventId);
                if (!this.compare(triggerCount, eventCount, eventCompare)) {
                    andConditionMet = false;
                    break;
                }
            }
            if (!andConditionMet) {
                return false;
            }
        }
        return true;
    }

    activeGift(giftId: string, triggerTime: number) {
        this.pushData.setPushState(giftId, GIFT_STATE.Active);
        this.pushData.setTriggerTime(giftId, triggerTime);
        this.pushData.addTrgiggerCount(giftId);
        this.pushData.addPopCount(giftId, triggerTime);
        const giftCfg = GiftPushCfg.Instance.get(giftId);
        MgrShop.Instance.activeShop(giftCfg.shopId, triggerTime, giftCfg.duration * HOUR_MILLISECOND);
        this._activeGifts.push(giftId);
    }

    calcTriggerGifts(pos: GIFT_PUSH_POS): string[] {
        const popPosGifts = GiftPushCfg.Instance.getPopPosGifts(pos);
        if (popPosGifts && popPosGifts.length !== 0) {
            const nowTime = Tools.GetNowTime();
            const triggeredGifts: string[] = [];
            for (const giftId of popPosGifts) {
                const giftCfg = GiftPushCfg.Instance.get(giftId);
                const shopCfg = ShopCfg.Instance.get(giftCfg.shopId);
                const pushData = this.pushData.getPushData(giftId);
                const packageBuyData = MgrShop.Instance.getPackageBuyData(giftCfg.shopId);
                if ((shopCfg.limitShowCnt === 0 || packageBuyData.showCnt < shopCfg.limitShowCnt) &&
                    (shopCfg.limitCycleType === CYCLE_TYPE.None || packageBuyData.cycleBuyCnt < shopCfg.limitCycleBuyCnt)) {
                    switch (pushData.state) {
                        case GIFT_STATE.Idle:
                            if (this.calcGiftEnable(giftId)) {
                                this.activeGift(giftId, nowTime);
                                if (!giftCfg.activePos.includes(GIFT_PUSH_POS.NON_ACTIVE_POP)) {
                                    triggeredGifts.push(giftId);
                                }
                            }
                            break;
                        case GIFT_STATE.Cd:
                            if (giftCfg.activeCnt === 0 || pushData.triggerCount < giftCfg.activeCnt) {
                                if (pushData.triggerTime + giftCfg.duration * HOUR_MILLISECOND + giftCfg.activeCd * HOUR_MILLISECOND < nowTime) {
                                    if (this.calcGiftEnable(giftId)) {
                                        this.activeGift(giftId, nowTime);
                                        if (!giftCfg.activePos.includes(GIFT_PUSH_POS.NON_ACTIVE_POP)) {
                                            triggeredGifts.push(giftId);
                                        }
                                    } else {
                                        this.pushData.setPushState(giftId, GIFT_STATE.Idle);
                                    }
                                }
                            }
                            break;
                        case GIFT_STATE.Active:
                            if (pushData.lastPopTime + giftCfg.popCd * HOUR_MILLISECOND < nowTime && pushData.popCount < giftCfg.popCount) {
                                this.pushData.addPopCount(giftId, nowTime);
                                triggeredGifts.push(giftId);
                            }
                            break;
                    }
                }
            }
            return triggeredGifts;
        }
        return [];
    }

    triggerPos(pos: GIFT_PUSH_POS) {
        this.tryResetTriggers();
        if (this.pushData.dailyPushCnt >= GameConst.GiftPushMaxNum) {
            return;
        }
        const triggeredGifts = this.calcTriggerGifts(pos);
        if (triggeredGifts && triggeredGifts.length > 0) {
            const asyncQueue = new AsyncQueue();
            triggeredGifts.forEach((giftId) => {
                asyncQueue.push((next) => {
                    if (GiftPushCfg.Instance.get(giftId).activePos.includes(GIFT_PUSH_POS.NON_ACTIVE_POP)) {
                        next();
                    } else {
                        const data = { giftId };
                        if (SdkBridge.checkCanPayment()) {
                            MgrUi.Instance.openViewAsync(UIPrefabs.PushGiftView, {
                                data,
                                callback: (view) => {
                                    view.once(VIEW_ANIM_EVENT.Removed, next);
                                }
                            });
                            this.pushData.dailyPushCnt++;
                        } else {
                            next();
                        }
                    }
                });
            });
            asyncQueue.complete = () => {};
            asyncQueue.play();
        }
    }

    triggerPurchased(shopId: string) {
        const giftId = GiftPushCfg.Instance.getShopGift(shopId);
        if (giftId) {
            const giftCfg = GiftPushCfg.Instance.get(giftId);
            const shopCfg = ShopCfg.Instance.get(giftCfg.shopId);
            const packageBuyData = MgrShop.Instance.getPackageBuyData(giftCfg.shopId);
            if (shopCfg.limitCycleType !== CYCLE_TYPE.None && packageBuyData.cycleBuyCnt >= shopCfg.limitCycleBuyCnt) {
                this.pushData.setPushState(giftId, GIFT_STATE.Cd);
                director.emit(Events.gitPushActiveEnd, giftId);
            }
        }
    }

    purchaseProductReceived(shopId: string) {
        if (ShopCfg.Instance.get(shopId).type === ShopPackageType.Currency) {
            this.addTriggerCount(GIFT_TRIGGER_ID.BillingGold);
        }
        this.addTriggerCount(GIFT_TRIGGER_ID.BillingCount);
        this.triggerPurchased(shopId);
    }
}