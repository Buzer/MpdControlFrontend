///<reference path='socket.io-client.d.ts'/>
/// <reference path='LiteEvent.ts' />

interface MpdMessage {
    command: string;
    identifier: number;
    params: any;
}
interface MpdOutstandingMessage {
    message: MpdMessage;
    permanent: boolean;
    callback: (data) => void;
}
interface Song {
    title: string;
    artist: string;
    album: string;
    length: number;
    cover: string;
}

class MpdControl {
    socket: Socket;
    url: string;
    password: string;
    permissioncheck: Array<boolean>;
    id: number;
    logindata: any;
    private currentsong: Song = { album: "Foobar", artist: "No one", length: 600, title: "Nothing", cover: null };
    private elapsed: number = 20;
    private paused = false;
    outstandingMessages: { [index: number]: MpdOutstandingMessage; };
    hosts: Array<string>;
    
    private onSong = new LiteEvent<Song>();
    private onElapsed = new LiteEvent<number>();
    private onLogin = new LiteEvent<Array<string>>();

    constructor(url: string) {
        this.url = url;
        this.id = 0;
        this.permissioncheck = new Array<boolean>();
        this.permissioncheck.push(true);
        this.socket = null;
        this.outstandingMessages = {};
    }

    private result(data: MpdMessage): void {
        var outstanding = this.getOutstandingMessage(data.identifier);
        outstanding.callback(data);
    }

    private getOutstandingMessage(identifier: number, removeNonPermanent: boolean = true): MpdOutstandingMessage {
        if (!this.outstandingMessages[identifier]) {
            //We should throw here or something
            return;
        }
        var msg = this.outstandingMessages[identifier];
        if (removeNonPermanent)
            delete this.outstandingMessages[identifier];
        return msg;
    }

    public login(logindata: any): void {
        this.logindata = logindata;
        if (this.socket == null)
            return this.connect(() => { this.loginPrivate(); });
        this.loginPrivate();
    }
    private loginPrivate(): void {
        this.socket.emit("login", this.logindata, (resp) => {
            if (resp.state != "ok")
                return alert(JSON.stringify(resp));
            this.hosts = resp.hosts;
            this.onLogin.trigger(this.hosts);
        });
    }
    private connect(cb: () => any): void {
        this.socket = io.connect(this.url);
        this.socket.on("mpdResult", (message: MpdMessage) => { this.result(message); });
        this.socket.on('connect', () => { cb(); });
    }

    private getId(): number {
        return this.id++;
    }

    private sendCommand(command: string, params: any, cb: (n: any) => any, continous:boolean = false) {
        var msg: MpdMessage = { command: command, identifier: this.getId(), params: params };
        this.outstandingMessages[msg.identifier] = { permanent: continous, message: msg, callback: cb};
        this.socket.emit("mpd", msg);

    }
    private subscribe(): void {
        this.updateSong();
        this.updateElapsed();
        setTimeout(() => {
            this.subscribe();
        }, 10000);
    }
    updateSong(): void {
        this.sendCommand("currentsong", null, (x: MpdMessage) => {
            var newsong = this.parseSong(x.params);
            if (newsong.album != this.currentsong.album || newsong.artist != this.currentsong.artist || newsong.title != this.currentsong.title) {
                this.sendCommand("getcover", null, (x: MpdMessage) => {
                    this.currentsong.cover = x.params;
                    this.onSong.trigger(this.currentsong);
                });
            }
            this.currentsong = newsong;
            this.onSong.trigger(this.currentsong);
        });
    }
    updateElapsed(): void {
        this.sendCommand("status", null, (x: MpdMessage) => {
            this.onElapsed.trigger(this.parseStatus(x.params));
        });
    }
    updateElapsedLazy(): void {
        if (!this.paused)
        this.elapsed++;
        if (this.elapsed > this.currentsong.length) {
            this.updateElapsed();
        }
        this.onElapsed.trigger(this.elapsed);
        setTimeout(() => { this.updateElapsedLazy() }, 1000);
    }

    parseSong(data: string): Song {
        var lines = data.split("\n");
        var songdata = this.parseMpdArray(data);
        var newsong = {
            album: songdata["Album"],
            artist: songdata["Artist"],
            title: songdata["Title"],
            length: this.currentsong.length,
            cover: this.currentsong.cover
        };
        return newsong;
    }
    parseStatus(data: string): number {
        var lines = data.split("\n");
        var statusdata = this.parseMpdArray(data);
        if (parseInt(statusdata["time"].split(":")[1]) != this.currentsong.length) {
            this.currentsong.length = parseInt(statusdata["time"].split(":")[1]);
            this.onSong.trigger(this.currentsong);
        }
        this.elapsed = statusdata["elapsed"];
        return statusdata["elapsed"];
    }
    parseMpdArray(data: string) {
        var lines = data.split("\n");
        var resdata = {};
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].replace(/^\s+|\s+$/g, '') == "OK" || lines[i].replace(/^\s+|\s+$/g, '') == "")
                continue;
            lines[i].substring(0, lines[i].indexOf(":") - 1);
            resdata[lines[i].substring(0, lines[i].indexOf(":"))] = lines[i].substring(lines[i].indexOf(":") + 1).replace(/^\s+|\s+$/g, '');
        }
        return resdata;
    }

    connectto(url: string) {
        this.socket.emit("connectto", url, (resp) => {
            if (resp.state != "ok")
                return alert(JSON.stringify(resp));
            this.subscribe();
            this.updateElapsedLazy();

        });
    }

    play(callback: () => void = () => { }): void {
        this.sendCommand("play", null, callback);
        this.paused = false;
        this.updateElapsed();
    }
    stop(callback: () => void = () => { }): void {
        this.sendCommand("stop", null, callback);
        this.paused = true;
    }
    prev(callback: () => void = () => { }): void {
        this.sendCommand("prev", null, callback);
        this.updateSong();
        this.updateElapsed();
    }
    next(callback: () => void = () => { }): void {
        this.sendCommand("next", null, callback);
        this.updateSong();
        this.updateElapsed();
    }


    public get Song(): ILiteEvent<Song> { return this.onSong; }
    public get Elapsed(): ILiteEvent<number> { return this.onElapsed; }
    public get Login(): ILiteEvent<Array<string>> { return this.onLogin; }

}
