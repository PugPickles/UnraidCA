FROM alpine:3.17.0

WORKDIR /cfddns


ENV auth_email="" \
    auth_key="" \
    zone_id="" \
    domain="" \
    update_time="5"


RUN apk add python3 py3-pip

RUN pip install requests

COPY . .

CMD ["python", "-u", "run.py"]