/**
 * Electron Auto Backup Module
 * 
 * Provides automatic database backup functionality with rotation.
 * - Creates timestamped backups in userData/backups/
 * - Rotates old backups (keeps latest N files)
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Configuration
const MAX_BACKUPS = 10; // Keep latest 10 backups
const BACKUP_FOLDER_NAME = 'backups';

/**
 * Write debug log to file (for troubleshooting packaged app)
 */
function writeDebugLog(message) {
    try {
        const logPath = path.join(app.getPath('userData'), 'backup-debug.log');
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${message}\n`;
        fs.appendFileSync(logPath, logLine);
        console.log('[Backup]', message);
    } catch (e) {
        console.error('[Backup] Failed to write log:', e);
    }
}

/**
 * Get the backup directory path
 * Uses Electron's userData folder for proper app data storage
 * @returns {string} Absolute path to backup directory
 */
function getBackupDir() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, BACKUP_FOLDER_NAME);
}

/**
 * Get the database file path
 * In production (packaged), DB is in prisma/ relative to main/
 * @returns {string} Absolute path to database file
 */
function getDbPath() {
    const isDev = !app.isPackaged;

    if (isDev) {
        // Development: DB is in project root/prisma
        return path.join(process.cwd(), 'prisma', 'local.db');
    } else {
        // Production: DB is in prisma/ relative to main/ (resources/app/prisma/)
        return path.join(__dirname, '..', 'prisma', 'local.db');
    }
}

/**
 * Generate backup filename with timestamp
 * Format: backup-YYYY-MM-DD-HHmm.db
 * @returns {string} Backup filename
 */
function generateBackupFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `backup-${year}-${month}-${day}-${hours}${minutes}.db`;
}

/**
 * Create a backup of the database
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
async function createBackup() {
    try {
        writeDebugLog('=== Starting backup ===');
        writeDebugLog(`app.isPackaged: ${app.isPackaged}`);
        writeDebugLog(`__dirname: ${__dirname}`);
        writeDebugLog(`process.cwd(): ${process.cwd()}`);
        writeDebugLog(`userData: ${app.getPath('userData')}`);

        const dbPath = getDbPath();
        const backupDir = getBackupDir();

        writeDebugLog(`DB path: ${dbPath}`);
        writeDebugLog(`Backup dir: ${backupDir}`);
        writeDebugLog(`DB exists: ${fs.existsSync(dbPath)}`);

        // Check if source DB exists
        if (!fs.existsSync(dbPath)) {
            writeDebugLog('ERROR: Database file not found');
            return { success: false, error: 'Database file not found' };
        }

        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
            writeDebugLog('Created backup directory');
        }

        // Generate backup path
        const backupFilename = generateBackupFilename();
        const backupPath = path.join(backupDir, backupFilename);

        // Copy database file
        fs.copyFileSync(dbPath, backupPath);
        writeDebugLog(`Created backup: ${backupPath}`);

        // Rotate old backups
        await rotateBackups();

        writeDebugLog('=== Backup complete ===');
        return { success: true, path: backupPath };
    } catch (error) {
        writeDebugLog(`ERROR: ${error.message}`);
        writeDebugLog(`Stack: ${error.stack}`);
        return { success: false, error: error.message };
    }
}

/**
 * Rotate old backups, keeping only the latest MAX_BACKUPS files
 * @returns {Promise<void>}
 */
async function rotateBackups() {
    try {
        const backupDir = getBackupDir();

        if (!fs.existsSync(backupDir)) {
            return;
        }

        // Get all backup files
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
            .map(f => ({
                name: f,
                path: path.join(backupDir, f),
                mtime: fs.statSync(path.join(backupDir, f)).mtime,
            }))
            .sort((a, b) => b.mtime - a.mtime); // Sort by date, newest first

        // Delete old backups beyond MAX_BACKUPS
        if (files.length > MAX_BACKUPS) {
            const toDelete = files.slice(MAX_BACKUPS);
            for (const file of toDelete) {
                fs.unlinkSync(file.path);
                console.log('[Backup] Deleted old backup:', file.name);
            }
        }
    } catch (error) {
        console.error('[Backup] Error rotating backups:', error);
    }
}

/**
 * Get list of existing backups
 * @returns {Array<{name: string, path: string, size: number, date: string}>}
 */
function listBackups() {
    try {
        const backupDir = getBackupDir();

        if (!fs.existsSync(backupDir)) {
            return [];
        }

        return fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
            .map(f => {
                const filePath = path.join(backupDir, f);
                const stats = fs.statSync(filePath);

                // Parse date from filename: backup-YYYY-MM-DD-HHmm.db
                let dateStr = stats.mtime.toISOString();
                const match = f.match(/backup-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})\.db/);
                if (match) {
                    const [, year, month, day, hour, minute] = match;
                    dateStr = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day),
                        parseInt(hour),
                        parseInt(minute)
                    ).toISOString();
                }

                return {
                    name: f,
                    path: filePath,
                    size: stats.size,
                    date: dateStr,
                };
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('[Backup] Error listing backups:', error);
        return [];
    }
}

/**
 * Restore database from a backup file
 * @param {string} backupName - Name of the backup file to restore
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function restoreBackup(backupName) {
    try {
        writeDebugLog(`=== Starting restore: ${backupName} ===`);

        const backupDir = getBackupDir();
        const backupPath = path.join(backupDir, backupName);
        const dbPath = getDbPath();

        writeDebugLog(`Backup path: ${backupPath}`);
        writeDebugLog(`DB path: ${dbPath}`);

        // Validate backup file exists
        if (!fs.existsSync(backupPath)) {
            writeDebugLog('ERROR: Backup file not found');
            return { success: false, error: 'Backup file not found' };
        }

        // Create a safety backup of current DB before restoring
        const safetyBackupName = `pre-restore-${Date.now()}.db`;
        const safetyBackupPath = path.join(backupDir, safetyBackupName);

        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, safetyBackupPath);
            writeDebugLog(`Created safety backup: ${safetyBackupName}`);
        }

        // Restore: copy backup to DB location
        fs.copyFileSync(backupPath, dbPath);
        writeDebugLog('Database restored successfully');
        writeDebugLog('=== Restore complete ===');

        return { success: true };
    } catch (error) {
        writeDebugLog(`ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

module.exports = {
    createBackup,
    rotateBackups,
    listBackups,
    restoreBackup,
    getBackupDir,
    getDbPath,
};

