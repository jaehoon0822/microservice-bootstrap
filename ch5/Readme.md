# 마이크로서비스 간의 통신

> 각각의 단위 마이크로서비스는 작고 단순하기 때문에  
> 기능이 많지 않으며, 앱의 목적을 위해서 마이크로서비스는  
> 반드시 협업을 통해 복잡한 동작을 해낸다. 협얼을 위해서  
> 마이크로 서비스는 서로 통신할 방법이 필요하다.

이 책에서는 이러한 통신을 위해 `RabbitMQ` 를 사용한다.

## 마이크로서비스 간의 대화

> 앱의 기능을 구현하기 위해 마이크로서비스는 반드시  
> 협업해야 하고, 이러한 협업을 위해 통신할 수 있는  
> 능력은 매우 중요하다.

## 히스토리 마이크로서비스 소개

`ch5` 부터는 `history` 라는 서비스를 하나더 추가한다.
이는 **_사용자가 신청한 내용을 기록_** 한다.

`history` 서비스는 `video streaming` 으로 부터 받은  
`message stream` 을 받아서 자신의 데이터베이스에 기록한다.

여기서 흥미로운 것은

```DockerFile

# Dockerfile.dev
RUN npm config set cache-min 999999

```

이 부분이다.
`npm config` 에서 제공하는 방식으로, 최소 `cache` 기간을  
초단위로 설정가능하다.

하지만 **_Error_** 가 발생한다
[npm v8/config 옵션](https://docs.npmjs.com/cli/v8/using-npm/config) 을 보면 아래처럼 작성되어 있다.

> `cache-min`
> Default: 0
> Type: Number
> DEPRECATED: This option has been deprecated in favor of --prefer-offline.
> --cache-min=9999 (or bigger) is an alias for --prefer-offline.

기존의 `cache-min=9999` 는 `deprecated` 되었고,
`prefer-offline` 으로 변경되었다고 한다.

변경해서 다시 작성한다.

```DockerFile

# Dockerfile.dev
RUN npm config set prefer-offline

```

이제 `cache` 된다.

`cache` 를 사용하는 이유는 새로운 `dependency`  
를 설치하게 된다면, `cache` 를 사용하여, 기존에 있는  
`package` 는 `cache` 에서 가져오고, 그렇지 않으면 새롭게  
설치한다.

`Dokcer` 에서 패키지 설치시, `cache` 데이터를 사용한다는것이다.

중요한 것은 `Docker` 의 `bind mount` 를 사용하여, 해당  
`cache` 폴더를 공유해야 한다.

> 역시나 책에서 나온 `cache` 폴더와는 다르다.
> `v8` 에서는 `~/.npm/_cacache` 에 저장된다고 한다.
> [npm v8/chache](https://docs.npmjs.com/cli/v8/commands/npm-cache) 에서 `Configuration` 부분에 해당 내용이 나온다

```yml
# docker-dompose.yml
---
# nvm 설치로 인해, ~/.npm/_cacache 에 cache data 저장됨
volumes:
  - ~/.npm/_cacache:/root/.npm/_cacache
```

이러한 형태로 `cache` 폴더를 `binding` 시켜준다.
`volumes` 를 사용하여 `src` 폴더역시 `binding` 해주면  
`Dockerfile-dev` 상에서, `COPY` 할 필요역시 없어진다.

> `volumes` 를 사용하여 `binding` 되면, 해당 폴더가 `Workdir` 에 생성된다. 그리고 해당 폴더의 내용이 변경되면, `binding` 된 `Workdir` 의 내용역시 동기화되어 변경되므로 `COPY` 할 필요가 없어진다.

`docker-compose.yml` 을 사용하여, `DockerFile-dev` 를 실행하도록 설정하면, 잘 실행된다.

이제, `bind mount` 된 `folder` 가 동기화 되므로, 내용을 변경하더라도 `Docker` 상에서 적용된다.

> 이전 `ch4` 에서, 내 마음대로 `bind mount` 를 사용하였지만,  
> 이 장에서 사용할줄은 몰랐다...(이전 장에서 진짜 불편했다 >o< )

이제 불편하게 `docker compose up --build -d` 명령어를 매번  
사용할 필요없어졌다!!

## 마이크로서비스 통신 방법들

> 직접 메시징과 간접메시지라는 개념이 존재한다.
> 직접 메시징을 동기라 부르기도 하고,
> 간접 메시징을 비동기라 부르기도 한다.

### 직접 메시징(동기)

> 직접메시징(`direct message`) 는 단순하게 하나의 마이크로서비스가 다른 마이크로서비스로 메시지를 직접 보내고, 바로 응답을 직접 받는 것을 의미한다.
>
> 메시지를 받는 마이크로서비스는 들어오는 메시지를 무시하거나 놓치면 안 된다. 만약 그래야 한다면 메시지 전달자가 응답을 통해 알 것이다.

말 그대로 동기식으로 작동하는 것이다.  
메시지의 응답을 받을때까지 기다리고, 그 응답을 받으면
그 다음의 일련의 동작을 실행한다.

> 밀접한 연결성(tight coupling)을 갖는 단점이 있다.

해당 메시지를 받아야 다음이 처리되니 당연하다.

## 간접 메시징(비동기)

> 간접 메시징은 통신하는 두 마이크로서비스 사이에 중개 역할을 추가한다. 두 마이크로 서비스의 가운데에 중개자를 두는것이다.
>
> 통신하는 양측은 실제로 서로에 대해서 알 필요가 없다.  
> 이런 유형의 통신은 결과적으로 느슨한 연결(looser coupling)을 가진다.

`RabbitMQ` 를 사용하는데, `RabbitMQ` 는 `Broker` 를 통해서  
`Message` 를 `Exchange` 한다.

`RabbitMQ` 는 메시지를 보내는 서비스를 `Publisher` 라 부르며,  
받는 서비스르 `Consumer` 라 부른다.

아무래도 `RabbitMQ` 에 대한 개념설명이 책에서는 부족하다.
개념적인 설명을 공부하고 정리해야 겠다.

> 역시 코딩은 이해하고 작성해야 하더라...
> `RabbitMQ` 이해하고 나중에 `Kafka` 보면 더 수월하게 익히겠지..

---

**_RabbitMQ 요소들_**

- **`message`**: 보낼 데이터이다. 명령 질의 혹은 이벤트 정보

- **`Publisher/Producer`**: `message` 생성자다

- **`Receiver/Consumer`**: `message` 소비자다.

- **`Broker`**: `message` 중개자다.

- **`Message Queue`** : `Producer` 에 의해 보내진 `message` 를 보관하는 `message` 대기열이다. `Broker` 내에 여러 `Message QUeue` 가 있는데, 고유한 이름을 가진 식별자로 구분하여 처리된다.

- **`Router/Exchange`**: 수신된 `message` 를 설정에 따라 어떤 `Queue` 로 보낼지 결정하는 구성요소이다. `RabbitMQ` 는 `Exchange` 라 부른다.

- **`Connection`**: `Producer` 와 `Broker`, `Consumer` 간의 통신연결을 말한다. /<TCP연결/>

- **`Channel`**: 가상의 `TCP` 연결로, `message` 전달은 `channel` 을 통해 전달된다. 생산자와 브로커, 브로커와 소비자사이에는 하나 이상의 채널이 존재해야 한다.

- **`Binding`**: `message Queue` 와 `Exchange` 간의 관계를 `정의`한다. 여기서 `정의` 라고 표현하는데, 이는 `routing key` 와 `header` 같은 인수가 포함된다.

> `Exchange` 는 들어오는 `message` 와 `binding routing` 정보를 비교한다. 그리고 이 메시지를 바인됭된 `queue` 로 보낸다.

---

**_Message 속성_**

- **`Routing key`**: `message` 를 `Queue` 로 배포할때 사용되는 `words` 이다.

- **`Headers`**: `Message routing` 및 추가 전달에 사용되는 키 값 쌍 모음이다.

- **`Payload`**: `Message` 의 실제 데이터이다.

- **`Publishing Timestamp`**: `Publiser` 가 제공하는 `timestamp` 값이다. (선택적 옵션)

- **`Expiration`**: `message` 의 `life time` 을 의미하며, 시간이 지나면 죽은것으로 간주된다. (단위: `milliseconds`)

- **`Delivery Mode`**: `persistent(영속적)` 이거나 `transient(일시적)` 로 설정할 수 있다. `RabbitMQ` 를 재시작할때 `Persistent` 는 디스크에 기록되어 리로드되지만, `transient` 는 일시적인 데이터로 사라진다.

- **`Priority`**: `message` 우선순위를 결정하며, `0-255` 사이의 값을 가진다.

- **`Message ID`**: `Producer` 에 의해 설정된 `message` 를 식별할 수 있는 고유 `ID` (선택적 옵션)

- **`Correlation ID`**: 원격 `Prociduer`(RPC) 와 `Req`, `Res` 를 일치시키기 위한 고유 `ID` (선택적 옵션)

- **`Reply To`**: `Consumer` 가 `Res` 시에 사용되는 `Queue` 혹은 `Exchange` 의 이름을 지정할 수 있다.(선택적 옵션)

- **`MessageTTL`**: `queue` 에 추가된 각 `message` 의 수명이다.
  해당 시간이 지나면 메시지는 자동으로 삭제된다. `message` 와 `queue` 모두 값이 있으면 가장 낮은 값이 선택된다.

---

**_Queue 의 속성_**

- **`Name`**: `Queue` 의 고유이름.

- **`Durable`**: `RabbitMQ` 재시작시, `Queue` 를 보존할지 삭제할지 결정한다.

- **`Auto Delete`**: `Consumer` 가 구독하지 않은 `Queue` 라면, 자동적으로 삭제한다.

- **`Exclusive`**: 오직 하나의 `connection` 에서만 사용가능하다. 그리고 `connection` 이 닫히면 삭제된다.

- **`Max Length`**: `Queue` 안에 대기할수 있는 `message` 의 최대 갯수를 말한다. 최대 갯수를 초과하면 오래된 `message` 를 버리거나 새로운 `message` 를 거부하도록 설정 가능하다

- **`Max Priority`**: `Queue` 에서 지원하는 최대 우선순위 값 설정이 가능하다. (255까지 설정가능)

> 기본값은 0 이며, 0 일시 메시지 우선 순위를 지원하지 않는다.

- **`MessageTTL`**: `queue` 에 추가된 각 `message` 의 수명이다.
  해당 시간이 지나면 메시지는 자동으로 삭제된다. `message` 와 `queue` 모두 값이 있으면 가장 낮은 값이 선택된다.

- **`Dead-letter Exchange`**: 기간이 지나거나, 버려진 `message` 를 `Dead-letter Queue` 혹은 `redicrection` 하도록 자동적으로 보낸다.

- **`Binding Configuration`**: `Queues` 와 `Exchanges` 사이의 연결을 설정한다. `message` 를 수신하려면 `Queue` 는 반드시 `Exchange` 와 `Binding` 되어야 한다.

---

**_Exchange 의 속성_**

- **`Name`**: `Exchange` 의 고유이름.

- **`Type`**: `Exchange` 의 타입.

> `fanout`, `direct`, `topic`, `headers` 를 사용할수 있다.
>
> ---
>
> - **`fanout`**: 특정 라우팅 키나 패턴 고려없이, `Exchange` 에 연결된 모든 `Queue` 로 메시지를 전달
>
> ---
>
> - **`direct`**: `binding` 에 정의된 `routing key` 로 `Queue` 에 보내는 `message` 이다.
>
> > `queue` 를 식별하기 위해서는 `message routing key` 와 `queue routing key` 가 있어야 한다. `message routing key` 와 `queue routing key` 를 비교해서 같으면 해당 `queue` 로 `message` 를 보내는 매커니즘이다.
>
> ---
>
> - **`topick`**: `Routing key` 를 사용하지만, `routing key 와 정확하게 일치`하지 않아도 된다. 대신에, `pattern 일치(wild card)` 로 처리한다.
>
> > - **\*(정확히 하나의 `단어` 만 일치)**: `*.message` 는 `test.message` 는 일치한다. 하지만 `more.test.message` 같은 형식은 일치하지 않다.
> >
> > - **#(0개 이상의 단어와 일치)**: `#.message` 는 `test.message` 도 일치하고, `more.test.message` 도 일치한다. 단, `test.message.not` 은 일치하지 않는다.
> >
> > 즉, `pattern` 에 일치하는 모든 `message queue` 에 `message` 를 전달한다.
>
> ---
>
> - **`headers`**: `message` 라우팅을 사용하기 위한 `message header` 이다. 메시지의 `routing key` 는 무시하며, `headers` 를 이용하여 복잡한 조건의 `message routing` 이 가능하다. `headers` 는 키-값 쌍이 포함되어 있으며, 여러 속성을 갖는다.
>
> > **Headers 에 사용되는 X-Arugument**
> >
> > `RabbitMQ`에서 `headers Exchange` 바인딩에 사용되는 특별한 인자(`x-argument`)이다.
> >
> > **`x-match`**: 이 인자는 바인딩된 큐로 메시지를 라우팅할때 헤더 속성들 간의 일치여부를 지정한다.
> >
> > - **`any`**: (default) 바인딩 조건 중 하나라도 일치하면 메시지를 라우팅
> >
> > - **`all`**: 모든 조건이 일치해야 메시지를 라우팅
> >
> > **`x-death`**: 이 인자는 `death-letter Queue` 와 관련된 정보를 포함한다. 메시지가 `death-letter Queue` 로 이동했을때 저장된다.
> >
> > **`x-message-ttl`**: 이 인자는 `TTL(Time-To-Live)` 를 설정한다. `Queue` 에 `message` 가 대기하는 시간을 설정한다.
> >
> > **`x-expires`**: 이 인자는 `TTL(Time-To-Live)` 를 설정한다. `Queue` 에 `message` 가 대기하는 시간을 설정한다.
> >
> > **`x-max-length`**: 이 인자는 `Queue` 에 저장될 수 있는 최대 `message` 갯수를 설정한다.
> >
> > **`x-length-bytes`**: 이 인자는 `Queue` 에 저장될 수 있는 최대 `byte` 를 설정한다.
>
> ---

- **`Durabillity`**: `RabbitMQ` 재시작시, `Exchange` 를 보존할지 삭제할지 결정한다.

- **`Auto Delete`**: `Exchange` 와 관련된 모든 큐가 더이상 필요하지 않을때, `Exchange` 를 자동으로 삭제한다.

- **`Internal`**: 내부 `Exchange` 는 다른 `Exchange` 로 부터 `message` 를 전달받을수 있다.

- **`Alternate Exchange`**: `Exchange` 에서 메시지를 라우팅할때 `key` 나 `pattern` 이 일치하지 않는 경우 메시지 손실이 이루어질수 있다. 이때 `Alternate Exchange` 를 설정하면 라우팅 실패한 메시지를 `Alternate Exchange` 로 전송하여 처리가능하다.

- **`Other Arguments(x-arguments)`**: `Exchange` 를 생성할때, 기타 명명된 `arguments` 혹은 `settings` 를 제공할수 있다. `x-` 로 이름이 시작되어, `x-arguments` 라 불린다.

> 이러한 인수는 대부분 `Plugin` 과 관련있다.

**_Default Exchange_**

`RabbitMQ` 실행시 자동적으로 생성되는 `Exchange` 이다.  
이 `Exchange` 는 특별하다. 삭제할수 없으며, 이름이 없다.

`Default Exchange` 의 기본 `type` 은 `direct` 이다.  
이런 이유로 `direct Exchange` 로 간주된다.

내가 이해하기로는 `queue` 에 따로 `Exchange` 를 `binding` 하지 않았더라도, `Default Exchange` 를 사용하여 `queue routing key` 로 `message` 를 보내면 받을수 있다.

즉, `binding` 없이 `routing key` 로 `message` 를 보낼수 있는 가장 기본적인 `Exchange` 라고 생각해도 될것 같다.

**_Exchange Binding_**

`Exchange` 는 `Queue` 하고만 `Binding` 되지 않는다.  
`Exchange` 끼리도 `Binding` 가능하다.

마지막 `Exchange` 는 `message` 를 결국 `Queue` 로 전달한다. (`Exchange` 는 `Queue` 로 전달하기 위한 `Router` 이니 당연하다.)

`Exchange Binding`이 유용하게 사용될 수 있지만,  
확실히 서비스상의 복잡한 관계가 형성될 것으로 보인다.

**_Alternate Exchange_**

어떠한 `message` 는 `routing` 되지 않았거나, `routing` 할수 없는 `message` 가 존재할 수 한다. 이럴때 폐기될수 있지만, 이러한 `message` 를 `Alternate Exchange` 로 설정 가능하다.
즉, `폐기될 message` 들은 전부 `Alternate Exchange` 로 향하여
`Alternate Exchange` 와 `binding` 된 `Queue` 에 저장된다.

> 지정시 새로운 `Exchange` 를 생성한후(`exchange name=alter_exchange`), 대상 `Exchange` 에 `aruments={"alternate-exchange":"alter_exchange"}` 형식으로 지정을 해주어야 한다.

```bash
# alter_exchange 생성
rabbitmqadmin declare exchange name=alter_exchange type=fanout
# alter_exchange 에 binding 할 alter_queue 새성
rabbitmqadmin declare queue name=alter_queue
# binding 시킨다.
rabbitmqadmin declare binding source=alter_exchange destination=alter_queue

# 새로운 exchange1 에 alternate-exchange 를 설정한다.
rabbitmqadmin declare exchange name=exchange1 type=direct arguments='{"alternate-exchange": "alter_exchange"}'

# 새로운 exchange2 에 alternate-exchange 를 설정한다.
rabbitmqadmin declare exchange name=exchange2 type=direct arguments='{"alternate-exchange": "alter_exchange"}'

```

> 보면 이러한 방식으로 각각 `exchange` 에 `alternate exchange` 를 설정한다.
> 그럼 `exchange1`, `exchange2` 에 보내지는 `message` 에 해당하는 `routing key` 가 없다면, `alter_exchange` 로 보내진다.
> 그럼 `alter_queue` 로 `message` 가 보내질 것이다.

**_Push_**

`Cousumer` 는 `Queue` 를 `Subscription` 하고 대기한다.  
그럼 이후 `Queue` 에 `message` 가 있다면 자동적으로  
`Subscription Consumer` 에 `push` 한다.

이때, `Subscription Cousumer` 는 지속적으로 `polling` 방식으로
`Qeueue` 를 감지하고 있는다.

**_Pull_**

`Consumer` 가 직접 수동으로 `Queue` 에서 `message` 를 가져오는  
경우이다. 이경우 `필요한 경우도 있지만, 권장되는 방식은 아니다.`

`RabbitMQ` 개념을 알아보는데 오래걸렸다..
대략적인 구조를 보자면 아래과 비슷할 것이다.

```sh
   | publisher |
        |
   | message(routing key 를 같이 보냄) |
        |
        v
----- broker ------------------------------------
        |
        v
    --------------------------------------------
             < Exchanges (여러 `Exchange`) >
              받은 메시지를 고유한 이름을 가진
              Queue 로 라우팅
              `Exchange` 끼리 서로 `binding` 될수 있다.
    --------------------------------------------
    |  Exchange  |  |  Exchange  |  |  Exchange  |
    --------------------------------------------
        |
        |
     Exchange 가
     message routing key 를
     queue routing key 와 비교이후
     해당하는 `queue` 로 보냄
        |
        v
      < routing key 를 가진 Queue 들 >
    ---------------------------------------------
    |  Queue  |  |  Queue  |  |  Queue  |
    -----------  -----------  -----------
    | message |  | message |  | message |
    -----------  -----------  -----------
                 | message |  | message |
    ---------------------------------------------
        |
        v
-------------------------------------------------
        |
    | message |
        |
        v
   | Consumer |
```

가운데 `Broker` 가 보일것이다.
`Broker` 가 중간에서 알아서 처리해준다.

그러므로 `Publihser` 는 `Broker` 에게 이 `message` 를  
알아서 보내달라고 예약을 한다.

그럼 `Broker` 는 해당 `message` 를 `Queue` 에 저장한다.
이는 `Consumer` 가 없더라도, `message` 를 게시할 수 있다.

모든 `message` 는 `Queue` 에 저장되며, `Consumer` 가 나중에  
읽을 수 있도록 한다.

이는, `Publisher` 가 `online` 이 아닌 경우에도, `Consumer` 가  
`message` 를 받을 수 있도록 하는 근본이 된다.

`Broker` 는 `Consumer` 가 `message` 를 처리할때까지 기다리거나, 여의치 않으면 다른 `Consumer` 에게 다시 보낸다.

이는 `Horizontally scalable` 하게 처리 가능하게 된다.  
`Consumer` 가 `message` 처리를 못한다면, 다른 확장된 `Consumer`에게 보내면 된다.

## HTTP 를 사용한 직접 메시징

아.. `RabbitMQ` 기초적 개념은 이해가 가는것 같다.  
그럼 간단한 `HTTP` 직접 메시징을 처리해 본다

`Docker compose` 는 자체적인 `Network` 를 가진다.  
이때 이 `Network` 는 기본값인 `brige` 이며, 해당 `Network` 에  
속하는 `service` 들은 `Private Network` 내에서 통신이 가능하다.

`service` 접근을 위서는 `ip` 주소가 필요한데, `Docker compose` 는 `DNS` 를 가지고 있어서, 해당 `service` 명을 식별자로 해서  
`ip` 주소로 변환해준다.

이는 매우 편리하게 각 서비스간의 소통이 이루어지도록 만들어준다.

> 책에서 구현된 것은 뭔가 `express` 스럽지 못하다는 느낌이  
> 들었다. 그래서 `express` 에서 `router` 로 구성해서 `history/viewed` 를 구성했고, `http.request` 를 사용하기 보다는  
> 잘 만들어진 `axios` 로 통신을 구현했다.

잘 작동되며, `db` 에도 저장되는것을 확인했다.

## 드디어 RabbitMQ 를 사용한 간접 메시징을 이용해본다

> `RabbitMQ` 를 보기 위해 하루 종일 작성중이다...
>
> 아무래도, 복잡한 `간접 메시징` 처리인데,
> 개념정도는 알고 넘어가야 나중에 수월할것이다.

---

> 래핏MQ 는 메시지 송신과 수신자 사이에 연결이 없어도 된다.  
> 송신자는 어느 마이크로서비스가 메시지를 처리할지 모른다.
>
> 래빗MQ 는 성숙한 도구이며, 안정적이다. 개발된지는 10년 이상  
> 지났고, 여러 프로토콜 중에서 메시지 중계(`message broker`)

통신을 위한 공개된 표준인 `AMQP(Advenced Message Queueing Protocol)` 을 따른다

`nodejs` 에서 지원하는 `rabbitMQ`는 [amqplib](https://www.npmjs.com/package/amqplib) 이다.

## Fault-tolerant(내결함성)

기본적으로 `Microservice` 를 구현하면서 `Fault-tolerant` 를  
강조한다.

여기서 `RabbitMQ` 를 사용하고 있으며, `Dockerfile-dev` 에서  
`depends-on` 을 사용하여, `history` 서비스가 의존하는 형태로  
만들었다.

하지만, `Kubernetes` 가 아닌 `docker compose` 를 사용하고  
있으므로, `RabbitMQ` 가 준비됐는지 혹은 다운되었는지 알수없다.

> 이 책에서는 `RabbitMQ` 자체가 다른 `microservice` 들에 비해  
> 무겁다고 강조한다. 이러한 경우, `RabbitMQ` 서비스가 만들어져도  
> 서버가 준비중이라면 `microservice` 는 `message` 를 받지 못한다.
>
> 이러한 문제를 해결하기 위한 우회방법으로 `wait-port` 라는  
> `npm package` 를 사용한다.

[wait-port](https://www.npmjs.com/package/wait-port) 에서  
다음처럼 글이 적혀있다.

> Simple binary to wait for a port to open. Useful when writing scripts which need to wait for a server to be available.

`port` 가 `open` 될때까지 기다리는 간단한 `binary` 라 한다.
`server` 가 사용가능해질때까지 기다린다는 것이다.

이 `package` 를 사용하면 `port open` 까지 기다리므로  
`rabbitMQ` 서비스가 시작될때까지 기다리는것은 보장할것이다.

그런데 `안되더라...`

```dockerfile
FROM node:alpine

WORKDIR /usr/app

COPY ./tsconfig.json .

COPY ./package*.json .

RUN npm config set prefer-offline true

RUN npm ci

RUN npx wait-port $RABBIT_HOST:5672

ENTRYPOINT [ "npm", "run", "start:dev" ]
```

이렇게 작성했는데, 처음에 책에 나와있는대로

```dockerfile

RUN npx wait-port rabbit:5672

```

이렇게 하니 전혀 작동안되었다. `rabbit` 서비스 자체를  
못찾는것 같아서, `$RABBIT_HOST=rabbit` 으로 환경변수 등록이후  
처리해보려 했다.

그럼 작동은 한다.
하지만, `waiting` 시간이 `100s` 가 넘어간다.
혹시나 싶어서, 해당 부분을 주석처리하고 `RabbitMQ` 를 재실행  
해보니, 시간이 걸리기는 하지만, `100s` 까지는 걸리지 않았다.

뭔가 인지를 못한다.
책에 나와있는대로 하면 안될것 같아, `helthcheck` 를 사용하여  
처리한다.

[해당내용](https://stackoverflow.com/questions/53031439/connecting-to-rabbitmq-container-with-docker-compose) 을 확인해볼수 있다.

[rabbitmq-diagnostics](https://www.rabbitmq.com/rabbitmq-diagnostics.8.html) 는 해당 문서에서 `특수증상에 사용되는 cli tool` 이라 한다.
`monitering`, `health checks` 에 사용된다고 한다.

> - **`-q`, `--quiet`**: `output` 을 조용히 처리한다.
> - **`ping`**: 가장 기본적인 `healthchack` 라고 한다. 만약 `target node` 가 실행중이고, `rabbitmq-diagnostics` 성공적으로 인증한다면 성공한다.
>
> 그런데 안되었다.
>
> 어허, 이거 뭐가 문제인가?
>
> 구글링으로도 나오지 않아서 `bard` 를 통해 확인했다.
> 사실 `AI` 가 유용하기는 해도, 거짓말을 많이해서 신용하는건
> 어렵지만, 적어도 제대로 작동하는 것이 확인되었다.
> 그리고 증상이, 처음 `docker compose up` 한 다음에 작동을
> 안하고, `code` 수정하면, `restart` 되면서 제대로 동작하는것
> 으로 보아, 내용이 맞는것 같아 적어둔다.
>
> 일단, `rabbitMQ` 에서 `서버가 실행된것은` 알수 있지만,
> `실행후 연결 수립할 준비가 되어있지 않는 상태` 라고 한다.
>
> `rabbitmq-diagnostics` 는 `서버 실행` 만 확인할뿐,
> `연결 수립 준비 확인` 까지는 알지 못한다고 한다.
>
> 이에 대한 해결책은 `amqp-dump` 를 사용하여 연결 수락되는지  
> 확인하는 방식을 사용해야 한다
>
> > 책에서 왜 `wait-port` 를 사용햇는지 이해가 간다
> > 그런데, `wait-port` 도 제대로 작동을 안하니 이렇게라도 사용하는 수밖에..ㅠㅠ
>
> `amqp-dump` 는 다음의 옵션이 있다.
>
> - -b: RabbitMQ 서버의 주소를 지정
> - -u: RabbitMQ 서버에 연결할 사용자 이름을 지정
> - -p: RabbitMQ 서버에 연결할 사용자 암호를 지정
> - -c: RabbitMQ 서버에 연결할 vhost를 지정
> - -q: RabbitMQ 서버에서 표시할 큐를 지정
> - -e: RabbitMQ 서버에서 표시할 exchange를 지정
> - -k: RabbitMQ 서버에서 표시할 키를 지정
>
> `amqp-dump` 에 대해서 알고 싶어서 `docs` 를 찾으려고 했지만,
> 찾을수가 없었다.
> 이 부분은 `rabbitmq` 에서 공식 지원되는 서비스가 아니라고  
> 한다. 해당 `github` 도 찾으려고 했지만 없는 `page` 라 나온다..
>
> 일단 이 방법으로 잘 작동하므로, 사용하도록 한다.

### amqp-dump 도 작동안한다

지금 `curl -f localhost:15673` 로 `test` 해봐도 작동안하고,  
`amqp-dump` 로 다시 작동해 보았는데 되지 않는다.

그리고 `port-wait` 시 `rabbit` 서비스를 `ip` 로 변환하지 못하고  
있다. 이유를 찾아야 한다.

다시 `port-wait` 으로 되돌아 왔다.
지금 문제를 알아낸것이, `ENTRYPOINT` 에 `port-wait` 을  
사용안하고, `RUN` 에 사용한 것이다.

`RUN` 에 사용한 `port-wait rabbit:5672` 에 `rabbit` 은  
`docker-compoes.yml` 에서 `dockerfile` 을 빌드하고있다.
이는 아직 `rabbit` 환경변수가 생성되지 않은 시점이다.

`docker-compose` 가 해당 서비스 이름을 `dns` 를 사용하여  
`ip` 주소로 변환해주는데, 이게 `build` 시점에서는 작동하지  
않은듯 하다.

이말은 `dockerfile` 빌드 이후에, 적용해야 한다는 것이다.
그래서 처음에는 다음처럼 적어보았다

```dockerfile

ENTRYPOINT["npx", "port-wait", "rabbit:5672", "&&", "npm", "run", "start:dev"]

```

이것역시 작동안한다, `ENTRYPOINT` 에서 해당 명령어를 읽은다음  
`rabbit` 환경변수를 보고 치환하는듯 하다.

하지만, 위의 명령은 `npx port-wait rabbit:5672` 명령어, `&&` 명령어, `npm run start:dev`명령어로 나누어진다.

명령어 자체를 `구분` 하여 처리된다.
이렇게 되면 문제가 전체 명령어를 읽고, 실행하는데 명령어를  
읽을때 변수로 치환하지 않는다.

`ENTRYPOINT` 명령어 전체를 다 읽고 치환한다.
각 구분된 명령어를 따로 실행하게 되므로, `rabbit` 변수 치환을  
못하는 상황이 생긴다.

이를 해결하기 위해서는

```dockerfile

ENTRYPOINT npx port-wait rabbit:5672 && \
           npm run start:dev

```

이렇게 한줄의 명령어로 적어주어야 제대로 작동한다.

> 괜히 이것저것 코드 건드리면서 만들어보려다가 힘들게 파고들었다.  
> 그래도 알지 못했던 사실을 알게되서 다행이다.

한줄로 작성된 코드는 구분되 명령어로 실행되지 않고,  
하나의 명령줄로 실행된다.

> 마음같아서는 `healthcheck` 로 처리하고 싶은데,  
> 처리가 되지 않느다. 뭐가 문제인지 문제점을 찾지 못하고 있다.
> 이건 따로 더 공부해야 할거 같다...

## 단일 수신자를 위한 간접 메시징

> `single-recipient` 메시지 설정으로 일대일 통신으로 사용하는것이다. 이 설정은 여러 전송자와 수신자가 포함될수는  
> 있지만, 오직 하나의 마이크로서비스만이 개별 메시지를 수신한다.

좀더 보도록 하자, 내가볼대 `direct message` 를 말하는거 같은데,  
다른 개념일수도 있겠다.

> 메시지를 `Queue` 에서 가져올때, `Queue` 를 생성하는 것이  
> 아니라 확보(`assert`)하는것이다.
>
> 여러개의 마이크로서비스가 하나의 큐를 대상으로 할수 있고,  
> 큐가 존재하는지 확인하는 것이며, 존재하지 않는 경우 큐를  
> 생성한다.

아.. 그래서 `assert` 라는 뜻으로 쓰이는구나..
왜 `create` 라는 말을 쓰지 않았는지 조금 의아했는데,  
`assert` 라는 의미가 더 명확하다는 것이 느껴진다.

`qmqplib` 는 `Node` 전용 라이브러리이다.  
책에 나온 코드는 뭔가, `express` 스럽지 않다.
그래서 그냥 코드 이해하고 내 방식대로 처리해본다.

```ts
//history/src/utils/createChannel.ts
import amqplib from "amqplib";

if (!process.env.RABBIT) {
  throw new Error("RABBIT variable not found");
}

const RABBIT = process.env.RABBIT;

const createChannel = async () => {
  return (await amqplib.connect(RABBIT)).createChannel();
};

export default createChannel;
```

이렇게 작성한다.
이는 `RabbitMQ` 의 `channel` 을 생성하는 함수이다.
`amqplib.connect` 를 통해 서버에 접속한후, `channel` 을 생성한다.

`channel` 은 `queue` 와 송수신할수 있는 통로로 생각하면 된다.

이렇게 만들어진 `channel` 을 통해 `assertQueue` 함수로  
`queue` 생성이 가능하다.

```ts
import createChannel from "@/utils/createChennel";

const messageChannel = await createChennel();
await chennel.assertQueue("viwed", {
  /* Options*/
});
```

생성된 `Queue` 에 `message` 를 저장하기 위해서는
`messageChannel` 의 `consume` 을 사용하고 첫번째 인자에  
`queue name` 을 넣고, 두번째 `callback` 에서 받은 `mssage` 를  
사용하여 처리한다을

응? 그런데 `Buffer` 를 `octet stream` 으로 받은 것으로 이해하는데, `toString` 시에 왜 객체가 나오는거지?

> `Buffer` 는 `octet stream` 이며, `toString` 은 `UTF-8` 인코딩으로 변환한다. 객체는 `JSON` 으로 표현가능하며, `JSON` 은  
> `UTF-8`인코딩으로 표현될수있다. (호환된다는 말이다.)
>
> `toString` 메서드는 `Buffer` 내용이 `Object` 이면,  
> 이를 `JSON` 으로 변환하는 기본 동작을 가지고 있다.
>
> 그러므로, 위에 내용이 객체더라도, `toString` 메서드를 통해  
> `JSON 객체` 형식으로 변환가능한것이다.

이렇게 받은 `message.content` 상의 내용을 사용하여 `db` 에  
저장하면, `message` 기반 서비스로서 처리 가능해진다.

마지막으로, `message` 처리 완료이후에, `messageChannel.ack(msg)` 을 실행한다.

이는 `messageChannel.ack` 은 `acknowledgement` 로 승인(처리)되었다는 것이다. 처리되었으므로 `queue` 상에 해당 `message` 삭제한다.

이후로, `video-streaming` 이 `publisher` 역할을 하면  
`message` 전송이 가능하다.

다음과 같다.

```ts
// #publish(exchange, routingKey, content, [options])
channel.publish("", "viewed", Buffer.from(content));
```

첫번째 인자는, `exchange` 인데 빈값이면, `default exchange` 를  
사용한다.
두번째 인자는 `routing key` 이다. 해당 `key` 에 맞는 `queue` 에  
`message` 를 전달한다.
세번째 인자는 `content` 인데, `Buffer` 로 변환해서 전송한다.
네번째는 `options` 이다.

[`channel.publish`](https://amqp-node.github.io/amqplib/channel_api.html#channel_publish) 에서 참고한다.

잘 작동되는 것을 확인했다.

## 다중 수신 메시지

> 다중 수신(`multiple-recipient`) 나 브로드캐스트(`broadcast`)  
> 같은 형태가 더 작합한 상황도 있다. 간단히 말하면 하나의  
> 마이크로서비스가 메시지를 보내면 다수의 마이크로 서비스가  
> 수신하는 것이다.
>
> 이런 유형의 메시지는 알림(`notifications`) 이 필요한 경우에  
> 사용하면 좋다.

여기서는 `anonymous queue` 를 사용한다.
말 그대로 `익명의 queue` 로 사용되며, `rabbitMQ` 에 의해 랜덤한  
이름을 갖게 된다.

생각해보면, `notifications` 은 모든 `queue` 들 에게 `message` 를
보내는 방식이므로, 굳이 이름지어진 `queue` 일 필요는 없다.

또한, `exclusive` 라는 옵션을 사용하는데, 해당 옵션은  
서비스 연결 종료시, `queue` 도 같이 사라지는 방식이다.

`notifications` 는 `queue` 자체가 항상 존재할 필요가 없다.
연결되면 `queue` 를 생성하고 `message` 를 담은다음에,  
해당 `message` 를 소비하면 된다.

굳이 `queue` 를 지속 유지할 필요는 없다.
`exclusive` 와 `autoDelete` 는 비슷한 점이 있지만,
명확히 말하면 조금 다르다.

| 옵션       | 설명                                                                                                                 |
| :--------- | :------------------------------------------------------------------------------------------------------------------- |
| exclusive  | `queue` 가 한번에 하나의 `consumer` 만 사용할수 있다. </br> 또한, `queue` 는 `consumer` 가 연결을 해제할때 삭제된다. |
| autoDelete | `queue` 에 연결된 `consumer` 가 없으면 `queue` 가 삭제된다.                                                          |

`notifications` 는 `exclusive` 가 맞다는 생각이 든다.

```ts
// exchange 를 생성한다.
// assertExchange(name, type, option)
// 방식으로 각 인자값을 받는다.
//
// fanout 타입은 연결된 모든 `queue` 에 `message` 를
// 전달한다.
await messageChannel.assertExchange("viewed", "fanout");

// queue 는 익명이므로, `distructure` 를 사용하여, `queue` 이름을 받는다.
const { queue } = await messageChannel.assertQueue("", { exclusive: true });

// exchange 와 queue 를 binding 한다.
// bindQueue(exchange name, queue name, pattern)
await messageChannel.bindQueue("viewed", queue, "");
```

아... 이제 처리 완료되었다.
`다중 메시지` 를 처리하기 위해 정말 많이 독스를 찾아본거 같다.
하나 할때마다 막히는 상황이니...

> 역시 삽질이 최고다.

## 간접 메시징 제어

> 간접 메시징은 중앙제어가 없기 때문에 오히려 더 유연하고  
> 확장성이 있으며 메시징구조를 개선하기 좋다.  
> 마이크로서비스가 개별적으로 받은 메시지에 대해서 어떻게 응답할지 책임을 지고, 또 다른 메시지도 응답으로 생성할 수 있다.
>
> 마이크로서비스가 죽으면 메시지의 메시지 처리 확인응답인  
> `ack` 을 받을 수 없고, 결과적으로 다른 마이크로서비스가  
> 처리하기 위해 메시지를 가져갈 것이다.
