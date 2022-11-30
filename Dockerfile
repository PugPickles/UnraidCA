FROM node:19-alpine3.15

WORKDIR /YTSync

ENV PYTHONUNBUFFERED=1
RUN apk add --update python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
#RUN pip3 install --no-cache --upgrade pip setuptools
RUN pip3 install pytube

COPY ./package*.json .

RUN npm install

COPY . .

ENV WEB_PORT 8095
ENV API_PORT 40123

VOLUME /MEDIA_ROOT
VOLUME /CONFIG

EXPOSE $WEB_PORT $API_PORT

CMD ["node", "server.js"]