# devops1

## 1. Platform
Hardware: Desktop, AMD Ryzen 5 9600x, RTX 4070, 32 GB RAM
Operating system: Windows 11
Docker version: 27.5.1, build 9f9e405
Docker-compose version: v2.32.4-desktop.1

## 2. Services & Diagram
Current services (container network IPs example):
- Service1 (Flask) :8199
- Service2 (Node.js) :8300
- Storage (Go) :8200
- Gateway (Nginx) :8199 external (basic auth)
- Console (Node.js) :8198

## 3. Status Record Analysis
Example:
```
2025-09-27T01:34:57Z: uptime 1.6 hours, free disk in root: 966333 MBytes
2025-09-27T01:34:57Z: uptime 1.6 hours, free disk in root: 966334 MBytes
```
Uptime is seconds since container start divided by 3600 (rounded). Free disk space taken from container root filesystem (may differ from host due to overlay / copy-on-write layers). Improvement: measure host metrics via Docker API (planned later) and include memory usage.

## 4. Persistent Storage Analysis
Two mechanisms:
1. Host bind volume `./vstorage` (simple, shares data but couples host path; not recommended for production). 
2. Named volume `storage_data` managed by Docker via `storage` service (proper persistence, can be removed independently). 
Clearing:
```
echo "" > ./vstorage            # clears host bind file
docker volume rm devops1_storage_data  # removes named volume (data loss)
curl -X POST -u admin:adminpass http://localhost:8199/log/reset  # gateway to storage reset endpoint (when exposed)
```

## 5. Running Locally
```sh
docker-compose build
docker-compose up -d
curl -u admin:adminpass http://localhost:8199/status
curl -u admin:adminpass http://localhost:8199/log
```
Console: http://localhost:8198 (admin / adminpass)

## 6. Difficulties
- Ensuring consistent status formatting across languages.
- Disk space retrieval differences (df vs shutil vs Node fs).

## 7. Problems / Observations
- `df` inside container may report different free space due to layered filesystem.
- Need future metric extension (CPU, memory per container) via Docker API.

## 8. Reset Log Methods
Console button calls storage `/log/reset` and truncates `vstorage`. Manual alternatives shown above.

## 9. Branch & Version Plan
Will create `project1.0` (uptime in hours) and `project1.1` (uptime in minutes) after core stabilization; gateway blue-green not yet implemented.

## 10. CI/CD Overview
`.gitlab-ci.yml` defines stages: build, test, package, smoke, deliver, deploy, cleanup. Registry & SSH credentials set as masked variables.

## 11. Pending Work
- Blue-green version switching logic.
- HTTPS (Certbot) for gateway.
- Optional advanced metrics & JWT (not in scope yet).

## 12. Cleanup
```sh
docker compose down
docker image prune -f
```
