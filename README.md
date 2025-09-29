# devops1
1. Platform
Hardware: Desktop, AMD Ryzen 5 9600x, RTX 4070, 32 GB RAM
Operating system: Windows 11
Docker version: 27.5.1, build 9f9e405
Docker-compose version: v2.32.4-desktop.1

2. Diagram 
Service1: 172.20.0.4:8199
Service2: 172.20.0.3:8300
Storage: 172.20.0.2:8200

3. Analysis of Status records
2025-09-27T01:34:57Z: uptime 1.6 hours, free disk in root: 966333 MBytes
2025-09-27T01:34:57Z: uptime 1.6 hours, free disk in root: 966334 MBytes

Uptime is measured since container started. Frtee disk space is measured from container's root filesystem.

4. Analysis of persistent storage
To clear vstorage: : > ./vstorage
To clear the storage container volume: docker volume rm devops1_storage_data

6. What was difficult?
Ensuring both services write the correct record format.


7. Main problems
df inside container shows slightly different values than host.