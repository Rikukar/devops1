FROM node:20-bullseye
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY server.js ./
COPY public ./public
EXPOSE 8198
CMD ["node", "server.js"]
