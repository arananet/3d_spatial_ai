FROM nginx:alpine

RUN apk add --no-cache gettext

COPY index.html /usr/share/nginx/html/index.html
COPY manifest.json /usr/share/nginx/html/manifest.json
COPY icon.svg /usr/share/nginx/html/icon.svg

# Write nginx config template using single-quoted string so
# ${PORT} and $uri are stored literally (not expanded at build time)
RUN printf 'server {\n\
    listen ${PORT};\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /tmp/nginx.template

ENV PORT=8080
EXPOSE 8080

# envsubst '$PORT' only substitutes ${PORT}, leaving nginx's $uri intact
CMD ["/bin/sh", "-c", \
  "envsubst '$PORT' < /tmp/nginx.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
