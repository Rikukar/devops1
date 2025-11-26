FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
# htpasswd with user admin and password adminpass (Apache MD5 $apr1$)
COPY htpasswd /etc/nginx/htpasswd
EXPOSE 8199
