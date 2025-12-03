import { _decorator, Component, Label, Animation, director, resources, Prefab, error, cclegacy } from 'cc';
import { MgrUi } from './MgrUi';
import { AssetPool } from './AssetPool';
import { isNil } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('Loading')
export class Loading extends Component {
    @property(Label)
    progresslabel: Label = null!;

    @property(Label)
    messageLabel: Label = null!;

    @property(Animation)
    loadingAnima: Animation = null!;

    private _progressPercent: number = 0;

    public static loadingView: Loading = null!;

    onEnable() {
        this.messageLabel.string = '';
        this.progresslabel.string = '';
        this._progressPercent = 0;
        this.loadingAnima.play();
    }

    onDisable() {
        director.targetOff(this);
        this.loadingAnima.stop();
    }

    registerTransitionProgress() {
        this.progresslabel.string = '0%';
        director.on('transition-progress', this.onProgressUpdate, this);
    }

    onProgressUpdate(current: number, total: number) {
        if (total > 0) {
            let progress = current / total;
            this._progressPercent = Math.max(progress, this._progressPercent);
            let percent = Math.min(Math.ceil(100 * this._progressPercent), 100);
            this.progresslabel.string = percent + '%';
        }
    }

    setMessage(message: string) {
        this.messageLabel.string = message;
    }

    public static load(callback?: () => void) {
        resources.load('Loading', Prefab, (err, prefab) => {
            if (err) {
                error('load loading error', err.message);
                callback && callback();
                return;
            }
            AssetPool.Instance.addPrefab(prefab, 'Loading');
            callback && callback();
        });
    }

    public static open(message: string = ''): Loading {
        if (isNil(Loading.loadingView)) {
            const node = AssetPool.Instance.createObject('Loading');
            node.parent = MgrUi.root();
            Loading.loadingView = node.getComponent(Loading)!;
        }
        Loading.loadingView.setMessage(message);
        return Loading.loadingView;
    }

    public static close() {
        if (Loading.loadingView) {
            AssetPool.Instance.put(Loading.loadingView);
            Loading.loadingView = null!;
        }
    }
}