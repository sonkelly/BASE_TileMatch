import { _decorator, Component, Node, Sprite, SpriteFrame, UIOpacity, tween, Tween, easing, v3 } from 'cc';
import { AsyncQueue } from './AsyncQueue';
import { StarEagleStageLevel } from './MgrStar';

const { ccclass, property } = _decorator;

@ccclass('StarleagueStage')
export class StarleagueStage extends Component {
    @property([SpriteFrame])
    stageSpriteFrame: SpriteFrame[] = [];

    @property(Sprite)
    stageSprite: Sprite | null = null;

    @property([Node])
    starNodes: Node[] = [];

    private _prevLevel: number = 0;
    private _curLevel: number = 0;
    private _taskAsync: AsyncQueue | null = null;
    private originScale: any;

    onLoad() {
        this.originScale = this.starNodes[0].getScale();
    }

    onDisable() {
        if (this._taskAsync) {
            this._taskAsync.clear();
            this._taskAsync = null;
        }
        this.unscheduleAllCallbacks();
    }

    init(level: number) {
        this._prevLevel = level;
        const stageIndex = Math.ceil(level / StarEagleStageLevel) - 1;
        this.stageSprite!.spriteFrame = this.stageSpriteFrame[stageIndex];
        
        let starCount = level % StarEagleStageLevel;
        if (starCount === 0) starCount = StarEagleStageLevel;
        
        this.starNodes.forEach((node, index) => {
            if (index < starCount) {
                node.active = true;
                node.scale = this.originScale;
                const opacityComp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
                opacityComp.opacity = 255;
            } else {
                node.active = false;
            }
        });
    }

    step(level: number) {
        this._curLevel = level;
        const diff = this._curLevel - this._prevLevel;
        if (diff > 0) {
            this._runAddTask(diff);
        } else if (diff < 0) {
            this._runSubTask(Math.abs(diff));
        }
    }

    private _runAddTask(count: number) {
        this._taskAsync = new AsyncQueue();
        
        for (let i = 1; i <= count; i++) {
            this._taskAsync.push((complete) => {
                this._prevLevel++;
                
                let starIndex = this._prevLevel % StarEagleStageLevel;
                if (starIndex === 0) starIndex = StarEagleStageLevel;
                
                const stageIndex = Math.ceil(this._prevLevel / StarEagleStageLevel) - 1;
                
                this.starNodes.forEach((node, index) => {
                    if (index < starIndex - 1) {
                        node.active = true;
                        node.scale = this.originScale;
                        const opacityComp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
                        opacityComp.opacity = 255;
                    } else {
                        node.active = false;
                    }
                });
                
                if (starIndex === 1) {
                    this.stageSprite!.spriteFrame = this.stageSpriteFrame[stageIndex];
                }
                
                const starNode = this.starNodes[starIndex - 1];
                starNode.scale = v3(0, 0, 0);
                const opacityComp = starNode.getComponent(UIOpacity) || starNode.addComponent(UIOpacity);
                opacityComp.opacity = 0;
                starNode.active = true;
                
                Tween.stopAllByTarget(starNode);
                tween(starNode)
                    .to(0.48, { scale: this.originScale }, { easing: easing.backIn })
                    .call(() => complete())
                    .start();
                    
                Tween.stopAllByTarget(opacityComp);
                tween(opacityComp)
                    .to(0.48, { opacity: 255 }, { easing: easing.backIn })
                    .start();
            });
        }
        
        this._taskAsync.complete = () => {};
        this._taskAsync.play();
    }

    private _runSubTask(count: number) {
        this._taskAsync = new AsyncQueue();
        
        for (let i = 1; i <= count; i++) {
            this._taskAsync.push((complete) => {
                const prevLevel = this._prevLevel;
                this._prevLevel--;
                
                let starIndex = prevLevel % StarEagleStageLevel;
                if (starIndex === 0) starIndex = StarEagleStageLevel;
                
                const stageIndex = Math.ceil(this._prevLevel / StarEagleStageLevel) - 1;
                
                this.starNodes.forEach((node, index) => {
                    if (index < starIndex) {
                        node.active = true;
                        node.scale = this.originScale;
                        const opacityComp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
                        opacityComp.opacity = 255;
                    } else {
                        node.active = false;
                    }
                });
                
                if (starIndex === StarEagleStageLevel) {
                    this.stageSprite!.spriteFrame = this.stageSpriteFrame[stageIndex];
                }
                
                const starNode = this.starNodes[starIndex - 1];
                starNode.scale = this.originScale;
                const opacityComp = starNode.getComponent(UIOpacity) || starNode.addComponent(UIOpacity);
                opacityComp.opacity = 255;
                starNode.active = true;
                
                Tween.stopAllByTarget(starNode);
                tween(starNode)
                    .to(0.64, { scale: v3(0, 0, 0) }, { easing: easing.sineOut })
                    .call(() => complete())
                    .start();
                    
                Tween.stopAllByTarget(opacityComp);
                tween(opacityComp)
                    .to(0.64, { opacity: 0 }, { easing: easing.sineOut })
                    .start();
            });
        }
        
        this._taskAsync.push((complete) => {
            let starIndex = this._curLevel % StarEagleStageLevel;
            if (starIndex === 0) starIndex = StarEagleStageLevel;
            
            const stageIndex = Math.ceil(this._curLevel / StarEagleStageLevel) - 1;
            
            this.starNodes.forEach((node, index) => {
                if (index < starIndex) {
                    node.active = true;
                    Tween.stopAllByTarget(node);
                    node.scale = this.originScale;
                    
                    const opacityComp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
                    Tween.stopAllByTarget(opacityComp);
                    opacityComp.opacity = 255;
                } else {
                    node.active = false;
                }
            });
            
            if (starIndex === StarEagleStageLevel) {
                this.stageSprite!.spriteFrame = this.stageSpriteFrame[stageIndex];
            }
            
            complete();
        });
        
        this._taskAsync.complete = () => {};
        this._taskAsync.play();
    }
}