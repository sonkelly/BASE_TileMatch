import { _decorator, Component, Label, ProgressBar, director, tween, Tween, resources, Prefab, error } from 'cc';
import { config } from './Config';
import { AssetPool } from './AssetPool';
import { MgrUi } from './MgrUi';
import { lodash } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('TransitionView')
export class TransitionView extends Component {
    private static transitionView: TransitionView | null = null;
    
    @property(Label)
    version: Label | null = null;
    
    @property(Label)
    progresslabel: Label | null = null;
    
    @property(ProgressBar)
    progressBar: ProgressBar | null = null;
    
    @property(Label)
    messageLabel: Label | null = null;
    
    @property(Label)
    uidLabel: Label | null = null;
    
    private _progressPercent: number = 0;
    private _progressPercentMax: number = 0;
    private _prgoressMessage: string = '';
    private repeat: number = 0;
    private _running: boolean = true;

    public static load(callback?: () => void): void {
        resources.load('Transition', Prefab, (err, prefab) => {
            if (err) {
                error('load transition error', err.message);
                callback && callback();
                return;
            }
            AssetPool.Instance.addPrefab(prefab, 'Transition');
            callback && callback();
        });
    }

    public static open(message: string = ''): TransitionView {
        if (lodash.isNil(TransitionView.transitionView)) {
            const node = AssetPool.Instance.createObject('Transition');
            node.parent = MgrUi.root();
            TransitionView.transitionView = node.getComponent(TransitionView)!;
        }
        if (message) {
            TransitionView.transitionView.setMessage(message);
        }
        return TransitionView.transitionView;
    }

    public static close(): void {
        if (TransitionView.transitionView) {
            AssetPool.Instance.put(TransitionView.transitionView);
            TransitionView.transitionView = null;
        }
    }

    public static pause(): void {
        if (TransitionView.transitionView) {
            TransitionView.transitionView._running = false;
        }
    }

    public static resume(): void {
        if (TransitionView.transitionView) {
            TransitionView.transitionView._running = true;
        }
    }

    public setVersion(version: string): void {
        if (this.version) {
            this.version.string = 'V:' + version;
        }
    }

    protected onEnable(): void {
        this.setVersion(config.version);
        this.repeat = 0;
        this._running = true;
        if (this.progresslabel) {
            this.progresslabel.string = '0%';
        }
        if (this.progressBar) {
            this.progressBar.progress = 0;
        }
        this._progressPercent = 0;
        this._progressPercentMax = 0.2;
        this._prgoressMessage = '';
        if (this.messageLabel) {
            this.messageLabel.string = this._prgoressMessage;
        }
        
        director.on('transition-progress', this.onProgressUpdate, this);
        if (this.messageLabel) {
            director.on('transition-message', this.onProgressMessage, this);
        }
        if (this.uidLabel) {
            this.uidLabel.string = '';
            director.on('transition-uid', this.setUidLabel, this);
        }
        
        if (this.progressBar) {
            tween(this.progressBar)
                .delay(0.01)
                .call(() => {
                    this._progressPercent += 0.01;
                    this._progressPercent = Math.min(this._progressPercent, this._progressPercentMax);
                    if (this.progresslabel) {
                        this.progresslabel.string = Math.min(Math.ceil(100 * this._progressPercent), 100) + '%';
                    }
                    if (this.progressBar) {
                        this.progressBar.progress = this._progressPercent;
                    }
                    if (this._progressPercent >= 1) {
                        Tween.stopAllByTarget(this.progressBar);
                    }
                })
                .union()
                .repeatForever()
                .start();
        }
    }

    protected onDisable(): void {
        if (this.progressBar) {
            Tween.stopAllByTarget(this.progressBar);
        }
        director.targetOff(this);
    }

    protected onDestroy(): void {
        TransitionView.transitionView = null;
    }

    protected update(dt: number): void {
        if (this._running) {
            this.repeat++;
            if (this.messageLabel) {
                this.messageLabel.string = this._prgoressMessage + 
                    new Array(Math.floor(this.repeat / 30) % 4).fill('.').join('');
            }
        }
    }

    private onProgressUpdate(current: number, total: number): void {
        if (total > 0) {
            const progress = Math.min(1, current / total);
            if (progress > this._progressPercentMax) {
                this._progressPercentMax = progress;
            }
        }
        this._progressPercent += 0.1;
        this._progressPercent = Math.min(this._progressPercent, this._progressPercentMax);
        if (this.progresslabel) {
            this.progresslabel.string = Math.min(Math.ceil(100 * this._progressPercent), 100) + '%';
        }
        if (this.progressBar) {
            this.progressBar.progress = this._progressPercent;
        }
    }

    private onProgressMessage(message: string): void {
        this.setMessage(message);
    }

    public setMessage(message: string): void {
        this._prgoressMessage = message;
        if (this.messageLabel) {
            this.messageLabel.string = message;
        }
    }

    private setUidLabel(uid: string): void {
        if (this.uidLabel) {
            this.uidLabel.string = 'UID:' + uid;
        }
    }
}