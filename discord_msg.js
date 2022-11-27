const fs = require('fs')
const { EmbedBuilder, WebhookClient } = require('discord.js');


let config = undefined
let webhClnt = undefined


module.exports = {
    init(cb) {
        try {
            config = JSON.parse(fs.readFileSync("discord_msg.json"))

            if (config["on"] && config["webhookURL"] !== "") {
                const webhookClient = new WebhookClient({ url: config["webhookURL"]});
                webhClnt = webhookClient

                return cb({
                    "status": 200,
                    "msg": "Webhook enabled"
                })
            } else {
                return cb({
                    "status": 200,
                    "msg": "Webhook disabled"
                })
            }

        } catch (e) {
            return cb({
                "status": 500,
                "msg": e
            })
        }
    },

    sendMsg(color, title, msg) {
        if (!config["on"] || config["webhookURL"] == "") {
            return
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(msg)
            .setTimestamp()
    
        webhClnt.send({
            content: "",
            username: "YTSync",
            avatarURL: "https://raw.githubusercontent.com/PugPickles/YTSync/main/icon.png",
            embeds: [embed],
        });
    }
}