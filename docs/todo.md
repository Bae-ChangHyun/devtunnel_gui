# TODO

## 현재 이슈

DevTunnel GUI가 리눅스 환경에서 다음과 같은 문제를 겪고 있음:
1. **성능 문제**: 대부분의 기능은 작동하지만 너무 느림
2. **로그 문제**: 로그가 실제로 반영되지 않음

## 문제 원인 분석

### 1. 성능 병목 (N+1 Query Problem)

**위치**: `src-tauri/src/devtunnel.rs:168-173`

```rust
// For each tunnel, fetch detailed info to get actual ports
for tunnel in &mut tunnels {
    if let Ok(show_output) = self.show_tunnel(Some(tunnel.tunnel_id.clone())) {
        let ports = parser::parse_tunnel_show(&show_output);
        tunnel.ports = ports;
    }
}
```

**문제점**:
- `list_tunnels()` 호출 시 각 터널마다 개별 `show_tunnel()` 실행
- 터널 5개 → 총 6번의 CLI 프로세스 spawn (1번 list + 5번 show)
- 각 프로세스 생성 오버헤드로 인해 기하급수적으로 느려짐
- 예: 10개 터널 = 11번, 20개 터널 = 21번의 CLI 호출

**성능 영향**:
- 터널 목록 로드 시간이 터널 개수에 비례하여 증가
- 대시보드 접근 시 매번 느린 로딩 발생
- UI 반응성 저하

### 2. 로그 미반영 문제

**위치**: `src-tauri/src/commands.rs`

**로그가 있는 커맨드** (7개):
- ✅ create_tunnel (73, 83, 87)
- ✅ host_tunnel (156, 164, 168)
- ✅ stop_tunnel (176, 184, 188)
- ✅ restart_tunnel (197, 205, 209)
- ✅ create_port (243, 251, 255)
- ✅ update_port (287, 294, 298)
- ✅ delete_port (306, 314, 318)

**로그가 없는 주요 커맨드** (15개 이상):
- ❌ login_devtunnel (32) - 인증 관련
- ❌ logout_devtunnel (47) - 인증 관련
- ❌ get_user_info (59) - 인증 관련
- ❌ **list_tunnels (94)** ← 가장 자주 호출됨!
- ❌ show_tunnel (106)
- ❌ update_tunnel (118)
- ❌ delete_tunnel (130)
- ❌ get_clusters (142)
- ❌ show_port (228)
- ❌ ping_port (262)
- ❌ 기타 access control 관련 커맨드들...

**문제점**:
- 25개 커맨드 중 약 7개만 로그를 emit
- 가장 빈번한 작업인 `list_tunnels`가 로그를 발생시키지 않음
- 사용자가 실제로 어떤 작업이 진행 중인지 알 수 없음

## 개선 방안

### Plan 1: 성능 최적화 (N+1 Query 해결)

**옵션 A: 병렬 처리**
```rust
// tokio를 사용한 병렬 show_tunnel 호출
use tokio::task::JoinSet;

let mut set = JoinSet::new();
for tunnel_id in tunnel_ids {
    let client = self.clone();
    set.spawn(async move {
        client.show_tunnel(Some(tunnel_id))
    });
}

while let Some(result) = set.join_next().await {
    // process result
}
```
- 장점: 구현이 간단, 즉각적인 성능 개선 (병렬 실행)
- 단점: 여전히 N번의 CLI 호출, CLI 병렬 실행 제한 가능성

**옵션 B: 캐싱 레이어 추가**
```rust
struct CachedTunnelData {
    data: TunnelListItem,
    timestamp: Instant,
}

struct DevTunnelClient {
    cache: Arc<Mutex<HashMap<String, CachedTunnelData>>>,
    cache_ttl: Duration, // 예: 30초
}
```
- 장점: 중복 호출 제거, 전반적인 성능 개선
- 단점: 캐시 무효화 로직 필요, 복잡도 증가

**옵션 C: 경량 목록 + 필요시 상세 조회**
```rust
// list_tunnels()는 기본 정보만 반환
// 사용자가 터널 선택 시에만 show_tunnel() 호출
pub fn list_tunnels_light(&self) -> Result<Vec<TunnelBasicInfo>> {
    // ports 정보 없이 빠르게 반환
}
```
- 장점: 초기 로딩 매우 빠름, 필요한 데이터만 로드
- 단점: Frontend 로직 수정 필요, 지연 로딩

**권장**: 옵션 A (병렬 처리) + 옵션 C (경량 목록)의 조합
- 1단계: 경량 목록으로 즉시 표시
- 2단계: 백그라운드에서 병렬로 상세 정보 로드

### Plan 2: 로그 시스템 개선

**방법 A: 모든 커맨드에 로그 추가**
```rust
#[tauri::command]
pub fn list_tunnels(app: tauri::AppHandle, req: Option<ListTunnelsRequest>) -> CommandResponse<Vec<TunnelListItem>> {
    emit_log(&app, "Loading tunnel list...");

    let binary_path = std::env::var("DEVTUNNEL_BIN")
        .unwrap_or_else(|_| "/home/bch/bin/devtunnel".to_string());
    let client = DevTunnelClient::new(binary_path);

    match client.list_tunnels(req) {
        Ok(tunnels) => {
            emit_log(&app, &format!("Loaded {} tunnels", tunnels.len()));
            CommandResponse::success(tunnels)
        },
        Err(e) => {
            emit_log(&app, &format!("ERROR: Failed to list tunnels: {}", e));
            CommandResponse::error(e.to_string())
        }
    }
}
```

**적용 대상**:
1. 인증 커맨드 (login, logout, get_user_info)
2. 터널 관리 (list, show, update, delete)
3. 클러스터 (get_clusters)
4. 포트 조회 (show_port, ping_port)
5. 액세스 컨트롤 관련 커맨드

**방법 B: 로그 레벨 구분**
```rust
enum LogLevel {
    DEBUG,   // 상세한 디버그 정보
    INFO,    // 일반 정보
    WARN,    // 경고
    ERROR,   // 에러
}

fn emit_log_with_level(app: &tauri::AppHandle, level: LogLevel, message: &str) {
    let log_message = format!("[{}] {}", level, message);
    let _ = app.emit("devtunnel-log", log_message);
}
```

## 진행 상황

- [x] 프로젝트 구조 파악
- [x] 성능 병목 지점 분석
- [x] 로그 미반영 문제 원인 파악
- [x] 개선 방안 구현
  - [x] 성능 최적화 (N+1 Query 해결)
    - [x] 경량 목록 함수 추가 (list_tunnels_light)
    - [x] 병렬 처리 함수 추가 (enrich_tunnel_details)
  - [x] 로그 시스템 개선
    - [x] 모든 커맨드에 로그 추가 (18개 커맨드)
- [x] 빌드 성공
  - [x] Rust 컴파일 성공
  - [x] Frontend 빌드 성공
  - [x] Release 패키지 생성 완료

## 완료 일자
2025-12-17

## 메모

### 기술 스택
- Frontend: React 19 + TypeScript + Tailwind CSS + Zustand
- Backend: Rust + Tauri 2.0
- CLI Wrapper: Microsoft DevTunnel CLI

### 주요 파일
- `src-tauri/src/devtunnel.rs:168-173` - N+1 Query 발생 지점
- `src-tauri/src/commands.rs` - Tauri 커맨드 핸들러 (로그 개선 필요)
- `src/components/Logs/LogsViewer.tsx` - 로그 뷰어 (정상 작동)
