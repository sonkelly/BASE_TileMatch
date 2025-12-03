import { _decorator, Node, SpriteFrame, ProgressBar, Sprite, Tween, Label, Vec3, UITransform, tween, Component, CCFloat } from 'cc';
import { MgrWinStreak } from './MgrWinStreak';
import {WinStreakCfg} from './WinStreakCfg';
import {AvatarCfg} from './AvatarCfg';
import { MgrUser } from './MgrUser';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import WinStreakV2Cfg from './WinStreakV2Cfg';
import { AppGame } from './AppGame';
import { GameMode } from './Const';
import {each, indexOf} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('StreakFailItem')
export class StreakFailItem extends Component {
    @property(Node)
    item: Node = null!;

    @property(Node)
    pointNode: Node = null!;

    @property(Node)
    listNode: Node = null!;

    @property([SpriteFrame])
    lvFrame: SpriteFrame[] = [];

    @property([SpriteFrame])
    lvFrame2: SpriteFrame[] = [];

    @property(ProgressBar)
    streakProgress: ProgressBar = null!;

    @property(Sprite)
    userIcon: Sprite = null!;

    private _lvList: number[] = [];
    private _progress: number = 0;
    private angleNodeY: number = 32;
    private _userIconId: string | null = null;

    showView() {
        Tween.stopAllByTarget(this.pointNode);
        this.showUserIcon();
        this.node.active = AppGame.gameCtrl.currMode !== GameMode.Challenge;
    }

    onEnable() {
        this.item.active = false;
        const animCtrl = this.node.getComponentInParent(ViewAnimCtrl);
        if (animCtrl) {
            animCtrl.node.once('anim-in-done', () => {
                this.showList();
                this.item.active = true;
            });
        } else {
            this.scheduleOnce(() => {
                this.showList();
                this.item.active = true;
            });
        }
    }

    onDisable() {
        Tween.stopAllByTarget(this.pointNode);
    }

    showList() {
        if (AppGame.gameCtrl.currMode === GameMode.Challenge) {
            this.node.active = false;
            return;
        }

        this._lvList = [];
        let streakTime = MgrWinStreak.Instance.getStreakTime();
        let isMaxStage = MgrWinStreak.Instance.isMaxStage();

        if (MgrWinStreakV2.Instance.checkInWinStreak()) {
            streakTime = MgrWinStreakV2.Instance.getStreakTime();
            isMaxStage = MgrWinStreakV2.Instance.isMaxStage();
        }

        if (streakTime <= 0 || isMaxStage) {
            this.node.active = false;
            return;
        }

        this.node.active = true;
        this.initShowList(streakTime);
        this.streakProgress.progress = this._progress;

        let frameList = this.lvFrame;
        if (MgrWinStreakV2.Instance.checkInWinStreak()) {
            frameList = this.lvFrame2;
        }

        each(this.listNode.children, (child: Node, index: number) => {
            const sprite = child.getComponent(Sprite);
            const level = this._lvList[index];
            
            child.getChildByName('lv')!.getComponent(Label)!.string = level.toString();
            
            let cfg = WinStreakCfg.Instance.getCfgByLevel(level);
            if (MgrWinStreakV2.Instance.checkInWinStreak()) {
                cfg = WinStreakV2Cfg.Instance.getCfgByLevel(level);
            }
            
            child.scale = cfg ? new Vec3(1.4, 1.4, 1) : Vec3.ONE;
            
            const isLocked = level > streakTime;
            sprite.spriteFrame = isLocked ? frameList[1] : frameList[0];
        });
    }

    async showUserIcon() {
        if (this._userIconId !== MgrUser.Instance.userData.userHead) {
            this._userIconId = MgrUser.Instance.userData.userHead;
            this.userIcon.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(this._userIconId);
        }
    }

    private initShowList(currentLevel: number) {
        let startLevel = 1;
        const maxLevel = MgrWinStreakV2.Instance.checkInWinStreak() 
            ? WinStreakV2Cfg.Instance.getMaxNum() 
            : WinStreakCfg.Instance.getMaxNum();

        if (currentLevel > maxLevel) {
            currentLevel = maxLevel;
        }

        switch (currentLevel) {
            case 1:
                startLevel = 1;
                break;
            case maxLevel:
            case maxLevel - 1:
            case maxLevel - 2:
            case maxLevel - 3:
            case maxLevel - 4:
                startLevel = maxLevel - 5;
                break;
            default:
                startLevel = currentLevel - 1;
        }

        for (let i = 0; i < 6; i++) {
            const level = startLevel + i;
            this._lvList.push(level);
            
            if (currentLevel === level) {
                this._progress = 0.165 * (i + 1);
            }
        }

        this.showAngle(indexOf(this._lvList, currentLevel));
    }

    private showAngle(index: number) {
        const worldPos = this.listNode.children[index].getWorldPosition();
        const nodePos = this.pointNode.parent!.getComponent(UITransform)!
            .convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y + this.angleNodeY, worldPos.z));
        
        this.pointNode.setPosition(nodePos);
        
        const targetPos = new Vec3(nodePos.x, nodePos.y + 5, nodePos.z);
        
        tween(this.pointNode)
            .to(0.5, { position: targetPos })
            .delay(0.1)
            .to(0.5, { position: nodePos })
            .union()
            .repeatForever()
            .start();
    }
}