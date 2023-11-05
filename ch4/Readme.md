# 마이크로서비스 데이터 관리

> 앱을 통해 생성되거나 수정되는 동적인 데이터를 저장하는 데이터베이스가 필요하고, 앱이 제공하거나 업로드 받는 파일을 저장할 장소도 필요하다.

책에서는 `Azuer` 를 사용한다. 그래서 `Azuer stroage` 를 사용하여 구현했다고 한다.

`Azuer` 를 사용하기는 해야할거 같다.

지금 챕터는 여러 컨테이너를 한번에 관리하기 위한 `Docker compose` 를 사용한다.

그리고 `Mongodb` 를 사용하여 `DB` 를 구성한다.

## 도커 컴포즈를 사용하는 이유

> `Kuberneties` 를 사용해 운영환경에서 컨테이너를 어떻게 관리하는지 볼수 있겠지만, 기본적으로 개발할때 여러 컨테이너를 관리하는것은 힘든일이다. 반면 쿠버네티서는 여러 개의 컴퓨터상에서 실행하도록 설계된 크고 복잡한 도구다.

이책에서는 `minikube` 를 사용하여, 쿠버네티스로 구현가능하기는 하지만 더 쉬운 방법으로 `Docker Compose` 를 구성해서 만들어 본다고 한다.

`Docker Compose` 는 다중 컨테이너를 한번에 관리할수 있도록 해준다,

지금 같은 상황에서도 `Video Streaming` 과 `MongoDB`, `video storage` 3개를 사용해야 한다.

만약 이러한 서비스가 여러개로 나누어진다면, 즉 10개정도로 많아진다면 일일히 `Dockerfile` 을 만들고 각 파일마다 들어가서 수정해 주고, 각 `Container` 를 관리하기 위해 터미널 10개를 켜고 확인해야 한다.

굉장히 짜증나는 일이다.

`Docker Compose` 는 한파일에서 전부 관리하게 해준다.

```sh
docker compose version
# Docker Compose version v2.23.0-desktop.1
```

그리고 생성한 `docker-compose.yml` 에서 `restart: no` 처리한 구문이있는데
`Mocroservice` 를 `dev` 환경에서 실행시킬때, 비정상 종료로 인한 재시작은 바람직하지 않다고 설명한다.

이 재시작할땐 문제를 놓치기 쉽다고 한다.

## 마이크로서비스 앱 부팅

```sh

# docker compose 실행
docker compose up --build

# docker compose 종료
docker compose down

```

`CTRL+c` 를 눌러서 `up` 된 컨테이너를 실행할 수있다.
이는 마치 `docker run --attach imageName` 된 상황과 비슷하다.

하지만 `compose` 는 여러개의 컨테이너를 실행하므로, 종료되는데 시간이 걸린다.
책에서는 이렇게 말한다.

> `CTRL + c` 를 한번만 누르도록 주의해야 한다. 한 번만 누르면 앱은 정상적으로 중지되고,  
> 모든 컨테이너를 중지할 때까지 끈기 있게 기다릴 것이다. \<중략\> 모든 프로세스가 완료될 때가지  
> `CTRL + c` 를 반복해서 누를 수 있다. \<중략\> 이 경우 종료되는 과정을 취소하고 일부 도는 모든  
> 컨테이너가 실행 상태로 남아있을 수 있다.

흥미롭군..
이러한 과정이 있는지는 몰랐다.

그래서 다음처럼 처리하도록 말하낟

```sh

docker compose down && docker compose up --build

```

재실행은 위처럼 한다.

이 책에서는 `Azure` 로 작동한다.
그러므로, `Azure` 의 `Storage` 를 사용하는데,
약간의 특이 사항이 생겼다.

책에서는 `azure-storage` 패키지를 설치하라고 한다.
하지만 현 시점에서 `azure-storage` 는 더이상 권장되지 않으며
`@azure/storage-blob` 을 권한한다.

`azure-storage` 의 `getBlobToStream` 을 사용하여,
`video` 를 `streming` 방식으로 `res` 객체로 보내는데,
`@azure/storage-blob` 에서는 더이상 이 방식을 지원하지 않는다.

또한 인증 방법도 약간 다르다.

> 훨씬 직관적으로 변경되기는 했다.

약간의 개념을 알아야 할것 같다.

> There are differences between Node.js and browsers runtime. When getting started with this library, pay attention to APIs or classes marked with "ONLY AVAILABLE IN NODE.JS RUNTIME" or "ONLY AVAILABLE IN BROWSERS".

간단하게 말하면, `node` 환경과 `browser` 환경에서 다운로드 동작이 다르다고 한다.

`Blob(파일이라고 생각해도된다.)` 을 `gzip` 혹은 `deflate` 형식으로 압축된 인토딩 데이터는 `Node.js` 에서는 압축된 형식으로 다운로드 하지만, `Browser` 에서는 압축 해제된 방식으로 다운된다고 한다.

이러한 부분이 다르므로, `API` 상 각 환경에 맞추어 표시한다고 한다.

여기서 `Blob` 이라는 말이 자주 나오는데,  
`Azure` 에서는 `Container` 를 폴더의 용어처럼 사용하고,  
`Blob` 을 저장된 파일을 말한다고 보면 된다,

> `blob` 은 `Binary Large Object` 의 약자라고 하는데, 오디오, 영상 같이 큰 데이터를 다룰때 사용한다. `Azure` 에서는 크든 작든 전부 `blob` 으로 취급하는듯 하다.

일단, 인증 방식부터 달라지는데, 여러 방식이 있지만, 가장 간단한 `StorageSharedKeyCredential` 을 사용하여 접근한다.

앞 글자를 보면 알겠지만 `class` 이므로 `new` 키와 같이 사용한다.

```js
const sharedKeyCredential = new StorageSharedKeyCredential(
  STORAGE_ACCOUNT_NAME || "",
  STORAGE_ACCESS_KEY || ""
);
```

이러한 방식으로 접근하여 처리한다.
이렇게 만들어진 인증방식을 `sharedKeyCredential` 에 할당하고
다음 처럼 처리하여 `blobServiceClient` 를 생성한다.

```js
const blobServiceClient = new BlobServiceClient(
  `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  sharedKeyCredential
);
```

이렇게 하면 이제 `blobServiceClient` 는 생성되었다.

여기서 흥미로운 부분은, `blobServiceClient` 를 사용할때,  
`폴더` 를 클릭하고 `file` 에 접근하듯이, 순차적인  
접근 방식으로 처리한다.

[Azure Blob Storage 소개](https://learn.microsoft.com/ko-kr/azure/storage/blobs/storage-blobs-introduction) 를 보면 각 `blob` 에 대한 설명이 있다.

```js
// 컨테이너 가져옴
const containerClient = blobServiceClient.getContainerClient(containerName);

// blob 가져옴
const blobClient = containerClient.getBlobClient(blobName);
// or BlockBlob 가져옴
const blockBlobClient = containerClient.getBlockBlobClient(blobName);
```

위에 보면 `blobClient` 방식과 `blockBlobClient` 방식이 있는데,  
`blobClient` 는 한번에 다운로드 하는 방식이라면, `blockBlobClient` 는 여러개의 `block` 으로 나뉘어 저장하는 경우에 쓴다고 보면 된다.

여기서 이전 `azure-storage` 의 `getBlobProperties` 를  
`blockBlobClient` 로 변경하여 처리한다.

이렇게 가져온 `blob` 을 다운로드 한다.

```js
// 여러 block 으로 나누어 다운로드 한다고했다.
// 0 은 처음부터 데이터를 가져오겠다는 것이다.
const blockBlobClientRes = await blockBlobClient.download(0);
```

결과적으로, `blockBlobClientRes` 에서 `block blob` 으로 받은 조각난 데이터를 받으면, 이를 `readableStreamBody` 를 통해 `readalbeStream` 으로 변환된다.

그런후, `res` 에 만든 `header` 값과 같이 클라이언트로 전송된다.

이게 지금까지 **_책의 내용과 다르게_** 변경한 코드이다.
자세한건 `src` 폴더에 존재한다.

## 이제 연결하기

책에서는 `azure-storage` 서비스와, `video-streaming` 서비스를 따로 구성했다.

하지는 이는 별개의 서버로 하나의 서버라고 말하기 힘들다.
그럼 두 서비스를 하나의 서비스로 연결해 주어야 한다.

```ts
// video-streaming/src/index.ts

import express, { Request, Response } from "express";
import http from "http";
import "./utils/env";

const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = process.env.VIDEO_STORAGE_PORT;
const app = express();

app.get("/video", (req: Request, res: Response) => {
  const queryPath = req.query.path as string;
  const requestOption: http.RequestOptions = {
    host: VIDEO_STORAGE_HOST,
    port: VIDEO_STORAGE_PORT,
    path: `/video?path=${queryPath}`,
    method: "GET",
    headers: req.headers,
  };
  const forwardRequest = http.request(requestOption, (forwardRes) => {
    res.writeHead(forwardRes.statusCode as number, forwardRes.headers);
    forwardRes.pipe(res);
  });

  req.pipe(forwardRequest);
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
```

이것이 연결을 위한 코드이다.
코드상 뭔가 이상해서 이것저것 많이 참고하면서 이해하려고 노력했다.

`/video` 라는 경로를 만들었고, `forwardRequest` 라는 변수를 `http.request` 를 통해 받아 처리한다.

뭔가 코드상 이상해 보이지만, 이는 `proxy` 역할을 하는 라우터 이다.

[http.request](https://nodejs.org/api/http.html#httprequesturl-options-callback) 를 보면 총 3가지의 인자를 받는다.

여기서 `url` 은 문자열로 받으면 자동적으로 `new URL()` 로  
파싱되며, `URL Object` 라면 자동적으로 `options` 객체로 변환된다고 한다.

`options` 객체는 `http` 요청 관련 프로퍼티들을 가진다.  
`callback` 은 요청이후 `response` 이벤트options를 받는 `listener` 이다.

이는 간단하게 `http` 객체를 사용해서 `request` 하는 로직이다.  
단, `Express GET router` 내부에서 작동하므로, 요청받은 값을  
다시, `응답받길 원하는 서버` 로 재 요청한다.

여기서 `req.pipe` 는 요청받은 값을 `forwardRequest` 로 데이터를 전송하는 역할을 한다.

그럼 `requestOption` 에 작성한 서버로 해당 요청을 전달하게 되고, 이러한 응답값을 `callback` 으로 받는다.

이제 이 받은 응답값을 `Express 의 res` 에 `pipe` 로 전달해주면, 해당 라이터의 응답을 `client` 에서 받아 출력하게 되는 코드이다.

이제 이렇게 만든 코드를 `docker compose` 에 작성하고 실행한다.

```yml
version: "3"
services:
  video-streaming:
    image: video-streaming
    build:
      context: ./video-streaming
      dockerfile: Dockerfile

    container_name: vidoe-streaming
    ports:
      - 4000:80
    env_file: "video-streaming/config/.env"
    restart: no

  azure-storage:
    image: azure-storage
    build:
      context: ./azure-storage
      dockerfile: Dockerfile
    container_name: video-storage
    ports:
      - 4001:80
    env_file: "azure-storage/config/.env"
    restart: no
```

이렇게 하면 `2개의 서버` 가 작동될것이고,  
`http://localhost:4000/video?path=SampleVideo_1280x720_1mb.mp4` 으로 접근하면, 포트 `4001` 서버의 출력화면이 나오게 된다.

이로서, 서로 다른 서버를 서로 연결했다.  
이게 `microservice` 의 강점이라 생각이든다.

서로 다른 서버를 작게 유지하면서 연결시키는 개념은  
`react component` 의 개념과 비슷해보인다.

> 결국에는 우리의 앱이 많은 마이크로서비스들이 서로 거미줄과 같이 연결하고 통신할 것이다. 하나의 마이크로 서비스에 대한 변경 사항이 앱 전바에 걸쳐 기하급수적으로 문제가 확장될 가능성도 갖고 있다. 마이크로 서비스들 간의 인터페이스를 상호 의존성을 최소화하도록 주의 깊게 만들어야 대부분의 마이크로서비스 아키텍처를 지원 할 수 있다.

`역할의 분리`, `단일 책임의 원칙` 을 기반한 마이크로서비스의 분리는 중요하다고 설명한다.

- `video-streaming`: 비디오 스트리밍 하는 역할
- `video-storage`: 비디오를 찾아 가져오는 역할

## 이제 `DB` 를 연결하자

책에서는 `mongodb` 를 사용한다.  
앞으로 지속적으로 공부할때 `javascript` 진영에서는 보통  
`sql` 과 `mongodb` 를 주로 쓴다.

> 특히 `mongodb` 는 `json` 형식을 따르므로, `javascript` 친화적이다.

`mongodb` 를 `docker` 를 사용해 만들수 있다.

## 이로인해 얻은것들

각 서비스를 `entity` 단위로 나누어 통신할수 있도록  
만들었다.

이로인해 각 서비스를 따로 구성하고, 구성된 서비스들이
주고 받을수 있다.

`db` 를 사용하여 따로 구성해 보았는데, `db`는 `entity` 단위로
각 서비스당 하나의 `db` 를 사용한다.

> 현재 서비스는 `db` 를 아예 빼서 만들었다.  
> 하지만 마치 `globalstate` 처럼 이런 공용 `db` 도 필요할  
> 테지만, 이 부분은 `kubernetes` 를 다루며 자세히 본다고 한다.

각 목적에 맞도록 추가 혹은 다른 `db` 로 대체도 가능하다.
각각의 추상화된 작업으로 인해 `역할의 분리`, `단일 책임 원칙`
에 맞는 경계가 그어졌다.

> 사실 책에서는 `docker-compose` 를 `production` 환경처럼  
> 구성해서 `npm start` 로 하고 있지만, **코드 변경이 일어날시, 너무 불편해서** `volume` 으로 `해당서비스/src` 로 `workingdir/src` 와 `bind volume` 으로 묶었다.
>
> 매번 `up.sh` 을 실행하고, 결과를 확인해야 하므로,  
> 개발환경에서 굳이 이렇게 할 필요는 없을거 같다.
>
> 물론 `kubernetes` 를 쓰면 달라는 상황이 생길거 같기는 하다.
