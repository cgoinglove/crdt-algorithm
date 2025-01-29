# CRDT RGA Implementation & Demo Guide

English | [한국어](./docs/kr.md)

This project demonstrates an implementation of the **CRDT (Conflict-free Replicated Data Type)** called **RGA (Replicated-Growable Array)**, along with a simple demo page that showcases its functionality.

- **Site**: [Demo](https://crdt-algorithm-demo.vercel.app)
- **Post**: [Post](https://cgoinglove.github.io/post/crdt-rga-%EC%A7%81%EC%A0%91-%EA%B5%AC%ED%98%84%EA%B8%B0:-%EC%B6%A9%EB%8F%8C-%EC%97%86%EB%8A%94-%EB%8F%99%EC%8B%9C%EB%AC%B8%EC%84%9C-%ED%8E%B8%EC%A7%91,-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%A7%8C%EB%93%A0%EB%8B%A4)

## Demo (demo)

- **Goal**: Utilize the RGA package to build a simple document-editing feature
- **Key Components**:
  - `src/components/editor.tsx`: Text editor UI
  - `src/hooks/use-rga-document.ts`: Hook that imports and manages RGA logic in the local state
  - `lib/mock-socket.ts`, `event-bus.ts`: Simplified network simulation to send and receive operations across multiple tabs (windows)

### How to Run

- **Start the development server** by running the following command in the root directory:
  ```bash
  pnpm dev:demo
  ```
  - Then open the provided local address in your browser to view the demo.

## RGA (rga)

- **Implementation Details**:

  - Core CRDT RGA algorithm logic (`doc.ts`, `node.ts`, `operation-token.ts`, etc.)
  - Includes Lamport Clock, node linking, and `Tombstone` (deleted node) handling for concurrent editing

- **Tests**:
  - The `__test__` folder contains various test files to validate the logic
  - Examples: `doc.test.ts`, `node.test.ts`, `operation-token.test.ts`, `lamport-clock.test.ts`, etc.

### Testing

- To run the test scripts for the RGA package:
  ```bash
  pnpm test:rga
  ```
  - This command executes the unit tests for the RGA logic.
