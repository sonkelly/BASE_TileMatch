import { _decorator, Component, Node, Label, Button, tween, Tween, v3, Vec3 } from 'cc';
import { Language } from './Language';
import { AdsManager } from './AdsManager';
import { MgrGoldTournamentV2 } from './MgrGoldTournamentV2';
import { Toast } from './Toast';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { MgrUser } from './MgrUser';
import { ITEM } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentV2DoubleView')
export class GoldTournamentV2DoubleView extends Component {
    @property(Node)
    lightNode: Node | null = null;

    @property(Label)
    goldTileCount: Label | null = null;

    @property(Label)
    doubleDesc: Label | null = null;

    @property(Button)
    doubleBtn: Button | null = null;

    @property(Button)
    NoBtn: Button | null = null;

    private _endCall: (() => void) | null = null;
    private _goldCube: number = 0;

    onLoad() {
        this.doubleBtn?.node.on('click', this._onDoubleClick, this);
        this.NoBtn?.node.on('click', this._onNoClick, this);
    }

    reuse(params: { endCall: () => void; goldCube: number }) {
        this._endCall = params.endCall;
        this._goldCube = params.goldCube;
    }

    onEnable() {
        this._startLightAction();
        if (this.goldTileCount) {
            this.goldTileCount.string = 'x' + this._goldCube;
        }

        const claimText = Language.Instance.getLangByID('claim');
        const claim2Text = Language.Instance.getLangByID('claim2');
        if (this.doubleDesc) {
            this.doubleDesc.string = claimText + ' ' + claim2Text;
        }

        if (this.NoBtn?.node) {
            this.NoBtn.node.active = false;
            this.scheduleOnce(() => {
                if (this.NoBtn?.node) {
                    this.NoBtn.node.active = true;
                }
            }, 2);
        }
    }

    onDisable() {
        this._stopLightAction();
    }

    private _startLightAction() {
        if (!this.lightNode) return;
        
        tween(this.lightNode)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(12, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    private _stopLightAction() {
        if (!this.lightNode) return;
        Tween.stopAllByTarget(this.lightNode);
    }

    private _onDoubleClick() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'GoldTournamentV2DoubleView',
            AdsType: 'DoubleGoldTile',
            onSucceed: () => {
                const flyData = {
                    sourcePos: this.doubleBtn?.node.worldPosition || Vec3.ZERO,
                    itemId: ITEM.GoldenTile,
                    change: this._goldCube,
                    result: 2 * this._goldCube,
                    notify: true
                };
                
                MgrUser.Instance.userData.flyAddItem(flyData);
                MgrGoldTournamentV2.Instance.addGoldCubeCnt(2 * this._goldCube);
                this._close();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    private _onNoClick() {
        MgrGoldTournamentV2.Instance.addGoldCubeCnt(this._goldCube);
        this._close();
    }

    private _close() {
        this.getComponent(ViewAnimCtrl)?.onClose();
        this._endCall?.();
    }
}