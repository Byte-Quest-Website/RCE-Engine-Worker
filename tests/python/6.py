from urllib.request import urlopen, Request

url = "https://api.fusionsid.xyz/docs"

if not url.startswith("http"):
    raise RuntimeError("Incorrect and possibly insecure protocol in url")

httprequest = Request(url, headers={"Accept": "application/json"})

with urlopen(httprequest) as response:
    print(response.status)
    print(response.read().decode())