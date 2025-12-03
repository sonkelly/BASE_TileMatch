import { _decorator, Component, Node, Label, Button, tween, UIOpacity, Tween, isValid } from 'cc';
import {UIIcon} from './UIIcon';
import { MgrUser } from './MgrUser';
import { AdsManager } from './AdsManager';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import {Toast} from './Toast';
import {Language} from './Language';
import {AssetsCfg} from './AssetsCfg';
import { GameConst, ITEM } from './GameConst';
import { AppGame } from './AppGame';

const { ccclass, property } = _decorator;

@ccclass('CommonDoubleView')
export class CommonDoubleView extends Component {
    @property(Node)
    shainNode: Node | null = null;

    @property(UIIcon)
    icon: UIIcon | null = null;

    @property(Label)
    countLabel: Label | null = null;

    @property(Button)
    normalGet: Button | null = null;

    @property(Button)
    adGet: Button | null = null;

    private _propData: string[] = [];
    private _adType: string = '';
    private _getSource: string = '';

    reuse(data: any) {
        this._propData = data.reward.split('|');
        this._adType = data.adType;
        this._getSource = data.getSource;
    }

    onLoad() {
        this.normalGet?.node.on('click', this.onNormalGet, this);
        this.adGet?.node.on('click', this.onAdGet, this);
    }

    onEnable() {
        MgrUser.Instance.userData.addMemItem(Number(this._propData[0]), Number(this._propData[1]), this._getSource);
        this.icon!.icon = AssetsCfg.Instance.get(Number(this._propData[0])).icon;
        this.countLabel!.string = 'x' + this._propData[1];
        tween(this.shainNode).by(1, { angle: -30 }).repeatForever().start();
        this.normalGet!.node.active = false;

        const normalGetOpacity = this.normalGet!.getComponent(UIOpacity) || this.normalGet!.addComponent(UIOpacity);
        normalGetOpacity.opacity = 0;
        Tween.stopAllByTarget(normalGetOpacity);

        this.scheduleOnce(() => {
            if (isValid(this.normalGet!.node)) {
                this.normalGet!.node.active = true;
                tween(normalGetOpacity).to(0.1, { opacity: 255 }).start();
            }
        }, GameConst.AdNext_Delay_Time);
    }

    onDisable() {
        Tween.stopAllByTarget(this.shainNode);
    }

    onNormalGet() {
        this.showFlyAnim(Number(this._propData[0]), Number(this._propData[1]));
        this.close();
    }

    onAdGet() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'DoubleView',
            AdsType: this._adType,
            onSucceed: () => {
                const itemId = Number(this._propData[0]);
                const itemCount = Number(this._propData[1]);
                if (itemId === ITEM.Light) {
                    AppGame.topUI.lightningItem.show(0.3, () => {
                        this.scheduleOnce(() => {
                            MgrUser.Instance.userData.addItem(itemId, itemCount, {
                                sourcePos: this.icon!.node.getWorldPosition(),
                                type: this._getSource,
                                callback: () => {
                                    this.scheduleOnce(() => {
                                        AppGame.topUI.lightningItem.hide();
                                    }, 0.8);
                                }
                            });
                        }, 0.034);
                        this.close();
                    });
                } else {
                    MgrUser.Instance.userData.addItem(itemId, itemCount, {
                        sourcePos: this.icon!.node.getWorldPosition(),
                        type: this._getSource
                    });
                    this.close();
                }
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    showFlyAnim(itemId: number, itemCount: number) {
        const itemData = MgrUser.Instance.userData.getItem(itemId);
        if (itemId === ITEM.Light) {
            AppGame.topUI.lightningItem.show(0.3, () => {
                this.scheduleOnce(() => {
                    MgrUser.Instance.userData.flyAddItem({
                        itemId,
                        change: itemCount,
                        result: itemData,
                        sourcePos: this.icon!.node.getWorldPosition(),
                        callback: () => {
                            this.scheduleOnce(() => {
                                AppGame.topUI.lightningItem.hide();
                            }, 0.8);
                        }
                    });
                }, 0.034);
                this.close();
            });
        } else {
            MgrUser.Instance.userData.flyAddItem({
                itemId,
                change: itemCount,
                result: itemData,
                sourcePos: this.icon!.node.getWorldPosition()
            });
        }
    }

    close() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }
}