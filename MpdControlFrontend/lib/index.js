/// <reference path='jquery.d.ts'/>
/// <reference path='MpdControl.ts' />
/// <reference path='dragdealer.d.ts' />
/// <reference path='LiteEvent.ts' />
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10);
    var minutes = Math.floor(sec_num / 60);
    var seconds = sec_num % 60;
    var minutesStr = minutes.toString();
    var secondsStr = seconds.toString();
    if (minutes < 10) {
        minutesStr = "0" + minutes;
    }
    if (seconds < 10) {
        secondsStr = "0" + seconds;
    }
    var time = minutesStr + ':' + secondsStr;
    return time;
};
var currentsong = { album: "Foobar", artist: "No one", length: 600, title: "Nothing", cover: null };
var elapsed = 20;
var userdrag = false;
var userdragtimeout = null;
var user = $(function () {
    if (window.location.hostname == "localhost")
        var mpd = new MpdControl("http://localhost:7915");
    else
        var mpd = new MpdControl("https://mpd.hakurei.fi");
    $.getJSON("/login/state", function (data) {
        if (data.state == false)
            return (window.location.href = '/login');
        $.getJSON("/login/info", function (data) {
            user = data;
            mpd.login(user);
        });
    });
    mpd.Login.on(function (hosts) {
        $("#serverselect").off('change');
        $("#serverselect").empty().append('<option value="">-</option>');
        $.each(hosts, function (idx, value) {
            $('<option/>', { value: value }).text(value).appendTo("#serverselect");
        });
        $("#serverselect").on('change', function () {
            if ($("select option:selected").first().length == 0)
                return;
            mpd.connectto($("select option:selected").first().text());
        });
    });
    var drag = new Dragdealer("timer");
    mpd.Elapsed.on(function (newelapsed) {
        elapsed = newelapsed;
        if (!userdrag)
            drag.setValue(elapsed / currentsong.length, 0, false);
    });
    mpd.Song.on(function (newsong) {
        currentsong = newsong;
        for (var element in currentsong) {
            if ($("#currentsong ." + element).text() != currentsong[element])
                $("#currentsong ." + element).text(currentsong[element]);
        }
        if ($("#currentsong .coverimg").attr("src").toString() != currentsong.cover) {
            if (currentsong.cover == null) {
                $("#currentsong .coverimg").attr("src", "");
            } else
                $("#currentsong .coverimg").attr("src", currentsong.cover);
        }
        if (!userdrag)
            drag.setValue(elapsed / currentsong.length, 0, false);
    });
    drag.options.animationCallback = function (x, y) {
        if (userdragtimeout != null)
            clearTimeout(userdragtimeout);
        userdrag = true;
        userdragtimeout = setTimeout(function () {
            userdragtimeout = null;
            userdrag = false;
        }, 1000);
        var cursec = Math.round(x * currentsong.length);
        $('#timer .handle').text(cursec.toString().toHHMMSS());
        return;
    };

    /*
    <li id="stop"><a>Stop</a></li>
    <li id="play"><a>Play/Pause</a></li>
    <li id="prev"><a>Prev</a></li>
    <li id="next"><a>Next</a></li>
    <li id="random"><a>Random</a></li>*/
    $("#controls #stop").click(function () {
        mpd.stop();
        return false;
    });
    $("#controls #play").click(function () {
        mpd.play();
        return false;
    });
    $("#controls #prev").click(function () {
        mpd.prev();
        return false;
    });
    $("#controls #next").click(function () {
        mpd.next();
        return false;
    });
});
