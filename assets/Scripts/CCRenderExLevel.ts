import { _decorator, Component } from 'cc';
const { ccclass, menu } = _decorator;

@ccclass('CCRenderExLevel')
@menu('性能优化/CCRenderExLevel')
export default class CCRenderExLevel extends Component {
    onLoad(): void {
        (this.node as any).__enableLevelRender = true;
    }
}