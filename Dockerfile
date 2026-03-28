FROM node:22-alpine AS deps
WORKDIR /build
RUN npm install three@0.162.0 --no-save

FROM nginx:alpine
RUN apk add --no-cache gettext

# Copy Three.js from npm (checksum-verified, never an HTML error page)
COPY --from=deps /build/node_modules/three/build/three.min.js /usr/share/nginx/html/three.min.js

COPY index.html    /usr/share/nginx/html/index.html
COPY manifest.json /usr/share/nginx/html/manifest.json
COPY icon.svg      /usr/share/nginx/html/icon.svg

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
CMD ["/bin/sh", "-c", \
  "envsubst '$PORT' < /tmp/nginx.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
