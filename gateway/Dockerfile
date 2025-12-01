FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
# htpasswd with user admin and password adminpass (Apache MD5 $apr1$)
COPY htpasswd /etc/nginx/htpasswd
# initial active upstream file (will be bind-mounted in runtime for switching)
COPY active.conf /etc/nginx/conf.d/active.conf
RUN mkdir -p /etc/nginx/certs
EXPOSE 80 443
