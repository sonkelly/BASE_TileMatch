import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import * as lodash from 'lodash-es'
//import md5 from 'md5';
//import {XXTEA} from './xxtea';
@ccclass('NewComponent')
export class NewComponent extends Component {
    a = 0
    start() {
        lodash.get("33", this.a)
    }

    update(deltaTime: number) {
        
    }
}

