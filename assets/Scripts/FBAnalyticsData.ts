import { _decorator, cclegacy } from 'cc';
import {IDataObject} from './IDataObject';
import { Tools } from './Tools';
import { ChannelType, channelManager } from './ChannelManager';
import { MgrGame } from './MgrGame';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import {get} from 'lodash-es';

const { ccclass } = _decorator;

const INTERSTITIAL_TRIGGERS = [3, 5, 10, 15, 20, 30];
const REWARD_TRIGGERS = [1, 2, 3, 4, 5, 10];
const LEVEL_TRIGGERS = [5, 10, 15, 20, 30, 40, 50];
const GAME_TIME_TRIGGERS = [5, 10, 20, 30, 40, 50];
const LOGIN_TRIGGERS = [2, 3, 4, 5];

enum AnalyticsKeys {
    INTERSTITIAL_COUNT = 0,
    INTERSTITIAL_TRIGGERS = 1,
    REWARD_COUNT = 2,
    REWARD_TRIGGERS = 3,
    LEVEL_COUNT_INIT = 4,
    LEVEL_COUNT = 5,
    LEVEL_TRIGGERS = 6,
    GAME_TIME = 7,
    GAME_TIME_TRIGGERS = 8,
    START_LOGIN_TIME = 9,
    TOTAL_LOGIN_TIMES = 10
}

@ccclass('FBAnalyticsData')
export class FBAnalyticsData extends IDataObject {
    private _interstitialCount: number = 0;
    private _interstitialCountTriggers: number[] = [];
    private _rewardCount: number = 0;
    private _rewardCountTriggers: number[] = [];
    private _levelCountInit: number = 0;
    private _levelCount: number = 0;
    private _levelCountTriggers: number[] = [];
    private _gameTime: number = 0;
    private _gameTimeTriggers: number[] = [];
    private _startLoginTime: number = 0;
    private _totalLoginTimes: number[] = [];

    public addInterstitialCount(count: number): void {
        if (typeof count !== 'number' || count <= 0) {
            console.warn('Invalid input: count must be a positive number');
            return;
        }

        this._interstitialCount += count;
        this.doDrity();
        
        console.log(`FBInstant.logEvent fb_InsertionADs count: ${count}`);
        if (ChannelType.FaceBook === channelManager.getChannelType() && typeof FBInstant !== 'undefined') {
            FBInstant.logEvent('fb_InsertionADs', count);
        }

        const remainingTriggers = new Set(INTERSTITIAL_TRIGGERS);
        for (const trigger of this._interstitialCountTriggers) {
            remainingTriggers.delete(trigger);
        }

        if (remainingTriggers.size > 0) {
            for (const trigger of remainingTriggers) {
                if (this._interstitialCount >= trigger) {
                    const eventName = `fb_InsertionADs_${trigger}`;
                    console.log(`FBInstant.logEvent: ${eventName}`);
                    if (ChannelType.FaceBook === channelManager.getChannelType() && typeof FBInstant !== 'undefined') {
                        FBInstant.logEvent(eventName);
                    }
                    this._interstitialCountTriggers.push(trigger);
                    this.doDrity();
                }
            }
        }
    }

    public addRewardCount(count: number): void {
        if (typeof count !== 'number' || count <= 0) {
            console.warn('Invalid input: count must be a positive number');
            return;
        }

        this._rewardCount += count;
        this.doDrity();
        
        console.log(`FBInstant.logEvent fb_AdRewardAD count: ${count}`);
        if (ChannelType.FaceBook === channelManager.getChannelType() && typeof FBInstant !== 'undefined') {
            FBInstant.logEvent('fb_AdRewardAD', count);
        }

        const remainingTriggers = new Set(REWARD_TRIGGERS);
        for (const trigger of this._rewardCountTriggers) {
            remainingTriggers.delete(trigger);
        }

        if (remainingTriggers.size > 0) {
            for (const trigger of remainingTriggers) {
                if (this._rewardCount >= trigger) {
                    const eventName = `fb_AdRewardAD_${trigger}`;
                    console.log(`FBInstant.logEvent: ${eventName}`);
                    if (ChannelType.FaceBook === channelManager.getChannelType() && typeof FBInstant !== 'undefined') {
                        FBInstant.logEvent(eventName);
                    }
                    this._rewardCountTriggers.push(trigger);
                    this.doDrity();
                }
            }
        }
    }

    public addLevelCount(count: number): void {
        if (typeof count !== 'number' || count <= 0) {
            console.warn('Invalid input: count must be a positive number');
            return;
        }

        this._levelCount += count;
        this.doDrity();
        
        console.log(`FBInstant.logEvent fb_level count: ${count}`);
        if (ChannelType.FaceBook === channelManager.getChannelType() && typeof FBInstant !== 'undefined') {
            FBInstant.logEvent('fb_level', count);
        }

        const remainingTriggers = new Set(LEVEL_TRIGGERS);
        for (const trigger of this._levelCountTriggers) {
            remainingTriggers.delete(trigger);
        }

        if (remainingTriggers.size > 0) {
            for (const trigger of remainingTriggers) {
                if (this._levelCount >= trigger) {
                    const eventName = `fb_level_${trigger}`;
                    console.log(`FBInstant.logEvent: ${eventName}`);
                    if (ChannelType.FaceBook === channelManager.getChannelType() && typeof FBInstant !== 'undefined') {
                        FBInstant.logEvent(eventName);
                    }
                    this._levelCountTriggers.push(trigger);
                    this.doDrity();
                }
            }
        }
    }

    public addGameTime(seconds: number): void {
        if (typeof seconds !== 'number' || seconds <= 0) {
            console.warn('Invalid input: sec must be a positive number');
            return;
        }

        const remainingTriggers = new Set(GAME_TIME_TRIGGERS);
        for (const trigger of this._gameTimeTriggers) {
            remainingTriggers.delete(trigger);
        }

        if (remainingTriggers.size > 0) {
            this._gameTime += seconds;
            this.doDrity();

            const minutes = Math.floor(this._gameTime / 60);
            for (const trigger of remainingTriggers) {
                if (minutes >= trigger) {
                    const eventName = `fb_time_${trigger}`;
                    console.log(`FBInstant.logEvent: ${eventName}`);
                    if (ChannelType.FaceBook === channelManager.getChannelType() && typeof FBInstant !== 'undefined') {
                        FBInstant.logEvent(eventName);
                    }
                    this._gameTimeTriggers.push(trigger);
                    this.doDrity();
                }
            }
        }
    }

    public addTotalLoginTimes(): void {
        const now = Tools.GetNowTime();
        const dayStart = moment(now).startOf('day').valueOf();

        if (!this._startLoginTime) {
            this._startLoginTime = dayStart;
        }

        if (this._totalLoginTimes.length >= 7 || 
            this._totalLoginTimes.includes(dayStart) || 
            dayStart >= moment(this._startLoginTime).add(7, 'days').valueOf()) {
            return;
        }

        this._totalLoginTimes.push(dayStart);
        this.doDrity();

        const loginCount = this._totalLoginTimes.length;
        if (LOGIN_TRIGGERS.includes(loginCount)) {
            const eventName = `fb_${loginCount}nd_in_7d`;
            console.log(`FBInstant.logEvent: ${eventName}`);
            if (ChannelType.FaceBook === channelManager.getChannelType() && typeof FBInstant !== 'undefined') {
                FBInstant.logEvent(eventName);
            }
        }
    }

    public initlevelCount(): void {
        if (!this._levelCountInit) {
            this._levelCountInit = 1;
            this.doDrity();

            const maxLevel = MgrGame.Instance.gameData.maxLv - 1;
            if (maxLevel > 0) {
                this.addLevelCount(maxLevel);
            }
        }
    }

    public deserialized(data: any): void {
        this._interstitialCount = get(data, AnalyticsKeys.INTERSTITIAL_COUNT) || 0;
        this._interstitialCountTriggers = get(data, AnalyticsKeys.INTERSTITIAL_TRIGGERS) || [];
        this._rewardCount = get(data, AnalyticsKeys.REWARD_COUNT) || 0;
        this._rewardCountTriggers = get(data, AnalyticsKeys.REWARD_TRIGGERS) || [];
        this._levelCountInit = get(data, AnalyticsKeys.LEVEL_COUNT_INIT) || 0;
        this._levelCount = get(data, AnalyticsKeys.LEVEL_COUNT) || 0;
        this._levelCountTriggers = get(data, AnalyticsKeys.LEVEL_TRIGGERS) || [];
        this._gameTime = get(data, AnalyticsKeys.GAME_TIME) || 0;
        this._gameTimeTriggers = get(data, AnalyticsKeys.GAME_TIME_TRIGGERS) || [];
        this._startLoginTime = get(data, AnalyticsKeys.START_LOGIN_TIME) || 0;
        this._totalLoginTimes = get(data, AnalyticsKeys.TOTAL_LOGIN_TIMES) || [];
        this.doDrity();
    }

    public serializeInfo(): any {
        return {
            [AnalyticsKeys.INTERSTITIAL_COUNT]: this._interstitialCount,
            [AnalyticsKeys.INTERSTITIAL_TRIGGERS]: this._interstitialCountTriggers,
            [AnalyticsKeys.REWARD_COUNT]: this._rewardCount,
            [AnalyticsKeys.REWARD_TRIGGERS]: this._rewardCountTriggers,
            [AnalyticsKeys.LEVEL_COUNT_INIT]: this._levelCountInit,
            [AnalyticsKeys.LEVEL_COUNT]: this._levelCount,
            [AnalyticsKeys.LEVEL_TRIGGERS]: this._levelCountTriggers,
            [AnalyticsKeys.GAME_TIME]: this._gameTime,
            [AnalyticsKeys.GAME_TIME_TRIGGERS]: this._gameTimeTriggers,
            [AnalyticsKeys.START_LOGIN_TIME]: this._startLoginTime,
            [AnalyticsKeys.TOTAL_LOGIN_TIMES]: this._totalLoginTimes
        };
    }
}