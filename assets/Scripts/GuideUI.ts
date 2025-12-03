import { _decorator, Node, sp, director, UITransform, Component, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';

const { ccclass, property } = _decorator;

@ccclass('GuideUI')
export class GuideUI extends Component {
    @property(Node)
    guideLayer: Node = null!;

    @property(sp.Skeleton)
    hand: sp.Skeleton = null!;

    onEnable() {
        director.on(GlobalEvent.GameBackHome, this.onBackHome, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    showHand(targetNode: Node) {
        function showInfo(targetNode){
            let ui = targetNode.getComponent("cc.UITransform");

            console.log(targetNode.name, {x : targetNode.getPosition().x, y : targetNode.getPosition().y}, {width : (ui ? ui.width : 0), height : (ui ? ui.height : 0)})
            if(targetNode.parent){
                showInfo(targetNode.parent)
            }
        }
        const worldPos = targetNode.getWorldPosition();
        showInfo(this.node)

        const nodePos = this.node.getComponent(UITransform)!.convertToNodeSpaceAR(worldPos);

        //debugger

        this.hand.node.setPosition(nodePos);
        this.guideLayer.active = true;
        this.hand.setAnimation(0, 'novice_hand', true);
        
        director.on(GlobalEvent.NextGuide, this.onNextGuide, this);
    }

    onNextGuide() {
        this.hideLayer();
    }

    onBackHome() {
        this.hideLayer();
    }

    hideLayer() {
        this.node.emit(VIEW_ANIM_EVENT.Remove, this);
    }
}