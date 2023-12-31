# Microservice-bootstarp

> 이 책은 `Bootstrapping Microservices with Docker, Kubernetes, and Terraform` 을 공부하기 위해 작성한다.
>
> 처음은 토이프로젝트를 지속적으로 만들고 싶고, `backend` 에 대한  
> 공부를 추가적으로 할 생각으로 접근했다.

`Docker` 를 알게되고, `Kubernetice` 의 존재를 알게되고, `Message Bus`를
알게되고, `CI/CD` 를 알게되고, 작은 단위로 서비스를 만들어 하나의 앱을 만드는데 매력적이더라...

어찌 어찌 하다보니, `Microservice` 에 대해서 관심이 생겼으며,
이를 구현하기 위해서는 정말 많은 툴들과 개념적이해가 필요하다는
생각을 하게 되었다.

지속적인 삽질끝에, `Nodejs` 와 `express` 를 사용하여, `Microservice` 를
구현하며, 전체적인 맥락을 잡아주는 이 책을 알게되어 빠르게 공부할 예정이다.

> 아무래도 동영상 강좌보다 책이 더 기억에 잘 남는것 같은 느낌이 든다.
> 사람은 삽질을 해야 머릿속에 남나보다.

이책 서문에 다음과 같은 이야기기 있다.

> 이 책을 통해 마이크로서비스 앱을 만들기 위한 학습곡선의 높은 한계를 극복하고자 한다. 혼자 힘으로 극복하기는 어렵게 느껴질 이 개발 과정을 함께 풀어나갈 것이다.

공감한다...
끝이 안보이더라...

또한 흥미로운게, `MicroService` 를 배우며, `TDD` 와 함께  
`Terraform`, `CI/CD` 까지 모든 흐름을 보여준다.

여기 `Readme` 문서에는 대략적인 중요한 포인트만 정리해둔다.

## 마이크로 서비스란?

> 개별적으로 배포 일정을 갖고 업데이트 운영이 가능한 작고 독립적인 소프트웨어 프로세스다.

## 모놀리스의 문제점

> 모놀리스는 전체적인 앱이 단일 프로세스로 동작하는 경우를 말한다.

모놀리스의 작업은 마이크로 서비스보다 훨씬 쉽다.
하지만 앱은 항상 작은규모일수 없다.

앱을 언제든 확장되며, 점점 비대해진다.
그때, 모놀리스는 많은 문제들이 발생한다.

- 스파게티 코드가 된다.
- 배포시 앱의 동작을 손상시킬 위험을 감수한다.
- 장애 발생 가능성이 높다

하지만 작은 어플리케이션 이나, 더이상 수정이 필요하지 않은 앱일 경우
유용하게 작성 가능하다.

## 마이크로 서비스의 장점

- 분산 시스템 구축 비용이 낮아짐
- 구성요소를 작게 만들어 테스트 및 유지보수에 용이
- 개발 과정을 자동화 시켜 배포 위험을 최소화
- 확장성이 좋으며, 내결함성 보장
- 각 서비스는 구분되어 있어 프로그래밍 언어선택에 생기는 제약이 없음

## 마이크로 서비스의 단점

- 모놀리스 보다 훨씬 어렵다.(핵공감)
- 복잡하다.

## 마이크로 서비스의 원칙

- 단일 책임 원칙
- 느슨한 연결
- 강한 응집력(cohesion)
