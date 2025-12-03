import { _decorator, cclegacy } from 'cc';
import { set, get, sum, values } from 'lodash-es';
import { AnalyticsManager } from './AnalyticsManager';
import { IDataObject } from './IDataObject';

const { ccclass, property } = _decorator;

@ccclass('AnalyticsData')
export class AnalyticsData extends IDataObject {
    private _playTimeByLv: Record<string, number> = {};
    private _winTimeByLv: Record<string, number> = {};
    private _lossTimeByLv: Record<string, number> = {};
    private _inviteClickNums: Record<string, number> = {};
    private _shareClickNums: Record<string, number> = {};
    private _inviteLongShowNums: Record<string, number> = {};
    private _inviteLongClickNums: Record<string, number> = {};

    public addPlayTime(level: string, count: number = 1): void {
        const current = get(this._playTimeByLv, level) || 0;
        set(this._playTimeByLv, level, current + count);
        AnalyticsManager.getInstance().setUserProperty({ CK_In_Times: current + count });
        this.doDrity();
    }

    public getPlayTime(level: string): number {
        return get(this._playTimeByLv, level) || 0;
    }

    public addWinTime(level: string, count: number = 1): void {
        const current = get(this._winTimeByLv, level) || 0;
        set(this._winTimeByLv, level, current + count);
        AnalyticsManager.getInstance().setUserProperty({ CK_WinTimes: current + count });
        this.doDrity();
    }

    public getWinTime(level: string): number {
        return get(this._winTimeByLv, level) || 0;
    }

    public addLossTime(level: string, count: number = 1): void {
        const current = get(this._lossTimeByLv, level) || 0;
        set(this._lossTimeByLv, level, current + count);
        AnalyticsManager.getInstance().setUserProperty({ CK_FailTimes: current + count });
        this.doDrity();
    }

    public getLossTime(level: string): number {
        return get(this._lossTimeByLv, level) || 0;
    }

    public addInviteClickTime(level: string): number {
        const current = get(this._inviteClickNums, level) || 0;
        const newCount = current + 1;
        set(this._inviteClickNums, level, newCount);
        this.doDrity();
        return newCount;
    }

    public getInviteClickTime(level: string): number {
        return get(this._inviteClickNums, level) || 0;
    }

    public addShareTime(level: string): number {
        const current = get(this._shareClickNums, level) || 0;
        const newCount = current + 1;
        set(this._shareClickNums, level, newCount);
        this.doDrity();
        return newCount;
    }

    public getShareTime(level: string): number {
        return get(this._shareClickNums, level) || 0;
    }

    public getShareTotalCount(): number {
        return sum(values(this._shareClickNums));
    }

    public addInviteLongShowTime(level: string): number {
        const current = get(this._inviteLongShowNums, level) || 0;
        const newCount = current + 1;
        set(this._inviteLongShowNums, level, newCount);
        this.doDrity();
        return newCount;
    }

    public getInviteLongShowTime(level: string): number {
        return get(this._inviteLongShowNums, level) || 0;
    }

    public addInviteLongClickNums(level: string): number {
        const current = get(this._inviteLongClickNums, level) || 0;
        const newCount = current + 1;
        set(this._inviteLongClickNums, level, newCount);
        this.doDrity();
        return newCount;
    }

    public getInviteLongClickNums(level: string): number {
        return get(this._inviteLongClickNums, level) || 0;
    }

    public deserialized(data: any): void {
        this._playTimeByLv = get(data, '_playTime') || {};
        this._winTimeByLv = get(data, '_winTime') || {};
        this._lossTimeByLv = get(data, '_lossTime') || {};
        this._inviteClickNums = get(data, '_inviteTime') || {};
        this._shareClickNums = get(data, '_shareTime') || {};
        this._inviteLongShowNums = get(data, '_inviteShowTime') || {};
        this._inviteLongClickNums = get(data, '_inviteLongClick') || {};
        this.doDrity();
    }

    public serializeInfo(): any {
        return {
            _playTime: this._playTimeByLv,
            _winTime: this._winTimeByLv,
            _lossTime: this._lossTimeByLv,
            _inviteTime: this._inviteClickNums,
            _shareTime: this._shareClickNums,
            _inviteShowTime: this._inviteLongShowNums,
            _inviteLongClick: this._inviteLongClickNums
        };
    }

    public get playTimeByLv(): Record<string, number> {
        return this._playTimeByLv;
    }

    public set playTimeByLv(value: Record<string, number>) {
        this._playTimeByLv = value;
        this.doDrity();
    }

    public get winTimeByLv(): Record<string, number> {
        return this._winTimeByLv;
    }

    public set winTimeByLv(value: Record<string, number>) {
        this._winTimeByLv = value;
        this.doDrity();
    }

    public get lossTimeByLv(): Record<string, number> {
        return this._lossTimeByLv;
    }

    public set lossTimeByLv(value: Record<string, number>) {
        this._lossTimeByLv = value;
        this.doDrity();
    }

    public get inviteClickNums(): Record<string, number> {
        return this._inviteClickNums;
    }

    public set inviteClickNums(value: Record<string, number>) {
        this._inviteClickNums = value;
        this.doDrity();
    }

    public get shareClickNums(): Record<string, number> {
        return this._shareClickNums;
    }

    public set shareClickNums(value: Record<string, number>) {
        this._shareClickNums = value;
        this.doDrity();
    }

    public get inviteLongShowNums(): Record<string, number> {
        return this._inviteLongShowNums;
    }

    public set inviteLongShowNums(value: Record<string, number>) {
        this._inviteLongShowNums = value;
        this.doDrity();
    }

    public get inviteLongClickNums(): Record<string, number> {
        return this._inviteLongClickNums;
    }

    public set inviteLongClickNums(value: Record<string, number>) {
        this._inviteLongClickNums = value;
        this.doDrity();
    }
}