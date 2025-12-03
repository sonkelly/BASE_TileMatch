import { _decorator, Node, sp, Label, director, NodeEventType, UITransform, v3, Component, cclegacy } from 'cc';
import { MgrMine, EBrickState, MineGuideSteps } from './MgrMine';
import {Language} from './Language';
import { GlobalEvent } from './Events';
import {UIUtil} from './UIUtil';
import { Guide_Layer, UI_2D_Layer } from './Const';

const { ccclass, property } = _decorator;

@ccclass('MineGuide')
export class MineGuide extends Component {
    @property(Node)
    guideNode: Node = null!;

    @property(Node)
    clickMask: Node = null!;

    @property(Node)
    maskNode: Node = null!;

    @property(sp.Skeleton)
    fingerSpine: sp.Skeleton = null!;

    @property(Node)
    tipNode: Node = null!;

    @property(Label)
    tipLabel: Label = null!;

    private _mineGuideDelegate: any = null;
    private _gemNode: Node | null = null;
    private _wallDoorNode: Node | null = null;
    private _pickaxeNode: Node | null = null;
    private _boxContentCmp: any = null;
    private _canTouchMask: boolean = true;

    get delegate(): any {
        return this._mineGuideDelegate;
    }

    set delegate(value: any) {
        this._mineGuideDelegate = value;
    }

    onEnable(): void {
        director.on(GlobalEvent.MineBreakBrick, this._onMineBreakBrick, this);
        director.on(GlobalEvent.MineCollectGem, this._onMineCollectGem, this);
        this.maskNode.on(NodeEventType.TOUCH_END, this._touchEnd, this);
        this._canTouchMask = true;
    }

    onDisable(): void {
        this._hideFinger();
        this._resetTargetNode();
        director.targetOff(this);
        this.unscheduleAllCallbacks();
    }

    checkGuideStep(): void {
        this.guideNode.active = true;
        this._hideFinger();
        if (MgrMine.Instance.checkInGuide()) {
            this._triggerGuideStep();
        }
    }

    private _triggerGuideStep(): void {
        switch (MgrMine.Instance.data.guideStep) {
            case 1:
                this.guideNode.active = false;
                this._showTip();
                
                const brick1 = this.delegate.getMapTargetBrick(1, 0);
                if (brick1) {
                    this._showFinger();
                    this.fingerSpine.node.setWorldPosition(brick1.node.worldPosition);
                }
                
                const gemPos = this.delegate.getMapGemWorldPosition(1);
                if (gemPos) {
                    this.clickMask.setWorldPosition(gemPos);
                }
                
                const gemSize = this.delegate.getMapGemCotentSize(1);
                if (gemSize) {
                    this.clickMask.getComponent(UITransform)!.setContentSize(gemSize);
                }
                
                const pickaxeNode = this.delegate.getPickaxeNode();
                if (pickaxeNode) {
                    this._pickaxeNode = pickaxeNode;
                    UIUtil.changeLayer(this._pickaxeNode, Guide_Layer);
                }
                
                const gemNode = this.delegate.getGemNode();
                if (gemNode) {
                    this._gemNode = gemNode;
                    UIUtil.changeLayer(this._gemNode, Guide_Layer);
                }
                
                const wallDoorNode = this.delegate.getWallDoorNode();
                if (wallDoorNode) {
                    this._wallDoorNode = wallDoorNode;
                    UIUtil.changeLayer(this._wallDoorNode, Guide_Layer);
                }
                
                const boxContentCmp = this.delegate.getBoxContentCmp();
                if (boxContentCmp) {
                    this._boxContentCmp = boxContentCmp;
                    UIUtil.changeLayer(this._boxContentCmp.node, Guide_Layer);
                    this._boxContentCmp.showMask();
                }
                break;
                
            case 2:
                this.guideNode.active = false;
                this._showTip();
                
                const brick1_case2 = this.delegate.getMapTargetBrick(1, 0);
                const brick2_case2 = this.delegate.getMapTargetBrick(1, 1);
                let targetBrick = null;
                
                if (brick1_case2?.brickInfo.state === EBrickState.Idle) {
                    targetBrick = brick1_case2;
                }
                if (brick2_case2?.brickInfo.state === EBrickState.Idle) {
                    targetBrick = brick2_case2;
                }
                
                if (targetBrick) {
                    this._showFinger();
                    this.fingerSpine.node.setWorldPosition(targetBrick.node.worldPosition);
                }
                
                const gemPos_case2 = this.delegate.getMapGemWorldPosition(1);
                if (gemPos_case2) {
                    this.clickMask.setWorldPosition(gemPos_case2);
                }
                
                const gemSize_case2 = this.delegate.getMapGemCotentSize(1);
                if (gemSize_case2) {
                    this.clickMask.getComponent(UITransform)!.setContentSize(gemSize_case2);
                }
                
                const pickaxeNode_case2 = this.delegate.getPickaxeNode();
                if (pickaxeNode_case2) {
                    this._pickaxeNode = pickaxeNode_case2;
                    UIUtil.changeLayer(this._pickaxeNode, Guide_Layer);
                }
                
                const gemNode_case2 = this.delegate.getGemNode();
                if (gemNode_case2) {
                    this._gemNode = gemNode_case2;
                    UIUtil.changeLayer(this._gemNode, Guide_Layer);
                }
                
                const wallDoorNode_case2 = this.delegate.getWallDoorNode();
                if (wallDoorNode_case2) {
                    this._wallDoorNode = wallDoorNode_case2;
                    UIUtil.changeLayer(this._wallDoorNode, Guide_Layer);
                }
                
                const boxContentCmp_case2 = this.delegate.getBoxContentCmp();
                if (boxContentCmp_case2) {
                    this._boxContentCmp = boxContentCmp_case2;
                    UIUtil.changeLayer(this._boxContentCmp.node, Guide_Layer);
                    this._boxContentCmp.showMask();
                }
                break;
                
            case 3:
                this.guideNode.active = false;
                this._showTip();
                
                const pickaxeNode_case3 = this.delegate.getPickaxeNode();
                if (pickaxeNode_case3) {
                    this._pickaxeNode = pickaxeNode_case3;
                    UIUtil.changeLayer(this._pickaxeNode, Guide_Layer);
                }
                break;
                
            case 4:
                this.guideNode.active = false;
                this._showTip();
                
                const gemNode_case4 = this.delegate.getGemNode();
                if (gemNode_case4) {
                    this._gemNode = gemNode_case4;
                    UIUtil.changeLayer(this._gemNode, Guide_Layer);
                }
                
                const wallDoorNode_case4 = this.delegate.getWallDoorNode();
                if (wallDoorNode_case4) {
                    this._wallDoorNode = wallDoorNode_case4;
                    UIUtil.changeLayer(this._wallDoorNode, Guide_Layer);
                }
                
                const boxContentCmp_case4 = this.delegate.getBoxContentCmp();
                if (boxContentCmp_case4) {
                    this._boxContentCmp = boxContentCmp_case4;
                    UIUtil.changeLayer(this._boxContentCmp.node, Guide_Layer);
                    this._boxContentCmp.hideMask();
                }
                break;
        }
    }

    private _onMineBreakBrick(): void {
        if (MgrMine.Instance.data.guideStep === 1) {
            MgrMine.Instance.data.guideStep++;
            this._hideFinger();
            this._hideTip();
            this.scheduleOnce(() => {
                this._resetTargetNode();
                this.checkGuideStep();
            }, 1);
        } else if (MgrMine.Instance.data.guideStep === 2) {
            MgrMine.Instance.data.guideStep++;
            this._canTouchMask = false;
            this._hideFinger();
            this._hideTip();
        }
    }

    private _touchEnd(): void {
        if (this._canTouchMask && (MgrMine.Instance.data.guideStep === 3 || MgrMine.Instance.data.guideStep === 4)) {
            MgrMine.Instance.data.guideStep++;
            this._resetTargetNode();
            this.checkGuideStep();
        }
    }

    private _onMineCollectGem(): void {
        if (MgrMine.Instance.data.guideStep === 3) {
            this._canTouchMask = true;
            this._resetTargetNode();
            this.checkGuideStep();
        }
    }

    private _showTip(): void {
        this.tipNode.active = true;
        const step = MgrMine.Instance.data.guideStep;
        let tipText = '';
        
        if (step <= 2) {
            tipText = Language.Instance.getLangByID('mine_guide_tip1');
        } else if (step === 3) {
            tipText = Language.Instance.getLangByID('mine_guide_tip2');
        } else {
            tipText = Language.Instance.getLangByID('mine_guide_tip3');
        }
        
        this.tipLabel.string = tipText;
        const tipY = MineGuideSteps[step - 1].tipY;
        this.tipNode.setPosition(v3(0, tipY, 0));
    }

    private _hideTip(): void {
        this.tipNode.active = false;
    }

    private _showFinger(): void {
        this.fingerSpine.node.active = true;
        this.fingerSpine.setAnimation(0, 'novice_hand', true);
    }

    private _hideFinger(): void {
        this.fingerSpine.clearAnimations();
        this.fingerSpine.node.active = false;
    }

    private _resetTargetNode(): void {
        this.clickMask.getComponent(UITransform)!.setContentSize(0, 0);
        
        if (this._gemNode) {
            UIUtil.changeLayer(this._gemNode, UI_2D_Layer);
            this._gemNode = null;
        }
        
        if (this._wallDoorNode) {
            UIUtil.changeLayer(this._wallDoorNode, UI_2D_Layer);
            this._wallDoorNode = null;
        }
        
        if (this._pickaxeNode) {
            UIUtil.changeLayer(this._pickaxeNode, UI_2D_Layer);
            this._pickaxeNode = null;
        }
        
        if (this._boxContentCmp) {
            UIUtil.changeLayer(this._boxContentCmp.node, UI_2D_Layer);
            this._boxContentCmp.hideMask();
            this._boxContentCmp = null;
        }
    }

    checkGuideLimtedTouch(target: any): boolean {
        if (!MgrMine.Instance.checkInGuide()) {
            return false;
        }
        
        if (MgrMine.Instance.data.guideStep === 1 || MgrMine.Instance.data.guideStep === 2) {
            const brick1 = this.delegate.getMapTargetBrick(1, 0);
            const brick2 = this.delegate.getMapTargetBrick(1, 1);
            
            if (target !== brick1 && target !== brick2) {
                return true;
            }
        }
        
        return false;
    }
}