import { _decorator, Component, Node, Vec3, Color, UIOpacity, Sprite, Label, view, Size, SpriteFrame } from 'cc';
import { AvatarFrameCfg } from './AvatarFrameCfg';
const { ccclass, property } = _decorator;

export enum AvatarFrameItemType {
    Empty = 0,
    Item = 1,
    Fly = 2
}

let grayColor = new Color();
Color.fromHEX(grayColor, '#BDBDBD');
let whiteColor = new Color();
Color.fromHEX(whiteColor, '#FFFFFF');
@ccclass('GoldTournamentAvatarItem')
export class GoldTournamentAvatarItem extends Component {
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

    private static readonly grayColor = grayColor;
    private static readonly whiteColor = whiteColor;
    private static readonly tempVec = new Vec3();
    private static readonly tempEuler = new Vec3(0, 0, 0);
    private static opacityFactor: number = 0;

    onEnable() {
        this._viewSizeX = view.getVisibleSize().width / 2;
    }

    lateUpdate(dt: number) {
        if (this._itemType !== AvatarFrameItemType.Item) return;

        this._offsetX = Math.abs(this.node.worldPosition.x - this._viewSizeX);
        
        if (this._offsetX <= 60) {
            GoldTournamentAvatarItem.opacityFactor = 1;
            this.avatarSp.color = GoldTournamentAvatarItem.whiteColor;
        } else {
            GoldTournamentAvatarItem.opacityFactor = 1 - 0.0015 * (this._offsetX - 60);
            this.avatarSp.color = GoldTournamentAvatarItem.grayColor;
        }

        GoldTournamentAvatarItem.opacityFactor = Math.max(GoldTournamentAvatarItem.opacityFactor, 0.55);
        
        GoldTournamentAvatarItem.tempVec.set(
            GoldTournamentAvatarItem.opacityFactor,
            GoldTournamentAvatarItem.opacityFactor,
            GoldTournamentAvatarItem.opacityFactor
        );
        this.avatarSp.node.setScale(GoldTournamentAvatarItem.tempVec);

        this.light.opacity = GoldTournamentAvatarItem.opacityFactor === 1 ? 200 : 0;

        if (GoldTournamentAvatarItem.opacityFactor === 1) {
            GoldTournamentAvatarItem.tempEuler.z -= 0.4;
            this.light.node.eulerAngles = GoldTournamentAvatarItem.tempEuler;
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
        const spriteFrame = await AvatarFrameCfg.Instance.loadAvatarFrameSpriteframe(frameId);
        this.avatarSp.spriteFrame = spriteFrame;
    }

    refreshLabel(cost: number) {
        this.costLabel.string = cost.toString();
    }

    get frameId(): number {
        return this._frameId;
    }
}