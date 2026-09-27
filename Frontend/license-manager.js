
const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');
const crypto = require('crypto');

class LicenseManager {
    constructor() {
        this.dbPath = path.join(app.getPath('userData'), 'license.db');
        this.deviceId = this.generateDeviceId();
    }

    // توليد بصمة الجهاز الفريدة
    generateDeviceId() {
        const info = os.hostname() + os.arch() + os.cpus()[0].model;
        return crypto.createHash('sha256').update(info).digest('hex').substring(0, 12).toUpperCase();
    }

    // الخوارزمية المبسطة بناءً على طلبك
    static generateKeys(deviceId) {
        const prefix = deviceId.substring(0, 6).toUpperCase();
        const startKey = prefix + "F";  // التفعيل الأول
        const finalKey = prefix + "FF"; // التفعيل النهائي
        return { startKey, finalKey };
    }

    getLicenseData() {
        if (!fs.existsSync(this.dbPath)) return null;
        try {
            const encryptedData = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(Buffer.from(encryptedData, 'base64').toString());
        } catch (e) {
            return null;
        }
    }

    saveLicenseData(data) {
        const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
        fs.writeFileSync(this.dbPath, encoded);
    }

    checkStatus() {
        const data = this.getLicenseData();
        const keys = LicenseManager.generateKeys(this.deviceId);

        if (!data || !data.activatedFirst) {
            return { status: 'REQUIRE_FIRST', deviceId: this.deviceId };
        }

        if (data.activatedFirst && !data.activatedFinal) {
            const startDate = new Date(data.startDate);
            const now = new Date();
            const diffDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));

            if (diffDays > 30) {
                return { status: 'REQUIRE_FINAL', deviceId: this.deviceId };
            }
            return { status: 'TRIAL', daysLeft: 30 - diffDays };
        }

        if (data.activatedFinal) {
            return { status: 'ACTIVATED' };
        }

        return { status: 'REQUIRE_FIRST', deviceId: this.deviceId };
    }

    activateFirst(code) {
        const keys = LicenseManager.generateKeys(this.deviceId);
        if (code.toUpperCase() === keys.startKey) {
            this.saveLicenseData({
                activatedFirst: true,
                startDate: new Date().toISOString(),
                activatedFinal: false
            });
            return true;
        }
        return false;
    }

    activateFinal(code) {
        const keys = LicenseManager.generateKeys(this.deviceId);
        if (code.toUpperCase() === keys.finalKey) {
            const data = this.getLicenseData() || {};
            this.saveLicenseData({
                ...data,
                activatedFinal: true
            });
            return true;
        }
        return false;
    }
}

module.exports = LicenseManager;
