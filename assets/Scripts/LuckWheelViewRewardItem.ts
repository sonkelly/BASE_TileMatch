import { _decorator, Component, Sprite, Label, UITransform, Size, CCClass, cclegacy } from 'cc';
import { ITEM } from './GameConst';
import {AssetsCfg} from './AssetsCfg';

const { ccclass, property: prop } = _decorator;

@ccclass('LuckWheelViewRewardItem')
export class LuckWheelViewRewardItem extends Component {
    @prop(Sprite)
    iconSp: Sprite | null = null;

    @prop(Label)
    countLabel: Label | null = null;

    @prop(Sprite)
    lightSp: Sprite | null = null;

    private _cfg: any = null;

    get cfg(): any {
        return this._cfg;
    }

    set cfg(value: any) {
        this._cfg = value;
    }

    setIcon(iconName: string): void {
        if (this.iconSp) {
            this.iconSp.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(iconName);
        }
    }

    setCount(count: number): void {
        if (this.countLabel) {
            this.countLabel.string = 'x' + count;
        }
    }

    setIconSize(itemType: ITEM): void {
        if (!this.iconSp || !this.iconSp.node) return;

        const uiTransform = this.iconSp.node.getComponent(UITransform);
        if (!uiTransform) return;

        if (itemType === ITEM.Coin) {
            this.iconSp.sizeMode = Sprite.SizeMode.CUSTOM;
            uiTransform.setContentSize(new Size(60, 60));
        } else {
            this.iconSp.sizeMode = Sprite.SizeMode.TRIMMED;
        }
    }

    setGet(isGot: boolean): void {
        if (this.lightSp && this.lightSp.node) {
            this.lightSp.node.active = isGot;
        }
    }
}