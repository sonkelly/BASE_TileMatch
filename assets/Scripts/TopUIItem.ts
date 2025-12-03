import { _decorator, CCInteger, UIOpacity, Tween, Layout, UITransform, Vec3, Button, tween, easing, v3, Component, Enum, cclegacy } from 'cc';
import { UIAssetFlyItem } from './UIAssetFlyItem';

const { ccclass, property } = _decorator;

enum WidgetType {
    Left = 1,
    Right = 2,
    Static = 3
}

enum ButtonType {
    Top = 0,
    List = 1
}

@ccclass('TopUIItem')
export class TopUIItem extends Component {
    @property({
        type: Enum(WidgetType)
    })
    widget: WidgetType = WidgetType.Left;

    @property({
        type: CCInteger,
        visible: function(this: TopUIItem) {
            return this.widget === WidgetType.Static;
        }
    })
    staticScale: number = 1;

    @property({
        visible: function(this: TopUIItem) {
            return this.widget === WidgetType.Static;
        }
    })
    opacityEnable: boolean = false;

    @property({
        type: UIOpacity,
        visible: function(this: TopUIItem) {
            return this.opacityEnable === true;
        }
    })
    opacityComp: UIOpacity | null = null;

    @property({
        type: Enum(ButtonType)
    })
    btnType: ButtonType = ButtonType.Top;

    private originPos: Vec3 | null = null;
    private moveWidth: number | null = null;
    private padding: number = 30;
    private gaps: number = 20;
    private _isBlock: boolean = false;
    private _isVisible: boolean = true;

    onDisable() {
        Tween.stopAllByTarget(this.node);
    }

    init() {
        const parentLayout = this.node.parent!.getComponent(Layout)!;
        this.padding = this.widget === WidgetType.Left ? parentLayout.paddingLeft : parentLayout.paddingRight;
        this.gaps = parentLayout.spacingX;
        this.originPos = this.node.getPosition();
        
        const parentTransform = this.node.parent!.getComponent(UITransform);
        this.moveWidth = (parentTransform?.width ?? 0) + 50;
        
        if (this.widget === WidgetType.Static) {
            this.node.scale = Vec3.ZERO;
            this.node.active = false;
        }
    }

    show(duration: number = 0.4, callback: (() => void) | null = null) {
        if (this.isBlock) return;
        if (this.widget === WidgetType.Static) {
            this.showStatic(0.3, callback);
            if (this.btnType) {
                this.node.parent!.active = true;
            }
            return;
        }

        const targetPos = this.getDisPos();
        const currentPos = this.node.getPosition();
        const finalPos = new Vec3(targetPos, this.originPos!.y, 0);

        this.node.active = true;
        if (this.btnType) {
            this.node.parent!.active = true;
        }
        Tween.stopAllByTarget(this.node);

        const button = this.node.getComponent(Button);
        if (button) {
            button.interactable = true;
        }

        if (finalPos.strictEquals(currentPos)) {
            callback?.();
        } else {
            this.node.setPosition(currentPos);
            if (duration === 0) {
                this.node.setPosition(finalPos);
                this.flyPosChange();
                callback?.();
            } else {
                tween(this.node)
                    .to(duration, { position: finalPos }, { easing: easing.backInOut })
                    .call(() => {
                        this.flyPosChange();
                        callback?.();
                    })
                    .start();
            }
        }
    }

    hide(duration: number = 0.4, callback: (() => void) | null = null) {
        if (this.isBlock) return;

        if (this.widget === WidgetType.Static) {
            this.hideStatic(0.1, callback);
            if (this.btnType) {
                this.node.parent!.active = false;
            }
            return;
        }

        const currentPos = this.getDisPos();
        const offset = this.widget === WidgetType.Left ? currentPos - this.moveWidth! : currentPos + this.moveWidth!;
        const targetPos = new Vec3(offset, this.originPos!.y, 0);

        Tween.stopAllByTarget(this.node);

        const button = this.node.getComponent(Button);
        if (button) {
            button.interactable = false;
        }

        if (targetPos.strictEquals(this.node.getPosition())) {
            callback?.();
        } else {
            this.node.active = true;
            if (duration === 0) {
                this.node.setPosition(targetPos);
                this.hideAtOnce();
                callback?.();
            } else {
                this.node.setPosition(this.node.getPosition());
                tween(this.node)
                    .to(duration, { position: targetPos }, { easing: easing.backInOut })
                    .call(() => {
                        this.node.active = false;
                        if (this.btnType) {
                            this.node.parent!.active = false;
                        }
                        callback?.();
                    })
                    .start();
            }
        }
    }

    hideAtOnce() {
        this.node.active = false;
    }

    showAtOnce() {}

    showStatic(duration: number, callback: (() => void) | null = null) {
        const targetPos = this.originPos!;
        const isActive = this.node.active;
        const isAtPosition = targetPos.strictEquals(this.node.getPosition());

        Tween.stopAllByTarget(this.node);

        const button = this.node.getComponent(Button);
        if (button) {
            button.interactable = true;
        }

        if (isAtPosition && isActive && this.node.scale.x === this.staticScale && this.opacityComp?.opacity === 255) {
            callback?.();
        } else {
            this.node.scale = Vec3.ZERO;
            this.node.setPosition(targetPos);
            if (this.opacityEnable) {
                this.opacityComp!.opacity = 0;
            }
            this.node.active = true;

            const targetScale = new Vec3(this.staticScale, this.staticScale, this.staticScale);
            tween(this.node)
                .to(duration, { scale: targetScale }, { easing: easing.backInOut })
                .call(() => {
                    callback?.();
                })
                .start();

            if (this.opacityEnable) {
                tween(this.opacityComp!)
                    .to(duration, { opacity: 255 })
                    .start();
            }
        }
    }

    hideStatic(duration: number, callback: (() => void) | null = null) {
        const targetPos = this.originPos!;
        const isActive = this.node.active;
        const isAtPosition = targetPos.strictEquals(this.node.getPosition());

        Tween.stopAllByTarget(this.node);

        const button = this.node.getComponent(Button);
        if (button) {
            button.interactable = false;
        }

        if (isAtPosition && !isActive && this.node.scale.strictEquals(Vec3.ZERO) && this.opacityComp?.opacity === 0) {
            callback?.();
        } else {
            const currentScale = new Vec3(this.staticScale, this.staticScale, this.staticScale);
            this.node.scale = currentScale;
            this.node.setPosition(targetPos);
            if (this.opacityEnable) {
                this.opacityComp!.opacity = 255;
            }
            this.node.active = true;

            tween(this.node)
                .to(duration, { scale: Vec3.ZERO })
                .call(() => {
                    this.node.active = false;
                    callback?.();
                })
                .start();

            if (this.opacityEnable) {
                tween(this.opacityComp!)
                    .to(duration, { opacity: 0 })
                    .start();
            }
        }
    }

    getDisPos(): number {
        let position = 0;
        const parent = this.node.parent!;

        if (this.widget === WidgetType.Left) {
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                if (child.getComponent(TopUIItem)!.isVisible) {
                    position += this.padding;
                    if (child === this.node) {
                        position += child.getComponent(UITransform)!.width / 2;
                        break;
                    }
                    position += child.getComponent(UITransform)!.width / 2;
                    position += this.gaps;
                }
            }
            return position;
        }

        if (this.widget === WidgetType.Right) {
            for (let i = parent.children.length - 1; i >= 0; i--) {
                const child = parent.children[i];
                if (child.getComponent(TopUIItem)!.isVisible) {
                    position -= this.padding;
                    if (child === this.node) {
                        position -= child.getComponent(UITransform)!.width / 2;
                        
                        if (this.node.name === 'coinValue') {
                            if (this._checkOnlyShopBtn(parent)) {
                                const goldBox = child.getChildByName('goldBox');
                                goldBox?.getComponent(UITransform)?.setContentSize(200, 75);
                                
                                const coinsIcon = child.getChildByName('coins-icon');
                                coinsIcon?.setPosition(v3(-48, 0, 0));
                                
                                const goldNum = child.getChildByName('goldNum');
                                goldNum?.setPosition(v3(24, 0, 0));
                                
                                position -= 20;
                            } else {
                                const goldBox = child.getChildByName('goldBox');
                                goldBox?.getComponent(UITransform)?.setContentSize(250, 75);
                                
                                const coinsIcon = child.getChildByName('coins-icon');
                                coinsIcon?.setPosition(v3(-68, 0, 0));
                                
                                const goldNum = child.getChildByName('goldNum');
                                goldNum?.setPosition(v3(6, 0, 0));
                            }
                        }
                        break;
                    }
                    position -= child.getComponent(UITransform)!.width / 2;
                    position -= this.gaps;
                }
            }
            return position;
        }

        return 0;
    }

    private _checkOnlyShopBtn(parent: any): boolean {
        let hasCoinValue = false;
        let hasShopBtn = false;
        let isShopBtnVisible = false;

        if (parent.children.length !== 2) {
            return false;
        }

        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i];
            if (child.name === 'coinValue') {
                hasCoinValue = true;
            }
            if (child.name === 'shopBtn') {
                hasShopBtn = true;
                isShopBtnVisible = child.getComponent(TopUIItem)?.isVisible ?? false;
            }
        }

        return hasCoinValue && hasShopBtn && !isShopBtnVisible;
    }

    flyPosChange() {
        const flyItems = this.getComponentsInChildren(UIAssetFlyItem);
        if (flyItems.length > 0) {
            flyItems.forEach(item => {
                item.register();
            });
        }
    }

    get isBlock(): boolean {
        return this._isBlock;
    }

    set isBlock(value: boolean) {
        this._isBlock = value;
    }

    get isVisible(): boolean {
        return this._isVisible;
    }

    set isVisible(value: boolean) {
        this._isVisible = value;
    }
}