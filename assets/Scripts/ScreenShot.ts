import { _decorator, Size, gfx, director, find, UITransform, RenderTexture, Camera, cclegacy } from 'cc';
import {UIUtil} from './UIUtil';

const { ccclass, property } = _decorator;

@ccclass('ScreenShot')
export class ScreenShot {
    private _texture: any = null;

    public static base64OfTexture(texture: any): string {
        if (!texture) {
            return '';
        }
        let canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const imageData = texture.image.data;
        
        canvas.height = imageData.height;
        canvas.width = imageData.width;
        ctx.drawImage(imageData, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        canvas = null;
        return dataUrl;
    }

    public static getSize(): Size {
        const size = new Size(640, 700);
        size.width = 2 * size.width;
        size.height = 2 * size.height;
        return size;
    }

    public static async NodeToBase64(node: any = null) {
        if (node === undefined) {
            node = null;
        }
        node && (node.parent = find('ScrenShotCanvas'));
        
        const uiTransform = node.getComponent(UITransform);
        const contentSize = uiTransform.contentSize;
        
        const renderTexture = new RenderTexture();
        renderTexture.initialize({
            width: Math.floor(this.getSize().width),
            height: Math.floor(this.getSize().height)
        });
        
        const camera = find('ScrenShotCanvas').getComponentInChildren(Camera);
        camera.targetTexture = renderTexture;
        
        await UIUtil.wait(200);
        
        const result = this.copyRenderTex(renderTexture, contentSize);
        camera.targetTexture = null;
        
        return result;
    };

    public static copyRenderTex(renderTexture: RenderTexture, contentSize: Size): string {
        const buffer = new Uint8Array(renderTexture.width * renderTexture.height * 4);
        const bufferCopy = new gfx.BufferTextureCopy();
        
        bufferCopy.texOffset.x = 0;
        bufferCopy.texOffset.y = 0;
        bufferCopy.texExtent.width = renderTexture.width;
        bufferCopy.texExtent.height = renderTexture.height;
        
        director.root.device.copyTextureToBuffers(
            renderTexture.getGFXTexture(),
            [buffer],
            [bufferCopy]
        );
        
        return this.toB64(buffer[0], contentSize);
    }

    public static toB64(bufferData: Uint8Array, size: Size): string {
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        
        const width = canvas.width;
        const height = canvas.height;
        const fullSize = this.getSize();
        const ctx = canvas.getContext('2d');
        const pixelData = bufferData;
        const bytesPerRow = 4 * width;
        const fullWidth = Math.floor(fullSize.width);
        const centerY = Math.floor(fullSize.height) / 2 + height / 2;
        const centerX = fullWidth / 2 - width / 2;
        
        for (let y = 0; y < height; y++) {
            const sourceY = centerY - 1 - y;
            const imageData = ctx.createImageData(width, 1);
            const sourceOffset = sourceY * fullWidth * 4 + 4 * centerX;
            
            for (let x = 0; x < bytesPerRow; x++) {
                imageData.data[x] = pixelData[sourceOffset + x];
            }
            
            ctx.putImageData(imageData, 0, y);
        }
        
        return canvas.toDataURL('image/jpeg', 0.5);
    }
}