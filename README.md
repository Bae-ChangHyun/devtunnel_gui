# DevTunnel GUI

> Microsoft DevTunnel의 비공식 GUI 관리 도구

Linux 환경에서 Microsoft DevTunnel을 편리하게 관리할 수 있는 데스크톱 애플리케이션입니다.

[![GitHub Release](https://img.shields.io/github/v/release/Bae-ChangHyun/devtunnel_gui)](https://github.com/Bae-ChangHyun/devtunnel_gui/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ⚠️ Important Notice

**This is NOT an official Microsoft product.**

- Unofficial GUI client wrapping Microsoft DevTunnel CLI
- Requires Microsoft DevTunnel CLI to be installed separately
- Microsoft trademarks and DevTunnel are property of Microsoft Corporation

## ✨ Features

### 🔐 Authentication
- Microsoft 계정 또는 GitHub 계정으로 로그인
- 디바이스 코드 인증 지원
- 인증 상태 실시간 확인

### 🚇 Tunnel Management
- **터널 생성**: 커스텀 ID, 설명, 태그 지정
- **터널 목록**: 모든 터널을 한눈에 확인
- **터널 상세 정보**: 포트, 도메인, 만료 시간
- **터널 삭제**: 개별 또는 전체 삭제
- **터널 호스팅**: 로컬 포트를 인터넷에 노출
- **실시간 제어**: 중지/재시작 지원

### 🔌 Port Management
- **프로토콜 선택**: HTTP/HTTPS/Auto
- **포트 설명**: 각 포트의 용도 문서화
- **공개 URL**: 자동 생성된 접근 URL
- **포트 핑**: 연결 상태 실시간 확인

### 🛡️ Access Control
- **익명 액세스**: 누구나 접근 가능
- **조직 기반**: 특정 조직 구성원만 허용
- **토큰 기반**: 보안 토큰으로 접근 제한
- **포트별 권한**: 각 포트마다 다른 설정
- **프리셋 템플릿**:
  - Public Demo (24시간 익명 액세스)
  - Team Access (조직 전용)
  - Client Preview (토큰 기반)

### 🏷️ Tag System
- 터널을 태그로 분류 (예: production, staging, development)
- 태그별 필터링으로 빠른 검색
- 여러 태그 동시 지정

### 📊 Real-time Monitoring
- 터널 상태 시각화 (Active/Stopped/Expired)
- 만료 시간 자동 추적
- 대시보드에서 전체 현황 확인

### 📝 Live Logging
- 모든 작업의 실시간 로그 표시
- 레벨별 구분 (INFO, WARN, ERROR, DEBUG)
- 타임스탬프와 상세 기록
- 자동 스크롤 및 로그 클리어

### ⚡ Performance
- **경량 목록**: 포트 정보 없이 빠른 로딩
- **병렬 처리**: 여러 터널 동시 조회
- **5-10배 성능 향상**: 10개 터널 기준 10초 → 1-2초

## 📋 Prerequisites

### Required
- **OS**: Linux (Ubuntu 20.04+, Debian 11+, Fedora 35+)
- **DevTunnel CLI**: Microsoft DevTunnel CLI must be installed

### Installing DevTunnel CLI

#### Option 1: Download from Microsoft (Recommended)
```bash
# Download and install DevTunnel CLI
# Visit: https://aka.ms/devtunnels/download

# For Linux:
curl -sL https://aka.ms/DevTunnelCliInstall | bash

# Verify installation
devtunnel --version
```

#### Option 2: Manual Installation
1. Download from [Microsoft DevTunnel Downloads](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)
2. Extract and place binary in your PATH
3. Set executable permission: `chmod +x devtunnel`

#### Set Custom Path (Optional)
```bash
# If DevTunnel is not in PATH, set environment variable
export DEVTUNNEL_BIN="/path/to/devtunnel"

# Make it permanent (~/.bashrc or ~/.zshrc)
echo 'export DEVTUNNEL_BIN="/path/to/devtunnel"' >> ~/.bashrc
```

**Official Documentation**: [Microsoft DevTunnel Docs](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/)

## 🚀 Installation

### Option 1: AppImage (Recommended)

**Download from [Releases](https://github.com/Bae-ChangHyun/devtunnel_gui/releases)**

```bash
# Make executable
chmod +x DevTunnel-GUI_0.1.0_amd64.AppImage

# Run
./DevTunnel-GUI_0.1.0_amd64.AppImage
```

### Option 2: Debian Package

```bash
# Download .deb from Releases
sudo dpkg -i devtunnel-gui_0.1.0_amd64.deb

# Run from application menu or
devtunnel-gui
```

### Option 3: Build from Source

#### Install Dependencies
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Build
```bash
# Clone repository
git clone https://github.com/Bae-ChangHyun/devtunnel_gui.git
cd devtunnel_gui

# Install dependencies
npm install

# Development mode
npm run tauri dev

# Production build
npm run tauri build

# Output: src-tauri/target/release/bundle/
```

## 📖 Quick Start

### 1. First Launch

1. Launch the application
2. Login screen: Choose **Microsoft** or **GitHub**
3. Complete authentication in browser
4. Return to app - automatically logged in

### 2. Create Tunnel

1. Click **"Create Tunnel"** in Dashboard
2. Fill in details:
   - **Tunnel ID** (optional): Custom identifier or auto-generate
   - **Description**: Purpose of the tunnel
   - **Tags**: Categorize (e.g., `web`, `api`, `production`)
   - **Allow Anonymous**: Enable public access
   - **Expiration**: 1h to 30d
3. Click **"Create Tunnel"**

### 3. Add Ports

1. Click tunnel card → **"Ports"** tab
2. Click **"Add Port"**
3. Configure:
   - **Port Number**: 1-65535
   - **Protocol**: auto/http/https
   - **Description**: Port purpose
4. Copy generated public URL

### 4. Host Tunnel

1. Tunnel detail → **"Host Tunnel"**
2. Enter port numbers (e.g., `3000,8080`)
3. Set expiration (optional)
4. Click **"Start Hosting"**
5. Check **Logs** tab for status

### 5. Access Control

1. Select tunnel → **"Access Control"** tab
2. Choose preset or custom:
   - **Public Demo**: 24h anonymous access
   - **Team Access**: Organization only
   - **Client Preview**: Token-based
3. Apply settings

### 6. View Logs

- Click **"Logs"** tab in header
- Real-time logs with timestamps
- Errors highlighted in red
- **"Clear Logs"** to reset

## 🔧 Configuration

### Environment Variables

```bash
# Custom DevTunnel binary path
export DEVTUNNEL_BIN="/usr/local/bin/devtunnel"

# Persistent (add to ~/.bashrc)
echo 'export DEVTUNNEL_BIN="/usr/local/bin/devtunnel"' >> ~/.bashrc
source ~/.bashrc
```

## 🐛 Troubleshooting

### DevTunnel CLI Not Found

```bash
# Check if installed
which devtunnel

# Install if missing (see Prerequisites section)
curl -sL https://aka.ms/DevTunnelCliInstall | bash

# Or set custom path
export DEVTUNNEL_BIN="/path/to/devtunnel"
```

### Login Failed

```bash
# Test CLI login manually
devtunnel user login -g

# Check authentication status
devtunnel user show

# Logout and retry
devtunnel user logout
```

### Build Errors

```bash
# Clean and reinstall
rm -rf node_modules src-tauri/target
npm install

# Update Rust
rustup update

# Rebuild
npm run tauri build
```

<details>
<summary><h2>💻 Tech Stack</h2></summary>

### Frontend
- **React 19**: Latest React features
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Modern styling
- **Zustand**: Lightweight state management
- **Vite 7**: Fast build tool

### Backend
- **Rust**: Safe and fast native performance
- **Tauri 2.0**: Lightweight desktop framework
- **Tokio**: Async runtime for parallel processing
- **Serde**: JSON serialization
- **Anyhow**: Error handling
- **Regex**: CLI output parsing

### Architecture
- **CLI Wrapper Pattern**: Invokes DevTunnel CLI via `std::process::Command`
- **IPC Communication**: Tauri invoke system for Frontend ↔ Backend
- **Event-based Logging**: Real-time logs via Tauri events
- **Parallel Processing**: tokio JoinSet for concurrent tunnel queries

</details>

<details>
<summary><h2>⚡ Performance Features</h2></summary>

### Parallel Processing
- Uses tokio JoinSet for concurrent execution
- Queries multiple tunnel details simultaneously
- Automatic parallelism based on CPU cores

### Lightweight Listing
- Initial load excludes port information
- Single CLI call for tunnel list
- Lazy loading of detailed data on user interaction

### Performance Comparison (10 tunnels)
| Version | Load Time | Improvement |
|---------|-----------|-------------|
| v0.0.x (sequential) | ~10 seconds | - |
| v0.1.0 (parallel) | ~1-2 seconds | **5-10x faster** |

</details>

<details>
<summary><h2>🏗️ Project Structure</h2></summary>

```
devtunnel-gui/
├── src/                          # React frontend
│   ├── components/
│   │   ├── Auth/                # Login screen
│   │   ├── Dashboard/           # Main UI
│   │   ├── Layout/              # Header, Sidebar
│   │   ├── Logs/                # Log viewer
│   │   └── Settings/            # Settings
│   ├── lib/
│   │   └── api.ts               # Tauri API wrapper
│   ├── stores/
│   │   └── tunnelStore.ts       # Zustand state
│   ├── types/
│   │   └── devtunnel.ts         # TypeScript types
│   └── App.tsx
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── commands.rs          # Tauri command handlers
│   │   ├── devtunnel.rs         # DevTunnel CLI wrapper
│   │   ├── parser.rs            # CLI output parser
│   │   ├── types.rs             # Rust types
│   │   └── lib.rs               # Entry point
│   └── Cargo.toml
└── docs/
    ├── improvements.md          # Performance improvements
    └── todo.md                  # Development notes
```

</details>

## 📄 License & Disclaimer

### Project License
This project's source code is distributed under the MIT License.

### Microsoft DevTunnel Notice
- Microsoft DevTunnel CLI is a product of Microsoft Corporation
- This GUI tool is an unofficial client wrapping the DevTunnel CLI
- Not endorsed or supported by Microsoft
- DevTunnel usage is subject to Microsoft's terms of service

### Disclaimer
This software is provided "as is" without warranty of any kind, express or implied.
All use is at your own risk.

## 🤝 Contributing

Bug reports, feature suggestions, and Pull Requests are welcome!

## 📮 Contact

Issues and questions: [GitHub Issues](https://github.com/Bae-ChangHyun/devtunnel_gui/issues)

---

**개발자를 위한, 개발자가 만든 DevTunnel GUI** 💻

Made with ❤️ for developers who need dev tunnels with a GUI
