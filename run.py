import os, requests, json, datetime
from time import sleep

auth_email = os.environ['auth_email']
auth_key = os.environ['auth_key']
zone_id = os.environ['zone_id']
domain = os.environ['domain']
update_time = int(os.environ['update_time']) * 60
records = os.environ['records'].replace(" ", "").upper().split(",")


record_id_v4 = ""
record_id_v6 = ""

record_ip_v4 = ""
record_ip_v6 = ""

headers = {
    "Authorization": f"Bearer {auth_key}",
    "Content-Type": "application/json"
}

data = {
    "type": "",
    "name": domain,
    "content": "",
    "ttl": 1,
    "proxied": True,
    "comment": ""
}


def getTime():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def printLog(txt):
    print(f"{getTime()} | {txt}")


def checkToken():
    printLog("[>] Check token")

    try:
        test = json.loads(requests.get(
            url="https://api.cloudflare.com/client/v4/user/tokens/verify",
            headers=headers
        ).content)

        if test["success"] != True or test["result"]["status"] != "active":
            printLog("  [X] failed >>> Token is invalid!")
            exit()

        printLog("  [*] ok")

    except Exception as e:
            printLog(f"  [X] failed >>> {e}\n")


def getRecord():
    printLog("[>] Get record id")

    global record_id_v4, record_id_v6, record_ip_v4, record_ip_v6

    try:
        dns = json.loads(requests.get(
            url=f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/",
            headers=headers
        ).content)

        for record in dns["result"]:
            if record["name"] == domain:
                    if record["type"] == "A":
                        record_id_v4 = record["id"]
                        record_ip_v4 = record["content"]
                    
                    if record["type"] == "AAAA":
                        record_id_v6 = record["id"]   
                        record_ip_v6 = record["content"] 

        if record_id_v4 or record_id_v6:
            printLog("  [*] ok")
        else:
            printLog(f"  [X] failed >>> No A or AAA record was found for the domain: {domain}!")
            exit()

    except Exception as e:
            printLog(f"  [X] failed >>> {e}\n")


def updateRecord(ip, recordType):
    if recordType == "A":
        if record_ip_v4 == ip:
            printLog(f'[i] IP for record "A" is up to date ({ip})')
            return

        record_id = record_id_v4
    else:
        if record_ip_v6 == ip:
            printLog(f'[i] IP for record "AAAA" is up to date ({ip})')
            return

        record_id = record_id_v6

    printLog(f'[>] Update "{recordType}" record ({ip})')

    data["type"] = recordType
    data["content"] = ip
    data["comment"] = f"DDNS service ({getTime()})"

    try:
        r = requests.put(
            url=f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record_id}",
            headers=headers,
            json=data
        )

        if r.status_code == 200:
            printLog("  [*] ok")
            return

        printLog(f"  [X] failed >>> {r}\n")

    except Exception as e:
            printLog(f"  [X] failed >>> {e}\n")


while True:
    printLog("----- Start -----")

    checkToken()
    getRecord()

    if "A" in records:
        try:
            printLog("[>] Get IPv4")
            ipv4 = requests.get("https://ip4.seeip.org/").content.decode("utf-8")
            printLog("  [*] ok")
            updateRecord(ipv4, "A")

        except Exception as e:
            printLog(f"  [X] failed >>> {e}\n")

    if "AAAA" in records:
        try:
            printLog("[>] Get IPv6")
            ipv6 = requests.get("https://ip6.seeip.org/").content.decode("utf-8")
            printLog("  [*] ok")
            updateRecord(ipv6, "AAAA")

        except Exception as e:
            printLog(f"  [X] failed >>> {e}\n")

    printLog("----- End -----")

    sleep(update_time)