import sys, json
from pytube import Playlist



pl = Playlist(sys.argv[1])

found_videos = 0
title = ""
description = ""



try:
    try:
        found_videos = len(pl)
    except Exception:
        pass
    try:
        title = pl.title
    except Exception:
        pass
    try:
        description = pl.description
    except Exception:
        pass

finally:
    print(json.dumps({
        "found_videos": found_videos,
        "title": title,
        "description": description
    }))
