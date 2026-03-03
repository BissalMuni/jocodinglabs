# Docker에서 Claude Code --dangerously 실행 가이드

> Windows Docker Desktop만으로 안전한 샌드박스 환경에서 Claude Code를 권한 제한 없이 실행하는 방법

---

## 전제 조건

- Windows 11 + Docker Desktop 설치
- Ubuntu/WSL 별도 설치 불필요 (Docker Desktop이 내부적으로 WSL2 자동 사용)
- Claude Max 구독

---

## 1. 왜 Docker에서 실행하나?

```
--dangerously-skip-permissions = 모든 도구를 승인 없이 실행

위험 요소:
- rm -rf / 같은 파괴적 명령 실행 가능
- 시스템 파일 수정 가능
- git push --force 등 되돌리기 어려운 작업 가능

Docker 컨테이너 = 격리된 일회용 환경
- 컨테이너 안에서 뭘 하든 호스트(Windows)는 안전
- 망하면 컨테이너 삭제하고 다시 시작
```

---

## 2. 설정 파일

### Dockerfile.claude

```dockerfile
FROM node:20

RUN npm install -g @anthropic-ai/claude-code pnpm typescript

RUN useradd -m -s /bin/bash claude && \
    mkdir -p /workspace && chown claude:claude /workspace

USER claude
RUN git config --global user.name "Docker Claude" && \
    git config --global user.email "claude@docker.local"

WORKDIR /workspace

CMD ["bash"]
```

### docker-compose.claude.yml

```yaml
services:
  claude:
    build:
      context: .
      dockerfile: Dockerfile.claude
    volumes:
      - .:/workspace
      - claude_modules:/workspace/node_modules
    env_file:
      - .env
    stdin_open: true
    tty: true

volumes:
  claude_modules:
```

---

## 3. 최초 실행 (이미지 빌드 + 컨테이너 시작)

```bash
cd D:/Coding/jocodinglabs

# 이미지 빌드 (최초 1회)
docker compose -f docker-compose.claude.yml build

# 컨테이너 시작 + bash 진입
docker compose -f docker-compose.claude.yml run claude bash

# 컨테이너 안에서 Claude 로그인 + 실행
claude login
claude --dangerously-skip-permissions
```

---

## 4. 컨테이너 재접속

### `docker run` vs `docker exec` 차이

| | `docker run` | `docker exec` |
|---|---|---|
| 동작 | **새** 컨테이너 생성 | **기존** 컨테이너에 접속 |
| 데이터 | 처음부터 시작 | 이전 작업 상태 유지 |
| 언제 쓰나 | 컨테이너가 없을 때 | 컨테이너가 실행 중일 때 |

### 기존 컨테이너에 다시 들어가기

```bash
# 1. 실행 중인 컨테이너 확인
docker ps

# 2-a. 컨테이너가 실행 중이면 → exec
docker exec -it <컨테이너ID 또는 이름> bash

# 2-b. 컨테이너가 중지 상태면 → 먼저 시작 후 exec
docker start <컨테이너ID>
docker exec -it <컨테이너ID> bash
```

### 새 컨테이너로 시작하기

```bash
# --rm: 종료 시 자동 삭제 (일회성)
docker compose -f docker-compose.claude.yml run --rm claude bash

# --rm 없이: 종료 후에도 컨테이너 보존 (재접속 가능)
docker compose -f docker-compose.claude.yml run claude bash
```

---

## 5. 일상 워크플로우

```bash
# 1. 컨테이너 확인
docker ps -a

# 2. 기존 컨테이너가 있으면 재접속
docker exec -it <컨테이너ID> bash

# 3. 없으면 새로 시작
docker compose -f docker-compose.claude.yml run claude bash

# 4. 컨테이너 안에서 Claude 실행
claude --dangerously-skip-permissions
```

---

## 6. 트러블슈팅

### Claude Code 버전 업데이트

```bash
docker compose -f docker-compose.claude.yml build --no-cache
```

### 컨테이너가 느림

Docker Desktop 설정에서 리소스 조정:

```
Settings → Resources → Advanced
  - CPUs: 4+
  - Memory: 8GB+
```

### git push가 안 됨

컨테이너에서 코드 수정 → 호스트(Windows) 터미널에서 git push (권장)

---

## 7. 보안 체크리스트

- [x] `.env` 파일을 `.gitignore`에 추가
- [x] API Key를 Dockerfile에 하드코딩하지 않기
- [x] 민감한 폴더 (`.ssh`, 브라우저 프로필 등)를 마운트하지 않기
- [x] 프로덕션 코드는 volume 마운트로 양방향 동기화
