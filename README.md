# Hihii

Hihii là ứng dụng trợ lý cá nhân desktop dùng Next.js, React và Tauri.

## Chạy bản dev

```powershell
npm.cmd run tauri dev
```

Nếu terminal chưa nhận Rust/Cargo, thêm tạm Cargo vào PATH của phiên hiện tại:

```powershell
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
npm.cmd run tauri dev
```

## Build installer Windows

```powershell
npm.cmd run tauri build
```

Installer NSIS sẽ nằm ở:

```text
src-tauri/target/release/bundle/nsis/Hihii_<version>_x64-setup.exe
```

## GitHub release và auto update

App đang kiểm tra bản mới từ GitHub Releases:

```text
https://github.com/hongmieu1995/HihiiTroLy/releases/latest
```

Khi có release mới với tag lớn hơn version hiện tại, app sẽ hiện modal cập nhật và tải asset `.exe` trong release đó.

### Chuẩn bị lần đầu

1. Tạo repository GitHub:

```text
hongmieu1995/HihiiTroLy
```

2. Cài GitHub CLI:

```powershell
winget install --id GitHub.cli
```

3. Đăng nhập GitHub:

```powershell
gh auth login
```

4. Khởi tạo git trong thư mục này nếu chưa có:

```powershell
git init
git add .
git commit -m "Initial Hihii release"
git branch -M main
git remote add origin https://github.com/hongmieu1995/HihiiTroLy.git
git push -u origin main
```

### Publish một bản mới

1. Tăng version đồng bộ ở 3 file:

```text
package.json
src-tauri/Cargo.toml
src-tauri/tauri.conf.json
```

Ví dụ từ `1.0.0` lên `1.0.1`.

2. Ghi changelog nếu muốn:

```text
changelog.txt
```

3. Build installer:

```powershell
npm.cmd run tauri build
```

4. Tạo GitHub Release và upload installer:

```powershell
npm.cmd run publish
```

Script sẽ tạo release tag dạng:

```text
v<version>
```

Ví dụ:

```text
v1.0.1
```

## Đổi repository updater

Nếu đổi GitHub repo, cập nhật 2 nơi:

- `src-tauri/src/lib.rs`: `owner` và `repo` trong `check_for_updates`
- `scripts/publish.js`: `GITHUB_OWNER` và `GITHUB_REPO`

Hoặc khi publish có thể override:

```powershell
$env:GITHUB_OWNER="your-user"
$env:GITHUB_REPO="your-repo"
npm.cmd run publish
```
