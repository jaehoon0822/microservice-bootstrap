# 마이크로 서비스 게시

이 책에서의 운영환경은 `Kubertetes` 이다.  
이를 위해서는 `Docker` 를 컨테이너화 시켜서 만든다.

`Docker` 를 사용하여 `code`, `relative file`, `dependancy` 를 하나의  
`bundle package(image)` 로 만들어 `container registry` 에 저장한다.

이후에 `container registry` 에서 `image` 를 `pull` 하여 사용하도록 만든다.

이책에서는 `Azure` 를 사용하여 서비스를 만드는데,  
개인적으로 `AWS` 였으면 좋았겠다 싶지만, 일단은 따라가자..

## Docker

> 마이크로서비스를 패키징하고, 게시 및 테스트를 하기 위해 사용

### 컨테이너의 개념

> 컨테이너는 일종의 서버 가상화 방법이다.

---

- 가상머신과 컨테이너의 차이에 대해서 (내가 이해한것)

> 가상머신은 `가상화된 하드웨어위에 운영체제를 설치` 하여 작동한다.
> 이때 `guest os 커널` 이 `하드웨어` 에 작동명령을 주는데,  
> `os` 마다 `커널` 이 변환한 `명령어` 가 다르다.  
> 이를 해결하기 위해 중간에 `하이퍼바이저` 를 사용한다.
> 하이퍼바이저는 `guest os 커널` 의 `명령어` 를 `host os` 커널의 `명령어` 로 변환하여 `하드웨어` 에 명령을 전달한다.
>
> > `guest os` 에 `가상화된 하드웨어` 가 있더라도 실제적으로 작동하는것은  
> > `host os` 의 `실제 하드웨어이`다. 실제 하드웨어위에 있는 `os`는  
> > `host os` 이므로, `host os` 의 `커널 명령어` 로 변환해야 한다.
>
> 컨테이너는 `하이퍼바이저` 가 존재하지 않으며, `host os` 커널상에서
> 작동한다. `하이퍼바이저` 대신 `dockerd` 가 `CGroups` 와 `namespace` 를 사용하여, 컨테이너를 격리시키고, 자원을 제한하도록 만들어 처리한다.
>
> 이는 마치 `Native Application` 처럼 작동한다.
> 당연, `하이퍼바이저` 에 의한 번역과정이 없으므로 더 나은 성능을 보여주며 가볍다.

### 이미지의 개념

> 이미지는 부팅이 가능한 서버의 스냅샷이며, 모든 코드, 종속성 및 실행에  
> 필요한 관련 파일들을 포함한다.

마치 `image` 는 `class` 와 비슷하고, `container` 는 `instance` 와 비슷하다.

객체지향 에서 `class`에 대해서 가장 많이 비유하는 것으로 말하자면,
`image` 는 붕어빵틀이고, `container` 는 붕어빵이다.

단, `code를 캡슐화` 한것이 아닌 `코드 및 종속성을 캡슐화한 가상화된 os`를 가진 붕어빵 틀 일뿐이다.

### 도커를 사용하는 이유

`도커는 마이크로 서비스 패키지를 만들고 게시하는 도구이다.`  
`도커를 가지고 우리가 작업한 것들을 패키징하고 게시하는데 사용된다.`

> - 시스템 환경 표준화
>   도커는 시스템 환경을 표준화 할수 있는 좋은 도구이다.  
>   모든 개발자들이 동일한 개발 환경을 가지고 작업할 수 있게 해준다.

마이크로 서비스를 만들기 위한 `flow` 는 다음과 같다

```sh

| < 서비스 >        | ---> | < 컨테이너 레지스트리 >   | ---> | <클러스터> |
| docker image 생성 |      | 서비스 도커 이미지 저장소 |      | 컨테이너들 |

```

각 `서비스` 는 `docker` 로 `image` 를 생성하고,
`컨테이너 레지스트리` 에 저장한다.

이후, `Kubernetes` 를 사용하여 `클러스터` 에서 각 컨테이너를 실행시키도록 한다.

> `Alpine` 과 `non-alpine` 의 비교
>
> 이미지 이름에 `alpine` 이 있다면 해당 이미지는 알파인 리눅스를 기반으로  
> 한다는것을 의미한다.
>
> 알파인은 **_최소한의 구성 요소만 가지고 있는 가벼운 리눅스이다._** 인프라와 클라우드 자원을 적게 사용 할수 있기 때문에 운영환경에 적합하다.

## 프라이빗 컨테이너 레지스트리 생성하기(나는 github package registry 사용 )

책에서는 `Azure` 를 사용하여, `container registry` 를 생성한다.

하지만, 나 같은경우 `github registry` 를 사용하여 저장할 것이다.

이야기 하기로는 `token(PATs)` 발급 받아 처리하거나 `github actions` 의 `workflow` 의 `GITHUB_TOKEN` 환경변수를 사용하여 `publish` 한다.

[Authnticationg to the Container registry](https://docs.github.com/ko/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry) 를 보면 `PATs` 를 발급받고, `permission` 설정하라고 한다.

> `Github` 에서는 `Github Actions` 를 사용하기를 추천한다고 한다.

`github` 는 [Github Packages Registry](https://github.com/settings/packages) 라는 저장소를 제공한다.

[About Github Packages](https://docs.github.com/ko/packages/learn-github-packages/introduction-to-github-packages) 에는  
다음처럼 작성되어 있다.

> GitHub Packages offers different package registries for commonly used package managers, such as npm, RubyGems, Apache Maven, Gradle, Docker, and NuGet. GitHub's Container registry is optimized for containers and supports Docker and OCI images.

간단하게 말하자면, `npm` 같은 `package registres` 를 제공한다고 한다. 물론, 그종류는 `Docker`, `RubyGems` 등등... 을 포함한다.

`Github Container Registry`는 `Docker container` 에 맞춰서  
최적화 되어있다고 한다. (`Docker` 사용하라는 뜻이다.)

[`Registry` 로 지원되는 목록](https://docs.github.com/ko/packages/learn-github-packages/introduction-to-github-packages#supported-clients-and-formats) 을 보면 어떠한 언어를 지원하는지 볼 수 있다.

[Working with the container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) 를 보면, `https://ghcr.io/<Owner>/<RepositoryName>/<ImageName>:태그` 라는 `package namespace` 를 사용한다고 한다.

이제, 알아야할 내용은 끝났다

`docker login` 을 사용하여 `github registry` 에 연결한다

```sh

docker login ghcr.io -u jaehoon0822 -p <PATs>

```

이렇게 하면 로그인된다.
이제 `github repsotiry` 로 `docker hub` 에 `push` 하듯 올릴수있다.

```sh

docker push ghcr.io/jaehoon0822/microservice-bootstrap/video-streaming:1.0

```

이제 `Packages` 탭에 보면 생성된 `image` 를 볼 수 있다.

생성된 `Package` 를 보면 이름이 다음처럼 되어있다.

> microservice-bootstrap/video-streaming

앞으로 이 `package` 를 가져오려면 아래의 코드를 입력하면 가져올수 있게 되었다.

```sh
docker pull ghcr.io/jaehoon0822/microservice-bootstrap/video-streaming:1.0
```

## 이미지를 레지스트리에 푸시하기

책의 내용인데, 위에 `github namespace` 를 사용하여 이미지 이름을 사용하는 규칙과 같아 보여 추가적으로 작성한다.

```sh

docker push <registry-url>/<image-name>:<version>

```

위의 `github repository` 에 올릴 `image` 이름과 형식상 같다.

```sh

docker push ghcr.io/jaehoon0822/microservice-bootstrap/video-streaming:1.0

```

중간에 `ghcr.io/jaehoon0822/microservice-bootstrap` 까지가 `registry-url` 로 볼수 있으며, `video-streaming` 이 `image-name` 이라고 보면 된다.

이제 `docker run` 을 사용할때, `github registry` 에 있는 이미지로 `container` 생성이 가능하다.

이제 `docker` 에 저장된 `ghcr.io/jaehoon0822/microservice-bootstrap/vidoe-streaming:1.0` 을 삭제하고,
`github` 에 저장된 `package` 를 바로 `run` 해본다.

```sh

# 기존의 run 중인 container 삭제
docker rm -f video-streaming

# 기존의 image 삭제
docker rmi ghcr.io/jaehoon0822/microservice-bootstrap/video-streaming:1.0

# github repository 의 이미지를 run
docker run -dp 3000:3000 -e PORT=3000 --name video-streaming ghcr.io/jaehoon0822/microservice-bootstrap/video-streaming:1.0

```

이제
