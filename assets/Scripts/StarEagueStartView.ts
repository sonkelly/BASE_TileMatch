import { _decorator, Component, Button } from 'cc';
import { UIPrefabs } from './Prefabs';
import { MgrStar } from './MgrStar';
import {MgrUi} from './MgrUi';
const { ccclass, property } = _decorator;

@ccclass('StarEagueStartView')
export default class StarEagueStartView extends Component {
    @property(Button)
    public startBtn: Button | null = null;

    @property(Button)
    public closeBtn: Button | null = null;

    private _hideCall: (() => void) | null = null;
    private _guideCall: (() => void) | null = null;

    onLoad() {
        if (this.startBtn) {
            this.startBtn.node.on('click', this._onStartBtn, this);
        }
        if (this.closeBtn) {
            this.closeBtn.node.on('click', this._onCloseBtn, this);
        }
    }

    onEnable() {
        MgrStar.Instance.refreshPopPeriod();
    }

    reuse(data?: { hideCall?: () => void; guideCall?: () => void } | null) {
        if (data) {
            this._hideCall = data.hideCall ?? null;
            this._guideCall = data.guideCall ?? null;
        }
    }

    private _onStartBtn() {
        MgrStar.Instance.joinCurPeriod();
        MgrStar.Instance.resetPrevStar();

        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.StarEagueView, {
            root: MgrUi.root(1),
            data: {
                hideCall: () => {
                    if (this._hideCall) this._hideCall();
                    if (this._guideCall) this._guideCall();
                },
            },
        });

        this.node.emit('Close');
    }

    private _onCloseBtn() {
        if (this._hideCall) this._hideCall();
        if (this._guideCall) this._guideCall();
        this.node.emit('Close');
    }
}