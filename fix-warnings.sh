#!/bin/bash

# Fix unused imports in devtunnel.rs
sed -i 's/use serde_json::Value;//g' src-tauri/src/devtunnel.rs
sed -i 's/use tokio::io::{AsyncBufReadExt, BufReader};//g' src-tauri/src/devtunnel.rs
sed -i 's/let stdout = /let _stdout = /g' src-tauri/src/devtunnel.rs
sed -i 's/let mut child = /let _child = /g' src-tauri/src/devtunnel.rs
sed -i '/pub fn get_active_hosts/,/^    }$/d' src-tauri/src/devtunnel.rs

# Fix unused imports in commands.rs  
sed -i 's/use tauri::State;//g' src-tauri/src/commands.rs
sed -i '/pub struct AppState/,/^}$/d' src-tauri/src/commands.rs
sed -i '/impl AppState/,/^}$/d' src-tauri/src/commands.rs

echo "Warnings fixed!"
