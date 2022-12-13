# PaperMC

Lightweight alpine image (alpine:3.17) with freely configurable papermc server (default is 1.19.2, build: 280).

see: https://hub.docker.com/r/pickl3s/papermc

# WARNING
If you have already built something and want to change settings
Do not stop the container!
Go like this to prevent a new world from being generated!

Enter the following 2 commands in the game (as op):
1. /save-all
2. /stop

---

You can put the server icon (server-icon.png) in the `backupData` mount, it will be automatically copied to the root dir

All settings are changed via environment variables

```
    SRV_VERSION=1.19.2 
    SRV_BUILD=280 
    SRV_XMS=2G 
    SRV_XMX=2G

    MC_OP_UUID= 
    MC_OP_USER= 
    MC_OP_LEVEL=1

    enable_jmx_monitoring=false 
    rcon_port=25575 
    level_seed= 
    gamemode=survival 
    enable_command_block=false 
    enable_query=false 
    generator_settings={} 
    enforce_secure_profile=true 
    motd=A_Minecraft_Server 
    query_port=25565 
    pvp=true 
    generate_structures=true 
    max_chained_neighbor_updates=1000000 
    difficulty=easy 
    network_compression_threshold=256 
    max_tick_time=60000 
    require_resource_pack=false 
    use_native_transport=true 
    max_players=20 
    online_mode=true 
    enable_status=true 
    allow_flight=false 
    broadcast_rcon_to_ops=true 
    view_distance=10 
    server_ip= 
    resource_pack_prompt= 
    allow_nether=true 
    server_port=25565 
    enable_rcon=false 
    sync_chunk_writes=true 
    op_permission_level=4 
    prevent_proxy_connections=false 
    hide_online_players=false 
    resource_pack= 
    entity_broadcast_range_percentage=100 
    simulation_distance=10 
    rcon_password= 
    player_idle_timeout=0 
    debug=false 
    force_gamemode=false 
    rate_limit=0 
    hardcore=false 
    white_list=false 
    broadcast_console_to_ops=true 
    spawn_npcs=true 
    previews_chat=false 
    spawn_animals=true 
    function_permission_level=2 
    level_type=minecraft\:normal 
    text_filtering_config= 
    spawn_monsters=true 
    enforce_whitelist=false 
    spawn_protection=16 
    resource_pack_sha1= 
    max_world_size=29999984
```

The volumes are

```
/srv/mc/plugins
/srv/mc/world
/srv/mc/world_nether
/srv/mc/world_the_end

/srv/mc/backupData <- To save the following dir/files "config" "whitelist.json" "banned-ips.json" "banned-players.json"
```
