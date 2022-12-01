import json, re, os, sys
from multiprocessing import Process
from pytube import Playlist, YouTube


def yt_download(link, type, path, vid_file, stream_id):
    try:
        if type == "mp3":
            # Download Video
            audio = YouTube(link).streams.get_by_itag(stream_id).download(path)           
            os.rename(audio, vid_file)
            print("Downloaded: " + vid_file.replace("/MEDIA_ROOT/", ""))

        if type == "mp4":
            # Download Video
            video = YouTube(link).streams.get_by_itag(stream_id).download(path)
            os.rename(video, vid_file)
            print("Downloaded: " + vid_file.replace("/MEDIA_ROOT/", ""))

    except Exception as e:
        print('Error on line {}'.format(sys.exc_info()[-1].tb_lineno), type(e).__name__, e)


def go(link, type, path, stream_id):
    try:
        # check empty data
        if (link == "") or (type == "") or (path == ""):
            return

        #if the type of the file is not correct
        if not (type == "mp3" or type == "mp4"):
            raise Exception(f"""
            File type not correct! (Playlist "{link}")
            Valid file types are "mp3" or "mp4".
            """)

        # get links from videos in playlist
        pl = Playlist(link)

        # when playlist is empty or private
        if len(pl) == 0:
            raise Exception(f"""
            No videos included in the playlist "{link}"
            Is the playlist set to "Public" or "Unlisted"?
            """)

        # check if video has already been downloaded
        for vid in pl:
            vid_title = str(YouTube(vid).title)

            # Not allowed characters in video title
            vid_title = re.sub('[:*/\\\|?"<>]', "", vid_title)

            vid_file = path + "/" + vid_title + "." + type

            # File does not exist, start download
            if not os.path.isfile(vid_file):
                print("Missing: " + vid_title)

                Process(target=yt_download, args=(vid, type, path, vid_file, stream_id)).start()

    except Exception as e:
        print('Error on line {}'.format(sys.exc_info()[-1].tb_lineno), type(e).__name__, e)


if __name__ == "__main__":
    try:
        # load config
        with open("/CONFIG/config.json") as c:
            config = json.load(c)
        
        # start check/download
        for pl in config["playlists"]:
            path = "/MEDIA_ROOT" + pl["path"]
            Process(target=go, args=(pl["link"], pl["type"], path, pl["stream"])).start()

    except Exception as e:
        print('Error on line {}'.format(sys.exc_info()[-1].tb_lineno), type(e).__name__, e)