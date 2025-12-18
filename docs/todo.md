# TODO

## 현재 이슈

**코드 리뷰를 통한 종합적 품질 개선**

4개 관점(보안, UI/UX, 아키텍처, 기능)에서 병렬 코드 리뷰를 수행한 결과, 다음과 같은 개선이 필요합니다:

- **P0 (Critical)**: 보안 취약점 2건, 접근성 미준수
- **P1 (High)**: 아키텍처 문제 5건
- **P2 (Medium)**: UI/UX 개선 3건

## Plan

### Phase 1: P0 - 보안 및 접근성 (Critical) [예상: 9-13시간]

#### 1. URL 검증 추가 (2-3시간)
**목표**: SSRF 및 Command Injection 방지

**작업 내역**:
- [ ] `src-tauri/src/commands.rs:573-589` - `open_url` 함수 수정
  - HTTP/HTTPS 스키마만 허용
  - `url` 크레이트로 파싱 검증
- [ ] `src-tauri/src/devtunnel.rs:881-922` - `ping_port` 함수 수정
  - URL 스키마 검증
  - curl 옵션 인젝션 방지 (`-` 문자 검증)
- [ ] 입력 검증 실패 시 명확한 에러 메시지 반환

#### 2. 접근성(A11y) 개선 (4-6시간)
**목표**: WCAG 2.1 AA 기준 준수

**작업 내역**:
- [ ] 클릭 가능한 `<div>` 요소에 키보드 접근성 추가
  - `role="button"`, `tabIndex={0}`, `onKeyDown` 핸들러
  - 대상: TunnelCard, 탭 버튼, 액션 버튼
- [ ] 모든 아이콘 버튼에 `aria-label` 추가
  - 새로고침, 삭제, 편집, 닫기 버튼
- [ ] 모달 접근성 개선
  - 포커스 트랩 구현 (`react-focus-lock` 또는 수동 구현)
  - ESC 키로 모달 닫기
  - `role="dialog"`, `aria-modal="true"`
- [ ] 폼 접근성 개선
  - `<label htmlFor>` 연결
  - 에러 메시지 `aria-describedby` 연결

#### 3. 에러 복구 메커니즘 (3-4시간)
**목표**: 네트워크 오류 시 사용자 경험 개선

**작업 내역**:
- [ ] `src/lib/api.ts` - 재시도 로직 추가
  - `invokeCommandWithRetry` 함수 구현
  - 최대 3회 재시도, 지수 백오프
- [ ] 컴포넌트 레벨 에러 처리
  - 재시도 버튼 UI 추가
  - 에러 상태 명확한 표시
- [ ] 토큰/세션 만료 감지
  - 401 에러 시 자동 로그아웃 또는 재인증 요청

---

### Phase 2: P1 - 아키텍처 개선 (High) [예상: 12-18시간]

#### 4. AppState Singleton 구현 (2-3시간)
**목표**: 프로세스 추적 기능 복원, 메모리 효율성

**작업 내역**:
- [ ] `src-tauri/src/lib.rs` - Tauri State 설정
  - `app.manage(AppState::new())`
- [ ] `src-tauri/src/commands.rs` - 모든 커맨드 수정
  - `state: tauri::State<AppState>` 파라미터 추가
  - 매번 `DevTunnelClient::new()` 호출 제거
- [ ] `active_processes` HashMap 기능 복원
  - 터널 호스팅 프로세스 추적

#### 5. API 에러 처리 통합 (1-2시간)
**목표**: 중복 코드 제거, 일관성 확보

**작업 내역**:
- [ ] `src/lib/api.ts` - `invokeCommand` 헬퍼 사용
  - 모든 API 메서드를 `invokeCommand` 기반으로 리팩토링
  - 250+ 줄의 중복 에러 처리 코드 제거
- [ ] `ApiError` 타입 일관성
  - `Error` 대신 `ApiError` 사용

#### 6. Store 분리 (3-4시간)
**목표**: 단일 책임 원칙, 유지보수성 향상

**작업 내역**:
- [ ] `src/stores/authStore.ts` 생성
  - `userInfo`, `isAuthenticated` 이동
  - 로그인/로그아웃 액션
- [ ] `src/stores/uiStore.ts` 생성
  - `activeTab`, `selectedTunnel` 이동
  - UI 상태 관리
- [ ] `src/stores/tunnelStore.ts` 리팩토링
  - 터널 데이터만 관리
  - 캐싱 로직 유지
- [ ] 컴포넌트에서 분리된 스토어 사용

#### 7. 사용자 설정 저장 (2-3시간)
**목표**: 사용자 맞춤 설정 지속성

**작업 내역**:
- [ ] 설정 타입 정의
  ```typescript
  interface UserSettings {
    defaultProtocol: Protocol;
    cacheTTL: number;
    theme: 'dark' | 'light';
    autoRefreshInterval: number;
  }
  ```
- [ ] `@tauri-apps/api/fs`로 설정 파일 저장/로드
  - `~/.config/devtunnel-gui/settings.json`
- [ ] Settings 페이지에서 설정 편집 UI

#### 8. 앱 업데이트 메커니즘 (4-6시간)
**목표**: 자동 업데이트 확인 및 설치

**작업 내역**:
- [ ] `src-tauri/tauri.conf.json` - updater 플러그인 설정
  - GitHub Releases 엔드포인트 설정
  - 공개키 생성 및 등록
- [ ] 업데이트 확인 UI
  - Settings 페이지에 "업데이트 확인" 버튼
  - 새 버전 알림 다이얼로그
- [ ] 자동 업데이트 옵션
  - 앱 시작 시 자동 확인 (선택적)

---

### Phase 3: P2 - UI 개선 (Medium) [예상: 9-13시간]

#### 9. 공통 UI 컴포넌트 라이브러리 (6-8시간)
**목표**: 코드 중복 제거, 디자인 일관성

**작업 내역**:
- [ ] `src/components/ui/` 디렉토리 생성
- [ ] `Button.tsx` - 재사용 가능한 버튼 컴포넌트
  - variant: primary, secondary, danger, ghost
  - size: sm, md, lg
  - 접근성 내장
- [ ] `Input.tsx` - 폼 입력 컴포넌트
  - 레이블, 에러 메시지 통합
  - 접근성 지원
- [ ] `Modal.tsx` - 모달 컴포넌트
  - 포커스 트랩, ESC 키 핸들링 내장
- [ ] `Spinner.tsx` - 로딩 스피너
  - 일관된 로딩 표시
- [ ] 디자인 토큰 통합
  - `src/lib/designTokens.ts` 생성
  - 색상, 간격, 타이포그래피 상수화
- [ ] 기존 컴포넌트를 공통 컴포넌트로 마이그레이션

#### 10. CSP 정책 개선 (1-2시간)
**목표**: XSS 방어 강화

**작업 내역**:
- [ ] `tauri.conf.json` - CSP 정책 수정
  - `'unsafe-inline'` 제거 검토
  - Nonce 기반 스타일링 또는 별도 CSS 파일
- [ ] 인라인 스타일 제거
  - Tailwind 클래스로 전환

#### 11. 로그 필터링/검색 (2-3시간)
**목표**: 로그 사용성 개선

**작업 내역**:
- [ ] `LogsViewer.tsx` - 필터링 UI 추가
  - 레벨 필터: All, Error, Warn, Info
  - 텍스트 검색 입력
- [ ] 필터링 로직 구현
- [ ] 로그 내보내기 버튼
  - 현재 로그를 파일로 저장

---

## 진행 상황

### Phase 1: P0 (Critical)
- [ ] URL 검증 추가
- [ ] 접근성 개선
- [ ] 에러 복구 메커니즘

### Phase 2: P1 (High)
- [ ] AppState Singleton
- [ ] API 에러 처리 통합
- [ ] Store 분리
- [ ] 사용자 설정 저장
- [ ] 앱 업데이트 메커니즘

### Phase 3: P2 (Medium)
- [ ] 공통 UI 컴포넌트
- [ ] CSP 정책 개선
- [ ] 로그 필터링/검색

---

## 메모

### 예상 작업 시간
- Phase 1 (P0): 9-13시간
- Phase 2 (P1): 12-18시간
- Phase 3 (P2): 9-13시간
- **총 예상 시간: 30-44시간**

### 브랜치 전략
- Branch: `refactor/comprehensive-improvements`
- 각 Phase별로 sub-commit 생성
- Phase 완료 시 통합 커밋

### 커밋 전략
- Phase 1 완료 시: `refactor(security): P0 보안 및 접근성 개선`
- Phase 2 완료 시: `refactor(architecture): P1 아키텍처 개선`
- Phase 3 완료 시: `refactor(ui): P2 UI 개선`

---

## 이전 완료 내역

### v0.5.0 (2025-12-17)
- ✅ 성능 최적화 (N+1 Query 해결)
  - 경량 목록 함수 추가 (list_tunnels_light)
  - 병렬 처리 함수 추가 (enrich_tunnel_details)
- ✅ 포괄적 캐싱 시스템 구현
  - 터널 상세 정보 캐싱
  - 탭 전환 즉시 응답

### v0.4.0 (2025-12-17)
- ✅ 코드 리뷰 및 품질 개선
  - Toast/Notification 시스템 도입
  - 성능 최적화 (캐싱)
  - 보안 수정 (하드코딩 경로 제거)

### v0.2.0 (2025-12-17)
- ✅ P0 보안 패치
  - Command Injection 취약점 수정
  - 프로세스 리소스 누수 해결
  - CSP 보안 정책 활성화

### v0.1.0 (2025-12-17)
- ✅ 초기 구현
  - 로그 시스템 개선 (18개 커맨드)
  - 기본 CRUD 기능
