from flask import Flask, request, Response
import datetime, shutil, requests

app = Flask(__name__)

STORAGE_URL = "http://storage:8200/log"
SERVICE2_URL = "http://service2:8300/status"
VSTORAGE_PATH = "/vstorage"

# Get current UTC timestamp in ISO 8601 format
def iso_utc_now():
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# Calculate container uptime in hours
def uptime_hours():
    try:
        with open('/proc/uptime','r') as f:
            seconds = float(f.readline().split()[0])
            return round(seconds / 3600.0, 2)
    except Exception:
        return 0

# Calculate available free disk space on root
def free_root_mb():
    du = shutil.disk_usage('/')
    return du.free // (1024*1024)

# Build a status record string with timestamp, uptime and free disk
def make_record(prefix="Timestamp1"):
    ts = iso_utc_now()
    up = uptime_hours()
    free = free_root_mb()
    return f"{ts}: uptime {up} hours, free disk in root: {free} MBytes"

# Append a record to the vStorage file
def append_vstorage(record):
    try:
        open(VSTORAGE_PATH, 'a').close()
        with open(VSTORAGE_PATH, 'a') as f:
            f.write(record + "\n")
    except Exception as e:
        app.logger.error("Failed to append to vstorage: %s", e)

# Send a record to the Storage service
def post_to_storage(record):
    try:
        requests.post(STORAGE_URL, data=record, headers={"Content-Type": "text/plain"}, timeout=2)
    except Exception as e:
        app.logger.error("POST to storage failed: %s", e)

# /status endpoint: create record, save it, and also fetch Service2's record
@app.route("/status", methods=["GET"])
def status():
    rec1 = make_record(prefix="Timestamp1")
    post_to_storage(rec1)
    append_vstorage(rec1)

    try:
        r = requests.get(SERVICE2_URL, timeout=3)
        rec2 = r.text.strip()
    except Exception as e:
        rec2 = f"ERROR contacting service2: {e}"

    combined = rec1 + "\n" + rec2
    return Response(combined, mimetype="text/plain")

@app.route("/log", methods=["GET"])
def log_proxy():
    try:
        r = requests.get(STORAGE_URL, timeout=3)
        return Response(r.text, mimetype="text/plain")
    except Exception as e:
        return Response(f"ERROR contacting storage: {e}", mimetype="text/plain", status=500)

if __name__ == "__main__":
    open(VSTORAGE_PATH, 'a').close()
    app.run(host="0.0.0.0", port=8199)