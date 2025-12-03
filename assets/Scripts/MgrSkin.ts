import { _decorator, cclegacy, director, SpriteFrame } from 'cc';
import {MgrBase} from './MgrBase';
import { SkinData, SKIN_STATUS } from './SkinData';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import SkinCfg from './SkinCfg';
import { AnalyticsManager } from './AnalyticsManager';
import { GlobalEvent } from './Events';
import { TASK_TYPE } from './Const';
import { MgrTask } from './MgrTask';
import { IMAGE_THEME_PATH } from './Prefabs';
import { config } from './Config';
import {each, sortBy} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MgrSkin')
export class MgrSkin extends MgrBase {
    private _data: SkinData = null;
    private levelUnlockData: any[] = null;

    onLoad() {
        this._data = new SkinData(this.name);
    }

    load() {
        this._data.load();
    }

    initLoadData() {
        const self = this;
        this.levelUnlockData = [];
        const allSkins = SkinCfg.Instance.getAll();
        
        each(allSkins, (skin) => {
            if (1007 === skin.item) {
                const skinData = this.data.getSkinData(skin.id);
                (!skinData || skinData.status !== SKIN_STATUS.UNLOCKED) && 
                this.levelUnlockData.push(skin);
            }
        });
        
        sortBy(this.levelUnlockData, (skin) => skin.price);
        AnalyticsManager.getInstance().setUserProperty({
            CK_Tile: this.data.currSkinId
        });
    }

    getLevelUnlockProgress(price: number): any {
        if (this.levelUnlockData.length > 0) {
            for (let i = 0; i < this.levelUnlockData.length; i++) {
                const skin = this.levelUnlockData[i];
                const skinData = this.data.getSkinData(skin.id);
                if (1007 == skin.item && 
                    !(skin.price <= price || 
                    (skinData && skinData.status === SKIN_STATUS.UNLOCKED))) {
                    return skin;
                }
            }
        }
        return false;
    }

    isShowUseTip(): boolean {
        const self = this;
        const allSkins = SkinCfg.Instance.getAll();
        let hasUnused = false;
        
        each(allSkins, (skin, id) => {
            const skinData = this.data.getSkinData(skin.id);
            if (skinData && 
                skinData.status === SKIN_STATUS.UNLOCKED && 
                skinData.used === 0) {
                hasUnused = true;
            }
        });
        
        return hasUnused;
    }

    isShowTipById(id: number): boolean {
        const skinData = this.data.getSkinData(id);
        return skinData && 
               skinData.status === SKIN_STATUS.UNLOCKED && 
               skinData.used === 0;
    }

    unlock(id: number) {
        const skinData = this.data.getSkinData(id);
        if (!skinData || skinData.status !== SKIN_STATUS.UNLOCKED) {
            this.data.unlock(id);
            AnalyticsManager.getInstance().reportSkinUnlock({
                Tile_Id: id
            });
        }
    }

    setCurrSkin(id: number) {
        if (this.data.currSkinId !== id) {
            const prevSkinId = this.data.currSkinId;
            this.data.currSkinId = id;
            this.loadThemeSprites(id);
            director.emit(GlobalEvent.ChangeGameSkin);
            MgrTask.Instance.data.addTaskData(TASK_TYPE.SKIN, 1);
            
            AnalyticsManager.getInstance().setUserProperty({
                CK_Tile: this.data.currSkinId
            });
            
            AnalyticsManager.getInstance().reportSkinChange({
                Tile_Before_Id: prevSkinId,
                Tile_After_Id: id
            });
        }
    }

    loadThemeSprites(themeId: number, callback?: Function) {
        const themeUrl = this.getThemeUrl(themeId);
        const bundleName = BUNDLE_NAMES.Game;
        
        AssetMgr.Instance.loadDir(bundleName, themeUrl, SpriteFrame, null, (assets) => {
            const spriteFrames = assets.assets;
            each(spriteFrames, (spriteFrame) => {
                AssetMgr.Instance.loadSpriteFrame(
                    bundleName, 
                    themeUrl + '/' + spriteFrame.name
                );
            });
            callback && callback();
        });
    }

    loadLanSprites(language: string, callback?: Function) {
        const lanUrl = IMAGE_THEME_PATH + '/theme_' + language;
        const bundleName = BUNDLE_NAMES.Game;
        
        AssetMgr.Instance.loadDir(bundleName, lanUrl, SpriteFrame, null, (assets) => {
            const spriteFrames = assets.assets;
            each(spriteFrames, (spriteFrame) => {
                AssetMgr.Instance.loadSpriteFrame(
                    bundleName, 
                    lanUrl + '/' + spriteFrame.name
                );
            });
            callback && callback();
        });
    }

    getThemeUrl(themeId: number): string {
        return IMAGE_THEME_PATH + '/theme' + themeId;
    }

    getIconUrl(iconName: string): string {
        const currSkinId = this.data.currSkinId;
        const defaultLanguage = config.defaultLanguage;
        const languageIcons = SkinCfg.Instance.get(currSkinId)[defaultLanguage];
        
        return (languageIcons && 
                languageIcons.length > 0 && 
                languageIcons.includes(iconName)) ? 
            IMAGE_THEME_PATH + '/theme_' + defaultLanguage + '/' + iconName : 
            IMAGE_THEME_PATH + '/theme' + currSkinId + '/' + iconName;
    }

    get data(): SkinData {
        return this._data;
    }

    static get Instance(): MgrSkin {
        return MgrSkin._instance;
    }
    
    private static _instance: MgrSkin;
}