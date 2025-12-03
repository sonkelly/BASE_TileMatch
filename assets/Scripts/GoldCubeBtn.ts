import { _decorator, Component, Label, Tween, tween, easing, Vec3, v3, cclegacy } from 'cc';
import { MgrBattleLevel } from './MgrBattleLevel';
import { MgrGame } from './MgrGame';
import { GameMode } from './Const';
import { AppGame } from './AppGame';

const { ccclass, property } = _decorator;

@ccclass('GoldCubeBtn')
export class GoldCubeBtn extends Component {
    @property(Label)
    goldCubeCount: Label | null = null;

    hide(): void {
        this.node.active = false;
    }

    showGoldCube(count: number): void {
        this.goldCubeCount!.string = '' + (count || 0);
        
        if (!this.node.active) {
            this.node.active = true;
            Tween.stopAllByTarget(this.node);
            
            const startPos = new Vec3(0, 160, 0);
            const targetPos = this.getShowPosition();
            
            this.node.position = startPos;
            
            tween(this.node)
                .to(0.2, { position: targetPos }, { easing: easing.smooth })
                .start();
        }
    }

    hideGoldCube(): void {
        if (this.node.active) {
            Tween.stopAllByTarget(this.node);
            
            const targetPos = new Vec3(0, 160, 0);
            
            tween(this.node)
                .to(0.2, { position: targetPos }, { easing: easing.smooth })
                .call(() => {
                    this.node.active = false;
                })
                .start();
        }
    }

    fixGoldCubeShowPosition(): void {
        if (this.node.active) {
            tween(this.node)
                .to(0.2, { position: Vec3.ZERO }, { easing: easing.smooth })
                .start();
        }
    }

    setGoldCubeCount(count: number): void {
        this.goldCubeCount!.string = '' + count;
    }

    getShowPosition(): Vec3 {
        const isNotChallengeMode = AppGame.gameCtrl.currMode !== GameMode.Challenge;
        const currentLevel = MgrGame.Instance.gameData.curLv;
        const isBattleLevel = MgrBattleLevel.Instance.checkIsBattleLevel(currentLevel);
        
        return (isNotChallengeMode && isBattleLevel) ? v3(0, -80, 0) : Vec3.ZERO;
    }
}