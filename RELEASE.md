# GitHub Release 생성 가이드

## 1. Git Tag 생성

```bash
# 현재 위치 확인
git status

# Tag 생성 (annotated tag 권장)
git tag -a v0.1.0 -m "Release v0.1.0 - DevTunnel GUI 초기 릴리스"

# Tag 확인
git tag -l

# Tag 정보 확인
git show v0.1.0
```

## 2. GitHub에 Push

```bash
# 코드 푸시 (아직 안했다면)
git push -u origin main

# Tag 푸시
git push origin v0.1.0

# 또는 모든 태그 푸시
git push --tags
```

## 3. GitHub Release 생성

### 방법 1: GitHub Web UI (권장)

1. **GitHub 저장소 방문**
   - https://github.com/Bae-ChangHyun/devtunnel_gui

2. **Releases 탭 클릭**
   - 우측 사이드바의 "Releases" 클릭
   - 또는 `/releases` URL로 직접 이동

3. **"Draft a new release" 클릭**

4. **Release 정보 입력**
   - **Choose a tag**: `v0.1.0` 선택 (방금 푸시한 태그)
   - **Release title**: `DevTunnel GUI v0.1.0 - 초기 릴리스`
   - **Description**: (아래 템플릿 사용)

```markdown
# DevTunnel GUI v0.1.0 🎉

Microsoft DevTunnel을 위한 Linux GUI 관리 도구 첫 번째 릴리스입니다.

## ✨ 주요 기능

### 인증 & 관리
- 🔐 Microsoft/GitHub OAuth 로그인
- 🚇 터널 생성, 조회, 수정, 삭제, 호스팅
- 🔌 포트 관리 (HTTP/HTTPS/Auto)
- 🛡️ 액세스 컨트롤 (익명/조직/토큰)
- 🏷️ 태그 시스템

### 모니터링
- 📊 실시간 대시보드
- 📝 전체 작업 로깅 (18개 커맨드)
- ⚡ 5-10배 성능 최적화

## 📦 다운로드

### AppImage (권장)
단일 실행 파일, 모든 Linux 배포판에서 실행 가능
```bash
chmod +x DevTunnel-GUI_0.1.0_amd64.AppImage
./DevTunnel-GUI_0.1.0_amd64.AppImage
```

### Debian Package
Ubuntu, Debian, Linux Mint 등
```bash
sudo dpkg -i devtunnel-gui_0.1.0_amd64.deb
```

### RPM Package
Fedora, RHEL, CentOS 등
```bash
sudo rpm -i devtunnel-gui-0.1.0-1.x86_64.rpm
```

## 📋 필수 요구사항

- **DevTunnel CLI 설치 필요**
  ```bash
  curl -sL https://aka.ms/DevTunnelCliInstall | bash
  ```
- 설치 가이드: [README.md](https://github.com/Bae-ChangHyun/devtunnel_gui#-prerequisites)

## 📖 사용 방법

1. 애플리케이션 실행
2. Microsoft/GitHub 계정으로 로그인
3. Dashboard에서 터널 생성 및 관리

자세한 사용법: [README.md](https://github.com/Bae-ChangHyun/devtunnel_gui#-quick-start)

## 🐛 알려진 이슈

- 없음 (첫 릴리스)

## 💻 기술 스택

- Frontend: React 19, TypeScript, Tailwind CSS 4
- Backend: Rust, Tauri 2.0, Tokio
- Build: Vite 7

## 📝 변경사항

전체 변경사항은 [커밋 히스토리](https://github.com/Bae-ChangHyun/devtunnel_gui/commits/v0.1.0)를 참조하세요.

---

**Full Changelog**: https://github.com/Bae-ChangHyun/devtunnel_gui/commits/v0.1.0
```

5. **파일 첨부**
   - "Attach binaries by dropping them here or selecting them" 영역 클릭
   - 다음 파일들을 드래그 앤 드롭:
     ```
     src-tauri/target/release/bundle/appimage/DevTunnel GUI_0.1.0_amd64.AppImage
     src-tauri/target/release/bundle/deb/DevTunnel GUI_0.1.0_amd64.deb
     src-tauri/target/release/bundle/rpm/DevTunnel GUI-0.1.0-1.x86_64.rpm
     ```

6. **릴리스 타입 선택**
   - ✅ "Set as the latest release" 체크
   - 첫 릴리스이므로 pre-release는 체크하지 않음

7. **"Publish release" 클릭**

### 방법 2: GitHub CLI (선택사항)

```bash
# GitHub CLI 설치 (Ubuntu/Debian)
sudo apt install gh

# 로그인
gh auth login

# Release 생성
gh release create v0.1.0 \
  src-tauri/target/release/bundle/appimage/DevTunnel\ GUI_0.1.0_amd64.AppImage \
  src-tauri/target/release/bundle/deb/DevTunnel\ GUI_0.1.0_amd64.deb \
  src-tauri/target/release/bundle/rpm/DevTunnel\ GUI-0.1.0-1.x86_64.rpm \
  --title "DevTunnel GUI v0.1.0 - 초기 릴리스" \
  --notes-file RELEASE_NOTES.md

# Release 확인
gh release view v0.1.0
```

## 4. Release 확인

1. GitHub 저장소에서 Releases 탭 확인
2. 다운로드 링크가 제대로 작동하는지 테스트
3. README의 배지가 올바른 버전을 표시하는지 확인

## 5. 다음 릴리스 준비

```bash
# 새 기능 개발...

# 변경사항 커밋
git add .
git commit -m "feat: 새로운 기능"

# 다음 버전 태그
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0

# GitHub에서 Release 생성 반복
```

## 파일명 변경 (선택사항)

빌드 파일명에 공백이 있어 불편하다면:

```bash
cd src-tauri/target/release/bundle/appimage
mv "DevTunnel GUI_0.1.0_amd64.AppImage" "devtunnel-gui_0.1.0_amd64.AppImage"

cd ../deb
mv "DevTunnel GUI_0.1.0_amd64.deb" "devtunnel-gui_0.1.0_amd64.deb"

cd ../rpm
mv "DevTunnel GUI-0.1.0-1.x86_64.rpm" "devtunnel-gui-0.1.0-1.x86_64.rpm"
```

## Release 삭제 (실수한 경우)

```bash
# GitHub Web UI
# Releases → 해당 Release → Delete

# GitHub CLI
gh release delete v0.1.0

# Tag도 삭제 (필요시)
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0
```

## 체크리스트

- [ ] 모든 변경사항 커밋 완료
- [ ] README.md 최신 상태
- [ ] 빌드 성공 (`npm run tauri build`)
- [ ] 빌드 파일 존재 확인 (AppImage, .deb, .rpm)
- [ ] Git tag 생성 및 푸시
- [ ] GitHub Release 생성
- [ ] 파일 첨부 완료
- [ ] Release Notes 작성
- [ ] "Publish release" 클릭
- [ ] 다운로드 링크 테스트
