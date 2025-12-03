import { _decorator, Component, Node, director, Widget, Vec3, SpriteFrame, AudioClip, log, cclegacy, Prefab } from 'cc';
import { AssetPool } from './AssetPool';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { Language } from './Language';
import { App } from './App';
import { GamePrefabs, UIPrefabs, ITEM_GOLD_CUBE_PATH, ITEM_COIN_PATH, GameAudios, IMAGE_PATHS, GuidesViews } from './Prefabs';
import { config } from './Config';
import { Alert } from './Alert';
import {TransitionView} from './TransitionView';
import {Toast} from './Toast';
import {Loading} from './Loading';
import { AsyncQueue } from './AsyncQueue';
import { MgrGame } from './MgrGame';
import { BundleMgr } from './BundleMgr';
import {merge, each, isNil} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('Launder')
export class Launder extends Component {
    private static _ins: Launder = null;

    public static get Instance(): Launder {
        return Launder._ins;
    }

    onLoad() {
        Launder._ins = this;
    }

    start() {
        config.init(this.initCallBack.bind(this));
    }

    getLanguage(id: string): string {
        return Language.Instance.getLangByID(id);
    }

    private async initCallBack() {
        const self = this;
        await self._loadNesscery();
        TransitionView.open();
        self._startup();
    }

   private async _loadNesscery(): Promise<void> {
        const promises: Promise<void>[] = [];
        
        promises.push(new Promise((resolve) => Alert.load(resolve)));
        promises.push(new Promise((resolve) => Toast.load(resolve)));
        promises.push(new Promise((resolve) => Loading.load(resolve)));
        promises.push(new Promise((resolve) => TransitionView.load(resolve)));
        promises.push(new Promise((resolve) => config.loadLanguage(resolve)));

        await Promise.all(promises);
    }

    private _startup() {
        const appNode = new Node('App');
        appNode.parent = director.getScene();
        appNode.addComponent('App');
        
        const widget = appNode.addComponent(Widget);
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        widget.top = widget.bottom = widget.left = widget.right = 0;
        
        director.addPersistRootNode(appNode);
    }

    public getLoadFuncs(): (() => Promise<void>)[] {
        const bundleName = BUNDLE_NAMES.Game;
        const imagePaths = IMAGE_PATHS;
        const prefabs = merge({}, GamePrefabs, UIPrefabs);

        const loadFuncs: (() => Promise<void>)[] = [];

        // 1. Load sprites
        loadFuncs.push(async () => {
            director.emit('transition-message', Language.Instance.getLangByID('Loading_tips_01'));

            const promises: Promise<void|any>[] = [];

            each(imagePaths, (path: string) => {
                promises.push(new Promise((resolve) => {
                    AssetMgr.Instance.loadDir(bundleName, path, SpriteFrame, null, (assets) => {
                        each(assets.assets, (asset: SpriteFrame) => {
                            AssetMgr.Instance.loadSpriteFrame(bundleName, path + '/' + asset.name);
                        });
                        App.MyApp.printLoadTime('load sprite ' + path);
                        resolve(null);
                    });
                }));
            });

            promises.push(AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, ITEM_GOLD_CUBE_PATH));
            promises.push(AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, ITEM_COIN_PATH));

            await Promise.all(promises);

            director.emit('transition-message', Language.Instance.getLangByID('Loading_tips_02'));
            App.MyApp.printLoadTime('load sprite');
        });

        // 2. Load prefabs
        loadFuncs.push(async () => {
            director.emit('transition-message', Language.Instance.getLangByID('Loading_tips_03'));

            const promises: Promise<void>[] = [];

            const loadPrefab = (url: string, viewComp?: any, count: number = 0) => {
                promises.push(new Promise((resolve) => {
                    const startTime = Date.now();
                    log('start load prefab:', url);
                    AssetMgr.Instance.loadPrefabAsync(bundleName, url).then((prefab) => {
                        log('load prefab:', Date.now() - startTime, url, count);
                        AssetPool.Instance.addPrefab(prefab, url, viewComp);

                        if (count > 0) {
                            for (let i = 0; i < count; i++) {
                                const obj = AssetPool.Instance.createObjWithPrefab(prefab, url);
                                AssetPool.Instance.put(obj);
                            }
                        }
                        resolve();
                    }).catch(e=>{
                        console.error(e)
                    });
                }));
            };

            for (const key in prefabs) {
                const prefabConfig = prefabs[key];
                if (typeof prefabConfig === 'string') {
                    loadPrefab(prefabConfig);
                } else if (Array.isArray(prefabConfig)) {
                    each(prefabConfig, (item: any) => {
                        if (!item.lazy) {
                            loadPrefab(item.url, item.viewComp, item.count);
                        }
                    });
                } else {
                    if (!prefabConfig.lazy) {
                        loadPrefab(prefabConfig.url, prefabConfig.viewComp, prefabConfig.count);
                    }
                }
            }

            await Promise.all(promises);

            director.emit('transition-message', Language.Instance.getLangByID('Loading_tips_04'));
            App.MyApp.printLoadTime('load prefab');
        });

        // 3. Load GameLevels bundle
        loadFuncs.push(async () => {
            if (!BundleMgr.Instance.getBundle(BUNDLE_NAMES.GameLevels)) {
                await BundleMgr.Instance.loadBundleAsync(BUNDLE_NAMES.GameLevels);
            }
        });

        return loadFuncs;
    }

    getLazyAsyncQueue(): AsyncQueue {
        const queue = new AsyncQueue();
        const bundleName = BUNDLE_NAMES.Game;
        
        const loadPrefab = (url: string, viewComp?: any, count: number = 0) => {
            queue.push(async function() {
                let prefab : Prefab | Node = AssetPool.Instance.getPrefab(url);
                if (isNil(prefab)) {
                    //@ts-ignore
                    prefab = await AssetMgr.Instance.loadPrefabAsync(bundleName, url) as Node;
                    if (!AssetPool.Instance.getPrefab(url)) {
                        AssetPool.Instance.addPrefab(prefab, url, viewComp);
                        if (count > 0) {
                            for (let i = 0; i < count; i++) {
                                const obj = AssetPool.Instance.createObjWithPrefab(prefab, url);
                                AssetPool.Instance.put(obj);
                            }
                        }
                    }
                }
            });
        };

        const loadAudio = (url: string) => {
            queue.push(async function () {
                await AssetMgr.Instance.loadAsync(bundleName, url, AudioClip);
            });
        };

        const prefabs = merge({}, GamePrefabs, UIPrefabs);
        for (const key in prefabs) {
            const prefabConfig = prefabs[key];
            if (Array.isArray(prefabConfig)) {
                each(prefabConfig, (item: any) => {
                    if (item.lazy) {
                        loadPrefab(item.url, item.viewComp, item.count);
                    }
                });
            } else {
                if (prefabConfig.lazy) {
                    loadPrefab(prefabConfig.url, prefabConfig.viewComp, prefabConfig.count);
                }
            }
        }

        const audios = GameAudios;
        for (const key in audios) {
            const audioConfig = audios[key];
            if (audioConfig.lazy) {
                loadAudio(audioConfig.url);
            }
        }

        return queue;
    }

    async loadCurrUi() {
        const startTime = Date.now();
        director.emit('transition-message', Language.Instance.getLangByID('Loading_tips_05'));
        
        if (MgrGame.Instance.gameData.maxLv === 1) {
            let prefab = AssetPool.Instance.getPrefab(GuidesViews.GameMethodView.url);
            if (!prefab) {
                const loadedPrefab = await AssetMgr.Instance.loadPrefabAsync(BUNDLE_NAMES.Game, GuidesViews.GameMethodView.url);
                //@ts-ignore
                AssetPool.Instance.addPrefab(loadedPrefab, GuidesViews.GameMethodView.url);
            }
            
            prefab = AssetPool.Instance.getPrefab(GuidesViews.GuideFinger.url);
            if (!prefab) {
                const loadedPrefab = await AssetMgr.Instance.loadPrefabAsync(BUNDLE_NAMES.Game, GuidesViews.GuideFinger.url);
                //@ts-ignore
                AssetPool.Instance.addPrefab(loadedPrefab, GuidesViews.GuideFinger.url);
            }
            
            if (!AssetPool.Instance.getPrefab(UIPrefabs.GameUI.url)) {
                const loadedPrefab = await AssetMgr.Instance.loadPrefabAsync(BUNDLE_NAMES.Game, UIPrefabs.GameUI.url);
                //@ts-ignore
                AssetPool.Instance.addPrefab(loadedPrefab, UIPrefabs.GameUI.url);
            }
        } else {
            if (!AssetPool.Instance.getPrefab(UIPrefabs.MainUI.url)) {
                const loadedPrefab = await AssetMgr.Instance.loadPrefabAsync(BUNDLE_NAMES.Game, UIPrefabs.MainUI.url);
                //@ts-ignore
                AssetPool.Instance.addPrefab(loadedPrefab, UIPrefabs.MainUI.url);
            }
        }
        
        log('loadCurrUi:', Date.now() - startTime);
        director.emit('transition-message', Language.Instance.getLangByID('Loading_tips_06'));
    }
}