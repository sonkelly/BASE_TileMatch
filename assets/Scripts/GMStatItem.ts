import { _decorator, Component, Sprite, Label, cclegacy } from 'cc';
import { MgrSkin } from './MgrSkin';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';

const { ccclass, property } = _decorator;

@ccclass('GMStatItem')
export class GMStatItem extends Component {
    @property(Sprite)
    iconSprite: Sprite | null = null;

    @property(Label)
    totalLabel: Label | null = null;

    @property(Label)
    residueLabel: Label | null = null;

    setIcon(iconName: string): void {
        const themeUrl = MgrSkin.Instance.getThemeUrl(MgrSkin.Instance.data.currSkinId) + '/' + iconName;
        this.iconSprite!.spriteFrame = AssetMgr.Instance.getSpriteFrame(BUNDLE_NAMES.Game, themeUrl);
    }

    setTotal(total: number | string): void {
        this.totalLabel!.string = '总：' + total;
    }

    setResidue(residue: number | string): void {
        this.residueLabel!.string = '余：' + residue;
    }
}