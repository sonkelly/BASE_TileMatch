import { _decorator, cclegacy } from 'cc';
import { each, set, get } from 'lodash-es';
import { ShopCfg } from './ShopCfg';
import { Tools } from './Tools';
import { CYCLE_TYPE } from './Const';
import { IDataObject } from './IDataObject';

const { ccclass, property } = _decorator;

@ccclass('ShopData')
export class ShopData extends IDataObject {
    private _limitedPackage: any = null;
    private _turnPackage: any = null;
    private _packages: { [key: number]: any } = {};
    private _showedNoAdsTip: number = 0;

    deserialized(data: any): void {
        this._limitedPackage = get(data, 'limited-pack', { id: 0 });
        this._turnPackage = get(data, 'turn-pack', { id: 0 });
        this._showedNoAdsTip = get(data, 'noAds-tip', 0);
        this._packages = {};

        const packagesData = get(data, 'all-pack', {});
        each(packagesData, (value: any, key: string) => {
            const id = parseInt(key);
            const [showCnt, buyCnt, cycleBuyCnt, openTime, closeTime] = value;
            this._packages[id] = { showCnt, buyCnt, cycleBuyCnt, openTime, closeTime };
        });

        this._refreshConfigs();
    }

    serializeInfo(): any {
        const result: any = {};
        set(result, 'limited-pack', this._limitedPackage);
        set(result, 'turn-pack', this._turnPackage);
        set(result, 'noAds-tip', this._showedNoAdsTip);

        const packagesData: any = {};
        each(this._packages, (value: any, key: string) => {
            const id = parseInt(key);
            packagesData[id] = [
                value.showCnt,
                value.buyCnt,
                value.cycleBuyCnt,
                value.openTime,
                value.closeTime
            ];
        });
        set(result, 'all-pack', packagesData);

        return result;
    }

    private _refreshConfigs(): void {
        let dirty = false;
        const cfg = ShopCfg.Instance.cfg;

        each(cfg, (value: any, key: string) => {
            const id = parseInt(key);
            if (!this._packages[id]) {
                dirty = true;
                this._packages[id] = {
                    showCnt: 0,
                    buyCnt: 0,
                    cycleBuyCnt: 0,
                    openTime: 0,
                    closeTime: 0
                };
            }
        });

        if (dirty) this.doDrity();
    }

    initLimitedPackage(): void {
        const id = this._limitedPackage.id;
        if (id) {
            if (this.getPackageCloseTime(id) <= Tools.GetNowTime()) {
                this._resetLimitedPackage();
            }
        } else {
            this._resetLimitedPackage();
        }
    }

    checkLimitedPackageRefresh(): void {
        const id = this._limitedPackage.id;
        if (id && this.getPackageCloseTime(id) - Tools.GetNowTime() < 0) {
            this._resetLimitedPackage();
        }
    }

    private _resetLimitedPackage(): void {
        const nextId = this._findNextLimitedPackage();
        if (!nextId) {
            this._limitedPackage.id = 0;
            this.doDrity();
            return;
        }

        const cfg = ShopCfg.Instance.get(nextId);
        const now = Tools.GetNowTime();
        this._limitedPackage.id = nextId;

        const pkg = this._packages[nextId];
        pkg.showCnt++;
        pkg.openTime = now;
        pkg.cycleBuyCnt = 0;
        pkg.closeTime = this._calcPackageCloseTime(cfg, now);
        this.doDrity();
    }

    private _findNextLimitedPackage(): number {
        const currentId = this._limitedPackage.id;
        const packages = ShopCfg.Instance.limitedPackages;
        const startIndex = packages.indexOf(currentId) + 1;
        let foundId = 0;

        for (let i = startIndex; i < startIndex + packages.length; i++) {
            const index = i % packages.length;
            const id = packages[index];
            const cfg = ShopCfg.Instance.get(id);
            const pkg = this._packages[id];

            if ((cfg.limitBuyCnt === 0 || pkg.buyCnt < cfg.limitBuyCnt) &&
                (cfg.limitShowCnt === 0 || pkg.showCnt < cfg.limitShowCnt)) {
                foundId = id;
                break;
            }
        }

        return foundId;
    }

    initTurnPackage(): void {
        const id = this._turnPackage.id;
        if (id) {
            if (this.getPackageCloseTime(id) <= Tools.GetNowTime()) {
                this._resetTurnPackage();
            }
        } else {
            this._resetTurnPackage();
        }
    }

    checkTurnPackageRefresh(): void {
        const id = this._turnPackage.id;
        if (id && this.getPackageCloseTime(id) - Tools.GetNowTime() < 0) {
            this._resetTurnPackage();
        }
    }

    private _resetTurnPackage(): void {
        const nextId = this._findNextTurnPackage();
        if (!nextId) {
            this._turnPackage.id = 0;
            this.doDrity();
            return;
        }

        const cfg = ShopCfg.Instance.get(nextId);
        const now = Tools.GetNowTime();
        this._turnPackage.id = nextId;

        const pkg = this._packages[nextId];
        pkg.showCnt++;
        pkg.openTime = now;
        pkg.cycleBuyCnt = 0;
        pkg.closeTime = this._calcPackageCloseTime(cfg, now);
        this.doDrity();
    }

    private _findNextTurnPackage(): number {
        const currentId = this._turnPackage.id;
        const packages = ShopCfg.Instance.turnPackages;
        const startIndex = packages.indexOf(currentId) + 1;
        let foundId = 0;

        for (let i = startIndex; i < startIndex + packages.length; i++) {
            const index = i % packages.length;
            const id = packages[index];
            const cfg = ShopCfg.Instance.get(id);
            const pkg = this._packages[id];

            if ((cfg.limitBuyCnt === 0 || pkg.buyCnt < cfg.limitBuyCnt) &&
                (cfg.limitShowCnt === 0 || pkg.showCnt < cfg.limitShowCnt)) {
                foundId = id;
                break;
            }
        }

        return foundId;
    }

    initAndCheckNormalPackage(): void {
        const now = Tools.GetNowTime();
        const packages = ShopCfg.Instance.normalPackages;

        for (let i = 0; i < packages.length; i++) {
            const id = packages[i];
            const cfg = ShopCfg.Instance.get(id);
            const pkg = this._packages[id];

            if (cfg.limitBuyCnt !== 0 && pkg.buyCnt >= cfg.limitBuyCnt) continue;

            if (cfg.limitCycleType !== CYCLE_TYPE.None) {
                if ((pkg?.closeTime || 0) <= now) {
                    if (cfg.limitShowCnt !== 0 && pkg.showCnt >= cfg.limitShowCnt) continue;

                    pkg.showCnt++;
                    pkg.openTime = now;
                    pkg.cycleBuyCnt = 0;
                    pkg.closeTime = this._calcPackageCloseTime(cfg, now);
                    this.doDrity();
                }
            }
        }
    }

    initAndCheckCurrencyPackage(): void {
        const now = Tools.GetNowTime();
        const packages = ShopCfg.Instance.currencyPackages;

        for (let i = 0; i < packages.length; i++) {
            const id = packages[i];
            const cfg = ShopCfg.Instance.get(id);
            const pkg = this._packages[id];

            if (cfg.limitBuyCnt !== 0 && pkg.buyCnt >= cfg.limitBuyCnt) continue;

            if (cfg.limitCycleType !== CYCLE_TYPE.None) {
                if ((pkg?.closeTime || 0) <= now) {
                    if (cfg.limitShowCnt !== 0 && pkg.showCnt >= cfg.limitShowCnt) continue;

                    pkg.showCnt++;
                    pkg.openTime = now;
                    pkg.cycleBuyCnt = 0;
                    pkg.closeTime = this._calcPackageCloseTime(cfg, now);
                    this.doDrity();
                }
            }
        }
    }

    private _calcPackageCloseTime(cfg: any, startTime: number): number {
        let closeTime = startTime;

        switch (cfg.limitCycleType) {
            case CYCLE_TYPE.Daily:
                const dailyTime = startTime + 24 * cfg.limitCycleParam * 60 * 60 * 1000;
                const dailyDate = new Date(dailyTime);
                dailyDate.setHours(0, 0, 0, 0);
                closeTime = dailyDate.getTime();
                break;

            case CYCLE_TYPE.Weekly:
                const weeklyTime = startTime + 7 * cfg.limitCycleParam * 24 * 60 * 60 * 1000;
                const weeklyDate = new Date(weeklyTime);
                weeklyDate.setHours(0, 0, 0, 0);
                closeTime = weeklyDate.getTime();
                break;

            case CYCLE_TYPE.Month:
                const monthlyTime = startTime + 30 * cfg.limitCycleParam * 24 * 60 * 60 * 1000;
                const monthlyDate = new Date(monthlyTime);
                monthlyDate.setHours(0, 0, 0, 0);
                closeTime = monthlyDate.getTime();
                break;

            default:
                console.error('no limitedType by cfgId:', cfg.id);
        }

        return closeTime;
    }

    activePackage(id: number, startTime: number, duration: number): void {
        const pkg = this._packages[id];
        pkg.showCnt++;
        pkg.openTime = startTime;
        pkg.cycleBuyCnt = 0;
        pkg.closeTime = startTime + duration;
        this.doDrity();
    }

    resetCyclePackage(id: number): void {
        this._packages[id].cycleBuyCnt = 0;
        this.doDrity();
    }

    getPackageCloseTime(id: number): number {
        return this._packages[id]?.closeTime || 0;
    }

    buyPackage(id: number): void {
        const pkg = this._packages[id];
        pkg.buyCnt++;
        pkg.cycleBuyCnt++;
        this.doDrity();
    }

    get limitedPackage(): any {
        return this._limitedPackage;
    }

    get turnPackage(): any {
        return this._turnPackage;
    }

    get packages(): { [key: number]: any } {
        return this._packages;
    }

    get showedNoAdsTip(): number {
        return this._showedNoAdsTip;
    }

    set showedNoAdsTip(value: number) {
        this._showedNoAdsTip = value;
        this.doDrity();
    }
}