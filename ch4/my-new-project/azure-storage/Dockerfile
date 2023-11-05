FROM node:alpine

WORKDIR /usr/app

COPY ./package*.json . 

# tsconfig 복사
COPY tsconfig.json ./tsconfig.json

RUN npm ci 

COPY ./src ./src

ENTRYPOINT [ "npm", "run", "start:dev" ]
