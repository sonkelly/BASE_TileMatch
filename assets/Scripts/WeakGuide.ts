import { _decorator, Component, Node, Label, Tween, Widget, instantiate, UITransform, Button, tween, NodeEventType, Vec3, cclegacy } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import {Language} from './Language';

const { ccclass, property } = _decorator;

export enum GuidePos {
    Top = 1,
    Button = 2,
    Left = 3,
    Right = 4,
    Center = 5
}

export enum GuideType {
    Angle = 1,
    Touch = 2
}

@ccclass('WeakGuide')
export class WeakGuide extends Component {
    @property(Node)
    guideBox: Node | null = null;

    @property(Node)
    guideAngle: Node | null = null;

    @property(Node)
    guideTouch: Node | null = null;

    @property(Label)
    textLabel: Label | null = null;

    @property(Node)
    viewNode: Node | null = null;

    private guideNode: Node | null = null;
    private guideType: GuideType | null = null;
    private clickCall: (() => void) | null = null;
    private closeCall: (() => void) | null = null;
    private boxPos: GuidePos | null = null;
    private blockTouch: boolean = false;
    private boxDistance: number = 0;

    reuse(data: {
        node: Node;
        click: () => void;
        close: () => void;
        pos: GuidePos;
        lang: string;
        blockTouch: boolean;
        type?: GuideType;
        boxDistance?: number;
    }) {
        this.guideNode = data.node;
        this.clickCall = data.click;
        this.closeCall = data.close;
        this.boxPos = data.pos;
        this.blockTouch = data.blockTouch === true;
        this.guideType = data.type || GuideType.Angle;
        this.boxDistance = data.boxDistance || 100;
        
        if (this.textLabel) {
            this.textLabel.string = Language.Instance.getLangByID(data.lang);
        }
    }

    onEnable() {
        const tempVec = new Vec3();
        
        this.viewNode?.removeAllChildren();
        Tween.stopAllByTarget(this.guideAngle);
        this.node.getComponent(Widget)?.updateAlignment();
        this.viewNode?.getComponent(Widget)?.updateAlignment();

        if (!this.guideNode) return;

        const guideClone = instantiate(this.guideNode);
        const worldPos = this.guideNode.getWorldPosition();
        
        guideClone.parent = this.viewNode;
        guideClone.scale = Vec3.ONE;
        guideClone.setSiblingIndex(0);
        
        this.viewNode?.getComponent(UITransform)?.convertToNodeSpaceAR(worldPos, tempVec);
        guideClone.setPosition(tempVec);
        
        guideClone.on('click', () => {
            const button = guideClone.getComponent(Button);
            if (button) button.interactable = false;
            
            this.clickCall?.();
            this.onClose();
        }, this);

        const guideUITransform = guideClone.getComponent(UITransform);
        if (guideUITransform && this.guideBox) {
            const guidePos = this.getGuidePos(tempVec, guideUITransform);
            this.guideBox.setPosition(guidePos);

            const anglePos = this.getAnglePos(tempVec, guideUITransform);
            if (this.guideAngle) {
                this.guideAngle.setPosition(anglePos);
                this.guideAngle.active = this.guideType === GuideType.Angle;
            }

            if (this.guideTouch) {
                this.guideTouch.active = this.guideType === GuideType.Touch;
            }

            switch (this.guideType) {
                case GuideType.Angle:
                    if (this.guideAngle && this.boxPos) {
                        const anglePos = this.getAnglePos(tempVec, guideUITransform);
                        this.guideAngle.setPosition(anglePos);
                        this.setAngle(this.guideAngle, this.boxPos);

                        const tweenPos = this.getTweenPos();
                        tween(this.guideAngle)
                            .by(0.5, { position: tweenPos.start })
                            .by(0.5, { position: tweenPos.end })
                            .union()
                            .repeatForever()
                            .start();
                    }
                    break;
                    
                case GuideType.Touch:
                    if (this.guideTouch) {
                        this.guideTouch.setPosition(tempVec);
                        tempVec.set(this.guideBox.position);
                        tempVec.x = 0;
                        this.guideBox.position = tempVec;
                    }
                    break;
            }
        }
    }

    private getGuidePos(targetPos: Vec3, targetTransform: UITransform): Vec3 {
        let offsetX = 0;
        let offsetY = 0;

        if (!this.guideBox) return targetPos.clone();

        const guideUITransform = this.guideBox.getComponent(UITransform);
        if (!guideUITransform) return targetPos.clone();

        switch (this.boxPos) {
            case GuidePos.Top:
                offsetY = guideUITransform.height / 2 + targetTransform.height / 2 + this.boxDistance;
                break;
            case GuidePos.Button:
                offsetY = -(guideUITransform.height / 2 + targetTransform.height / 2 + this.boxDistance);
                break;
            case GuidePos.Left:
                offsetX = -(guideUITransform.width / 2 + targetTransform.width / 2 + this.boxDistance);
                break;
            case GuidePos.Right:
                offsetX = guideUITransform.width / 2 + targetTransform.width / 2 + this.boxDistance;
                break;
        }

        return new Vec3(targetPos.x + offsetX, targetPos.y + offsetY, 0);
    }

    private getAnglePos(targetPos: Vec3, targetTransform: UITransform): Vec3 {
        let offsetX = 0;
        let offsetY = 0;

        if (!this.guideAngle) return targetPos.clone();

        const angleUITransform = this.guideAngle.getComponent(UITransform);
        if (!angleUITransform) return targetPos.clone();

        switch (this.boxPos) {
            case GuidePos.Top:
                offsetY = angleUITransform.height / 2 + targetTransform.height / 2;
                break;
            case GuidePos.Button:
                offsetY = -(angleUITransform.height / 2 + targetTransform.height / 2);
                break;
            case GuidePos.Left:
                offsetX = -(angleUITransform.width / 2 + targetTransform.width / 2);
                break;
            case GuidePos.Right:
                offsetX = angleUITransform.width / 2 + targetTransform.width / 2;
                break;
        }

        return new Vec3(targetPos.x + offsetX, targetPos.y + offsetY, 0);
    }

    private setAngle(node: Node, pos: GuidePos): void {
        switch (pos) {
            case GuidePos.Top:
                node.angle = 90;
                break;
            case GuidePos.Button:
                node.angle = -90;
                break;
            case GuidePos.Left:
                node.angle = 180;
                break;
            case GuidePos.Right:
                node.angle = 0;
                break;
        }
    }

    private getTweenPos(): { start: Vec3; end: Vec3 } {
        let start = Vec3.ZERO.clone();
        let end = Vec3.ZERO.clone();

        switch (this.boxPos) {
            case GuidePos.Top:
                start.set(0, 20, 0);
                end.set(0, -20, 0);
                break;
            case GuidePos.Button:
                start.set(0, -20, 0);
                end.set(0, 20, 0);
                break;
            case GuidePos.Left:
                start.set(20, 0, 0);
                end.set(-20, 0, 0);
                break;
            case GuidePos.Right:
                start.set(-20, 0, 0);
                end.set(20, 0, 0);
                break;
        }

        return { start, end };
    }

    onLoad() {
        this.node.on(NodeEventType.TOUCH_END, this.onTouchBlock, this);
    }

    private onTouchBlock() {
        if (!this.blockTouch) {
            this.onClose();
        }
    }

    private onClose() {
        this.closeCall?.();
        this.node.getComponent(ViewAnimCtrl)?.onClose();
    }
}