// ==UserScript==
// @name         Download Mahjong Soul Logs
// @namespace    mjslog
// @version      0.1.0
// @description  Press "s" while in a Mahjong Soul replay to create a JSON file.
// @include      https://mahjongsoul.game.yo-star.com/
// @include      https://game.mahjongsoul.com/
// @include      https://game.maj-soul.com/1/
// ==/UserScript==

(function()
{   //https://keycode.info/
    const KEY = 83;

    function checkscene(scene)
    {   //listen for key press, modified from anonymizer mod
        return scene && ((scene.Inst && scene.Inst._enable) || (scene._Inst && scene._Inst._enable));
    }

    document.addEventListener("keydown", function(e)
    {   // GameMgr.Inst.record_uuid becomes populated when we have looked at a log
        e = e || window.event;
        if ((KEY == e.keyCode || KEY == e.key) && GameMgr.Inst.record_uuid)
            if (checkscene(uiscript.UI_Replay) || checkscene(uiscript.UI_Loading))
                downloadlog();
    });

    function download(filename, text)
    {   //pop-up window for downloading
        let element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(text)
        );
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        return;
    }

    function parse(record)
    {   //json struct that we write to file
        let res = {};
        var mjslog = [];
        var mjsact = net.MessageWrapper.decodeMessage(record.data).actions;
        mjsact.forEach(e => {if(e.result.length!==0)mjslog.push(net.MessageWrapper.decodeMessage(e.result))});
        res["mjshead"] = record.head;
        res["mjslog"] = mjslog;
        //res["mjsrecordtypes"] = mjslog.map(e => e.constructor.name);
        return res;
    }

    function downloadlog()
    {
        app.NetAgent.sendReq2Lobby(
            "Lobby",
            "fetchGameRecord",
            { game_uuid: GameMgr.Inst.record_uuid, client_version_string: GameMgr.Inst.getClientVersion()},
            function(i, record) {
                let results = parse(record);
                download(
                    ((new Date(record.head.end_time * 1000)).toLocaleString() + ".json").replace(/[ \/]/g,"_").replace(/,/g, ""), JSON.stringify(results)
                );
            }
        );
    }
})();