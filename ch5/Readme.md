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

구조는 아래와 비슷할것이다.

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

**_Work Queue_**

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
