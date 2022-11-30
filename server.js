const express = require("express")
const api = express()
const webui = express()
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require("path")
const { parse } = require("path")
const CronJob = require('cron').CronJob
const spawn = require("child_process").spawn;
const discord_msg = require("./discord_msg")


let var_port_web = process.env.WEB_PORT || 8095
let var_port_api = process.env.API_PORT || 40123


// ########## Server ##########

api.use(bodyParser.urlencoded({ extended: false }));

// Header
api.use(function (req, res, next) {
    res.setHeader("X-Powered-By", "YTSync-API");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});
webui.use(function (req, res, next) {
    res.setHeader("X-Powered-By", "YTSync");
    next();
});

// ########## Server ##########



// ########## Helper ##########

// print log
function logger(msg) {
    let timestamp = new Date().toLocaleString()
    console.log(timestamp, " | ", msg, "\n")
}


// Get pl data (title, description)
function get_pl_data(link, cb) {
    const get_data = spawn('python3', ["get_pl_meta.py", link]);

    let stderr = ""
    let pl_data = ""

    get_data.stderr.on("data", data => {
        logger(data.toString())
        stderr += data.toString()
    });

    get_data.stdout.on('data', (data) => {
        pl_data += data.toString()
    });

    get_data.stdout.on("close", () => {
        if (stderr !== "") {
            return cb({
                "e": true,
                "msg": stderr
            })
        }

        try {
            pl_data = JSON.parse(pl_data)
        } catch (e) {
            logger(e)
            return cb({
                "e": true,
                "msg": e
            })
        }

        return cb({
            "e": false,
            "msg": pl_data
        })
    });
}

// Get data from specific playlist (include videos in playlist)
function inspect_playlist(link, cb) {
    const get_data = spawn('python3', ["get_specific_pl.py", link]);

    let stderr = ""
    let pl_data = ""

    get_data.stderr.on("data", data => {
        logger(data.toString())
        stderr += data.toString()
    });

    get_data.stdout.on('data', (data) => {
        pl_data += data.toString()
    });

    get_data.stdout.on("close", () => {
        if (stderr !== "") {
            return cb({
                "e": true,
                "msg": stderr
            })
        }

        try {
            pl_data = JSON.parse(pl_data)
        } catch (e) {
            logger(e)
            return cb({
                "e": true,
                "msg": e
            })
        }

        return cb({
            "e": false,
            "msg": pl_data
        })
    });
}

// Cron job
let cron_job_s;
function cron_job(cron_job_s, job, cb) {
    try {
        if (cron_job_s) {
            cron_job_s.stop()
        }

        cron_job_s = new CronJob(job, function () {
            const downloader = spawn('python3', ["downloader.py"]);

            let stderr = ""
            let stdout = ""

            downloader.stderr.on("data", data => {
                stderr += data.toString()
            });

            downloader.stdout.on('data', (data) => {
                logger(data.toString())
                stdout += data.toString()
            });

            downloader.stdout.on("close", () => {
                if (stderr !== "") {
                    logger(stderr)
                } else {
                    if (stdout !== "---------- START SYNC ----------\n----------- END SYNC -----------\n") {
                        discord_msg.sendMsg("02f0fe", "Auto sync", stdout)
                    }
                }                
            });

        }, null, true, 'America/Los_Angeles');

        return cb(undefined)
    } catch (e) {
        return cb(e)
    }
}

// ########## Helper ##########



// ########## API ##########

// Get all playlists (init)
api.get("/api/get/all", (req, res) => {
    try {
        res.send(JSON.parse(fs.readFileSync("/CONFIG/config.json")))
    } catch (e) {
        logger(e)
        res.status(500).send(e.toString())
    }
})


// Get data from specific playlist (include videos in playlist)
api.post("/api/get/playlist", (req, res) => {
    let link = req.body.link

    if (link == "" || link == undefined) {
        res.status(403).send("Missing link")
        return
    }

    logger("Get data from specific playlist: " + link)

    inspect_playlist(link, function (cb) {
        if (cb["e"]) {
            logger(cb["msg"])
            res.status(500).send(cb["msg"].toString())
            return
        }

        res.status(200).send(cb["msg"])
    })
})


// Add playlist to /CONFIG/config.json
api.post("/api/playlist/add", (req, res) => {
    let link = req.body.link
    let type = req.body.type
    let stream = req.body.stream
    let path = req.body.path

    if (link == "" ||
        type == "" ||
        stream == "" ||
        path == "") {
        logger("Missing data")
        res.status(403).send("Missing data")
        return
    }

    if (type !== "mp3" && type !== "mp4") {
        logger("Wrong file format, allowed are mp3 and mp4")
        res.status(403).send("Wrong file format, allowed are mp3 and mp4")
        return
    }

    get_pl_data(link, function (cb) {
        if (cb["e"]) {
            logger(cb["msg"])
            res.status(500).send(cb["msg"].toString())
            return
        }

        if (cb["msg"]["found_videos"] == 0) {
            logger("No videos were found that can be downloaded, is the playlist set to private?")
            res.status(200).send(cb["msg"])
            return
        }

        try {
            let config = JSON.parse(fs.readFileSync("/CONFIG/config.json"))

            let playlists = config["playlists"]

            if (playlists.some(pl => pl.link === link)) {
                logger("Playlist already exists")
                res.status(403).send("Playlist already exists")
                return
            }

            playlists.push({
                "title": cb["msg"]["title"],
                "description": cb["msg"]["description"],
                "link": link,
                "type": type,
                "stream": stream,
                "path": path
            })

            fs.writeFileSync("/CONFIG/config.json", JSON.stringify(config))

            let msg = `
    Title: ${cb["msg"]["title"]}
    Description: ${cb["msg"]["description"]}
    Videos: ${cb["msg"]["found_videos"]}
    Link: ${link}
    Type: ${type}
    Stream: ${stream}
    Path: ${path}
            `

            logger("Playlist added" + msg)

            discord_msg.sendMsg("02f0fe", "Playlist added", msg)

            res.status(200).send(cb["msg"])
        } catch (e) {
            logger(e)
            res.status(500).send(e.toString())
        }
    })
})


// Remove playlist from config.json
api.post("/api/playlist/remove", (req, res) => {
    try {
        let config = JSON.parse(fs.readFileSync("/CONFIG/config.json"))

        const del_index = config["playlists"].findIndex(pl => {
            return pl["link"] === req.body.link;
        })

        config["playlists"].splice(del_index, 1)

        fs.writeFileSync("/CONFIG/config.json", JSON.stringify(config))

        logger("Delete playlist: " + req.body.link)

        discord_msg.sendMsg("f83d3d", "Playlist deleted", req.body.link)

        res.sendStatus(204)
    } catch (e) {
        logger(e)
        res.status(500).send(e.toString())
    }
})


// Start sync
api.post("/api/playlist/sync", (req, res) => {
    try {
        logger("Start manual sync")
        discord_msg.sendMsg("02f0fe", "Manual sync started", " ")

        const downloader = spawn('python3', ["downloader.py"]);

        let stderr = ""
        let log = ""
    
        downloader.stderr.on("data", data => {
            stderr += data.toString()
        });
    
        downloader.stdout.on('data', (data) => {
            log += data.toString()
        });
    
        downloader.stdout.on("close", () => {
            if (stderr !== "") {
                logger(stderr)
                res.status(500).send(stderr)
                return
            }

            logger(log)
            discord_msg.sendMsg("02f0fe", "Manual sync finished", log)
            res.send(log)
        });
    } catch (e) {
        logger(e)
        res.status(500).send(e.toString())
    }
})


// Change cron job
api.post("/api/cron/change", (req, res) => {
    try {
        let config = JSON.parse(fs.readFileSync("/CONFIG/config.json"))

        logger(`Change cron job from [ ${config["cron"]} ] to [ ${req.body.job} ]`)
        discord_msg.sendMsg("fe4006", "Cron job changed",
        "from " + "`" + config["cron"] + "` to " + "`" + req.body.job + "`")

        config["cron"] = req.body.job

        cron_job(cron_job_s, config["cron"], function (cb) {
            if (cb !== undefined) {
                logger(cb)
                res.status(500).send(cb.toString())
                return
            }

            fs.writeFileSync("/CONFIG/config.json", JSON.stringify(config))

            res.sendStatus(204)
        })
    } catch (e) {
        logger(e)
        res.status(500).send(e.toString())
    }
})


// Get discord webhook config
api.get("/api/discord/get", (req, res) => {
    try {
        let config = JSON.parse(fs.readFileSync("/CONFIG/discord_msg.json"))

        let webhookURL = config["webhookURL"].split("/")

        let discordUrlSeg = ["https:","","discord.com","api","webhooks"]

        let miniWebhookURL = ""

        if (webhookURL.length !== 1) {
            webhookURL.forEach(function(element, index) {
                if (discordUrlSeg.includes(element)) {
                    miniWebhookURL += element + "/"
                } else {
                    if (index == 5) {
                        trimmedElement = element.substring(0, 5) + "..."
                        miniWebhookURL += trimmedElement + "/"
                    } else {
                        trimmedElement = element.substring(0, 10) + "..."
                        miniWebhookURL += trimmedElement
                    }
                }
            });
        }

        res.send({
            "on": config["on"],
            "webhookURL": miniWebhookURL
        })
    } catch (e) {
        logger(e)
        res.status(500).send(e.toString())
    }
})

// Set discord webhook config
api.post("/api/discord/set", (req, res) => {
    try {
        let config = JSON.parse(fs.readFileSync("/CONFIG/discord_msg.json"))

        let status = req.body.on
        let url = req.body.webhookURL

        logger(`
Changing webhook:
    Enabled: ${status}
    URL: ${url}`)

        if (status !== undefined) {
            if (status == "true") {
                config["on"] = true
            } else {
                discord_msg.sendMsg("fe4006", "Discord notifications disabled", " ")
                config["on"] = false
            }
        }

        if (url !== undefined) {
            discord_msg.sendMsg("fe4006", "Discord webhook url was changed", " ")
            config["webhookURL"] = url
        }

        fs.writeFileSync("/CONFIG/discord_msg.json", JSON.stringify(config))

        discord_msg.init(function(cb) {
            logger(cb["msg"])

            if (cb["status"] == 200) {
                discord_msg.sendMsg("3df87b", "It works",
                `
                You will now receive messages about:
                > Adding/deleting playlists
                > Changing settings
                > Manual and automatic sync.
                
                (With auto sync. only messages are sent when data are missing)
                `)

                res.sendStatus(204)
            } else {
                res.status(500).send(cb["msg"].toString())
            }
        })
    } catch (e) {
        logger(e)
        res.status(500).send(e.toString())
    }
})

// ########## API ##########



// ########## UI ##########

// Change api port
webui.get("/appdata/api.js", function (req, res) {
    let api_js = `url = window.location.origin.replace(${var_port_web}, ${var_port_api});` + fs.readFileSync(__dirname + "/public/stuff/api.js")
    res.send(api_js);
});

// App data path
webui.use('/appdata', express.static(path.join(__dirname, "/public/stuff"), {
    setHeaders: function (res) {
        res.set('Cache-control', 'public, max-age=31536000');
    }
}));

// Send page
webui.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// API page
webui.get("/api", function (req, res) {
    res.sendFile(path.join(__dirname, "public/api_info.html"));
});

// Sync page
webui.get("/sync", function (req, res) {
    res.sendFile(path.join(__dirname, "public/sync.html"));
});

// Inspect playlist page
webui.get("/inspect", function (req, res) {
    res.sendFile(path.join(__dirname, "public/inspect.html"));
});
// ########## UI ##########







function init_cron(config) {
    cron_job(cron_job_s, config["cron"], function (cb) {
        if (cb !== undefined) {
            logger(cb)
            return
        }

        logger("Cron job has been started: " + config["cron"])
    })
}

api.listen(40123, () => {
    logger("Api listens to port: " + var_port_api)
})

webui.listen(8095, () => {
    logger("Web listens to port: " + var_port_web)

    if (! fs.existsSync("/CONFIG/config.json")) {
        logger("config.json missing, creating...")

        fs.writeFileSync("/CONFIG/config.json", '{"cron":"0 */12 * * *","playlists":[]}')
    }

    if (! fs.existsSync("/CONFIG/discord_msg.json")) {
        logger("discord_msg.json missing, creating...")

        fs.writeFileSync("/CONFIG/discord_msg.json", '{"on":false,"webhookURL":""}')
    }

    let config = JSON.parse(fs.readFileSync("/CONFIG/config.json"))

    init_cron(config)
    
    discord_msg.init(function(cb) {
        if (cb["status"] == 200) {
            logger(cb["msg"])

            let pl_data = ""

            if (config["playlists"].length == 0) {
                pl_data = "**No playlists available yet**"
            } else {
                config["playlists"].forEach(pl => {
                    pl_data += `
                    **Title: ${pl["title"]}**
                    Description: ${pl["description"]}
                    Link: ${pl["link"]}
                    Type: ${pl["type"]}
                    Stream: ${pl["stream"]}
                    Path: ${pl["path"]}
                    `
                })
            }

            discord_msg.sendMsg("3df87b", "Server running",
            "Server is accessible via the webui under the port: `" + var_port_web + "`\n" +
            "the api is running under the port: `" + var_port_api + "`\n" +
            "the following cron job is active: `" + config["cron"] + "`\n\n" +
            "These playlists will be synced: \n" + pl_data)
        } else {
            logger(cb["msg"])
        }
    })
})