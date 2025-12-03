import { _decorator, Component, cclegacy } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import { BTN_BACK } from './TopUIView';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentView')
export class GoldTournamentView extends Component {
    onEnable() {
        const self = this;
        AppGame.topUI.addBackFunc(() => {
            self._onBackBtn();
            AppGame.topUI.showMain();
        });
        AppGame.topUI.show(BTN_BACK);
        AppGame.Ins.checkNetwork();
    }

    onDisable() {}

    private _onBackBtn() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }
}