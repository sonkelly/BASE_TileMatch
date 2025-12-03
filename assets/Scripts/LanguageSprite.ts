import { _decorator, CCString, Component, Sprite, SpriteFrame, resources, UITransform, sys, cclegacy } from 'cc';
import { LanguageData } from './LanguageData';
import { config } from './Config';

const { ccclass, property, menu } = _decorator;

@ccclass('LanguageSprite')
@menu('language/LanguageSprite')
export class LanguageSprite extends Component {
    @property({
        serializable: true
    })
    private _dataID: string = '';

    @property({
        type: CCString,
        serializable: true
    })
    public get dataID(): string {
        return this._dataID || '';
    }

    public set dataID(value: string) {
        this._dataID = value;
        this.updateSprite();
    }

    @property({
        tooltip: '是否设置为图片原始资源大小'
    })
    public isRawSize: boolean = true;

    private defaultFrame: SpriteFrame | null = null;

    public onLoad(): void {
        const sprite = this.getComponent(Sprite);
        sprite!.spriteFrame = this.defaultFrame;
        this.defaultFrame = sprite!.spriteFrame;
        sprite!.spriteFrame = null;
    }

    public start(): void {
        this.updateSprite();
    }

    public language(): void {
        this.updateSprite();
    }

    private updateSprite(): void {
        const path = `language/texture/${this.getLanguage()}/${this.dataID}/spriteFrame`;
        const spriteFrame = resources.get(path, SpriteFrame);
        
        if (spriteFrame) {
            const sprite = this.getComponent(Sprite);
            sprite!.spriteFrame = spriteFrame;
            
            if (this.isRawSize) {
                const originalSize = spriteFrame._originalSize;
                sprite!.node.getComponent(UITransform)!.setContentSize(originalSize);
            }
        } else {
            console.error(`[LanguageSprite] 资源不存在 ${path}`);
            this.getComponent(Sprite)!.spriteFrame = this.defaultFrame;
        }
    }

    private getLanguage(): string {
        let language = 'en';
        
        if (LanguageData.current !== '') {
            const languageKey = config.getLanguageKey();
            const storedLanguage = sys.localStorage.getItem(languageKey);
            
            if (storedLanguage) {
                language = storedLanguage;
            }
        }
        
        return language;
    }
}