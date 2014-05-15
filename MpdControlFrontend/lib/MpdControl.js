///<reference path='socket.io-client.d.ts'/>
/// <reference path='LiteEvent.ts' />

var MpdControl = (function () {
    function MpdControl(url) {
        this.currentsong = { album: "Foobar", artist: "No one", length: 600, title: "Nothing", cover: null };
        this.elapsed = 20;
        this.paused = false;
        this.onSong = new LiteEvent();
        this.onElapsed = new LiteEvent();
        this.onLogin = new LiteEvent();
        this.url = url;
        this.id = 0;
        this.permissioncheck = new Array();
        this.permissioncheck.push(true);
        this.socket = null;
        this.outstandingMessages = {};
    }
    MpdControl.prototype.result = function (data) {
        var outstanding = this.getOutstandingMessage(data.identifier);
        outstanding.callback(data);
    };

    MpdControl.prototype.getOutstandingMessage = function (identifier, removeNonPermanent) {
        if (typeof removeNonPermanent === "undefined") { removeNonPermanent = true; }
        if (!this.outstandingMessages[identifier]) {
            //We should throw here or something
            return;
        }
        var msg = this.outstandingMessages[identifier];
        if (removeNonPermanent)
            delete this.outstandingMessages[identifier];
        return msg;
    };

    MpdControl.prototype.login = function (logindata) {
        var _this = this;
        this.logindata = logindata;
        if (this.socket == null)
            return this.connect(function () {
                _this.loginPrivate();
            });
        this.loginPrivate();
    };
    MpdControl.prototype.loginPrivate = function () {
        var _this = this;
        this.socket.emit("login", this.logindata, function (resp) {
            if (resp.state != "ok")
                return alert(JSON.stringify(resp));
            _this.hosts = resp.hosts;
            _this.onLogin.trigger(_this.hosts);
        });
    };
    MpdControl.prototype.connect = function (cb) {
        var _this = this;
        this.socket = io.connect(this.url);
        this.socket.on("mpdResult", function (message) {
            _this.result(message);
        });
        this.socket.on('connect', function () {
            cb();
        });
    };

    MpdControl.prototype.getId = function () {
        return this.id++;
    };

    MpdControl.prototype.sendCommand = function (command, params, cb, continous) {
        if (typeof continous === "undefined") { continous = false; }
        var msg = { command: command, identifier: this.getId(), params: params };
        this.outstandingMessages[msg.identifier] = { permanent: continous, message: msg, callback: cb };
        this.socket.emit("mpd", msg);
    };
    MpdControl.prototype.subscribe = function () {
        var _this = this;
        this.updateSong();
        this.updateElapsed();
        setTimeout(function () {
            _this.subscribe();
        }, 10000);
    };
    MpdControl.prototype.updateSong = function () {
        var _this = this;
        this.sendCommand("currentsong", null, function (x) {
            var newsong = _this.parseSong(x.params);
            if (newsong.album != _this.currentsong.album || newsong.artist != _this.currentsong.artist || newsong.title != _this.currentsong.title) {
                _this.sendCommand("getcover", null, function (x) {
                    _this.currentsong.cover = x.params;
                    _this.onSong.trigger(_this.currentsong);
                });
            }
            _this.currentsong = newsong;
            _this.onSong.trigger(_this.currentsong);
        });
    };
    MpdControl.prototype.updateElapsed = function () {
        var _this = this;
        this.sendCommand("status", null, function (x) {
            _this.onElapsed.trigger(_this.parseStatus(x.params));
        });
    };
    MpdControl.prototype.updateElapsedLazy = function () {
        var _this = this;
        if (!this.paused)
            this.elapsed++;
        if (this.elapsed > this.currentsong.length) {
            this.updateElapsed();
        }
        this.onElapsed.trigger(this.elapsed);
        setTimeout(function () {
            _this.updateElapsedLazy();
        }, 1000);
    };

    MpdControl.prototype.parseSong = function (data) {
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
    };
    MpdControl.prototype.parseStatus = function (data) {
        var lines = data.split("\n");
        var statusdata = this.parseMpdArray(data);
        if (parseInt(statusdata["time"].split(":")[1]) != this.currentsong.length) {
            this.currentsong.length = parseInt(statusdata["time"].split(":")[1]);
            this.onSong.trigger(this.currentsong);
        }
        this.elapsed = statusdata["elapsed"];
        return statusdata["elapsed"];
    };
    MpdControl.prototype.parseMpdArray = function (data) {
        var lines = data.split("\n");
        var resdata = {};
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].replace(/^\s+|\s+$/g, '') == "OK" || lines[i].replace(/^\s+|\s+$/g, '') == "")
                continue;
            lines[i].substring(0, lines[i].indexOf(":") - 1);
            resdata[lines[i].substring(0, lines[i].indexOf(":"))] = lines[i].substring(lines[i].indexOf(":") + 1).replace(/^\s+|\s+$/g, '');
        }
        return resdata;
    };

    MpdControl.prototype.connectto = function (url) {
        var _this = this;
        this.socket.emit("connectto", url, function (resp) {
            if (resp.state != "ok")
                return alert(JSON.stringify(resp));
            _this.subscribe();
            _this.updateElapsedLazy();
        });
    };

    MpdControl.prototype.play = function (callback) {
        if (typeof callback === "undefined") { callback = function () {
        }; }
        this.sendCommand("play", null, callback);
        this.paused = false;
        this.updateElapsed();
    };
    MpdControl.prototype.stop = function (callback) {
        if (typeof callback === "undefined") { callback = function () {
        }; }
        this.sendCommand("stop", null, callback);
        this.paused = true;
    };
    MpdControl.prototype.prev = function (callback) {
        if (typeof callback === "undefined") { callback = function () {
        }; }
        this.sendCommand("prev", null, callback);
        this.updateSong();
        this.updateElapsed();
    };
    MpdControl.prototype.next = function (callback) {
        if (typeof callback === "undefined") { callback = function () {
        }; }
        this.sendCommand("next", null, callback);
        this.updateSong();
        this.updateElapsed();
    };

    Object.defineProperty(MpdControl.prototype, "Song", {
        get: function () {
            return this.onSong;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MpdControl.prototype, "Elapsed", {
        get: function () {
            return this.onElapsed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MpdControl.prototype, "Login", {
        get: function () {
            return this.onLogin;
        },
        enumerable: true,
        configurable: true
    });
    return MpdControl;
})();
//# sourceMappingURL=MpdControl.js.map
