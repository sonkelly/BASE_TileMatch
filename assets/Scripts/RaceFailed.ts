import { _decorator, Component, Node, Button } from 'cc';
import { RaceFailedType, MgrRace } from './MgrRace';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';

const { ccclass, property } = _decorator;

@ccclass('RaceFailed')
class RaceFailed extends Component {
    @property(Node)
    failedTypeNode1: Node | null = null;

    @property(Node)
    failedTypeNode2: Node | null = null;

    @property(Button)
    continueBtn: Button | null = null;

    private _faildType: RaceFailedType = RaceFailedType.None;

    reuse(data: { faildType: RaceFailedType }) {
        this._faildType = data.faildType;
    }

    onLoad() {
        this.continueBtn?.node.on('click', this._onClickContinue, this);
    }

    onEnable() {
        if (this.failedTypeNode1) {
            this.failedTypeNode1.active = this._faildType === RaceFailedType.Rank;
        }
        if (this.failedTypeNode2) {
            this.failedTypeNode2.active = this._faildType === RaceFailedType.Boom;
        }
        if (this.continueBtn) {
            this.continueBtn.interactable = true;
        }
    }

    onDisable() {
        // Add any necessary cleanup code here
    }

    private _onClickContinue() {
        if (this.continueBtn) {
            this.continueBtn.interactable = false;
        }
        MgrRace.Instance.settlementOneTurn();
        MgrUi.Instance.closeView(UIPrefabs.RaceView.url);
        this.node.getComponent(ViewAnimCtrl)?.onClose();
        MgrRace.Instance.checkAutoPopMatchView();
    }
}