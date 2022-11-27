# YTSync

The following data is required for the container:
* Port for WebUI `8095`
* Port for API `40123`
* Media root dir.

ports can be freely specified with variables
```
WEB_PORT (default = 8095)
API_PORT (default = 40123)
```

For other ports, the command must look like this, for example:

`docker run --env WEB_PORT=1234 --env=API_PORT=4321 -p 1234:8095 -p 4321:40123 -v /media/root/:/MEDIA_ROOT pickl3s/ytsync`

See: https://hub.docker.com/r/pickl3s/ytsync


# 1.2.2

* Integration of discord webhook
* small changes on the ui
