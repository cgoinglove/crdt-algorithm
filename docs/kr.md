# CRDT RGA 구현 & 데모 안내

이 프로젝트는 **CRDT(Conflict-free Replicated Data Type)** 중 하나인 **RGA(Replicated-Growable Array)**를 직접 구현하고, 간단한 데모 페이지에서 동작을 시연하기 위한 예시입니다.

- **Site**: [Demo](https://crdt-algorithm-demo.vercel.app)
- **Post**: [Post](https://cgoinglove.github.io/post/crdt-rga-%EC%A7%81%EC%A0%91-%EA%B5%AC%ED%98%84%EA%B8%B0:-%EC%B6%A9%EB%8F%8C-%EC%97%86%EB%8A%94-%EB%8F%99%EC%8B%9C%EB%AC%B8%EC%84%9C-%ED%8E%B8%EC%A7%91,-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%A7%8C%EB%93%A0%EB%8B%A4)

## 데모(demo)

- **목표**: RGA 패키지를 활용해 간단한 문서 편집 기능 구현
- **주요 구성**:
  - `src/components/editor.tsx`: 텍스트 에디터 UI
  - `src/hooks/use-rga-document.ts`: RGA 로직을 가져와서 상태를 업데이트하는 Hook
  - `lib/mock-socket.ts`, `event-bus.ts`: 여러 창(탭) 간에 Operation을 주고받는 간이 네트워크 시뮬레이션

### 실행

- **개발 서버 구동**: 루트 디렉터리에서 아래 명령어 실행
  ```bash
  pnpm dev:demo
  ```
  - 브라우저에서 표시된 로컬 주소로 접속해 데모를 확인할 수 있습니다.

## RGA(rga)

- **구현 내용**:
  - CRDT RGA 알고리즘 핵심 로직 (`doc.ts`, `node.ts`, `operation-token.ts` 등)
  - Lamport Clock, Node 연결, 삭제 노드(`Tombstone`) 처리 등 동시 편집을 위한 주요 기능 포함
- **테스트**:
  - `__test__` 폴더 안의 각 테스트 파일을 통해 로직을 검증 가능
  - 예: `doc.test.ts`, `node.test.ts`,`operation-token.test.ts`,`lamport-clock.test.ts` 등

### 테스트

- RGA 패키지의 테스트 스크립트 실행
  ```bash
  pnpm test:rga
  ```
  - RGA 로직에 대한 단위 테스트를 수행합니다.
