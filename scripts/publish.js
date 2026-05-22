const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'hongmieu1995';
const GITHUB_REPO = process.env.GITHUB_REPO || 'HihiiTroLy';

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;
const tagName = `v${version}`;

const nsisDir = path.join(__dirname, '../src-tauri/target/release/bundle/nsis');
const installerName = `Hihii_${version}_x64-setup.exe`;
const installerPath = path.join(nsisDir, installerName);

console.log(`==================================================`);
console.log(`🚀 Hihii automated publish tool`);
console.log(`==================================================`);
console.log(`👉 Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
console.log(`👉 Phiên bản: ${tagName}`);

if (!fs.existsSync(installerPath)) {
  console.error(`❌ KHÔNG TÌM THẤY BỘ CÀI ĐẶT TẠI: \n   ${installerPath}`);
  console.log(`\n💡 Gợi ý: Hãy chạy lệnh 'npm.cmd run tauri build' trước để tạo bộ cài đặt!`);
  process.exit(1);
}

console.log(`✅ Đã tìm thấy bộ cài đặt: ${installerName}`);

// 3. Đọc nhật ký cập nhật từ changelog.txt nếu có
let releaseNotes = `### 👾 Bản cập nhật ${tagName}\n- Tối ưu hóa hệ thống tự động cập nhật.\n- Cập nhật hiệu năng và sửa các lỗi nhỏ.`;
const changelogPath = path.join(__dirname, '../changelog.txt');

if (fs.existsSync(changelogPath)) {
  releaseNotes = fs.readFileSync(changelogPath, 'utf8');
  console.log(`📝 Đã đọc nội dung nhật ký cập nhật từ changelog.txt`);
} else {
  console.log(`📝 Sử dụng nhật ký cập nhật mặc định.`);
  console.log(`💡 Mẹo: Bạn có thể tạo file 'changelog.txt' ở thư mục gốc để ghi nhật ký tùy ý!`);
}

// 4. Kiểm tra xem người dùng đã cài đặt GitHub CLI (gh) chưa
try {
  execSync('gh --version', { stdio: 'ignore' });
} catch (e) {
  console.error(`\n❌ LỖI: Chưa cài đặt GitHub CLI ('gh') trên máy của bạn!`);
  console.log(`\n👉 HƯỚNG DẪN CÀI ĐẶT NHANH (Chỉ làm 1 lần duy nhất):`);
  console.log(`1. Mở PowerShell và chạy lệnh cài đặt:`);
  console.log(`   winget install --id GitHub.cli`);
  console.log(`2. Tắt và mở lại VS Code, sau đó đăng nhập tài khoản GitHub bằng lệnh:`);
  console.log(`   gh auth login`);
  process.exit(1);
}

// 5. Tiến hành tạo và đăng tải tệp lên GitHub Releases
try {
  console.log(`\n📦 Đang tiến hành đẩy bộ cài đặt lên GitHub Releases...`);
  
  const notesPath = path.join(__dirname, '../.release-notes.md');
  fs.writeFileSync(notesPath, releaseNotes, 'utf8');
  const command = `gh release create ${tagName} "${installerPath}" --repo "${GITHUB_OWNER}/${GITHUB_REPO}" --title "Hihii ${tagName}" --notes-file "${notesPath}"`;
  
  try {
    execSync(command, { stdio: 'inherit' });
  } finally {
    try { fs.unlinkSync(notesPath); } catch {}
  }
  
  console.log(`\n==================================================`);
  console.log(`🎉 ĐÃ ĐĂNG TẢI PHIÊN BẢN MỚI LÊN GITHUB THÀNH CÔNG!`);
  console.log(`==================================================`);
  console.log(`👉 Tất cả người dùng của bạn hiện tại đã có thể cập nhật lên phiên bản ${tagName}!`);
} catch (error) {
  console.error(`\n❌ Thất bại khi đẩy lên GitHub Releases.`);
  console.error(`👉 Kiểm tra: repo đã tồn tại, bạn đã chạy 'gh auth login', tag ${tagName} chưa bị trùng.`);
  process.exit(1);
}
