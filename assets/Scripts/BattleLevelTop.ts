import { _decorator, Component, Node, Sprite, Label, Tween, tween, v3, easing } from 'cc';
import { MgrBattleLevel } from './MgrBattleLevel';

const { ccclass, property } = _decorator;

@ccclass('BattleLevelTop')
export class BattleLevelTop extends Component {
    @property(Node)
    battleLevelNode: Node | null = null;

    @property(Sprite)
    headMeSp: Sprite | null = null;

    @property(Sprite)
    headOtherSp: Sprite | null = null;

    @property(Node)
    headMeNode: Node | null = null;

    @property(Node)
    headOtherNode: Node | null = null;

    @property(Node)
    vsNode: Node | null = null;

    @property(Sprite)
    progressSpMe: Sprite | null = null;

    @property(Sprite)
    progressSpOther: Sprite | null = null;

    @property(Label)
    progressLabMe: Label | null = null;

    @property(Label)
    progressLabOther: Label | null = null;

    @property(Node)
    progressLabelNodeMe: Node | null = null;

    @property(Node)
    progressLabelNodeOt: Node | null = null;

    @property(Node)
    finishNodeMe: Node | null = null;

    @property(Node)
    finishNodeOt: Node | null = null;

    @property(Label)
    nameLabelMe: Label | null = null;

    @property(Label)
    nameLabelOt: Label | null = null;

    initHeadAndNick() {
        MgrBattleLevel.Instance.initBattleLevelHeads(this.headMeSp, this.headOtherSp);
        MgrBattleLevel.Instance.initNick(this.nameLabelMe, this.nameLabelOt);
    }

    battleLevelTopEnter() {
        if (this.battleLevelNode.position.y !== 110) {
            this.battleLevelNode.active = true;
            Tween.stopAllByTarget(this.battleLevelNode);
            tween(this.battleLevelNode)
                .to(0.24, { position: v3(0, 110, 0) }, { easing: easing.sineIn })
                .start();
        }
    }

    battleLevelTopExit() {
        if (this.battleLevelNode.position.y !== 270) {
            Tween.stopAllByTarget(this.battleLevelNode);
            tween(this.battleLevelNode)
                .to(0.24, { position: v3(0, 270, 0) }, { easing: easing.sineOut })
                .call(() => {
                    this.battleLevelNode.active = false;
                })
                .start();
        }
    }

    refreshSelfProgress(progress: string, fillRange: number) {
        this.progressLabMe.string = progress;
        this.progressSpMe.fillRange = fillRange;
        this.progressLabelNodeMe.active = fillRange !== 1;
        this.finishNodeMe.active = fillRange === 1;
    }

    refreshOtherProgress(progress: string, fillRange: number) {
        this.progressLabOther.string = progress;
        this.progressSpOther.fillRange = fillRange;
        this.progressLabelNodeOt.active = fillRange !== 1;
        this.finishNodeOt.active = fillRange === 1;
    }

    runVsAnimation() {
        Tween.stopAllByTarget(this.headMeNode);
        tween(this.headMeNode)
            .to(0.07, { scale: v3(1.2, 1.2, 1) })
            .to(0.07, { scale: v3(1, 1, 1) })
            .start();

        Tween.stopAllByTarget(this.headOtherNode);
        tween(this.headOtherNode)
            .to(0.07, { scale: v3(1.2, 1.2, 1) })
            .to(0.07, { scale: v3(1, 1, 1) })
            .start();

        Tween.stopAllByTarget(this.vsNode);
        tween(this.vsNode)
            .to(0.07, { scale: v3(1.2, 1.2, 1) })
            .to(0.07, { scale: v3(1, 1, 1) })
            .start();
    }
}