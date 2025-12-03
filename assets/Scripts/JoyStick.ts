import { _decorator, Component, Node, UITransform, UIOpacity, Vec3, Vec2, macro, math } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JoyStick')
export class JoyStick extends Component {
    @property({
        type: Node,
        displayName: 'Dot',
        tooltip: '摇杆操纵点'
    })
    dot: Node | null = null;

    @property({
        type: Node,
        tooltip: '摇杆背景节点'
    })
    bg: Node | null = null;

    @property({
        type: Node,
        tooltip: '指示效果'
    })
    arrow: Node | null = null;

    private _touchLocation: Vec2 = Vec2.ZERO;
    private _radius: number = 0;
    private _stickPos: Vec3 | null = null;
    private _opacity: UIOpacity | null = null;
    private _transform: UITransform | null = null;
    public delegate: any = null;
    private _start: boolean = false;
    private _enable: boolean = true;
    private _touched: boolean = false;

    onLoad() {
        this._radius = (this.bg!.getComponent(UITransform)!.width) / 2;
        this._opacity = this.node.getComponent(UIOpacity);
        this._transform = this.node.getComponent(UITransform);
        this._initTouchEvent();
        this._stickPos = this.bg!.position.clone();
    }

    setTouchEnable(enable: boolean) {
        this._enable = enable;
    }

    onEnable() {
        this._opacity!.opacity = 0;
    }

    private _initTouchEvent() {
        this.node.on(Node.EventType.TOUCH_START, this._touchStartEvent, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._touchMoveEvent, this);
        this.node.on(Node.EventType.TOUCH_END, this._touchEndEvent, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._touchEndEvent, this);
    }

    private _touchStartEvent(event: any) {
        if (!this._enable) return;

        event.getUILocation(this._touchLocation);
        const worldPos = new Vec3(this._touchLocation.x, this._touchLocation.y, 0);
        this._stickPos = this._transform!.convertToNodeSpaceAR(worldPos);
        
        this._opacity!.opacity = 255;
        this.bg!.position = this._stickPos;
        this.dot!.position = this._stickPos.clone();
        this.arrow!.position = this._stickPos.clone();
        
        this._start = false;
        this._touched = true;
        this.arrow!.angle = 0;
    }

    private _touchMoveEvent(event: any) {
        if (!this._touched) return;

        const currentLocation = new Vec2();
        event.getUILocation(currentLocation);
        
        if (this._touchLocation.equals(currentLocation)) return;
        
        this._touchLocation = currentLocation;
        const worldPos = new Vec3(this._touchLocation.x, this._touchLocation.y, 0);
        const localPos = this.bg!.getComponent(UITransform)!.convertToNodeSpaceAR(worldPos);
        
        const distance = localPos.length();
        const direction = new Vec3();
        Vec3.normalize(direction, localPos);
        
        const tempPos = new Vec3();
        if (distance > this._radius) {
            Vec3.multiplyScalar(tempPos, direction, this._radius);
            this.dot!.setPosition(
                this._stickPos!.x + tempPos.x,
                this._stickPos!.y + tempPos.y,
                0
            );
        } else {
            this.dot!.setPosition(
                this._stickPos!.x + localPos.x,
                this._stickPos!.y + localPos.y,
                0
            );
        }

        if (!this._start) {
            this._start = distance >= (this._radius / 2);
        }

        if (this._start) {
            this.arrow!.angle = macro.DEG * (Math.atan2(direction.y, direction.x) - math.HALF_PI);
            if (this.delegate && this.delegate.onJoyStickMove) {
                this.delegate.onJoyStickMove(direction);
            }
        }
    }

    private _touchEndEvent() {
        if (!this._touched) return;

        this._touched = false;
        this.dot!.setPosition(this.bg!.position);
        this._opacity!.opacity = 0;
        
        if (this.delegate && this.delegate.onJoyStickStop) {
            this.delegate.onJoyStickStop();
        }
    }
}