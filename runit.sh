#!/bin/sh
backupFiles=("config" "whitelist.json" "banned-ips.json" "banned-players.json")

srv_jar=paper-$SRV_VERSION-$SRV_BUILD.jar

printlog() {
    printf "$1\n"
}

# backup config files
backup() {
    printlog "[>] Backup config"
    for data in "${backupFiles[@]}"
        do
            echo "  [>] $data"
            cp -r $data "/srv/mc/backupData"
        done
    printlog "[*] done."
}
trap "backup" EXIT

# create server.properties
printlog "[>] Create config (server.properties)"
echo "#Minecraft server properties
#$(date)
enable-jmx-monitoring=$enable_jmx_monitoring
rcon.port=$rcon_port
level-seed=$level_seed
gamemode=$gamemode
enable-command-block=$enable_command_block
enable-query=$enable_query
generator-settings=$generator_settings
enforce-secure-profile=$enforce_secure_profile
level-name=world
motd=$motd
query.port=$query_port
pvp=$pvp
generate-structures=$generate_structures
max-chained-neighbor-updates=$max_chained_neighbor_updates
difficulty=$difficulty
network-compression-threshold=$network_compression_threshold
max-tick-time=$max_tick_time
require-resource-pack=$require_resource_pack
use-native-transport=$use_native_transport
max-players=$max_players
online-mode=$online_mode
enable-status=$enable_status
allow-flight=$allow_flight
broadcast-rcon-to-ops=$broadcast_rcon_to_ops
view-distance=$view_distance
server-ip=$server_ip
resource-pack-prompt=$resource_pack_prompt
allow-nether=$allow_nether
server-port=$server_port
enable-rcon=$enable_rcon
sync-chunk-writes=$sync_chunk_writes
op-permission-level=$op_permission_level
prevent-proxy-connections=$prevent_proxy_connections
hide-online-players=$hide_online_players
resource-pack=$resource_pack
entity-broadcast-range-percentage=$entity_broadcast_range_percentage
simulation-distance=$simulation_distance
rcon.password=$rcon_password
player-idle-timeout=$player_idle_timeout
debug=$debug
force-gamemode=$force_gamemode
rate-limit=$rate_limit
hardcore=$hardcore
white-list=$white_list
broadcast-console-to-ops=$broadcast_console_to_ops
spawn-npcs=$spawn_npcs
previews-chat=$previews_chat
spawn-animals=$spawn_animals
function-permission-level=$function_permission_level
level-type=$level_type
text-filtering-config=$text_filtering_config
spawn-monsters=$spawn_monsters
enforce-whitelist=$enforce_whitelist
spawn-protection=$spawn_protection
resource-pack-sha1=$resource_pack_sha1
max-world-size=$max_world_size
" > server.properties
printlog "[*] done."

# create ops.json
if ! [[ -z $MC_OP_UUID || -z $MC_OP_USER ]]; then
    printlog "[>] include user $MC_OP_USER with uuid $MC_OP_UUID as op (level: $MC_OP_LEVEL)"
    echo '[
    {
        "uuid": "'$MC_OP_UUID'",
        "name": "'$MC_OP_USER'",
        "level": '$MC_OP_LEVEL'
    }
    ]' > ops.json
    printlog "[*] done."
fi

# check if backup data exist
printlog "[>] Backup config"
for data in "${backupFiles[@]}"
    do
        if test -f "/srv/mc/backupData/$data" || test -d "/srv/mc/backupData/$data"; then
            printlog "  [>] $data"
            cp -r "/srv/mc/backupData/$data" "/srv/mc"
        fi
    done
    printlog "[*] done."

# check if server version exist
if test -f "$srv_jar"; then
    printlog "[>] Start server (Xms: $SRV_XMS | Xmx: $SRV_XMX)"
    java -Xms$SRV_XMS -Xmx$SRV_XMX -jar $srv_jar --nogui
fi

# download new version and start
printlog "[>] Downloading... (Version: $SRV_VERSION | Build: $SRV_BUILD)"
$(wget -q "https://api.papermc.io/v2/projects/paper/versions/$SRV_VERSION/builds/$SRV_BUILD/downloads/$srv_jar")
printlog "[*] done."

printlog "[>] Start server (Xms: $SRV_XMS | Xmx: $SRV_XMX)"
java -Xms$SRV_XMS -Xmx$SRV_XMX -jar $srv_jar --nogui

#bash -i