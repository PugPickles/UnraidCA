

function error(e) {
    let pv = JSON.stringify(e, null, 2).replace(/\\/g, "");

    navigator.clipboard.writeText(pv);
    console.error(pv);
    window.alert(`
    There is an error!
    (error was copied to clipboard)

    ERROR:
    ${pv}
    `);
}

const api = {
    init: function(cb) {
        $.get(url + "/api/get/all", function(res) {
            return cb(res);
        })
        .fail(function(e) {
            error(e);
        });
    },

    change_cron: function(job, cb) {
        $.post(url + "/api/cron/change",
        {
            "job": job
        }, function() {
            return cb();
        })
        .fail(function(e) {
            error(e);
        });
    },

    add_playlist: function(link, type, stream, path, cb) {
        $.post(url + "/api/playlist/add",
        {
            "link": link,
            "type": type,
            "stream": stream,
            "path": path,
        }, function(res) {
            return cb(res);
        })
        .fail(function(e) {
            $("add_pl_loader").fadeOut(100);
            error(e);
        });
    },

    get_playlist: function(link, cb) {
        $.post(url + "/api/get/playlist",
        {
            "link": link
        }, function(res) {
            return cb(res);
        })
        .fail(function(e) {
            error(e);
        });
    },

    delete_playlist: function(link, cb) {
        $.post(url + "/api/playlist/remove",
        {
            "link": link
        }, function() {
            return cb();
        })
        .fail(function(e) {
            $("preloader").fadeOut(100);
            error(e);
        });
    },

    sync: function(cb) {
        $.post(url + "/api/playlist/sync", function(res) {
            return cb(res);
        })
        .fail(function(e) {
            error(e);
        });
    },

    discord_status: function(cb) {
        $.get(url + "/api/discord/get", function(res) {
            return cb(res);
        })
        .fail(function(e) {
            error(e);
        });
    },

    discord_change: function(status, webhookURL, cb) {
        $.post(url + "/api/discord/set",
        {
            "on": status,
            "webhookURL": webhookURL
        },
        function() {
            return cb();
        })
        .fail(function(e) {
            error(e);
        });
    }
};