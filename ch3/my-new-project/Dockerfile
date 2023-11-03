# 사용할 이미지
FROM node:alpine

# 해당 이미지에서 사용될 `working directory`
WORKDIR /usr/src/app

# package 로 시작하는 파일 복사
# -- 다음의 파일을 복사한다 --
## package.json
## package.lock.json
# ----------------------------
COPY package*.json  .

# npm ci 를 사용하여 package.lock.json 의
# 명시된 패키지 버전 install
RUN npm ci

# src 폴더를 `working dir` 에 복사
COPY ./src ./src

# video 폴더를 `working dir` 에 복사
COPY ./videos ./videos

# npm run start 실행
ENTRYPOINT [ "npm", "run", "start" ] 