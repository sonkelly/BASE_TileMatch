import { _decorator, Component, Node, UIOpacity, Label, Vec2, NodeEventType, director, Tween, tween, easing, Vec3, cclegacy } from 'cc';
import { UIPool } from './UIPool';
import { MgrMine, EStageBoxState, EBrickState } from './MgrMine';
import { GemItem } from './GemItem';
import { BrickSpine } from './BrickSpine';
import { MineItem } from './MineItem';
import { GlobalEvent } from './Events';
import { MgrUser } from './MgrUser';
import { ITEM } from './GameConst';
import { UIUtil } from './UIUtil';
import { Guide_Layer, UI_2D_Layer } from './Const';
import { MgrUi } from './MgrUi';
import { UIPrefabs } from './Prefabs';

const { ccclass, property } = _decorator;

@ccclass('MineContent')
export class MineContent extends Component {
    @property(MineItem)
    mineItem1: MineItem = null!;

    @property(MineItem)
    mineItem2: MineItem = null!;

    @property(Node)
    mineTouch: Node = null!;

    @property(Node)
    mineMaskNode: Node = null!;

    @property(UIOpacity)
    mineMaskOpacity: UIOpacity = null!;

    @property(UIPool)
    flyGemPool: UIPool = null!;

    @property(Node)
    flyGemContent: Node = null!;

    @property(UIPool)
    spinePool: UIPool = null!;

    @property(Node)
    spineContent: Node = null!;

    @property(Label)
    allFinishTip: Label = null!;

    @property(Node)
    pickaxeNode: Node = null!;

    private _mineContentDelegate: any = null;
    private _curMineItem: MineItem = null!;
    private _nextMineItem: MineItem = null!;
    private _spineItemNodes: Node[] = [];
    private _flyGemItem: Node = null!;
    private _isFlyGem: boolean = false;

    get delegate(): any {
        return this._mineContentDelegate;
    }

    set delegate(value: any) {
        this._mineContentDelegate = value;
    }

    get curMineItem(): MineItem {
        return this._curMineItem;
    }

    get nextMineItem(): MineItem {
        return this._nextMineItem;
    }

    onLoad() {
        this._curMineItem = this.mineItem2;
        this._nextMineItem = this.mineItem1;
    }

    onEnable() {
        this.mineTouch.on(NodeEventType.TOUCH_END, this._touchEnd, this);
        director.on(GlobalEvent.MineBreakBrickSpineFinish, this._onBreakBrickSpineFinish, this);
        this._isFlyGem = false;
        this.mineMaskNode.active = true;
        this.mineMaskOpacity.opacity = 0;
        this._checkAllFinishTip();
    }

    onDisable() {
        this.mineTouch.off(NodeEventType.TOUCH_END, this._touchEnd, this);
        director.targetOff(this);
        
        if (this._flyGemItem) {
            Tween.stopAllByTarget(this._flyGemItem);
            this._flyGemItem = null;
        }

        this._spineItemNodes.forEach((node) => {
            node.getComponent(BrickSpine)!.reset();
            this.spinePool.put(node);
        });
        this._spineItemNodes.length = 0;
        this.flyGemPool.clear();
        this.unscheduleAllCallbacks();
    }

    private _touchEnd(event: any) {
        if (this._isFlyGem) return;

        const location = new Vec2();
        event.getUILocation(location);

        const brickItems = this._curMineItem.brickItems;
        if (brickItems.length <= 0) {
            console.error('no brickItems!');
            return;
        }

        let targetBrick = null;
        for (const brick of brickItems) {
            if (brick.checkDig(location)) {
                targetBrick = brick;
                break;
            }
        }

        if (!targetBrick) return;

        if (!this.delegate.checkGuideLimtedTouch(targetBrick)) {
            if (MgrUser.Instance.userData.getItem(ITEM.PickAxe) > 0) {
                if (MgrUser.Instance.userData.subItem(ITEM.PickAxe, 1, { type: 'Mining' }) && 
                    MgrMine.Instance.hitBrick(targetBrick.brickInfo.id)) {
                    
                    director.emit(GlobalEvent.MineBreakBrick);
                    
                    const spineNode = this.spinePool.get();
                    spineNode.name = targetBrick.brickInfo.id.toString();
                    spineNode.parent = this.spineContent;
                    spineNode.getComponent(BrickSpine)!.playDig(targetBrick, this._curMineItem.targetScale);
                    this._spineItemNodes.push(spineNode);

                    const gemData = MgrMine.Instance.digGem(targetBrick.brickInfo.id);
                    if (gemData) {
                        this._isFlyGem = true;
                        this.scheduleOnce(() => {
                            this._dealCollectGem(gemData);
                        }, 0.5);
                    }
                }
            } else {
                if (!MgrUi.Instance.hasView(UIPrefabs.MineNotEnableTipView.url)) {
                    MgrUi.Instance.openViewAsync(UIPrefabs.MineNotEnableTipView);
                }
            }
        }
    }

    private _dealCollectGem(gemData: any) {
        const gemItems = this._curMineItem.gemItems;
        if (gemItems.length <= 0) {
            console.error('no gemItems!');
            return;
        }

        let mapGemItem = null;
        for (const gem of gemItems) {
            if (gem.gemMapData.id == gemData.id) {
                mapGemItem = gem;
                break;
            }
        }

        const stageGems = this.delegate.getCurStageGems();
        let stageGemItem = null;
        for (const gem of stageGems) {
            if (gem.gemStageData.id == gemData.id) {
                stageGemItem = gem;
                break;
            }
        }

        if (!mapGemItem || !stageGemItem) {
            console.error('no mapGemItem! or no stageGemItem! hitGemMapId', gemData.id);
            this._isFlyGem = false;
            return;
        }

        const startPos = new Vec3(mapGemItem.node.worldPosition);
        const startScale = new Vec3(mapGemItem.node.worldScale);
        const endPos = new Vec3(stageGemItem.node.worldPosition);
        const endScale = new Vec3(stageGemItem.node.worldScale);
        const midScale = new Vec3(1.1 * startScale.x, 1.1 * startScale.y, startScale.z);

        this._flyGemItem = this.flyGemPool.get();
        this._flyGemItem.name = gemData.id + '_fly';
        this._flyGemItem.parent = this.flyGemContent;
        this._flyGemItem.active = true;
        UIUtil.changeLayer(this._flyGemItem, Guide_Layer);

        const gemComp = this._flyGemItem.getComponent(GemItem)!;
        gemComp.reset();
        gemComp.refresh(gemData);
        this._flyGemItem.setWorldPosition(startPos);
        this._flyGemItem.setWorldScale(startScale);

        Tween.stopAllByTarget(this._flyGemItem);
        tween(this._flyGemItem)
            .to(0.24, { worldScale: midScale }, { easing: easing.backIn })
            .call(() => {
                mapGemItem.refreshGemShowState();
            })
            .to(0.48, { worldPosition: endPos, worldScale: endScale }, { easing: easing.backIn })
            .call(() => {
                stageGemItem.refreshGemShowState();
                UIUtil.changeLayer(this._flyGemItem, UI_2D_Layer);
                this.flyGemPool.put(this._flyGemItem);
                this._flyGemItem = null;
                this._isFlyGem = false;
                director.emit(GlobalEvent.MineCollectGem);
                MgrMine.Instance.reportProgress();
                this._checkStageAllGemCollect();
            })
            .start();
    }

    private _checkStageAllGemCollect() {
        const stageInfo = MgrMine.Instance.data.getStageBoxInfo(this.delegate.getCurMineCfg().id);
        if (stageInfo.state !== EStageBoxState.Open) return;

        const brickItems = this._curMineItem.brickItems;
        if (brickItems.length <= 0) {
            console.error('no brickItems!');
            return;
        }

        for (const brick of brickItems) {
            if (brick.brickInfo.state === EBrickState.Idle) {
                brick.brickInfo.state = EBrickState.Break;
                MgrMine.Instance.data.doDrity();

                const spineNode = this.spinePool.get();
                spineNode.name = brick.brickInfo.id.toString();
                spineNode.parent = this.spineContent;
                spineNode.getComponent(BrickSpine)!.playBreak(brick, this._curMineItem.targetScale);
                this._spineItemNodes.push(spineNode);
                brick.refreshBrickShowState();
            }
        }

        this.delegate.showAdvanced();
    }

    private _onBreakBrickSpineFinish(node: Node) {
        const index = this._spineItemNodes.indexOf(node);
        if (index >= 0) {
            this._spineItemNodes.splice(index, 1);
            node.getComponent(BrickSpine)!.reset();
            this.spinePool.put(node);
        }
    }

    private _checkAllFinishTip() {
        const isFinish = MgrMine.Instance.isFinish();
        this.allFinishTip.node.active = isFinish;
        this.pickaxeNode.active = !isFinish;
    }

    refreshCurMine(data: any) {
        this._curMineItem.node.active = true;
        this._curMineItem.refreshMine(data);
    }

    refreshNextMine(data: any) {
        this._nextMineItem.node.active = true;
        this._nextMineItem.refreshMine(data);
    }

    showMask() {
        this.mineMaskNode.active = true;
        this.mineMaskOpacity.opacity = 0;
        Tween.stopAllByTarget(this.mineMaskOpacity);
        tween(this.mineMaskOpacity)
            .to(0.5, { opacity: 75 }, { easing: easing.linear })
            .start();
    }

    hideMask() {
        this.mineMaskOpacity.opacity = 75;
        Tween.stopAllByTarget(this.mineMaskOpacity);
        tween(this.mineMaskOpacity)
            .to(0.5, { opacity: 0 }, { easing: easing.linear })
            .call(() => {
                this.mineMaskNode.active = false;
            })
            .start();
    }

    showSwitchMine() {
        this._curMineItem.playHide();
        this._nextMineItem.playShow();
        this.scheduleOnce(() => {
            this._checkAllFinishTip();
        }, 0.36);
    }

    switchStage() {
        const temp = this._curMineItem;
        this._curMineItem = this._nextMineItem;
        this._nextMineItem = temp;
        this._curMineItem.node.setSiblingIndex(1);
        this._nextMineItem.node.setSiblingIndex(0);
    }
}