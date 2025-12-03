import { _decorator, warn, error, director } from 'cc';
import { Singleton } from './Singleton';
import { LanguageData } from './LanguageData';
import LanguagePack from './LanguagePack';

export enum LanguageEvent {
    CHANGE = 'LanguageEvent.CHANGE',
    RELEASE_RES = 'LanguageEvent.RELEASE_RES'
}

@_decorator.ccclass
export class Language extends Singleton {
    private _support: string[] = ['zh', 'zh-tw', 'en', 'id', 'de', 'es', 'fr', 'in', 'it', 'jp', 'ko', 'ru', 'pt'];
    private _languagePack: LanguagePack = new LanguagePack();

    public isExist(lang: string): boolean {
        return this.languages.indexOf(lang) > -1;
    }

    public getNextLang(): string {
        const languages = this.languages;
        const currentIndex = languages.indexOf(LanguageData.current);
        return languages[(currentIndex + 1) % languages.length];
    }

    public setLanguage(lang: string | null, callback: (success: boolean) => void): void {
        if (!lang) {
            lang = 'en';
        }
        
        lang = lang.toLowerCase();
        
        if (this.languages.indexOf(lang) < 0) {
            warn(`当前不支持该语种${lang} 将自动切换到 zh 语种!`);
            lang = 'en';
        }

        if (lang !== LanguageData.current) {
            this.loadLanguageAssets(lang, (err, data) => {
                if (err) {
                    error('语言资源包下载失败', err);
                    callback(false);
                    return;
                }
                
                LanguageData.current = lang;
                this._languagePack.updateLanguage(lang);
                director.emit(LanguageEvent.CHANGE, data);
                callback(true);
            });
        } else {
            callback(false);
        }
    }

    public setAssetsPath(path: string, baseUrl: string): void {
        this._languagePack.setAssetsPath(path, baseUrl);
    }

    public getLangByID(id: string): string {
        return LanguageData.getLangByID(id);
    }

    public loadLanguageAssets(lang: string, callback: (error: any, data?: any) => void): void {
        lang = lang.toLowerCase();
        return this._languagePack.loadLanguageAssets(lang, callback);
    }

    public releaseLanguageAssets(lang: string): void {
        lang = lang.toLowerCase();
        this._languagePack.releaseLanguageAssets(lang);
        director.emit(LanguageEvent.RELEASE_RES, lang);
    }

    public set supportLanguages(languages: string[]) {
        this._support = languages;
    }

    public get current(): string {
        return LanguageData.current;
    }

    public get languages(): string[] {
        return this._support;
    }

    public static get Instance(): Language {
        return Language.getInstance();
    }
}