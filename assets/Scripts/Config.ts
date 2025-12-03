import { _decorator, resources, JsonAsset, error, sys, log, warn, cclegacy } from 'cc';
import { Language } from './Language';
import { SdkBridge } from './SdkBridge';

const { ccclass, property } = _decorator;

@ccclass('Config')
export class Config {
    private _data: any = null;

    public loadCfg(callback?: () => void): void {
        const self = this;
        resources.load('Config/config', JsonAsset, (err, jsonAsset) => {
            if (err) {
                error(err);
            } else {
                self._data = jsonAsset.json;
            }
            callback && callback();
        });
    }

    public initVersion(): void {
        if (sys.platform === sys.Platform.ANDROID || sys.platform === sys.Platform.IOS) {
            const sdkWrapper = SdkBridge.getSdkWrapper();
            if (sdkWrapper && sdkWrapper.getVersion) {
                const version = sdkWrapper.getVersion();
                if (version) {
                    this.version = version;
                }
            }
        }
    }

    public init(callback?: () => void): void {
        const self = this;
        this.loadCfg(() => {
            self._applyCfg();
            callback && callback();
        });
    }

    private _applyCfg(): void {
        // @todo disable log if needed
        // if (!this.reportDebug) {
        //     console.log = () => {};
        // }
        // if (!this.debug) {
        //     console.log = console.warn = () => {};
        // }
    }

    public getLanguageKey(): string {
        return this.gameName + '_language';
    }

    public loadLanguage(callback?: () => void): void {
        const languageKey = this.getLanguageKey();
        let languageCode = sys.localStorage.getItem(languageKey);
        
        if (!languageCode) {
            const sysLanguage = sys.languageCode.toLowerCase();
            
            switch (sysLanguage) {
                case 'zh':
                case 'zh_cn':
                case 'zh-cn':
                case 'zh_sg':
                case 'zh-sg':
                    languageCode = 'zh';
                    break;
                case 'zh_hk':
                case 'zh-hk':
                case 'zh_mo':
                case 'zh-mo':
                case 'zh_tw':
                case 'zh-tw':
                    languageCode = 'zh-tw';
                    break;
                case 'id':
                case 'id-id':
                case 'id_id':
                case 'in-id':
                case 'in_id':
                case 'en-id':
                case 'en_id':
                    languageCode = 'id';
                    break;
                case 'de':
                case 'de-de':
                case 'de_de':
                case 'de-li':
                case 'de_li':
                case 'de-at':
                case 'de_at':
                case 'de-ch':
                case 'de_ch':
                    languageCode = 'de';
                    break;
                case 'es':
                case 'es-es':
                case 'es_es':
                case 'es-la':
                case 'es_la':
                case 'es-ar':
                case 'es_ar':
                case 'es-us':
                case 'es_us':
                case 'es-mx':
                case 'es_mx':
                case 'es-co':
                case 'es_co':
                case 'es-pr':
                case 'es_pr':
                    languageCode = 'es';
                    break;
                case 'fr':
                case 'fr-fr':
                case 'fr_fr':
                case 'fr-lu':
                case 'fr_lu':
                case 'fr-ch':
                case 'fr_ch':
                case 'fr-be':
                case 'fr_be':
                    languageCode = 'fr';
                    break;
                case 'hi':
                case 'hi-in':
                case 'hi_in':
                case 'en-in':
                case 'en_in':
                    languageCode = 'in';
                    break;
                case 'it':
                case 'it-it':
                case 'it_it':
                    languageCode = 'it';
                    break;
                case 'ja':
                case 'ja-jp':
                case 'ja_jp':
                    languageCode = 'jp';
                    break;
                case 'ko':
                case 'ko-kr':
                case 'ko_kr':
                    languageCode = 'ko';
                    break;
                case 'ru':
                case 'ru-ru':
                case 'ru_ru':
                    languageCode = 'ru';
                    break;
                case 'pt':
                case 'pt-pt':
                case 'pt_pt':
                    languageCode = 'pt';
                    break;
                default:
                    languageCode = 'en';
            }
            
            sys.localStorage.setItem(languageKey, languageCode);
        }
        
        Language.Instance.setAssetsPath(this.languagePathJson, this.languagePathTexture);
        Language.Instance.setLanguage(languageCode, callback);
    }

    public saveLocalLanguage(languageCode: string): void {
        const languageKey = this.getLanguageKey();
        sys.localStorage.setItem(languageKey, languageCode);
    }

    // Properties with getters and setters
    get gameName(): string {
        return this._data.config.gameName;
    }

    get debug(): boolean {
        return true;
        //@todo show debug
        return this._data.config.debug;
    }

    get reportDebug(): boolean {
        return this._data.config.reportDebug;
    }

    get version(): string {
        return this._data.config.version;
    }

    set version(value: string) {
        this._data.config.version = value;
    }

    get versionRemote(): string {
        return this._data.config.versionRemote || this.version;
    }

    set versionRemote(value: string) {
        this._data.config.versionRemote = value;
    }

    get baseVersion(): string {
        return this._data.config.baseVersion;
    }

    get checkNetTime(): number {
        return this._data.config.checkNetTime;
    }

    set checkNetTime(value: number) {
        this._data.config.checkNetTime = value;
    }

    get useServerData(): boolean {
        return this._data.config.useServerData;
    }

    get checkUpdate(): boolean {
        return this._data.config.checkUpdate;
    }

    get frameRate(): number {
        return this._data.config.frameRate;
    }

    set frameRate(value: number) {
        this._data.config.frameRate = value;
        this.frameTime = 1 / value;
    }

    get frameTime(): number {
        if (!this._data.config.frameTime) {
            this._data.config.frameTime = 1 / this.frameRate;
        }
        return this._data.config.frameTime;
    }

    set frameTime(value: number) {
        this._data.config.frameTime = value;
    }

    get language(): string[] {
        return this._data.language.type || ['zh'];
    }

    get languagePathJson(): string {
        return this._data.language.path.json || 'language/json';
    }

    get languagePathTexture(): string {
        return this._data.language.path.texture || 'language/texture';
    }

    get defaultLanguage(): string | null {
        return sys.localStorage.getItem('default_language');
    }

    get packageUrl(): string {
        return this._data.config.packageUrl;
    }

    set packageUrl(value: string) {
        this._data.config.packageUrl = value;
    }
}

// Export a singleton instance
export const config = new Config();