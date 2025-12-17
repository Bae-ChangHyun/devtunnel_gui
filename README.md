
# DevTunnel GUI (Unofficial)

<div align="center">

![Logo](https://via.placeholder.com/150?text=DevTunnel+GUI) **Linux 환경을 위한 Microsoft DevTunnel 비공식 GUI 클라이언트**
<br/>
CLI의 복잡함 없이, 무료로 무제한 터널링을 경험하세요.

[![GitHub Release](https://img.shields.io/github/v/release/Bae-ChangHyun/devtunnel_gui?style=flat-square&color=blue)](https://github.com/Bae-ChangHyun/devtunnel_gui/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Linux-orange?style=flat-square&logo=linux)](https://github.com/Bae-ChangHyun/devtunnel_gui)
[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20Code-D97757?style=flat-square&logo=anthropic)](https://claude.ai)

[다운로드 (AppImage / Deb)](https://github.com/Bae-ChangHyun/devtunnel_gui/releases) • [버그 신고](https://github.com/Bae-ChangHyun/devtunnel_gui/issues)

</div>

---

> **⚠️ Legal Notice**<br/>
> This is **NOT** an official Microsoft product. "DevTunnel" and "Microsoft" are trademarks of Microsoft Corporation. This project is an independent GUI wrapper requiring Microsoft DevTunnel CLI. [Read Disclaimer](#-license--disclaimer)

---

## 📖 Introduction

**DevTunnel GUI**는 Microsoft의 강력한 DevTunnel을 Linux 데스크톱에서 쉽고 편리하게 사용할 수 있도록 돕는 도구입니다.

로컬 개발 환경(Web App, API Server 등)을 외부에 공유해야 할 때, 기존 솔루션들의 **비용 문제**나 **동시 터널 제한** 때문에 고민하셨나요? Microsoft DevTunnel은 훌륭한 무료 대안이지만, **CLI 명령어**를 일일이 입력해야 하는 불편함이 있었습니다.

이 프로젝트는 이러한 불편함을 해소하고, **클릭 몇 번으로 터널을 생성, 관리, 모니터링**할 수 있는 직관적인 GUI를 제공합니다.

### 🎨 Developed via Vibe Coding
이 프로젝트는 **[Claude Code](https://claude.ai/claude-code)**와의 협업을 통해 **Vibe Coding** 방식으로 개발되었습니다. 기획부터 구현까지 AI와 함께하며 개발 생산성의 새로운 가능성을 탐구한 결과물입니다.

---

## 📸 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x500?text=Dashboard+Screenshot" alt="Dashboard" width="800"/>
  <br/>
  <em>직관적인 대시보드에서 모든 터널을 한눈에 관리하세요.</em>
</div>

---

## 📊 Why DevTunnel GUI?

포트포워딩 도구는 많지만, **무료**이면서 **Linux GUI**를 지원하는 도구는 찾기 힘듭니다.

| 도구 | GUI 지원 | 가격 | 동시 터널 | 플랫폼 | 비고 |
|:---:|:---:|:---:|:---:|:---:|:---|
| **DevTunnel GUI** | ✅ **Linux** | **무료** | **무제한** | Linux | **본 프로젝트** (CLI 래퍼) |
| **DevTunnel CLI** | ❌ CLI Only | 무료 | 무제한 | Cross | 명령어 암기 필요 |
| **ngrok** | Web UI | [$8-20/월](https://ngrok.com/pricing) | 제한 있음 | Cross | 무료 플랜 제한 많음 |
| **LocalXpose** | ✅ GUI | [$8/월](https://localxpose.io/pricing) | 제한 있음 | Cross | 데스크톱 GUI 유료 |
| **LocalCan** | ✅ Mac | [$67](https://www.localcan.com) | 무제한 | Mac Only | Mac 전용 유료 앱 |
| **Cloudflare** | Web UI | 무료 | 무제한 | Cross | 설정이 다소 복잡함 |

### ✨ Key Benefits
- **No Monthly Fee**: Microsoft 계정만 있으면 100% 무료
- **GUI Convenience**: 복잡한 CLI 명령어를 외울 필요 없음
- **Real-time Logs**: 연결 상태와 요청 로그를 실시간 시각화
- **Tag System**: 프로젝트별(Production, Staging) 터널 태그 분류
- **Access Control**: 익명, 조직 전용, 토큰 기반 등 세밀한 권한 제어

---

## ✨ Features

### 🚇 Tunnel & Port Management
* **Easy Creation**: 커스텀 ID, 설명, 태그를 통한 손쉬운 터널 생성
* **Hosting**: 로컬 포트(HTTP/HTTPS)를 즉시 인터넷에 노출
* **Protocol**: Auto, HTTP, HTTPS 프로토콜 지원
* **Deep Linking**: 생성된 터널 URL 원클릭 복사 및 열기

### 🛡️ Security & Access
* **Authentication**: Microsoft 또는 GitHub 계정 로그인 지원
* **Access Presets**:
    * `Public Demo`: 24시간 익명 접속 허용
    * `Team Access`: 같은 조직 구성원만 접근
    * `Client Preview`: 보안 토큰 기반 접근 제한

### ⚡ Performance & Monitoring
* **Real-time Dashboard**: 터널 상태(Active/Stopped) 및 만료 시간 자동 추적
* **Live Logging**: INFO, WARN, ERROR 레벨별 로그 및 타임스탬프 기록
* **Fast Loading**: 병렬 처리를 통한 빠른 목록 조회 (기존 대비 5-10배 향상)

---

## 🚀 Installation

### 0. Prerequisites
본 프로그램은 **Microsoft DevTunnel CLI**를 내부적으로 사용합니다.
(앱 실행 시 감지되지 않으면 설정 가이드를 제공합니다.)

```bash
# Recommended: Install DevTunnel CLI (Linux)
curl -sL [https://aka.ms/DevTunnelCliInstall](https://aka.ms/DevTunnelCliInstall) | bash

```

### 1. Download & Run
[Releases 페이지](https://github.com/Bae-ChangHyun/devtunnel_gui/releases)에서 최신 버전을 다운로드하세요.

#### Option A: AppImage (권장)설치 없이 바로 실행 가능합니다.

```bash
chmod +x DevTunnel-GUI_0.1.0_amd64.AppImage
./DevTunnel-GUI_0.1.0_amd64.AppImage
```

#### Option B: Debian Package (.deb)Ubuntu/Debian 계열 사용자를 위한 설치 패키지입니다.

```bash
sudo dpkg -i devtunnel-gui_0.1.0_amd64.deb
devtunnel-gui
```

---

## 📖 Quick Start Guide

1. **로그인**: 앱 실행 후 `Microsoft` 또는 `GitHub` 계정으로 로그인합니다. (브라우저 인증)
2. **터널 생성**: `Create Tunnel` 버튼을 누르고 ID와 태그를 입력합니다.
3. **포트 추가**: 생성된 터널 카드에서 `Ports` 탭 → `Add Port`를 눌러 로컬 포트(예: 3000)를 연결합니다.
4. **호스팅 시작**: `Host Tunnel` 버튼을 누르면 터널링이 시작됩니다.
5. **접속**: 생성된 `Public URL`을 통해 외부에서 로컬 서버에 접속합니다.

---

## 💻 Tech Stack**Frontend**

**Backend & Desktop**

---

## 🚧 Roadmap
* [ ] **Token Auto-Refresh**: 24시간 토큰 만료 시 자동 갱신 및 알림
* [ ] **UI/UX Polish**: 다크 모드, 드래그 앤 드롭 정렬
* [ ] **Settings Sync**: 설정 백업 및 복원 기능
* [ ] **Advanced Metrics**: 트래픽 통계 차트 시각화

---

## 📄 License & Disclaimer
### Project License
Distributed under the **MIT License**. See `LICENSE` for more information.

### Disclaimer
*  **Unofficial**: This is an unofficial wrapper and is not endorsed by Microsoft.
* **Terms**: Use of DevTunnel CLI is subject to Microsoft's [Terms of Service](https://aka.ms/devtunnels/tos).
* **Warranty**: This software is provided "as is" without warranty of any kind.

---

<div align="center">

**Made with ❤️ for developers**




이 프로젝트가 도움이 되었다면 ⭐️ Star를 눌러주세요!

[Issues](https://github.com/Bae-ChangHyun/devtunnel_gui/issues) • [Pull Requests](https://www.google.com/search?q=https://github.com/Bae-ChangHyun/devtunnel_gui/pulls)

</div>