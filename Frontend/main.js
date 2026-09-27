
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const LicenseManager = require('./license-manager');

let mainWindow;
let licenseWindow;
const lm = new LicenseManager();

// وظيفة لفتح شاشة التفعيل
function createLicenseWindow() {
  if (licenseWindow) return;

  licenseWindow = new BrowserWindow({
    width: 500,
    height: 650,
    frame: false,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    backgroundColor: '#020617',
    icon: path.join(__dirname, 'icon.ico')
  });

  licenseWindow.loadFile(path.join(__dirname, 'license.html'));
  
  licenseWindow.once('ready-to-show', () => {
    licenseWindow.show();
    // إرسال معرف الجهاز وحالة التفعيل للشاشة
    const status = lm.checkStatus();
    licenseWindow.webContents.send('setup-ui', status);
  });
}

// وظيفة لفتح الشاشة الرئيسية للبرنامج
function createWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 750,
    title: "العربية لصهر وتشكيل المعادن - نظام إدارة المخازن الاحترافي",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, 'icon.ico')
  });

  // تحديد المسار الصحيح لملف index.html سواء في وضع التطوير أو بعد البناء
  const isDev = !app.isPackaged;
  const indexPath = isDev 
    ? path.join(__dirname, 'index.html') 
    : path.join(__dirname, 'dist', 'index.html');

  mainWindow.loadFile(indexPath).catch((err) => {
    console.error("Failed to load index.html:", err);
    // محاولة بديلة إذا فشل المسار الأول
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  });
  
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// استقبال طلب التفعيل من شاشة التفعيل
ipcMain.on('submit-key', (event, key) => {
    const status = lm.checkStatus();
    let success = false;

    if (status.status === 'REQUIRE_FIRST') {
        success = lm.activateFirst(key);
    } else if (status.status === 'REQUIRE_FINAL') {
        success = lm.activateFinal(key);
    }

    if (success) {
        if (licenseWindow) {
            licenseWindow.close();
            licenseWindow = null;
        }
        createWindow();
    } else {
        event.reply('auth-error');
    }
});

// تشغيل البرنامج وفحص الرخصة فوراً
app.whenReady().then(() => {
  const status = lm.checkStatus();
  
  // إذا كان مفعلاً أو في الفترة التجريبية افتح البرنامج
  if (status.status === 'ACTIVATED' || status.status === 'TRIAL') {
    createWindow();
  } else {
    // خلاف ذلك اطلب كود التفعيل
    createLicenseWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const currentStatus = lm.checkStatus();
      if (currentStatus.status === 'ACTIVATED' || currentStatus.status === 'TRIAL') createWindow();
      else createLicenseWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
