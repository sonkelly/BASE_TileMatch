import { _decorator, Component, Node, RichText, UITransform, Vec3, v3, resources, Prefab, error, isValid, cclegacy } from 'cc';
import { AssetPool } from './AssetPool';
import { MgrUi } from './MgrUi';

const { ccclass, property } = _decorator;

enum ToastState {
    IDLE = 0,
    SCALE_UP = 1,
    SHOWING = 2,
    SCALE_DOWN = 3
}

const PREFAB_NAME = 'UIToast';
const SCALE_UP = v3(1, 0, 1);
const SCALE_NORMAL = v3(1, 1, 1);
const tempVec = new Vec3();

@ccclass('Toast')
export class Toast extends Component {
    @property(RichText)
    messageLabel: RichText = null!;

    private originSize: Vec3 = new Vec3();
    private running: boolean = false;
    private runningTime: number = 0;
    private state: ToastState = ToastState.IDLE;
    private message: string = '';
    private transfrom: UITransform = null!;

    private static lastMessage: string = '';
    private static lastToast: Toast = null!;

    onLoad() {
        this.transfrom = this.node.getComponent(UITransform)!;
        this.originSize = this.transfrom.contentSize.clone();
    }

    tip(message: string) {
        this.message = `<b><color=#ffffff>${message}</color></b>`;
        this.messageLabel.string = this.message;
    }

    warn(message: string) {
        this.message = `<b><color=#ff8800>${message}</color></b>`;
        this.messageLabel.string = this.message;
    }

    error(message: string) {
        this.message = `<b><color=#ff0000>${message}</color></b>`;
        this.messageLabel.string = this.message;
    }

    close() {
        this.running = false;
        this.node.emit('remove', this);
    }

    onEnable() {
        this.node.scale = SCALE_UP;
        this.running = true;
        this.runningTime = 0;
        this.state = ToastState.SCALE_UP;
    }

    lateUpdate(deltaTime: number) {
        if (!this.running) return;

        this.runningTime += deltaTime;

        switch (this.state) {
            case ToastState.SCALE_UP:
                if (this.runningTime >= 0.1) {
                    this.runningTime = 0;
                    this.state = ToastState.SHOWING;
                    this.node.scale = SCALE_NORMAL;
                } else {
                    Vec3.lerp(tempVec, SCALE_UP, SCALE_NORMAL, this.runningTime / 0.1);
                    this.node.scale = tempVec;
                }
                break;

            case ToastState.SHOWING:
                if (this.runningTime >= 2.5) {
                    this.runningTime = 0;
                    this.state = ToastState.SCALE_DOWN;
                }
                break;

            case ToastState.SCALE_DOWN:
                Vec3.lerp(tempVec, SCALE_NORMAL, SCALE_UP, this.runningTime / 0.1);
                this.node.scale = tempVec;
                
                if (this.runningTime >= 0.1) {
                    this.runningTime = 0;
                    this.state = ToastState.IDLE;
                    this.running = false;
                    this.node.emit('remove', this);
                }
                break;
        }
    }

    static load(callback?: () => void) {
        resources.load('Toast', Prefab, (err, prefab) => {
            if (err) {
                error('load ToastView error', err.message);
            } else {
                AssetPool.Instance.addPrefab(prefab!, PREFAB_NAME);
                callback && callback();
            }
        });
    }

    static open(): Toast {
        const node = AssetPool.Instance.createObject(PREFAB_NAME);
        node.parent = MgrUi.root();
        
        node.once('remove', (toast: Toast) => {
            if (toast && isValid(toast.node)) {
                Toast.lastMessage = '';
                toast.node.emit('removed');
                AssetPool.Instance.put(toast);
            }
        });

        Toast.lastToast = node.getComponent(Toast)!;
        return Toast.lastToast;
    }

    static tip(message: string): Toast | null {
        if (Toast.lastMessage !== message) {
            Toast.lastToast && Toast.lastToast.close();
            Toast.lastMessage = message;
            
            const toast = Toast.open();
            toast.tip(message);
            return toast;
        }
        return null;
    }

    static warn(message: string): Toast | null {
        if (Toast.lastMessage !== message) {
            Toast.lastToast && Toast.lastToast.close();
            Toast.lastMessage = message;
            
            const toast = Toast.open();
            toast.warn(message);
            return toast;
        }
        return null;
    }

    static error(message: string): Toast | null {
        if (Toast.lastMessage !== message) {
            Toast.lastToast && Toast.lastToast.close();
            Toast.lastMessage = message;
            
            const toast = Toast.open();
            toast.error(message);
            return toast;
        }
        return null;
    }
}