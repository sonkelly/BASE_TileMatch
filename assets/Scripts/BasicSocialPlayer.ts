import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

export class BasicSocialPlayerData {
    id: string = '123';
    name: string = '';
    photo: string = '';
}

@ccclass('BasicSocialPlayer')
export class BasicSocialPlayer extends Component {
    private data: BasicSocialPlayerData = new BasicSocialPlayerData();

    getID(): string {
        return this.data.id;
    }

    getName(): string {
        return this.data.name;
    }

    getPhoto(): string {
        return this.data.photo;
    }
}