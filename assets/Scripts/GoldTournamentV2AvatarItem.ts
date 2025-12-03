import { _decorator, Component, Vec3, Color, UIOpacity, Sprite, Label, view, cclegacy } from 'cc';
import { AvatarFrameItemType } from './GoldTournamentAvatarItem';
import { AvatarFrame2Cfg } from './AvatarFrame2Cfg';

const { ccclass, property } = _decorator;

const tempVec3 = new Vec3();
const grayColor = new Color().fromHEX('#BDBDBD');
const whiteColor = new Color().fromHEX('#FFFFFF');
const rotationVec = new Vec3(0, 0, 0);

@ccclass('GoldTournamentV2AvatarItem')
export class GoldTournamentV2AvatarItem extends Component {
    @property(UIOpacity)
    light: UIOpacity = null!;

    @property(Sprite)
    avatarSp: Sprite = null!;

    @property(Label)
    costLabel: Label = null!;

    private _viewSizeX: number = 0;
    private _offsetX: number = 0;
    private _itemType: AvatarFrameItemType = AvatarFrameItemType.Empty;
    private _frameId: number = 0;

    onEnable() {
        this._viewSizeX = view.getVisibleSize().width / 2;
    }

    lateUpdate(dt: number) {
        if (this._itemType === AvatarFrameItemType.Item) {
            this._offsetX = Math.abs(this.node.worldPosition.x - this._viewSizeX);
            
            let scaleValue: number;
            if (this._offsetX <= 60) {
                scaleValue = 1;
                this.avatarSp.color = whiteColor;
            } else {
                scaleValue = 1 - 0.0015 * (this._offsetX - 60);
                this.avatarSp.color = grayColor;
            }

            scaleValue = Math.max(scaleValue, 0.55);
            tempVec3.set(scaleValue, scaleValue, scaleValue);
            this.avatarSp.node.setScale(tempVec3);

            this.light.opacity = scaleValue === 1 ? 200 : 0;
            
            if (scaleValue === 1) {
                rotationVec.z += -0.4;
                this.light.node.eulerAngles = rotationVec;
            }
        }
    }

    setType(type: AvatarFrameItemType) {
        this._itemType = type;
        this.avatarSp.node.active = type !== AvatarFrameItemType.Empty;
        this.costLabel.node.active = type === AvatarFrameItemType.Item;
        this.light.node.active = type === AvatarFrameItemType.Item;
    }

    async refreshSp(frameId: number) {
        this._frameId = frameId;
        this.avatarSp.spriteFrame = await AvatarFrame2Cfg.Instance.getAvatarFrameSpriteframe(frameId);
    }

    refreshLabel(cost: number) {
        this.costLabel.string = cost.toString();
    }

    get frameId(): number {
        return this._frameId;
    }
}