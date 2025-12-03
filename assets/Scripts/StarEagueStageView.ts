import { _decorator, Component, Button, Node, CCInteger } from 'cc';
import { AsyncQueue } from './AsyncQueue';
import { StarleagueStage } from './StarleagueStage';

const { ccclass, property } = _decorator;

@ccclass('StarEagueStageView')
export class StarEagueStageView extends Component {
    @property(Button)
    sureBtn: Button | null = null;

    @property(StarleagueStage)
    starleagueStage: StarleagueStage | null = null;

    private _hideCall: (() => void) | null = null;
    private _prevLevel: number = 0;
    private _curLevel: number = 0;
    private _taskAsync: AsyncQueue | null = null;

    onLoad() {
        this.sureBtn?.node.on('click', this._onClickSureBtn, this);
    }

    onEnable() {
        this.starleagueStage?.init(this._prevLevel);
        this._runTask();
    }

    onDisable() {
        this._taskAsync?.clear();
        this._taskAsync = null;
        this.unscheduleAllCallbacks();
    }

    reuse(params: { hideCall?: () => void; prevLevel?: number; curLevel?: number }) {
        if (params) {
            this._hideCall = params.hideCall || null;
            this._prevLevel = params.prevLevel || 0;
            this._curLevel = params.curLevel || 0;
        }
    }

    private _runTask() {
        if (!this.sureBtn || !this.starleagueStage) return;

        this.sureBtn.node.active = false;
        this._taskAsync = new AsyncQueue();

        this._taskAsync.push((next) => {
            this.starleagueStage!.step(this._curLevel);
            this.scheduleOnce(next, 1);
        });

        this._taskAsync.complete = () => {
            this.sureBtn!.node.active = true;
        };

        this._taskAsync.play();
    }

    private _onClickSureBtn() {
        this._hideCall?.();
        this.node.emit('Close');
    }
}