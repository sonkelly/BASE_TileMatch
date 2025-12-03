import {
    _decorator,
    Component,
    Node,
    Color,
    Canvas,
    UITransform,
    instantiate,
    Label,
    RichText,
    Toggle,
    Button,
    director,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('internal.DebugViewRuntimeControl')
export class DebugViewRuntimeControl extends Component {

    @property(Node)
    compositeModeToggle: Node | null = null;

    @property(Node)
    singleModeToggle: Node | null = null;

    @property(Node)
    EnableAllCompositeModeButton: Node | null = null;

    private _single = 0;
    private strSingle: string[] = [
        "No Single Debug", "Vertex Color", "Vertex Normal", "Vertex Tangent", "World Position", "Vertex Mirror", "Face Side",
        "UV0", "UV1", "UV Lightmap", "Project Depth", "Linear Depth", "Fragment Normal", "Fragment Tangent",
        "Fragment Binormal", "Base Color", "Diffuse Color", "Specular Color", "Transparency", "Metallic",
        "Roughness", "Specular Intensity", "IOR", "Direct Diffuse", "Direct Specular", "Direct All", "Env Diffuse",
        "Env Specular", "Env All", "Emissive", "Light Map", "Shadow", "AO", "Fresnel", "Direct Transmit Diffuse",
        "Direct Transmit Specular", "Env Transmit Diffuse", "Env Transmit Specular", "Transmit All",
        "Direct Internal Specular", "Env Internal Specular", "Internal All", "Fog"
    ];

    private strComposite: string[] = [
        "Direct Diffuse", "Direct Specular", "Env Diffuse", "Env Specular", "Emissive",
        "Light Map", "Shadow", "AO", "Normal Map", "Fog", "Tone Mapping", "Gamma Correction",
        "Fresnel", "Transmit Diffuse", "Transmit Specular", "Internal Specular", "TT"
    ];

    private strMisc: string[] = ["CSM Layer Coloration", "Lighting With Albedo"];

    private compositeModeToggleList: Node[] = [];
    private singleModeToggleList: Node[] = [];
    private miscModeToggleList: Node[] = [];
    private textComponentList: (Label | RichText)[] = [];
    private labelComponentList: Label[] = [];
    private textContentList: string[] = [];
    private hideButtonLabel: Label | undefined = undefined;

    private _currentColorIndex = 0;
    private strColor: string[] = ["<color=#ffffff>", "<color=#000000>", "<color=#ff0000>", "<color=#00ff00>", "<color=#0000ff>"];
    private color: Color[] = [Color.WHITE, Color.BLACK, Color.RED, Color.GREEN, Color.BLUE];

    start() {
        const parentCanvas = this.node.parent?.getComponent(Canvas);
        if (!parentCanvas) {
            console.error("debug-view-runtime-control should be child of Canvas");
            return;
        }

        const uiTrans = this.node.parent.getComponent(UITransform)!;
        const width = 0.5 * uiTrans.width;
        const height = 0.5 * uiTrans.height;
        let posX = 0.1 * width - width;
        let posY = height - 0.1 * height;

        const miscNode = this.node.getChildByName("MiscMode")!;
        const buttonsRoot = instantiate(miscNode);
        buttonsRoot.parent = this.node;
        buttonsRoot.name = "Buttons";

        const titlesRoot = instantiate(miscNode);
        titlesRoot.parent = this.node;
        titlesRoot.name = "Titles";

        // Tạo Title cho Single / Composite mode
        for (let u = 0; u < 2; u++) {
            const labelNode = instantiate(this.EnableAllCompositeModeButton!.getChildByName("Label")!);
            labelNode.setPosition(posX + (u > 0 ? 450 : 150), posY, 0);
            labelNode.setScale(0.75, 0.75, 0.75);
            labelNode.parent = titlesRoot;

            const lbl = labelNode.getComponent(Label)!;
            lbl.string = u ? "----------Composite Mode----------" : "----------Single Mode----------";
            lbl.color = Color.WHITE;
            lbl.overflow = Label.Overflow.NONE;
            this.labelComponentList.push(lbl);
        }

        // TODO: Phần còn lại (Single toggle, Composite toggle, Misc toggle, button events...)
        // Có thể copy logic từ bản JS sang giống hệt
    }

    private isTextMatched(str: string, target: string): boolean {
        const idx = str.indexOf(">");
        if (idx === -1) return str === target;
        const pureText = str.substring(idx + 1, str.indexOf("<", idx + 1));
        return pureText === target;
    }

    private toggleSingleMode(toggle: Toggle) {
        const dbg = director.root!.debugView;
        const txt = toggle.getComponentInChildren(RichText)!;
        for (let i = 0; i < this.strSingle.length; i++) {
            if (this.isTextMatched(txt.string, this.strSingle[i])) {
                dbg.singleMode = i;
            }
        }
    }

    private toggleCompositeMode(toggle: Toggle) {
        const dbg = director.root!.debugView;
        const txt = toggle.getComponentInChildren(RichText)!;
        for (let i = 0; i < this.strComposite.length; i++) {
            if (this.isTextMatched(txt.string, this.strComposite[i])) {
                dbg.enableCompositeMode(i, toggle.isChecked);
            }
        }
    }

    private toggleLightingWithAlbedo(toggle: Toggle) {
        director.root!.debugView.lightingWithAlbedo = toggle.isChecked;
    }

    private toggleCSMColoration(toggle: Toggle) {
        director.root!.debugView.csmLayerColoration = toggle.isChecked;
    }

    private enableAllCompositeMode(btn: Button) {
        const dbg = director.root!.debugView;
        dbg.enableAllCompositeMode(true);

        this.compositeModeToggleList.forEach(n => n.getComponent(Toggle)!.isChecked = true);

        let t = this.miscModeToggleList[0].getComponent(Toggle)!;
        t.isChecked = false;
        dbg.csmLayerColoration = false;

        t = this.miscModeToggleList[1].getComponent(Toggle)!;
        t.isChecked = true;
        dbg.lightingWithAlbedo = true;
    }

    private hideUI(btn: Button) {
        const titles = this.node.getChildByName("Titles")!;
        const active = !titles.active;

        this.singleModeToggleList[0].parent!.active = active;
        this.miscModeToggleList[0].parent!.active = active;
        this.compositeModeToggleList[0].parent!.active = active;
        this.EnableAllCompositeModeButton!.parent!.active = active;
        titles.active = active;

        if (this.hideButtonLabel) {
            this.hideButtonLabel.string = active ? "Hide UI" : "Show UI";
        }
    }

    private changeTextColor(btn: Button) {
        this._currentColorIndex++;
        if (this._currentColorIndex >= this.strColor.length) {
            this._currentColorIndex = 0;
        }

        for (let i = 0; i < this.textComponentList.length; i++) {
            this.textComponentList[i].string =
                this.strColor[this._currentColorIndex] + this.textContentList[i] + "</color>";
        }
        for (let i = 0; i < this.labelComponentList.length; i++) {
            this.labelComponentList[i].color = this.color[this._currentColorIndex];
        }
    }
}
