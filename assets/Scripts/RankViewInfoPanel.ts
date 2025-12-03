import { _decorator, Component, Label, Node, Button, director, tween, v3, Tween } from 'cc';
import { GlobalEvent } from './Events';
import { ITEM } from './GameConst';
import { UIPrefabs } from './Prefabs';
import {Language} from './Language';
import {Tools} from './Tools';
import { RankType } from './RankData';
import { MgrRank } from './MgrRank';
import {MgrUi} from './MgrUi';
import { MgrUser } from './MgrUser';
import {Utils} from './Utils';
import { SdkBridge } from './SdkBridge';

const { ccclass, property } = _decorator;

@ccclass('RankViewInfoPanel')
export class RankViewInfoPanel extends Component {
    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    wisdomLabel: Label | null = null;

    @property(Label)
    wisdomTitleLabel: Label | null = null;

    @property(Node)
    sunGlow: Node | null = null;

    @property(Button)
    shareBtn: Button | null = null;

    private _shareClick(): void {
        MgrUi.Instance.openViewAsync(UIPrefabs.UIShareList, {
            data: {
                icon: SdkBridge.getPlayerPhotoUrl(),
                score: MgrUser.Instance.userData.getItem(ITEM.Wisdom),
                shareType: 'Rank'
            }
        });
    }

    start(): void {
        this.shareBtn?.node.on('click', this._shareClick, this);
    }

    onEnable(): void {
        director.on(GlobalEvent.refreshMonthRankTimeStamp, this._refreshTimeLabel, this);
        director.on(GlobalEvent.refreshRankType, this._refreshWidomTitle, this);
        this._refreshTimeLabel();
        this._actSunGlow();
        this.refreshTimeShow();
        this._refreshWidomTitle();
    }

    onDisable(): void {
        director.targetOff(this);
        this._stopSunGlow();
    }

    private _refreshTimeLabel(): void {
        if (!this.timeLabel) return;
        if (MgrRank.Instance.nextMonthTimeStampDiff < 0) {
            this.timeLabel.string = '';
        } else {
            this.timeLabel.string = Language.Instance.getLangByID('Pass_Time') + Utils.timeConvertToDDHH(MgrRank.Instance.nextMonthTimeStampDiff);
        }
    }

    private _actSunGlow(): void {
        if (!this.sunGlow) return;
        tween(this.sunGlow)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(6, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    private _stopSunGlow(): void {
        if (!this.sunGlow) return;
        Tween.stopAllByTarget(this.sunGlow);
    }

    private _refreshWidomTitle(): void {
        if (!this.wisdomTitleLabel || !this.shareBtn) return;
        
        if (MgrRank.Instance.rankType === RankType.Year || MgrRank.Instance.rankType === RankType.Friend) {
            this.wisdomTitleLabel.string = Language.Instance.getLangByID('ui_total');
        } else {
            const month = Tools.GetNowDate().getMonth() + 1;
            this.wisdomTitleLabel.string = Language.Instance.getLangByID('Month' + month);
        }
        this.shareBtn.node.active = MgrRank.Instance.rankType === RankType.Friend;
    }

    refreshWisdom(): void {
        if (!this.wisdomLabel) return;
        
        let wisdom: number;
        if (MgrRank.Instance.rankType === RankType.Year || MgrRank.Instance.rankType === RankType.Friend) {
            wisdom = MgrUser.Instance.userData.getItem(ITEM.Wisdom);
        } else {
            wisdom = MgrRank.Instance.rankData.monthWisdom;
        }
        this.wisdomLabel.string = '' + wisdom;
    }

    refreshTimeShow(): void {
        if (!this.timeLabel) return;
        this.timeLabel.node.active = MgrRank.Instance.rankType === RankType.Month;
    }
}