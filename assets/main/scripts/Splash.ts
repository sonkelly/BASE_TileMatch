import {
    _decorator,
    Component,
    Node,
    Sprite,
    UITransform,
    view,
    ResolutionPolicy,
    assetManager,
    sys,
    DynamicAtlasManager,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Splash')
export class Splash extends Component {

    @property(Node)
    background: Node | null = null;

    @property(Sprite)
    logoSprite: Sprite | null = null;

    private defaultFrame: any = null;
    private nodeWidth: number | null = null;
    private nodeHeight: number | null = null;

    onLoad() {
        // Disable DynamicAtlas
        DynamicAtlasManager.instance.enabled = false;

        const visibleSize = view.getVisibleSize();
        const designSize = view.getDesignResolutionSize();

        // Adjust resolution policy
        if (visibleSize.width / visibleSize.height > designSize.width / designSize.height) {
            view.setResolutionPolicy(ResolutionPolicy.SHOW_ALL);
            view.setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy.SHOW_ALL);
        } else if (visibleSize.width / visibleSize.height > designSize.width / designSize.height) {
            view.setResolutionPolicy(ResolutionPolicy.FIXED_HEIGHT);
        }

        // Get size from background
        if (this.background) {
            const uiTrans = this.background.getComponent(UITransform)!;
            this.nodeWidth = uiTrans.width;
            this.nodeHeight = uiTrans.height;
        }
    }

    loadGameLogo() {
        // TODO: Có thể load logo từ bundle hoặc asset khác
    }

    start() {
        const visibleSize = view.getVisibleSize();
        if (!this.nodeWidth || !this.nodeHeight) return;

        let scale = this.nodeWidth / this.nodeHeight;
        scale = scale < visibleSize.width / visibleSize.height
            ? visibleSize.width / this.nodeWidth
            : visibleSize.height / this.nodeHeight;

        if (this.background) {
            this.background.setScale(scale, scale, scale);
        }

        assetManager.loadBundle("Scripts", {
            onFileProgress: () => {}
        }, (err, bundle) => {
            if (err) {
                console.error("Failed to load Scripts bundle:", err);
                return;
            }
            this.addComponent("Launder"); // attach Launder component dynamically
        });
    }

    getDefaultLang(): string {
        let lang = sys.localStorage.getItem("ck_language");

        if (!lang) {
            switch (sys.languageCode.toLowerCase()) {
                case "zh":
                case "zh_cn":
                case "zh-cn":
                case "zh_sg":
                case "zh-sg":
                    lang = "zh";
                    break;
                case "zh_hk":
                case "zh-hk":
                case "zh_mo":
                case "zh-mo":
                case "zh_tw":
                case "zh-tw":
                    lang = "zh-tw";
                    break;
                case "id":
                case "id-id":
                case "id_id":
                case "in-id":
                case "in_id":
                case "en-id":
                case "en_id":
                    lang = "id";
                    break;
                case "de":
                case "de-de":
                case "de_de":
                case "de-li":
                case "de_li":
                case "de-at":
                case "de_at":
                case "de-ch":
                case "de_ch":
                    lang = "de";
                    break;
                case "es":
                case "es-es":
                case "es_es":
                case "es-la":
                case "es_la":
                case "es-ar":
                case "es_ar":
                case "es-us":
                case "es_us":
                case "es-mx":
                case "es_mx":
                case "es-co":
                case "es_co":
                case "es-pr":
                case "es_pr":
                    lang = "es";
                    break;
                case "fr":
                case "fr-fr":
                case "fr_fr":
                case "fr-lu":
                case "fr_lu":
                case "fr-ch":
                case "fr_ch":
                case "fr-be":
                case "fr_be":
                    lang = "fr";
                    break;
                case "hi":
                case "hi-in":
                case "hi_in":
                case "en-in":
                case "en_in":
                    lang = "in";
                    break;
                case "it":
                case "it-it":
                case "it_it":
                    lang = "it";
                    break;
                case "ja":
                case "ja-jp":
                case "ja_jp":
                    lang = "jp";
                    break;
                case "ko":
                case "ko-kr":
                case "ko_kr":
                    lang = "ko";
                    break;
                case "ru":
                case "ru-ru":
                case "ru_ru":
                    lang = "ru";
                    break;
                case "pt":
                case "pt-pt":
                case "pt_pt":
                    lang = "pt";
                    break;
                default:
                    lang = "en";
            }
        }

        const key = "default_language";
        if (!sys.localStorage.getItem(key)) {
            sys.localStorage.setItem(key, lang);
        }
        return lang;
    }
}
