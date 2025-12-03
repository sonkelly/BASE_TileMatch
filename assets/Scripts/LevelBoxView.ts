import { _decorator, Component, Node, Button, Layout, Tween, tween, v3, easing } from 'cc';
import { AppGame } from './AppGame';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { AnalyticsManager } from './AnalyticsManager';

const { ccclass, property } = _decorator;

enum LevelBoxType {
    Back = 1,
    Hint = 2,
    Fresh = 3
}

@ccclass('LevelBoxView')
export class LevelBoxView extends Component {
    @property(Button)
    useBackBtn: Button = null!;

    @property(Button)
    useHitBtn: Button = null!;

    @property(Button)
    useFreshBtn: Button = null!;

    @property(Layout)
    boxContent: Layout = null!;

    @property([Node])
    arrawNodes: Node[] = [];

    onLoad() {
        this.useBackBtn.node.on('click', this._onClickUseBack, this);
        this.useHitBtn.node.on('click', this._onClickuseHit, this);
        this.useFreshBtn.node.on('click', this._onClickuseFresh, this);
    }

    onEnable() {
        this.useBackBtn.interactable = true;
        this.useHitBtn.interactable = true;
        this.useFreshBtn.interactable = true;

        const collectorLength = AppGame.gameCtrl?.collector?.CollectOrderTiles?.length || 0;
        this.useBackBtn.node.active = collectorLength > 0;

        const spacingX = collectorLength > 0 ? 20 : 60;
        this.boxContent.spacingX = spacingX;

        this.arrawNodes.forEach((node) => {
            Tween.stopAllByTarget(node);
            tween(node)
                .set({ position: v3(0, -250, 0) })
                .to(0.5, { position: v3(0, -200, 0) }, { easing: easing.sineIn })
                .delay(0.16)
                .to(0.5, { position: v3(0, -250, 0) }, { easing: easing.sineOut })
                .delay(0.16)
                .union()
                .repeatForever()
                .start();
        });
    }

    onDisable() {
        this.arrawNodes.forEach((node) => {
            Tween.stopAllByTarget(node);
        });
    }

    private _onClickUseBack() {
        this.useBackBtn.interactable = false;
        AppGame.gameCtrl.undo();
        this._reportEvent(LevelBoxType.Back);
        this._close();
    }

    private _onClickuseHit() {
        this.useHitBtn.interactable = false;
        AppGame.gameCtrl.wand();
        this._reportEvent(LevelBoxType.Hint);
        this._close();
    }

    private _onClickuseFresh() {
        this.useFreshBtn.interactable = false;
        AppGame.gameCtrl.shuffle();
        this._reportEvent(LevelBoxType.Fresh);
        this._close();
    }

    private _reportEvent(type: LevelBoxType) {
        AnalyticsManager.getInstance().reportLevelAdBox({
            Prop_Type: type
        });
    }

    private _close() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }
}