import { _decorator, Component, cclegacy } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrBattleLevel } from './MgrBattleLevel';

const { ccclass, property } = _decorator;

@ccclass('BattleLevelStartView')
export class BattleLevelStartView extends Component {
    onEnable() {
        const viewAnimCtrl = this.node.getComponent(ViewAnimCtrl);
        if (viewAnimCtrl) {
            viewAnimCtrl.node.once('anim-in-done', () => {
                this._battleLevelSocial();
            });
        } else {
            this.scheduleOnce(() => {
                this._battleLevelSocial();
            });
        }
    }

    private _battleLevelSocial() {
        MgrBattleLevel.Instance.createBattleLevelSocial(() => {
            this.node.emit(VIEW_ANIM_EVENT.Remove, this);
        });
    }
}