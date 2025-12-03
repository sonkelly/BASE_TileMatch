import { _decorator, Component, Label, Button, Node, Sprite, SpriteFrame } from 'cc';
import { AppGame } from './AppGame';
import { BTN_BACK, VALUE_COIN } from './TopUIView';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { CalendarItem } from './CalendarItem';
import { MgrChallenge } from './MgrChallenge';
import {MgrUi} from './MgrUi';
import { AdsManager } from './AdsManager';
import {Language} from './Language';
import { NativeBridge } from './NativeBridge';
import { GiftNode } from './GiftNode';
import { MgrChallengeStorage } from './MgrChallengeStorage';
import {Toast} from './Toast';
import {UIPool} from './UIPool';
import {last} from 'lodash-es';
import { Tools } from './Tools';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;

const { ccclass, property } = _decorator;

@ccclass('UIChallengeView')
export class UIChallengeView extends UIPool {
    @property(Label)
    dateMonth: Label | null = null;

    @property(Button)
    preMonth: Button | null = null;

    @property(Button)
    nextMonth: Button | null = null;

    @property(Node)
    calendarNode: Node | null = null;

    @property(GiftNode)
    giftNode: GiftNode | null = null;

    @property(Node)
    passBg: Node | null = null;

    @property(Node)
    passNode: Node | null = null;

    @property(Node)
    passStarNode: Node | null = null;

    @property(Label)
    statusLabel: Label | null = null;

    @property(Button)
    playBtn: Button | null = null;

    @property(Sprite)
    playBtnSprite: Sprite | null = null;

    @property(SpriteFrame)
    adFrame: SpriteFrame | null = null;

    @property(SpriteFrame)
    normalFrame: SpriteFrame | null = null;

    @property(Node)
    adIcon: Node | null = null;

    @property(Label)
    dateLabel2: Label | null = null;

    private gapsMonth: number = 0;
    private calendarList: CalendarItem[] = [];
    private dataList: any[] = [];
    private currCalendar: CalendarItem | null = null;

    onLoad() {
        this.preMonth!.node.on('click', this.onClickPreMonth, this);
        this.nextMonth!.node.on('click', this.onClickNextMonth, this);
        this.playBtn!.node.on('click', this.onClickPlay, this);
    }

    onEnable() {
        AppGame.topUI.addBackFunc(() => {
            AppGame.Ins.switchToMain(() => {
                this.onBackBtn();
                AppGame.topUI.showMain();
            });
        });

        AppGame.topUI.show(BTN_BACK | VALUE_COIN);

        if (MgrChallenge.Instance.curTime) {
            const curTime = moment(MgrChallenge.Instance.curTime);
            const now = Tools.GetNowMoment();
            const diff = now.startOf('months').diff(curTime.startOf('months'), 'months');
            this.gapsMonth = now.isAfter(curTime) ? -diff : diff;
        } else {
            this.gapsMonth = 0;
        }

        this.freshMonthDate();
    }

    showDateLabel(date: moment.Moment) {
        this.dateMonth!.string = Language.Instance.getLangByID('Month' + (date.month() + 1));
    }

    freshMonthDate() {
        this.dataList = [];
        const currentMonth = Tools.GetNowMoment().add(this.gapsMonth, 'months');
        const startOfMonth = currentMonth.startOf('month');
        const firstDayOffset = startOfMonth.weekday() === 0 ? 6 : startOfMonth.weekday() - 1;
        const daysInMonth = currentMonth.daysInMonth();

        this.dataList = new Array(firstDayOffset).fill(null);
        for (let day = 1; day <= daysInMonth; day++) {
            this.dataList.push(day);
        }

        this.autoChooseCalendar();
        this.refreshCalenderList();
        this.refreshBottomStatus();
        this.currCalendar!.refreshChooseChange();

        const worldPos = this.currCalendar!.node.worldPosition;
        this.giftNode!.show(worldPos, currentMonth);
        this.checkBtnEnable();
        this.showDateLabel(currentMonth);
    }

    refreshCalenderList() {
        const currentMonth = Tools.GetNowMoment().add(this.gapsMonth, 'months');
        
        for (let i = 0; i < this.dataList.length; i++) {
            let calendarItem = this.calendarList[i];
            if (!calendarItem) {
                const node = this.get();
                node.parent = this.calendarNode;
                calendarItem = node.getComponent(CalendarItem)!;
                calendarItem.delegate = this;
                this.calendarList.push(calendarItem);
            }
            
            if (calendarItem.setData(this.dataList[i], this.dataList[i] ? currentMonth : null)) {
                this.currCalendar = calendarItem;
            }
        }

        if (this.calendarList.length > this.dataList.length) {
            const emptyCount = this.dataList.filter(item => item === null).length + this.dataList[this.dataList.length - 1];
            for (let i = emptyCount; i < this.calendarList.length; i++) {
                this.calendarList[i].setData(null, null);
            }
        }
    }

    onSelectCalendarItem(item: CalendarItem) {
        if (this.currCalendar) {
            this.currCalendar.refreshChooseChange();
        }
        this.currCalendar = item;
        this.refreshBottomStatus();
    }

    autoChooseCalendar() {
        const validDays = this.dataList.filter(day => day !== null);
        let targetDate = null;
        let curTime = MgrChallenge.Instance.curTime;

        if (!curTime) {
            curTime = Tools.GetNowMoment().add(this.gapsMonth, 'months').startOf('month').startOf('day');
        }

        const starData = MgrChallengeStorage.Instance.getStarData(curTime.valueOf());
        if (starData && starData.star !== starData.preStar) {
            if (MgrChallenge.Instance.curTime) return;
            
            const lastDay = last(starData.dayList);
            targetDate = moment(lastDay).valueOf();
        } else {
            const now = Tools.GetNowMoment();
            for (let i = validDays.length - 1; i >= 0; i--) {
                const day = validDays[i];
                const date = moment(curTime).add(day - 1, 'days');
                const isPast = now.isAfter(date);
                const isPassed = MgrChallenge.Instance.getLevelPassEnable(date.valueOf());
                
                if (isPast && !isPassed) {
                    targetDate = Math.max(targetDate || 0, date.valueOf());
                    break;
                }
                
                if (i === 0) {
                    targetDate = targetDate || date.valueOf();
                }
            }
        }

        MgrChallenge.Instance.curTime = moment(targetDate);
    }

    checkMonthComplete(): boolean {
        const validDays = this.dataList.filter(day => day !== null);
        const lastDay = validDays[validDays.length - 1];
        const lastDate = Tools.GetNowMoment().add(this.gapsMonth, 'months')
            .startOf('month').startOf('day').add(lastDay - 1, 'days');

        if (Tools.GetNowMoment().isAfter(lastDate)) {
            for (const day of validDays) {
                const date = Tools.GetNowMoment().add(this.gapsMonth, 'months')
                    .startOf('month').startOf('day').add(day - 1, 'days');
                
                if (!MgrChallenge.Instance.getLevelPassEnable(date.valueOf())) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    refreshBottomStatus() {
        const curTime = moment(MgrChallenge.Instance.curTime);
        const dayStart = curTime.startOf('day').valueOf();
        const monthStart = curTime.startOf('month').startOf('day').valueOf();
        const isPassed = MgrChallenge.Instance.getLevelPassEnable(dayStart) || false;

        this.passBg!.active = isPassed;
        this.passNode!.active = isPassed;
        this.playBtn!.node.active = !isPassed;
        this.passStarNode!.active = isPassed;
        this.statusLabel!.string = Language.Instance.getLangByID(isPassed ? 'challenge_solved' : 'challenge_unsolve');

        const dayOfMonth = curTime.diff(moment(monthStart), 'day') + 1;
        this.dateLabel2!.string = '' + dayOfMonth;

        if (!isPassed) {
            const isToday = curTime.isSame(Tools.GetNowMoment(), 'day');
            const levelData = MgrChallenge.Instance.getLevelData(dayStart);
            
            this.adIcon!.active = !isToday && !levelData;
            this.playBtnSprite!.spriteFrame = (isToday || levelData) ? this.normalFrame! : this.adFrame!;
        }
    }

    onClickPreMonth() {
        this.gapsMonth -= 1;
        MgrChallenge.Instance.curTime = null;
        this.freshMonthDate();
    }

    onClickNextMonth() {
        this.gapsMonth += 1;
        MgrChallenge.Instance.curTime = null;
        this.freshMonthDate();
    }

    checkBtnEnable() {
        this.nextMonth!.node.active = this.gapsMonth < 0;
        
        const canGoPrev = !Tools.GetNowMoment()
            .add(this.gapsMonth - 1, 'months')
            .startOf('day')
            .isBefore(MgrChallenge.Instance.startTime);
            
        this.preMonth!.node.active = canGoPrev;
    }

    onClickPlay() {
        const dayStart = moment(MgrChallenge.Instance.curTime).startOf('day').valueOf();
        const isToday = dayStart === Tools.GetNowMoment().startOf('day').valueOf();
        const levelData = MgrChallenge.Instance.getLevelData(dayStart);

        if (isToday || levelData) {
            this.onNormalPlay();
        } else {
            this.onAdPlay();
        }
    }

    onAdPlay() {
        console.log('UIChallengeView onAdPlay');
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'ChallengeView',
            AdsType: 'AdStartChanllenge',
            onSucceed: () => {
                this.onNormalPlay();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    onNormalPlay() {
        if (MgrChallenge.Instance.curTime) {
            NativeBridge.Instance.showInterstitialIfCooldown({
                OpenUi: 'ChallengeLevel'
            });

            AppGame.topUI.clearBackFunc();
            MgrUi.Instance.closeAll();

            const level = MgrChallenge.Instance.getLevelByDate(MgrChallenge.Instance.curTime);
            MgrChallenge.Instance.curLv = level;
            MgrChallenge.Instance.addPlayTime();
            MgrChallenge.Instance.enterChallenge();
        }
    }

    onBackBtn() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }
}