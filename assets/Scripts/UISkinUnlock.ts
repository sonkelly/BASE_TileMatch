import { _decorator, Component, Sprite, Button, director } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { GlobalEvent } from './Events';
import { MgrSkin } from './MgrSkin';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { SkinBreviaryPath } from './Const';

const { ccclass, property } = _decorator;

@ccclass('UISkinUnlock')
export class UISkinUnlock extends Component {
    @property(Sprite)
    skinIcon: Sprite | null = null;

    @property(Button)
    okBtn: Button | null = null;

    @property(Button)
    changeBtn: Button | null = null;

    private unlockData: any = null;

    onLoad() {
        this.okBtn!.node.on('click', this.onOk, this);
        this.changeBtn!.node.on('click', this.onChange, this);
    }

    reuse(data: any) {
        this.unlockData = data;
        this.showIcon();
    }

    private async showIcon() {
        const spriteFrame = await AssetMgr.Instance.loadSpriteFrame(
            BUNDLE_NAMES.Game, 
            SkinBreviaryPath + this.unlockData.icon
        );
        this.skinIcon!.spriteFrame = spriteFrame;
    }

    private onOk() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private onChange() {
        MgrSkin.Instance.setCurrSkin(this.unlockData.id);
        director.emit(GlobalEvent.NewSkinViewClose);
        this.onOk();
    }
}