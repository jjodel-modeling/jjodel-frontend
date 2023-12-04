FROM nginx:alpine

COPY build /usr/share/nginx/html/jjodel
COPY default.conf /etc/nginx/conf.d/default.conf
