import { _decorator, Component, cclegacy } from 'cc';
import { AppGame } from './AppGame';
import { BTN_BACK } from './TopUIView';
import { ViewAnimCtrl } from './ViewAnimCtrl';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentV2View')
export class GoldTournamentV2View extends Component {
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