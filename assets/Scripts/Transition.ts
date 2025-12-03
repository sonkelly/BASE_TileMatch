import { _decorator, Component, director, sys, Director, find } from 'cc';
import { TransitionView } from './TransitionView';
import { AssetMgr } from './AssetMgr';
import { BundleMgr } from './BundleMgr';
import { BUNDLE_NAMES } from './AssetRes';

const { ccclass, property } = _decorator;

@ccclass('Transition')
export class Transition extends Component {
    private static _instance: Transition;
    private prevBundleName: string = '';
    private launchSceneName: string = '';
    private launchBundleName: string = '';
    private onLaunched: Array<() => void> = [];
    private launchConfig: any = null;
    private _loading: boolean = false;

    public onPreloadProgress: (progress: number, total: number) => void = () => {};

    public static get Instance(): Transition {
        if (!Transition._instance) {
            Transition._instance = new Transition();
        }
        return Transition._instance;
    }

    public get loading(): boolean {
        return this._loading;
    }

    private onSceneLoaded(err: Error | null, scene: any): void {
        if (err) {
            director.emit('launch-scene-error', 'onSceneLoaded error:\n ' + err);
        } else {
            director.emit('transition-progress', 1, 1);
            director.runScene(scene, null, () => {
                if (this.onLaunched.length > 0) {
                    this.onLaunched.forEach(callback => callback());
                    this.onLaunched.length = 0;
                }
                
                setTimeout(() => {
                    sys.garbageCollect();
                }, 2000);
                
                director.emit('scene-launched');
                this._loading = false;
            });
        }
    }

    private onPreLaunched(err: Error | null): void {
        if (err) {
            director.emit('launch-scene-error', 'preloadScene error:\n ' + err.message);
        } else {
            if (this.prevBundleName && this.prevBundleName !== this.launchBundleName && 
                !BundleMgr.Instance.isEngine(this.prevBundleName)) {
                AssetMgr.Instance.releaseBundleAllRes(this.prevBundleName);
                this.prevBundleName = '';
            }
            
            sys.garbageCollect();
            
            director.once(Director.EVENT_AFTER_DRAW, () => {
                BundleMgr.Instance.getBundle(this.launchBundleName)
                    .loadScene(this.launchSceneName, this.onPreloadProgress, this.onSceneLoaded.bind(this));
            });
        }
    }

    private async launchTransition(): Promise<void> {
        return new Promise<void>((resolve) => {
            director.loadScene(this.launchConfig.transitionName, (err) => {
                if (err) {
                    director.emit('launch-scene-error', 'launch transition scene error:\n ' + err);
                }
                
                if (this.prevBundleName && this.prevBundleName !== this.launchBundleName && 
                    !BundleMgr.Instance.isEngine(this.prevBundleName)) {
                    AssetMgr.Instance.releaseBundleAllRes(this.prevBundleName);
                    this.prevBundleName = '';
                }
                
                resolve();
            });
        });
    }

    public async enterScene(bundleName: string, sceneName: string, options?: any): Promise<void> {
        const callback = options?.callback;
        
        if (!this.launchSceneName) {
            const canvasParent = find('Canvas')?.parent;
            this.launchSceneName = canvasParent?.name || '';
        }

        if (this.launchSceneName !== sceneName) {
            const opts = options || { needLoading: true };
            
            this.launchConfig = {
                needLoading: opts.needLoading === true
            };
            this.launchConfig.transitionName = opts.transitionName || 'Transition';
            
            if (opts.needLoading) {
                await this.launchTransition();
            } else {
                TransitionView.open();
            }
            
            this.prevBundleName = this.launchBundleName;
            this.launchBundleName = bundleName;
            this.launchSceneName = sceneName;
            
            if (callback) {
                this.onLaunched.push(callback);
            }
            
            this._loading = true;
            
            BundleMgr.Instance.loadBundle(this.launchBundleName, (bundle) => {
                bundle&&this.onPreLaunched(null);
            });
        } else {
            if (callback) {
                if (this.loading) {
                    this.onLaunched.push(callback);
                } else {
                    callback();
                }
            }
        }
    }

    public static loadScene(bundleName: string, sceneName: string, options?: any): void {
        const callback = options?.callback;
        
        if (bundleName && bundleName !== '' && sceneName && sceneName !== '') {
            Transition.Instance.enterScene(bundleName, sceneName, options);
        } else if (callback) {
            callback(false);
        }
    }

    public static enterGame(callback?: () => void): void {
        Transition.loadScene(BUNDLE_NAMES.Game, 'Game', {
            needLoading: false,
            transitionName: 'Transition',
            callback: callback
        });
    }
}