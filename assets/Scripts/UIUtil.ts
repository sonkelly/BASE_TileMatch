import { _decorator, Component, Node, Vec3, Vec2, UITransform, assetManager, ImageAsset, SpriteFrame, Texture2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIUtil')
export class UIUtil extends Component {

    private static tempVec3_1: Vec3 = new Vec3();
    private static tempVec3_2: Vec3 = new Vec3();
    private static tempVec3_3: Vec3 = new Vec3();
    private static tempVec2: Vec2 = new Vec2();

    public static async wait(delay: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, delay);
        });
    }

    public static convertToNodeSpaceAR(worldPos: Vec3, targetNode: Node): Vec3 {
        const worldSpace = targetNode.getComponent(UITransform)!.convertToWorldSpaceAR(worldPos);
        return this.convertToNodeSpaceAR(worldSpace, targetNode);
    }

    public static isTouchInNodeRect(touchEvent: any, node: Node): boolean {
        touchEvent.getUILocation(this.tempVec2);
        return node.getComponent(UITransform)!.getBoundingBoxToWorld().contains(this.tempVec2);
    }

    public static getWorldPositionByCamera(sourceCamera: any, targetCamera: any, position: Vec3 | Node): Vec3 {
        const worldPos = position instanceof Node ? 
            this.tempVec3_1.set(position.worldPosition) : 
            this.tempVec3_1.set(position);
            
        sourceCamera.camera.worldToScreen(this.tempVec3_2, worldPos);
        targetCamera.camera.screenToWorld(this.tempVec3_3, this.tempVec3_2);
        
        return this.tempVec3_3.clone();
    }

    public static loadHead(imageUrl: string, targetNode: Node): void {
        assetManager.downloader.downloadDomImage(imageUrl, { ext: '.jpg' }, (err, image) => {
            if (err) {
                console.error('Failed to load head image:', err);
                return;
            }
            
            if (targetNode && targetNode.isValid) {
                const imageAsset = new ImageAsset(image);
                const spriteFrame = new SpriteFrame();
                const texture = new Texture2D();
                
                texture.image = imageAsset;
                spriteFrame.texture = texture;
                
                const sprite = targetNode.getComponent(Sprite) || targetNode.addComponent(Sprite);
                sprite.spriteFrame = spriteFrame;
            }
        });
    }

    public static changeLayer(node: Node, layer: number): void {
        if (node && node.layer !== layer) {
            node.layer = layer;
        }
        
        if (node && node.children && node.children.length > 0) {
            node.children.forEach(child => {
                this.changeLayer(child, layer);
            });
        }
    }
}