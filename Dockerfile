FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html

# At runtime, replace nginx's default port 80 with Railway's $PORT
RUN printf '#!/bin/sh\n\
PORT=${PORT:-8080}\n\
sed -i "s/listen 80;/listen ${PORT};/g" /etc/nginx/conf.d/default.conf\n\
exec nginx -g "daemon off;"\n' > /start.sh && chmod +x /start.sh

EXPOSE 8080
CMD ["/start.sh"]
