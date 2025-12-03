import { _decorator, Component, Node, Button, Label, Sprite, SpriteFrame, macro, Enum, cclegacy } from 'cc';
import { ACTIVITY_ID, ACTIVE_STATUS } from './Const';
import { MgrGoldTournament } from './MgrGoldTournament';
import { MgrGoldTournamentV2 } from './MgrGoldTournamentV2';
import { MgrPass } from './MgrPass';
import { MgrRace } from './MgrRace';
import { MgrStar } from './MgrStar';
import { MgrToyRace } from './MgrToyRace';
import { MgrWinStreak } from './MgrWinStreak';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import { Utils } from './Utils';
import { MgrMine } from './MgrMine';

const { ccclass, property } = _decorator;

@ccclass('UIActivePreviewItem')
export class UIActivePreviewItem extends Component {
    @property({
        type: Enum(ACTIVITY_ID)
    })
    activityId: ACTIVITY_ID = ACTIVITY_ID.WIN_STREAK;

    @property(Button)
    btnEnter: Button = null!;

    @property(Node)
    remainTimeNode: Node = null!;

    @property(Label)
    remainTimeLabel: Label = null!;

    @property(Label)
    activityOpenInfo: Label = null!;

    @property(Node)
    lockNode: Node = null!;

    @property(Sprite)
    line: Sprite = null!;

    @property(SpriteFrame)
    lockFrame: SpriteFrame = null!;

    @property(SpriteFrame)
    normalFrame: SpriteFrame = null!;

    @property(Sprite)
    iconBg: Sprite = null!;

    @property(SpriteFrame)
    lockBg: SpriteFrame = null!;

    @property(SpriteFrame)
    normalBg: SpriteFrame = null!;

    private _delegate: any = null;
    private root: any = null;
    private _currStatus: any = null;

    get delegate(): any {
        if (this._delegate === null) {
            switch (this.activityId) {
                case ACTIVITY_ID.WIN_STREAK:
                    this._delegate = MgrWinStreak.Instance;
                    break;
                case ACTIVITY_ID.WIN_STREAK2:
                    this._delegate = MgrWinStreakV2.Instance;
                    break;
                case ACTIVITY_ID.TOY_RACE:
                    this._delegate = MgrToyRace.Instance;
                    break;
                case ACTIVITY_ID.STAR_LEAGUE:
                    this._delegate = MgrStar.Instance;
                    break;
                case ACTIVITY_ID.PASS:
                    this._delegate = MgrPass.Instance;
                    break;
                case ACTIVITY_ID.GOLD_RACE:
                    this._delegate = MgrGoldTournament.Instance;
                    break;
                case ACTIVITY_ID.GOLD_RACE2:
                    this._delegate = MgrGoldTournamentV2.Instance;
                    break;
                case ACTIVITY_ID.Race:
                    this._delegate = MgrRace.Instance;
                    break;
                case ACTIVITY_ID.Mine:
                    this._delegate = MgrMine.Instance;
                    break;
            }
        }
        return this._delegate;
    }

    onLoad() {
        this.btnEnter.node.on(Button.EventType.CLICK, this.onClickEnter, this);
    }

    onClickEnter() {
        this.delegate.onEnter();
        this.root.close();
    }

    onEnable() {
        this.schedule(this.fixedUpdate, 1, macro.REPEAT_FOREVER);
        this._currStatus = this.delegate.getActiveStatus();
        this.refreshStatusInfo(this._currStatus);
    }

    onDisable() {
        this.unscheduleAllCallbacks();
    }

    fixedUpdate(dt: number) {
        const status = this.delegate.getActiveStatus();
        if (this._currStatus !== status) {
            this._currStatus = status;
            this.refreshStatusInfo(status);
        }
        if (status === ACTIVE_STATUS.ACTIVE) {
            this.refreshRemainTime();
        }
    }

    refreshStatusInfo(status: any) {
        switch (status) {
            case ACTIVE_STATUS.LOCK:
                this.refreshUnlockInfo();
                break;
            case ACTIVE_STATUS.GAP:
                this.refreshOpenInfo();
                break;
            case ACTIVE_STATUS.ACTIVE:
                this.refreshRemainTime();
                break;
        }

        this.remainTimeNode.active = status === ACTIVE_STATUS.ACTIVE;
        this.btnEnter.node.active = status === ACTIVE_STATUS.ACTIVE && this.delegate.hasGuide();
        this.activityOpenInfo.node.parent.active = status !== ACTIVE_STATUS.ACTIVE;
        this.activityOpenInfo.node.parent.getComponent(Sprite).grayscale = status !== ACTIVE_STATUS.ACTIVE;
        this.line.spriteFrame = status === ACTIVE_STATUS.ACTIVE ? this.normalFrame : this.lockFrame;
        this.iconBg.spriteFrame = status === ACTIVE_STATUS.ACTIVE ? this.normalBg : this.lockBg;
    }

    refreshRemainTime() {
        const time = this.delegate.getRemainTime();
        this.setTime(time);
    }

    setTime(time: number) {
        this.remainTimeLabel.string = Utils.timeConvertToHHMM(time);
    }

    refreshUnlockInfo() {
        this.activityOpenInfo.string = this.delegate.getUnlockInfo();
    }

    refreshOpenInfo() {
        this.activityOpenInfo.string = this.delegate.getOpenTimeInfo();
    }
}