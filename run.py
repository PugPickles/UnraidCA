import os, requests, json
from time import sleep


auth_email = os.environ['auth_email']
auth_key = os.environ['auth_key']
zone_id = os.environ['zone_id']
domain = os.environ['domain']
update_time = int(os.environ['update_time']) * 60



record_id = ""

headers = {
    "Authorization": f"Bearer {auth_key}",
    "Content-Type": "application/json"
}


def checkToken():
    print("[>] Check token")

    test = json.loads(requests.get(
        url="https://api.cloudflare.com/client/v4/user/tokens/verify",
        headers=headers
    ).content)

    if test["success"] != True or test["result"]["status"] != "active":
        print("  [X] Token error!")
        exit()

    print("  [*] ok")


def getRecord():
    print("[>] Get DNS record id")

    global record_id

    dns = json.loads(requests.get(
        url=f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/",
        headers=headers
    ).content)

    for record in dns["result"]:
        if record["name"] == domain:
            if record["type"] == "A":
                record_id = record["id"]
                print("  [*] ok")


def updateRecord(ip):
    print(f"[>] Update A record ({ip})")

    data = {
        "type": "A",
        "name": domain,
        "content": ip,
        "ttl": 1,
        "proxied": True
    }

    r = requests.put(
        url=f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record_id}",
        headers=headers,
        json=data
    )

    if r.status_code == 200:
        print("  [*] ok")
        return

    print("  [X] failed")


while True:
    print("----- Start -----")

    checkToken()
    getRecord()

    try:
        print("[>] Get IPv4")
        ip_v4 = requests.get("https://ifconfig.me").content.decode("utf-8")
        print("  [*] ok")

        updateRecord(ip_v4)
    except Exception:
        print("  [X] failed")

    print("----- End -----")

    sleep(update_time)