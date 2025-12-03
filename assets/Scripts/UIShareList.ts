import { _decorator, Component, Label, Sprite, Node, SpriteFrame, Color, assetManager, ImageAsset, Texture2D, cclegacy } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { ScreenShot } from './ScreenShot';
import { MgrRank } from './MgrRank';
import { SdkBridge } from './SdkBridge';
import { MgrAnalytics } from './MgrAnalytics';
import { AnalyticsManager } from './AnalyticsManager';

const { ccclass, property } = _decorator;

const RankIndexColorSelf = '#FCFF00';
const RankIndexColorOther = '#FFFFFF';

@ccclass('UIShareList')
export class UIShareList extends Component {
    @property(Label)
    score: Label | null = null;

    @property(Sprite)
    headSprite: Sprite | null = null;

    @property([Node])
    list: Node[] = [];

    @property([SpriteFrame])
    spRanks: SpriteFrame[] = [];

    @property([SpriteFrame])
    spGuas: SpriteFrame[] = [];

    @property(SpriteFrame)
    selfCircle: SpriteFrame | null = null;

    @property(SpriteFrame)
    otherCircle: SpriteFrame | null = null;

    reuse(data: any): void {
        if (this.score) {
            this.score.string = data.score.toString();
        }
        this.setIcon(data.icon, this.headSprite);
        this.loadList();
        this.scheduleOnce(() => {
            this.share();
        }, 1.5);

        const shareType = data.shareType;
        MgrAnalytics.Instance.data.addShareTime(shareType);
        const totalCount = MgrAnalytics.Instance.data.getShareTotalCount();
        AnalyticsManager.getInstance().reportShareClick({
            Click_Num: totalCount,
            Share_Type: shareType
        });
    }

    loadList(): void {
        const rankData = MgrRank.Instance.friendList.rankData;
        this.list.forEach((item, index) => {
            item.active = true;
            const data = rankData[index];
            
            if (data) {
                const gua1 = item.getChildByName('gua1')!.getComponent(Sprite)!;
                const rankSp = item.getChildByName('rankSp')!.getComponent(Sprite)!;
                const rankNumber = item.getChildByName('ranknumber')!;
                const rankLabel = rankNumber.getChildByName('Label')!.getComponent(Label)!;
                const headBg = item.getChildByName('headNode')!.getChildByName('headBg')!.getComponent(Sprite)!;
                const headIcon = headBg.node.getChildByName('Mask')!.getChildByName('head')!.getComponent(Sprite)!;
                const nameLabel = item.getChildByName('nameLabel')!.getComponent(Label)!;
                const wisdomLabel = item.getChildByName('wisdomLayout')!.getChildByName('wisdomNode')!.getChildByName('wisdomBg')!.getChildByName('Label')!.getComponent(Label)!;

                if (data.rank > 3) {
                    gua1.node.active = rankSp.node.active = false;
                    rankNumber.active = true;
                    rankLabel.string = data.rank.toString();
                } else {
                    gua1.node.active = rankSp.node.active = true;
                    gua1.spriteFrame = this.spGuas[data.rank - 1];
                    rankSp.spriteFrame = this.spRanks[data.rank - 1];
                    rankNumber.active = false;
                }

                nameLabel.string = data.name;
                wisdomLabel.string = data.wisdom.toString();

                if (data.me) {
                    headBg.spriteFrame = this.selfCircle;
                    const selfColor = Color.fromHEX(RankIndexColorSelf);
                    rankLabel.color = wisdomLabel.color = nameLabel.color = selfColor;
                } else {
                    headBg.spriteFrame = this.otherCircle;
                    const otherColor = Color.fromHEX(RankIndexColorOther);
                    rankLabel.color = wisdomLabel.color = nameLabel.color = otherColor;
                }

                this.setIcon(data.head + '', headIcon);
            } else {
                item.active = false;
            }
        });
    }

    setIcon(url: string, sprite: Sprite | null): void {
        if (!sprite) return;

        assetManager.downloader.downloadDomImage(url, { ext: '.jpg' }, (err, image) => {
            if (err || !sprite.isValid) return;

            const imageAsset = new ImageAsset(image);
            const spriteFrame = new SpriteFrame();
            const texture = new Texture2D();
            
            texture.image = imageAsset;
            spriteFrame.texture = texture;
            sprite.spriteFrame = spriteFrame;
        });
    }

    async share(): Promise<void> {
        try {
            const base64 = await ScreenShot.NodeToBase64(this.node);
            await SdkBridge.shareAsync({
                intent: 'SHARE',
                image: base64,
                text: 'Come play with me!'
            });
        } catch (error) {
            // Handle share error
        } finally {
            this.node.getComponent(ViewAnimCtrl)!.onClose();
        }
    }
}