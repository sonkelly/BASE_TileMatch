import { _decorator, resources, TextAsset, director, warn, error, log } from 'cc';
import { LanguageData } from './LanguageData';
import {LanguageLabel} from './LanguageLabel';
import {LanguageSprite} from './LanguageSprite';
import XXTEA from './xxtea';
const { ccclass } = _decorator;

@ccclass('LanguagePack')
export default class LanguagePack {
    private _langjsonPath: string = 'lang_json';
    private _langTexturePath: string = 'lang_texture';

    public setAssetsPath(jsonPath?: string, texturePath?: string): void {
        if (jsonPath) this._langjsonPath = jsonPath;
        if (texturePath) this._langTexturePath = texturePath;
    }

    public updateLanguage(language: string): void {
        const jsonPath = `${this._langjsonPath}/${language}`;
        const textAsset = resources.get(jsonPath, TextAsset);
        
        if (textAsset && textAsset.text) {
            let decryptedText = XXTEA.decryptFromBase64(textAsset.text, 'fu03f6ck-bfbd-4d');
            decryptedText = decryptedText.replace(/\\N/g, '\n');
            
            LanguageData.data = JSON.parse(decryptedText);
            
            const scene = director.getScene();
            if (scene) {
                const children = scene.children;
                
                for (let i = 0; i < children.length; i++) {
                    const labels = children[i].getComponentsInChildren(LanguageLabel);
                    for (let j = 0; j < labels.length; j++) {
                        labels[j].language();
                    }
                    
                    const sprites = children[i].getComponentsInChildren(LanguageSprite);
                    for (let k = 0; k < sprites.length; k++) {
                        sprites[k].language();
                    }
                }
            }
        } else {
            warn('没有找到指定语言内容配置', language);
        }
    }

    public loadLanguageAssets(language: string, callback: (error?: any, language?: string) => void): void {
        const texturePath = `${this._langTexturePath}/${language}`;
        const jsonPath = `${this._langjsonPath}/${language}`;

        resources.loadDir(texturePath, (err: any) => {
            if (err) {
                error(err);
                return callback(err);
            }
            
            resources.load(jsonPath, TextAsset, (err: any, asset: TextAsset) => {
                if (err) {
                    error(err);
                    return callback(err);
                }
                callback(null, language);
            });
        });
    }

    public releaseLanguageAssets(language: string): void {
        const texturePath = `${this._langTexturePath}/${language}`;
        const jsonPath = `${this._langjsonPath}/${language}`;
        
        resources.release(texturePath);
        resources.release(jsonPath);
    }
}