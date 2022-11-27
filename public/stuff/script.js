// ----- navbar -----

function settings() {
    if ($("settings").is(":visible")) {
        $('settings').fadeOut(100);
        document.title = "YTSync";
    } else {
        $('settings').fadeIn(100);
        document.title = "YTSync | Settings";
    }
}

function api_popup() {
    window.open(
        "/api",
        "API Info",
        "width=800,height=800,status=yes,scrollbars=yes,resizable=yes"
    ).focus();
}

function sync_popup() {
    window.open(
        "/sync",
        "API Info",
        "width=800,height=600,status=yes,scrollbars=yes,resizable=yes"
    ).focus();
}

// ----- navbar -----



// ----- settings -----

// Menu
$(".settings_menu").click(function() {
    if ($(this).prop("tagName") == "SETTINGS_SET") {
        $("settings_pl").removeClass("settings_active");
        $("settings_pl_wrp").fadeOut(100);

        get_discord_settings();

        setTimeout(function() {
            $("settings_set").addClass("settings_active");
            $("settings_set_wrp").fadeIn(100);
        }, 100);
    } else {
        $("settings_set").removeClass("settings_active");
        $("settings_set_wrp").fadeOut(100);

        setTimeout(function() {
            $("settings_pl").addClass("settings_active");
            $("settings_pl_wrp").fadeIn(100);
        }, 100);
    }
})

// --- settings_pl ---

// change stream id
$("#type").change(function () {
    if ($(this).val() == "mp4") {
        $("#stream").val(22);
    } else {
        $("#stream").val(140);
    }
});

// add playlist
$("#add_pl_form").submit(function (e) {
    e.preventDefault();

    $("add_pl_loader").fadeIn(100);

    let link = $("#link");
    let type = $("#type");
    let stream = $("#stream");
    let path = $("#path");

    api.add_playlist(link.val(), type.val(), stream.val(), path.val(), function (cb) {
        $("add_pl_loader").fadeOut(100);

        if (cb["found_videos"] == 0) {
            window.alert(`
            >>> NOTICE <<<            
            No videos were found that can be downloaded,
            is the playlist set to private?

            Playlist was not added
    
            Name: ${cb["title"]}
            Found: ${cb["found_videos"]}
            Description: ${cb["description"]}
            `);
        } else {
            window.alert(`
            Playlist added
    
            Name: ${cb["title"]}
            Found: ${cb["found_videos"]}
            Description: ${cb["description"]}
            `);
        }

        link.val("");
        path.val("");

        init_data();
    });
});

// --- settings_pl ---



// --- settings_set ---

// change cron
$("#cron").blur(function () {
    $(this).addClass("setting_saves");

    api.change_cron($(this).val(), function () {
        $("#cron").removeClass("setting_saves").addClass("setting_saved");

        setTimeout(function () {
            $("#cron").removeClass("setting_saved");
        }, 2000);
    });
});

// get discord settings
function get_discord_settings() {
    api.discord_status(function(cb) {
        if (cb["on"]) {
            $('#webhook_sw').prop("checked", true);
            $("#webhook_status").html("Enabled");
            $("#webhook_status").css("color", "var(--green)")
        } else {
            $('#webhook_sw').prop("checked", false);
            $("#webhook_status").html("Disabled");
            $("#webhook_status").css("color", "var(--red)")
        }

        if (cb["webhookURL"] !== "") {
            $("#webhook_url_view").html(cb["webhookURL"]);
        }
    });
}

// En-/Disable discord msg
$("#webhook_sw").change(function() {
    api.discord_change($(this).prop("checked"), undefined, function() {
        get_discord_settings();
    });
})

// Set webhook url
$("#webhook_url").blur(function() {
    $("#webhook_url").addClass("setting_saves");

    api.discord_change(undefined, $(this).val(), function() {
        $("#webhook_url").removeClass("setting_saves").addClass("setting_saved");

        $("#webhook_url").val("");

        get_discord_settings();

        setTimeout(function () {
            $("#webhook_url").removeClass("setting_saved");
        }, 2000);
    });
})

// --- settings_set ---

// ----- settings -----



// ----- plalist actions -----

function parent_link(to) {
    return $(to).parents().eq(4).attr("pl-link");
}

// inspect playlist
$(document).on("click", ".pl_search", function() {
    sessionStorage.setItem("inspect_pl", $(this).parents().eq(4).attr("pl-link"));

    window.open(
        "/inspect",
        "API Info",
        "width=800,height=800,status=yes,scrollbars=yes,resizable=yes"
    ).focus();
});

// delete playlist
$(document).on("click", ".pl_remove", function() {
    let link = $(this).parents().eq(4).attr("pl-link");

    if (window.confirm(`
    Delete playlist: ${$(this).parents().eq(4).find(".pl_title").html()}
    (${link})
    `)) {
        $("preloader").fadeIn(100);
        
        api.delete_playlist(link, function() {
            init_data();
            $("preloader").fadeOut(100);
        })
    }
});

// ----- plalist actions -----



function init_data() {
    api.init(function (res) {
        $("#cron").val(res["cron"]);
        $("playlists").html("");
        $("preloader").fadeOut(100);

        if (res["playlists"].length == 0) {
            $("playlists").append(`
            <no_pl>
                <empty_cloud></empty_cloud>
                <p>No playlists available</p>
            </no_pl>
            `);
            return;
        }

        res["playlists"].forEach(function (pl, tmr) {
            setTimeout(function () {
                $("playlists").append(`
                <pl_wrp pl-link="${pl["link"]}">
                    <table>
                        <tr>
                            <td>
                                <pl_type_ico class="type_${pl["type"]}"></pl_type_ico>
                            </td>
                            <td>
                                <a class="pl_title">${pl["title"]}</a>
                            </td>
                            <td>
                                <view_pl class="pl_search" title="Inspect playlist"></view_pl>
                            </td>
                            <td>
                                <del_pl class="pl_remove" title="Delete playlist"></del_pl>
                            </td>
                        </tr>
                      </table>
                      <p class="pl_description">${pl["description"]}</p>
                      <a class="pl_link pl_link_${pl["type"]}" href="${pl["link"]}" target="_blank">${pl["link"]}</a>
                      <table>
                        <tr>
                            <td>
                                <a>Path</a>
                            </td>
                            <td>
                                <a>Stream</a>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <a>${pl["path"]}</a>
                            </td>
                            <td>
                                <a>${pl["stream"]}</a>
                            </td>
                        </tr>
                    </table>
                </pl_wrp>
                `);
            }, tmr * 100);
        });
    });
}
init_data();