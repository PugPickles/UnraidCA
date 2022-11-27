import sys, json
from pytube import Playlist, YouTube



pl = Playlist(sys.argv[1])

pl_data = []



def rem_uni(txt):
    enc = txt.encode("ascii", "ignore")
    dec = enc.decode()
    return dec



for vid in pl:
    yt_vid = YouTube(vid)

    title = ""
    description = ""
    c_img = ""

    try:
        title = yt_vid.title
        description = rem_uni(yt_vid.description)
        c_img = yt_vid.thumbnail_url

    except Exception:
        pass


    pl_data.append({
        "title" : title,
        "description": description,
        "c_img": c_img
    })



print(json.dumps({
    "title": pl.title,
    "vids": len(pl),
    "data": pl_data
}))