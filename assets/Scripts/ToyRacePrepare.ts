import { _decorator, Component, Button, Label, macro } from 'cc';
import { UIPrefabs } from './Prefabs';
import { MgrToyRace, ToyRaceState } from './MgrToyRace';
import { MgrUi } from './MgrUi';
import { Utils } from './Utils';

const { ccclass, property } = _decorator;

@ccclass('ToyRacePrepare')
export class ToyRacePrepare extends Component {
    @property(Button)
    btnPrepare: Button = null!;

    @property(Button)
    btnClose: Button = null!;

    @property(Label)
    remainTimeLabel: Label = null!;

    private _hideCall: (() => void) | null = null;
    private _guideCall: (() => void) | null = null;

    onLoad() {
        this.btnPrepare.node.on(Button.EventType.CLICK, this.onClickPrepare, this);
        this.btnClose.node.on(Button.EventType.CLICK, this.onClickClose, this);
    }

    reuse(data: { hideCall?: () => void; guideCall?: () => void }) {
        if (data) {
            this._hideCall = data.hideCall || null;
            this._guideCall = data.guideCall || null;
        }
    }

    onClickClose() {
        this._hideCall?.();
        this._guideCall?.();
        this.node.emit('Close');
    }

    onClickPrepare() {
        this.node.emit('Close');
        
        if (MgrToyRace.Instance.toyRaceData.status !== ToyRaceState.None) {
            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRaceView, {
                data: {
                    hideCall: this._hideCall,
                    guideCall: this._guideCall
                }
            });
        } else {
            this._hideCall?.();
        }
    }

    onEnable() {
        this.setTime(MgrToyRace.Instance.getRemainTime());
        this.schedule(this.fixedUpdate, 1, macro.REPEAT_FOREVER);
    }

    onDisable() {
        this._hideCall = null;
        this._guideCall = null;
    }

    fixedUpdate(dt: number) {
        this.setTime(MgrToyRace.Instance.getRemainTime());
    }

    setTime(time: number) {
        this.remainTimeLabel.string = Utils.timeConvertToHHMM(time);
    }
}