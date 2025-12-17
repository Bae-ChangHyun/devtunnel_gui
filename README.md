# DevTunnel GUI

> Microsoft DevTunnel의 비공식 GUI 관리 도구

Linux 환경에서 Microsoft DevTunnel을 편리하게 관리할 수 있는 데스크톱 애플리케이션입니다.

## ⚠️ 중요 안내

**이 프로젝트는 Microsoft의 공식 제품이 아닙니다.**

- Microsoft DevTunnel CLI를 래핑한 비공식 GUI 클라이언트입니다
- Microsoft DevTunnel CLI가 사전에 설치되어 있어야 합니다
- Microsoft 상표 및 DevTunnel은 Microsoft Corporation의 자산입니다

## 주요 기능

### 🔐 인증 관리
- Microsoft 계정 또는 GitHub 계정으로 로그인
- 디바이스 코드 인증 지원
- 인증 상태 실시간 확인

### 🚇 터널 관리
- **터널 생성**: 커스텀 ID, 설명, 태그 지정
- **터널 목록 조회**: 모든 터널을 한눈에 확인
- **터널 상세 정보**: 포트, 도메인, 만료 시간 등
- **터널 삭제**: 개별 또는 전체 삭제
- **터널 호스팅**: 로컬 포트를 인터넷에 노출
- **터널 중지/재시작**: 실시간 제어

### 🔌 포트 관리
- **포트 추가**: HTTP/HTTPS/Auto 프로토콜 선택
- **포트 설명**: 각 포트의 용도 문서화
- **포트 URL**: 자동 생성된 공개 URL 확인
- **포트 삭제**: 불필요한 포트 제거
- **포트 핑 테스트**: 연결 상태 실시간 확인

### 🛡️ 액세스 컨트롤
- **익명 액세스**: 누구나 접근 가능하도록 설정
- **조직 기반 액세스**: 특정 조직 구성원만 허용
- **토큰 기반 액세스**: 보안 토큰으로 접근 제한
- **포트별 액세스**: 각 포트마다 다른 권한 설정
- **프리셋**: 일반적인 시나리오를 위한 템플릿 제공
  - Public Demo (24시간 익명 액세스)
  - Team Access (조직 전용)
  - Client Preview (토큰 기반)

### 🏷️ 태그 시스템
- 터널을 태그로 분류 (예: production, staging, development)
- 태그별 필터링으로 빠른 검색
- 여러 태그 동시 지정 가능

### 📊 실시간 모니터링
- 터널 상태 시각화 (Active/Stopped/Expired)
- 만료 시간 자동 추적
- 대시보드에서 전체 현황 확인

### 📝 로그 뷰어
- 모든 작업의 실시간 로그 표시
- 로그 레벨 구분 (INFO, WARN, ERROR, DEBUG)
- 타임스탬프와 함께 상세 기록
- 자동 스크롤 및 로그 클리어 기능

### ⚡ 성능 최적화 (v0.1.0 신규)
- **경량 목록 조회**: 포트 정보 없이 빠른 터널 목록 로드
- **병렬 처리**: 여러 터널의 상세 정보를 동시에 조회
- **5-10배 성능 향상**: 10개 터널 기준 10초 → 1-2초로 단축

## 시스템 요구사항

### 필수 사항
- **운영체제**: Linux (Ubuntu 20.04+, Debian 11+ 권장)
- **DevTunnel CLI**: Microsoft DevTunnel CLI가 설치되어 있어야 함
  - 기본 경로: `/home/bch/bin/devtunnel`
  - 또는 `DEVTUNNEL_BIN` 환경 변수로 경로 지정

### 개발 의존성 (소스 빌드 시)
```bash
# Tauri 의존성 (Ubuntu/Debian)
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# Rust 설치
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js 18+ 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## 설치 및 실행

### AppImage로 실행 (권장)

1. **AppImage 다운로드**
   ```bash
   # Release 페이지에서 다운로드하거나
   # 직접 빌드한 경우:
   ls src-tauri/target/release/bundle/appimage/
   ```

2. **실행 권한 부여**
   ```bash
   chmod +x "DevTunnel GUI_0.1.0_amd64.AppImage"
   ```

3. **실행**
   ```bash
   ./"DevTunnel GUI_0.1.0_amd64.AppImage"
   ```

### Debian 패키지 설치

```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/DevTunnel\ GUI_0.1.0_amd64.deb
```

### 소스에서 빌드

```bash
# 저장소 클론
git clone <repository-url>
cd devtunnel-gui

# 의존성 설치
npm install

# 개발 모드 실행
npm run tauri dev

# 프로덕션 빌드
npm run tauri build
```

## 사용 방법

### 1. 최초 로그인

1. 애플리케이션 실행
2. 로그인 화면에서 **Microsoft** 또는 **GitHub** 선택
3. 브라우저에서 인증 완료
4. 앱으로 돌아오면 자동으로 로그인 완료

### 2. 터널 생성

1. **대시보드**에서 **"Create Tunnel"** 버튼 클릭
2. 정보 입력:
   - **Tunnel ID** (선택): 커스텀 식별자 (비워두면 자동 생성)
   - **Description**: 터널 용도 설명
   - **Tags**: 분류용 태그 (예: `web`, `api`, `production`)
   - **Allow Anonymous**: 익명 접근 허용 여부
   - **Expiration**: 만료 시간 (1h ~ 30d)
3. **"Create Tunnel"** 클릭

### 3. 포트 추가

1. 터널 카드 클릭
2. **"Ports"** 탭으로 이동
3. **"Add Port"** 클릭
4. 정보 입력:
   - **Port Number**: 로컬 포트 번호 (1-65535)
   - **Protocol**: auto/http/https 선택
   - **Description**: 포트 용도 설명
5. **"Add Port"** 클릭
6. 생성된 공개 URL 확인 및 복사

### 4. 터널 호스팅

1. 터널 상세 페이지에서 **"Host Tunnel"** 클릭
2. 포트 번호 입력 (예: `3000,8080`)
3. 만료 시간 설정 (선택)
4. **"Start Hosting"** 클릭
5. **Logs** 탭에서 호스팅 상태 확인

### 5. 액세스 컨트롤 설정

1. 터널 선택 → **"Access Control"** 탭
2. 프리셋 선택 또는 커스텀 설정:
   - **Public Demo**: 24시간 동안 누구나 접근 가능
   - **Team Access**: 조직 구성원만 접근 가능
   - **Client Preview**: 토큰으로 접근 제한
3. 설정 적용

### 6. 로그 확인

- 상단 메뉴에서 **"Logs"** 탭 클릭
- 모든 작업의 실시간 로그 확인
- 에러 발생 시 빨간색으로 표시
- **"Clear Logs"** 버튼으로 로그 초기화

## 환경 변수

```bash
# DevTunnel CLI 경로 설정 (기본값이 아닌 경우)
export DEVTUNNEL_BIN="/custom/path/to/devtunnel"

# 영구 설정 (~/.bashrc 또는 ~/.zshrc에 추가)
echo 'export DEVTUNNEL_BIN="/custom/path/to/devtunnel"' >> ~/.bashrc
```

## 문제 해결

### DevTunnel CLI를 찾을 수 없음

```bash
# DevTunnel 설치 확인
which devtunnel

# 없다면 Microsoft DevTunnel CLI 설치 필요
# https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started

# 설치 후 경로 설정
export DEVTUNNEL_BIN="/path/to/devtunnel"
```

### 로그인 실패

```bash
# 수동으로 CLI 로그인 테스트
devtunnel user login -g

# 인증 상태 확인
devtunnel user show

# 로그아웃 후 재시도
devtunnel user logout
```

### 터널 목록이 느리게 로드됨

- **v0.1.0부터 성능이 크게 개선되었습니다**
- 여전히 느리다면:
  1. DevTunnel CLI 최신 버전 확인
  2. 네트워크 연결 상태 확인
  3. Logs 탭에서 에러 확인

### 빌드 오류

```bash
# 의존성 재설치
rm -rf node_modules src-tauri/target
npm install

# Rust 툴체인 업데이트
rustup update

# 재빌드
npm run tauri build
```

## 기술 스택

### Frontend
- **React 19**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성
- **Tailwind CSS 4**: 모던 스타일링
- **Zustand**: 경량 상태 관리
- **Vite**: 빠른 빌드 도구

### Backend
- **Rust**: 안전하고 빠른 네이티브 성능
- **Tauri 2.0**: 경량 데스크톱 프레임워크
- **Tokio**: 비동기 런타임 (병렬 처리)
- **Serde**: JSON 직렬화

### 아키텍처
- CLI Wrapper 패턴: DevTunnel CLI 명령어를 Rust에서 호출
- IPC 통신: Tauri invoke 시스템으로 Frontend ↔ Backend 통신
- 이벤트 기반 로깅: Tauri 이벤트로 실시간 로그 전송

## 성능 특징 (v0.1.0)

### 병렬 처리
- tokio JoinSet을 사용한 동시 실행
- 여러 터널의 상세 정보를 병렬로 조회
- CPU 코어 수만큼 병렬성 자동 조정

### 경량 목록
- 초기 로드 시 포트 정보 제외
- 1회의 CLI 호출로 터널 목록 획득
- 사용자 클릭 시 상세 정보 지연 로딩

### 성능 비교 (10개 터널 기준)
- **기존 (v0.0.x)**: ~10초 (순차 실행)
- **개선 (v0.1.0)**: ~1-2초 (병렬 실행)
- **개선율**: 약 5-10배

## 라이센스 및 면책

### 프로젝트 라이센스
이 프로젝트의 소스 코드는 MIT 라이센스 하에 배포됩니다.

### Microsoft DevTunnel 관련
- Microsoft DevTunnel CLI는 Microsoft Corporation의 제품입니다
- 이 GUI 도구는 DevTunnel CLI를 래핑한 비공식 클라이언트입니다
- Microsoft의 승인을 받지 않았으며, Microsoft가 보증하지 않습니다
- DevTunnel 사용 시 Microsoft의 이용 약관이 적용됩니다

### 면책 조항
이 소프트웨어는 "있는 그대로" 제공되며, 어떠한 명시적 또는 묵시적 보증도 하지 않습니다.
사용으로 인한 모든 책임은 사용자에게 있습니다.

## 기여

버그 리포트, 기능 제안, Pull Request를 환영합니다!

## 문의

문제가 발생하거나 질문이 있으시면 GitHub Issues를 이용해주세요.

---

**개발자를 위한, 개발자가 만든 DevTunnel GUI** 💻
