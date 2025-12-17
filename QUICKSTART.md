# DevTunnel GUI - Quick Start Guide

## 빠른 시작 🚀

### 1. 개발 환경 실행

```bash
cd /home/bch/Project/main_project/forwarding/devtunnel-gui

# 개발 서버 실행
npm run tauri dev
```

### 2. 빌드 (선택사항)

```bash
# 프로덕션 빌드
npm run tauri build

# 결과물 위치:
# - AppImage: src-tauri/target/release/bundle/appimage/
# - Debian: src-tauri/target/release/bundle/deb/
```

## 주요 기능 미리보기

### ✅ 구현된 기능
1. **인증 시스템**: Microsoft/GitHub 로그인
2. **터널 관리**: 생성, 삭제, 수정, 조회
3. **포트 관리**: 포트 추가/삭제, 프로토콜 설정, 설명 추가
4. **태그 시스템**: 터널별 태그로 필터링 및 검색
5. **액세스 제어**: 프리셋 기반 빠른 설정
6. **만료 관리**: 1시간~30일 커스텀 설정

### 🏗️ 추후 구현 예정
1. **로그 뷰어**: 실시간 로그 모니터링
2. **트래픽 인스펙터**: HTTP 요청/응답 분석
3. **자동 갱신**: 만료 전 자동 갱신 옵션

## 프로젝트 구조

```
devtunnel-gui/
├── src/                         # React 프론트엔드
│   ├── components/
│   │   ├── Auth/               # 로그인 화면
│   │   ├── Dashboard/          # 메인 대시보드
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TunnelCard.tsx
│   │   │   ├── CreateTunnelModal.tsx
│   │   │   ├── TunnelDetailPanel.tsx
│   │   │   ├── PortManager.tsx  # 포트 관리
│   │   │   └── AccessControlManager.tsx  # 액세스 제어
│   │   └── Layout/
│   ├── lib/
│   │   └── api.ts              # Tauri API 래퍼
│   ├── stores/
│   │   └── tunnelStore.ts      # 상태 관리
│   └── types/
│       └── devtunnel.ts        # 타입 정의
│
└── src-tauri/                  # Rust 백엔드
    └── src/
        ├── commands.rs         # Tauri 명령어 핸들러
        ├── devtunnel.rs        # DevTunnel CLI 래퍼
        └── types.rs            # Rust 타입 정의
```

## 문제 해결

### DevTunnel 바이너리를 찾을 수 없음
```bash
# 환경변수 설정
export DEVTUNNEL_BIN="/home/bch/bin/devtunnel"

# 영구 설정 (추천)
echo 'export DEVTUNNEL_BIN="/home/bch/bin/devtunnel"' >> ~/.bashrc
source ~/.bashrc
```

### 빌드 실패
```bash
# 의존성 재설치
rm -rf node_modules
npm install

# Rust 의존성 업데이트
cd src-tauri
cargo clean
cargo build
```

### 인증 실패
```bash
# DevTunnel CLI로 직접 로그인 테스트
devtunnel user login -g  # GitHub
# 또는
devtunnel login  # Microsoft
```

## 다음 단계

1. 애플리케이션 실행 (`npm run tauri dev`)
2. Microsoft 또는 GitHub로 로그인
3. "Create Tunnel" 버튼 클릭
4. 터널 설정:
   - 터널 ID (선택)
   - 설명
   - 태그 추가
   - 만료 시간 설정
5. 터널 카드 클릭하여 상세 관리
6. Ports 탭에서 포트 추가
7. Access Control 탭에서 액세스 규칙 설정

## 기여 가이드

이 프로젝트는 현재 개발 중입니다. 기여를 환영합니다!

### 개발 워크플로우
1. Feature 브랜치 생성
2. 변경사항 커밋
3. Pull Request 생성
4. 리뷰 후 머지

---

**참고 자료:**
- [DevTunnel CLI 공식 문서](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/cli-commands)
- [Tauri 공식 문서](https://tauri.app/)
- [React 공식 문서](https://react.dev/)
