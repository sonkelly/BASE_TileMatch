import { _decorator, Component, Node, Label, Button, tween, v3, Tween } from 'cc';
import {Language} from './Language';
import {MgrUser} from './MgrUser';
import { ITEM } from './GameConst';
import {ViewAnimCtrl} from './ViewAnimCtrl';
import {AdsManager} from './AdsManager';
import {Toast} from './Toast';
import {MgrMine} from './MgrMine';
import {MineMenu} from './MineMenu';
import {AppGame} from './AppGame';

const { ccclass, property } = _decorator;

@ccclass('MineViewDoubleView')
export class MineViewDoubleView extends Component {
    @property(Node)
    lightNode: Node | null = null;

    @property(Label)
    countLabel: Label | null = null;

    @property(Label)
    doubleDesc: Label | null = null;

    @property(Button)
    doubleBtn: Button | null = null;

    @property(Button)
    NoBtn: Button | null = null;

    private _endCall: (() => void) | null = null;
    private _pickAxeCnt: number = 0;

    onLoad() {
        this.doubleBtn!.node.on('click', this._onDoubleClick, this);
        this.NoBtn!.node.on('click', this._onNoClick, this);
    }

    reuse(params: { endCall: () => void; pickAxeCnt: number }) {
        this._endCall = params.endCall;
        this._pickAxeCnt = params.pickAxeCnt;
    }

    onEnable() {
        this._startLightAction();
        this.countLabel!.string = 'x' + this._pickAxeCnt;
        
        const claim = Language.Instance.getLangByID('claim');
        const claim2 = Language.Instance.getLangByID('claim2');
        this.doubleDesc!.string = claim + ' ' + claim2;
        
        this.NoBtn!.node.active = false;
        this.scheduleOnce(() => {
            this.NoBtn!.node.active = true;
        }, 2);
    }

    onDisable() {
        this._stopLightAction();
    }

    private _startLightAction() {
        tween(this.lightNode)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(12, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    private _stopLightAction() {
        Tween.stopAllByTarget(this.lightNode!);
    }

    private _onDoubleClick() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'MineViewDoubleView',
            AdsType: 'DoublePickaxe',
            onSucceed: () => {
                const flyData = {
                    sourcePos: this.doubleBtn!.node.worldPosition,
                    itemId: ITEM.PickAxe,
                    change: this._pickAxeCnt,
                    result: 2 * this._pickAxeCnt,
                    notify: true
                };
                
                MgrUser.Instance.userData.flyAddItem(flyData);
                MgrUser.Instance.userData.addItem(ITEM.PickAxe, this._pickAxeCnt, {
                    type: 'Mining'
                });

                const mineMenu = AppGame.topUI.mineBtn.getComponent(MineMenu);
                if (mineMenu) {
                    mineMenu.addPickAxe(this._pickAxeCnt);
                }

                MgrMine.Instance.reportMiningPickaxeGet(this._pickAxeCnt, 2);
                this._close();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    private _onNoClick() {
        this._close();
    }

    private _close() {
        this.getComponent(ViewAnimCtrl)!.onClose();
        this._endCall && this._endCall();
    }
}