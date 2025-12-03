import { _decorator, Component, Sprite, Size, UITransform, cclegacy } from 'cc';
import { IMAGE_ICON_PATH } from './Prefabs';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import {isNil, isEmpty} from 'lodash-es';

const { ccclass, property, requireComponent } = _decorator;

@ccclass('UIIcon')
@requireComponent(Sprite)
export class UIIcon extends Component {
    private _sprite: Sprite | null = null;
    private _transform: UITransform | null = null;
    private _iconUrlPath: string = IMAGE_ICON_PATH;
    private _icon: string | null = null;
    private iconOriginSize: Size | null = null;

    get iconSprite(): Sprite {
        if (!this._sprite) {
            this._sprite = this.node.getComponent(Sprite)!;
        }
        return this._sprite;
    }

    get iconSize(): Size {
        if (!this.iconOriginSize) {
            this.iconOriginSize = new Size();
            this.iconOriginSize.set(this.iconSprite.node.getComponent(UITransform)!.contentSize);
            this.iconSprite.trim = true;
            this.iconSprite.sizeMode = Sprite.SizeMode.RAW;
        }
        return this.iconOriginSize;
    }

    get transform(): UITransform {
        if (isNil(this._transform)) {
            this._transform = this.node.getComponent(UITransform)!;
        }
        return this._transform;
    }

    get iconUrlPath(): string {
        return this._iconUrlPath;
    }

    set iconUrlPath(value: string) {
        this._iconUrlPath = value;
    }

    get icon(): string | null {
        return this._icon;
    }

    set icon(value: string | null) {
        if (this._icon !== value) {
            this._icon = value;
            this.applyIcon();
        }
    }

    applyIcon(): void {
        if (isEmpty(this.icon)) {
            this.iconSprite.spriteFrame = null;
        } else {
            const path = this.iconUrlPath + '/' + this.icon;
            this.loadSpriteFrame(path);
        }
    }

    loadSpriteFrame(path: string): void {
        const size = this.iconSize;
        this.iconSprite.spriteFrame = AssetMgr.Instance.getSpriteFrame(BUNDLE_NAMES.Game, path);
        
        let scale = size.height / this.transform.height;
        if (this.transform.width > this.transform.height) {
            scale = size.width / this.transform.width;
        }
        this.iconSprite.node.setScale(scale, scale, scale);
    }
}