import { _decorator, Node, Button, Label, Tween, UIOpacity, tween, v3, director, Component } from 'cc';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { GlobalEvent } from './Events';
import { AppGame } from './AppGame';
import { NativeBridge } from './NativeBridge';
import { MgrGame } from './MgrGame';
import { Language } from './Language';
import { MgrUi } from './MgrUi';

const { ccclass, property } = _decorator;

@ccclass('MineNotEnableTipView')
export class MineNotEnableTipView extends Component {
    @property(Node)
    lightNode: Node | null = null;

    @property(Button)
    closeBtn: Button | null = null;

    @property(Button)
    playBtn: Button | null = null;

    @property(Label)
    currLevelLabel: Label | null = null;

    onLoad() {
        this.closeBtn!.node.on('click', this._clickClose, this);
        this.playBtn!.node.on('click', this._clickPlay, this);
    }

    onEnable() {
        const curLv = MgrGame.Instance.gameData.curLv;
        this.currLevelLabel!.string = Language.Instance.getLangByID('Language1').replace('{0}', '' + curLv);
        this._startLightAction();
    }

    onDisable() {
        this._stopLightAction();
    }

    private _stopLightAction() {
        Tween.stopAllByTarget(this.lightNode!);
        Tween.stopAllByTarget(this.lightNode!.getComponent(UIOpacity)!);
    }

    private _startLightAction() {
        tween(this.lightNode!.getComponent(UIOpacity)!)
            .set({ opacity: 0 })
            .to(0.1, { opacity: 200 })
            .start();

        tween(this.lightNode!)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(18, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    private _clickClose() {
        this.node.emit(VIEW_ANIM_EVENT.Remove, this);
    }

    private _clickPlay() {
        director.emit(GlobalEvent.MinePlayGame);
        AppGame.topUI.clearBackFunc();
        MgrUi.Instance.closeAll();
        AppGame.topUI.lightningItem.hide();
        MgrGame.Instance.enterLevel();
        NativeBridge.Instance.showInterstitialIfCooldown({ OpenUi: 'PickaxeGet' });
        this.node.emit(VIEW_ANIM_EVENT.Remove, this);
    }
}