FROM nginx:alpine

RUN apk add --no-cache gettext curl

# Download Three.js at build time so the browser loads it from our own server.
# This eliminates CDN dependency on the client's network entirely.
RUN curl -sL https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js \
      -o /usr/share/nginx/html/three.min.js

COPY index.html  /usr/share/nginx/html/index.html
COPY manifest.json /usr/share/nginx/html/manifest.json
COPY icon.svg    /usr/share/nginx/html/icon.svg

# Write nginx config template using single-quoted string so
# ${PORT} and $uri are stored literally (not expanded at build time)
RUN printf 'server {\n\
    listen ${PORT};\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    add_header Permissions-Policy "camera=*, microphone=()" always;\n\
    add_header Cache-Control "no-store" always;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /tmp/nginx.template

ENV PORT=8080
EXPOSE 8080

# envsubst '$PORT' only substitutes ${PORT}, leaving nginx's $uri intact
CMD ["/bin/sh", "-c", \
  "envsubst '$PORT' < /tmp/nginx.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
