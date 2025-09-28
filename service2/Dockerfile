FROM node:20-bullseye
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY app.js .
EXPOSE 8300
CMD ["node", "app.js"]