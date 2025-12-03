import { _decorator, Component, Node, Sprite, SpriteFrame, Label, ProgressBar, cclegacy } from 'cc';
import { passRewardItem } from './passRewardItem';
import { MgrPass } from './MgrPass';

const { ccclass, property } = _decorator;

@ccclass('passItem')
export class passItem extends Component {
    @property(passRewardItem)
    freeRewardItem: passRewardItem = null!;

    @property(passRewardItem)
    adRewardItem: passRewardItem = null!;

    @property(Sprite)
    starNode: Sprite = null!;

    @property(SpriteFrame)
    passStar: SpriteFrame = null!;

    @property(SpriteFrame)
    lockStar: SpriteFrame = null!;

    @property(Node)
    star: Node = null!;

    @property(Label)
    lvLabel: Label = null!;

    @property(ProgressBar)
    topProNode: ProgressBar = null!;

    @property(ProgressBar)
    buttomProNode: ProgressBar = null!;

    private data: any = null;

    onEnable() {}

    show(data: any, currentLevel: any) {
        this.data = data;
        this.showItem();
        this.buttomProNode.node.parent.active = data.level !== currentLevel.level;
    }

    showItem() {
        this.lvLabel.string = '' + this.data.level;
        this.freeRewardItem.show(this.data, true);
        this.adRewardItem.show(this.data, false);

        const isPassed = MgrPass.Instance.data.passLevel >= this.data.totalLv;
        
        this.star.active = this.data.level === 0;
        this.lvLabel.node.active = this.data.level !== 0;
        this.starNode.spriteFrame = isPassed ? this.passStar : this.lockStar;

        const isCurrentEndLevel = MgrPass.Instance.getPassEndData().level === this.data.level;
        const taskData = MgrPass.Instance.getPassTaskData();
        const currentLevel = MgrPass.Instance.data.passLevel;

        if (isPassed) {
            this.topProNode.progress = 1;
            if (isCurrentEndLevel) {
                const progress = (currentLevel - (taskData.totalLv - taskData.stage)) / taskData.stage;
                this.buttomProNode.progress = 2 * progress;
            } else {
                this.buttomProNode.progress = 1;
            }
        } else {
            if (taskData.level === this.data.level) {
                const progress = (currentLevel - (taskData.totalLv - taskData.stage)) / taskData.stage;
                this.topProNode.progress = 2 * (progress - 0.5);
            } else {
                this.topProNode.progress = 0;
            }
            this.buttomProNode.progress = 0;
        }
    }
}