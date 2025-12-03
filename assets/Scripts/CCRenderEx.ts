import { _decorator, cclegacy, approx, EPSILON, StencilManager, gfx, clamp } from 'cc';

const { ccclass, property } = _decorator;

enum StencilStage {
    DISABLED = 0,
    CLEAR = 1,
    ENTER_LEVEL = 2,
    ENABLED = 3,
    EXIT_LEVEL = 4,
    CLEAR_INVERTED = 5,
    ENTER_LEVEL_INVERTED = 6
}

const levelRenderQueue: any[][] = [];

function updateOpacity(renderData: any, opacity: number) {
    const vertexFormat = renderData.vertexFormat;
    const vb = renderData.chunk.vb;
    let offset = 0;

    for (let i = 0; i < vertexFormat.length; ++i) {
        const attr = vertexFormat[i];
        const formatInfo = gfx.FormatInfos[attr.format];
        
        if (formatInfo.hasAlpha) {
            const stride = renderData.floatStride;
            
            if (formatInfo.size / formatInfo.count === 1) {
                const alphaValue = clamp(Math.round(0xff * opacity), 0, 0xff);
                for (let j = offset; j < vb.length; j += stride) {
                    vb[j] = ((0xffffff00 & vb[j]) | alphaValue) >>> 0;
                }
            } else if (formatInfo.size / formatInfo.count === 4) {
                for (let j = offset + 3; j < vb.length; j += stride) {
                    vb[j] = opacity;
                }
            }
        }
        offset += formatInfo.size >> 2;
    }
}

export class CCRenderEx {
    public static register() {
        const Batcher2D = cclegacy.internal.Batcher2D;

        Batcher2D.prototype.levelSplit = function(node: any, level: number, itemIndex: number): number {
            if (!levelRenderQueue[level]) {
                levelRenderQueue[level] = [];
            }
            levelRenderQueue[level].push(node);
            
            level++;
            node.__renderLv = level;
            node.__levelRender = true;
            node.__itemIndex = itemIndex;

            const children = node.children;
            for (let i = 0; i < children.length; ++i) {
                const child = children[i];
                if (!levelRenderQueue[level]) {
                    levelRenderQueue[level] = [];
                }
                level = this.levelSplit(child, level, itemIndex);
            }

            return level;
        };

        Batcher2D.prototype.walk = function(node: any, depth: number = 0) {
            if (!node.activeInHierarchy) return;

            const children = node.children;
            const uiProps = node._uiProps;
            const uiComp = uiProps.uiComp;
            
            let parentOpacity = 1;
            if (node.parent) {
                parentOpacity = node.parent._uiProps.opacity;
            }

            let opacity = parentOpacity;
            opacity *= ((uiComp && uiComp.color) ? uiComp.color.a / 0xff : 1) * uiProps.localOpacity;
            uiProps._opacity = opacity;

            if (!approx(opacity, 0, EPSILON)) {
                if (uiProps.colorDirty) {
                    this._opacityDirty++;
                }

                if (uiComp && uiComp.enabledInHierarchy && uiComp.fillBuffers) {
                    uiComp.fillBuffers(this);
                }

                if (this._opacityDirty && uiComp && !uiComp.useVertexOpacity && 
                    uiComp.renderData && uiComp.renderData.vertexCount > 0) {
                    updateOpacity(uiComp.renderData, opacity);
                    const meshBuffer = uiComp.renderData.getMeshBuffer();
                    if (meshBuffer) {
                        meshBuffer.setDirty();
                    }
                }

                if (children.length > 0 && !node._static && !node.__levelRender) {
                    levelRenderQueue.length = 0;
                    
                    for (let i = 0; i < children.length; ++i) {
                        const child = children[i];
                        if (node.__enableLevelRender) {
                            this.levelSplit(child, 0, i);
                        } else {
                            this.walk(child, depth);
                        }
                    }

                    while (levelRenderQueue.length > 0) {
                        const levelNodes = levelRenderQueue.shift();
                        if (levelNodes && levelNodes.length > 0) {
                            while (levelNodes.length > 0) {
                                const childNode = levelNodes.shift();
                                this.walk(childNode, depth);
                            }
                        }
                    }
                }

                if (uiProps.colorDirty) {
                    this._opacityDirty--;
                    uiProps.colorDirty = false;
                }
            }

            if (uiComp && uiComp.enabledInHierarchy) {
                if (uiComp.postUpdateAssembler) {
                    uiComp.postUpdateAssembler(this);
                }

                if ((uiComp.stencilStage === StencilStage.ENTER_LEVEL || 
                     uiComp.stencilStage === StencilStage.ENTER_LEVEL_INVERTED) &&
                    StencilManager.sharedManager.getMaskStackSize() > 0) {
                    this.autoMergeBatches(this._currComponent);
                    this.resetRenderStates();
                    StencilManager.sharedManager.exitMask();
                }
            }

            depth++;
        };
    }
}