import { _decorator, Component, Sprite, Label, assetManager, ImageAsset, SpriteFrame, Texture2D, cclegacy } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { ScreenShot } from './ScreenShot';
import { SdkBridge } from './SdkBridge';
import { MgrAnalytics } from './MgrAnalytics';
import { AnalyticsManager } from './AnalyticsManager';

const { ccclass, property } = _decorator;

@ccclass('UIShareSelf')
export class UIShareSelf extends Component {
    @property(Sprite)
    headSprite: Sprite | null = null;

    @property(Label)
    valueLabel: Label | null = null;

    reuse(data: { score: number; icon: string; shareType: string }): void {
        if (this.valueLabel) {
            this.valueLabel.string = data.score.toString();
        }
        this.setIcon(data.icon);
        
        const shareType = data.shareType;
        MgrAnalytics.Instance.data.addShareTime(shareType);
        const shareTotalCount = MgrAnalytics.Instance.data.getShareTotalCount();
        
        AnalyticsManager.getInstance().reportShareClick({
            Click_Num: shareTotalCount,
            Share_Type: shareType
        });
    }

    setIcon(iconUrl: string): void {
        assetManager.downloader.downloadDomImage(iconUrl, { ext: '.jpg' }, async (err, imageData) => {
            if (err) {
                this.node.getComponent(ViewAnimCtrl)?.onClose();
                return;
            }

            if (this.headSprite && this.headSprite.isValid) {
                const imageAsset = new ImageAsset(imageData);
                const spriteFrame = new SpriteFrame();
                const texture = new Texture2D();
                
                texture.image = imageAsset;
                spriteFrame.texture = texture;
                this.headSprite.spriteFrame = spriteFrame;

                try {
                    const base64Image = await ScreenShot.NodeToBase64(this.node);
                    const shareData = {
                        intent: 'SHARE',
                        image: base64Image,
                        text: 'Come play with me!'
                    };
                    
                    await SdkBridge.shareAsync(shareData);
                    this.node.getComponent(ViewAnimCtrl)?.onClose();
                } catch (error) {
                    this.node.getComponent(ViewAnimCtrl)?.onClose();
                }
            }
        });
    }
}