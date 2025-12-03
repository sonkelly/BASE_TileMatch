import { _decorator, Component, Node, Label, tween, Vec3, Tween, Button, CCBoolean } from 'cc';
import { GameConst, ITEM } from './GameConst';
import {Toast} from './Toast';
import {Language} from './Language';
import { MgrGame } from './MgrGame';
import { MgrUser } from './MgrUser';
import { AdsManager } from './AdsManager';
import { AppGame } from './AppGame';
import { TopUIItem } from './TopUIItem';

const { ccclass, property } = _decorator;

@ccclass('LightingBtn')
export class LightingBtn extends Component {
    @property(Node)
    animNode: Node | null = null;

    @property(Label)
    lightingLabel: Label | null = null;

    onLoad() {
        if (this.lightingLabel) {
            this.lightingLabel.string = '+' + GameConst.PROP_LIGHT_AD_NUM;
        }
        this.node.on('click', this.onLightingBtn, this);
    }

    onEnable() {
        this.animEnable();
    }

    onDisable() {
        this.animDisable();
    }

    animEnable() {
        if (!this.animNode) return;
        
        tween(this.animNode)
            .to(0.25, { scale: new Vec3(1.05, 1.1, 1) }, { easing: 'sineInOut' })
            .to(0.25, { scale: Vec3.ONE }, { easing: 'sineInOut' })
            .to(0.25, { scale: new Vec3(1.05, 1.1, 1) }, { easing: 'sineInOut' })
            .to(0.25, { scale: Vec3.ONE }, { easing: 'sineInOut' })
            .delay(2)
            .union()
            .repeatForever()
            .start();
    }

    animDisable() {
        if (!this.animNode) return;
        Tween.stopAllByTarget(this.animNode);
    }

    onLightingBtn() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'LightBtn',
            AdsType: 'AdLevelLight',
            onSucceed: () => {
                const button = this.node.getComponent(Button);
                if (button) {
                    button.interactable = false;
                }

                const lightningItem = AppGame.topUI.lightningItem;
                MgrGame.Instance.goldLighting = false;

                lightningItem.show(0.3, () => {
                    this.scheduleOnce(() => {
                        MgrUser.Instance.userData.addItem(ITEM.Light, GameConst.PROP_LIGHT_AD_NUM, {
                            sourcePos: this.node.getWorldPosition(),
                            type: 'AdLevelLight',
                            callback: () => {
                                this.scheduleOnce(() => {
                                    AppGame.topUI.lightningItem.hide();
                                }, 0.8);
                            }
                        });
                    }, 0.034);

                    const topUIItem = this.node.getComponent(TopUIItem);
                    if (topUIItem) {
                        topUIItem.hide();
                    }
                });
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }
}