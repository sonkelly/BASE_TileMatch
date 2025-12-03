import { _decorator, Component, Button, Label, director, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { UIPrefabs } from './Prefabs';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { AsyncQueue } from './AsyncQueue';
import { Language } from './Language';
import { MgrStar } from './MgrStar';
import { MgrUi } from './MgrUi';
import { Utils } from './Utils';
import { AppGame } from './AppGame';
import { BTN_BACK } from './TopUIView';
import { StarleagueStage } from './StarleagueStage';
import { StarEagueRank } from './StarEagueRank';

const { ccclass, property } = _decorator;

@ccclass('StarEagueView')
export class StarEagueView extends Component {
    @property(Button)
    helpBtn: Button | null = null;

    @property(Label)
    cdLabel: Label | null = null;

    @property(StarleagueStage)
    starleagueStage: StarleagueStage | null = null;

    @property(StarEagueRank)
    starEagueRank: StarEagueRank | null = null;

    private _dayHourStr: string = '';
    private _hideCall: (() => void) | null = null;
    private _taskAsync: AsyncQueue | null = null;

    onLoad() {
        this.helpBtn?.node.on('click', this._onClickHelp, this);
        this._dayHourStr = Language.Instance.getLangByID('Language371');
        if (this.starEagueRank) {
            this.starEagueRank.delegate = this;
        }
    }

    reuse(data: any) {
        if (data) {
            this._hideCall = data.hideCall;
        }
    }

    onEnable() {
        director.on(GlobalEvent.StarEagueTimeChange, this._onStarEagueTimeChange, this);
        this._onStarEagueTimeChange();
        this._checkshowHelp();
        
        if (this.starleagueStage && MgrStar.Instance.starData) {
            this.starleagueStage.init(MgrStar.Instance.starData.level);
        }

        AppGame.topUI.addBackFunc(() => {
            const animCtrl = this.node.getComponent(ViewAnimCtrl);
            if (animCtrl) {
                animCtrl.onClose();
            }
            AppGame.topUI.showMain();
        });

        AppGame.Ins.checkNetwork();
        AppGame.topUI.show(BTN_BACK);
        this._runTask();
    }

    onDisable() {
        director.targetOff(this);
        if (this._taskAsync) {
            this._taskAsync.clear();
            this._taskAsync = null;
        }
        this.unscheduleAllCallbacks();
    }

    private _onStarEagueTimeChange() {
        const remainTime = MgrStar.Instance.getRemainTime();
        if (this.cdLabel) {
            this.cdLabel.string = remainTime >= 0 ? Utils.timeConvertToHHMM(remainTime) : '';
        }
    }

    private _checkshowHelp() {
        if (MgrStar.Instance.starData && MgrStar.Instance.starData.showHelp <= 0) {
            MgrStar.Instance.starData.addShowHelp();
            MgrUi.Instance.openViewAsync(UIPrefabs.StarEagueHelpView);
        }
    }

    private _runTask() {
        this._taskAsync = new AsyncQueue();
        this._taskAsync.push((next: Function) => {
            this.scheduleOnce(() => {
                if (this.starEagueRank) {
                    this.starEagueRank.playRankChange(next);
                }
            });
        });
        this._taskAsync.complete = () => {};
        this._taskAsync.play();
    }

    onClickClose() {
        if (this._hideCall) {
            this._hideCall();
        }
        this.node.emit('Close');
    }

    private _onClickHelp() {
        MgrUi.Instance.openViewAsync(UIPrefabs.StarEagueHelpView);
    }
}