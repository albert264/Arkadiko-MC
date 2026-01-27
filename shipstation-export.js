/***** MetsCube – ShipStation Export, Emails, Monthly & Annual Summaries *****/
/**
 * @version 2.10.3
 * @date 2026-01-27
 * @changelog
 *   2.10.3 - Backfill fixes:
 *           - Fixed runScheduledBackfill_ to runScheduledBackfill (private functions can't be triggered)
 *           - Added forceBackfillJanuary2026 function for re-importing deleted data
 *           - Added SpreadsheetApp.flush() after writes to prevent data loss
 *           - Backfill now writes in batches of 500 to avoid timeout data loss
 *   2.10.2 - Backfill dialog fix:
 *           - Fixed Custom Date Range Backfill dialog hanging/timing out
 *           - Backfill now runs asynchronously via scheduled trigger
 *           - Dialog closes immediately after scheduling the backfill
 *   2.10.1 - Ship Date timezone fix
 *   2.10.0 - Order Summary enhancements
 */

const SCRIPT_VERSION = '2.10.3';

/** ========= Configuration ========= **/
const CONFIG = {
  MAX_EXECUTION_TIME: 300000,
  BACKFILL_MAX_EXECUTION_TIME: 300000,
  API_TIMEOUT: 60,
  API_MAX_RETRIES: 3,
  API_RETRY_DELAY_MS: 1000,
  API_RATE_LIMIT_DELAY_MS: 500,
  BUSINESS_HOURS_START: 6,
  BUSINESS_HOURS_END: 18,
  TIMEZONE: 'America/New_York',
  LOOKBACK_MINUTES: 15,
  LOCK_TIMEOUT_SECONDS: 300,
  ALERT_EMAIL: 'albert@metscube.com',
  OPERATIONS_EMAIL: 'operations@metscube.com',
  LOG_TO_SHEET: true,
  LOG_SHEET_NAME: 'System Log',
  INCLUDE_FULFILLMENTS: true,
  CLIENT_EMAILS_PROPERTY_KEY: 'CLIENT_EMAILS_ENABLED',
};

function isClientEmailsEnabled() {
  const props = PropertiesService.getScriptProperties();
  const value = props.getProperty(CONFIG.CLIENT_EMAILS_PROPERTY_KEY);
  return value === 'true';
}

function setClientEmailsEnabled(enabled) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(CONFIG.CLIENT_EMAILS_PROPERTY_KEY, enabled ? 'true' : 'false');
  logMessage(`Client emails ${enabled ? 'ENABLED' : 'DISABLED'}`, LogLevel.INFO);
}

let SCRIPT_START_TIME = new Date().getTime();
let BACKFILL_START_TIME = new Date().getTime();

/** ========= Logging ========= **/
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

function logMessage(message, level = LogLevel.INFO, data = null) {
  const timestamp = new Date();
  const formattedTime = Utilities.formatDate(timestamp, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss.SSS z');
  const logEntry = `[${formattedTime}] [${level}] ${message}`;
  Logger.log(logEntry);
  if (data) Logger.log('  Data: ' + JSON.stringify(data));
  if (CONFIG.LOG_TO_SHEET && (level === LogLevel.WARNING || level === LogLevel.ERROR || level === LogLevel.CRITICAL)) {
    try { writeToLogSheet_(timestamp, level, message, data); } catch (e) { Logger.log('Failed to write to log sheet: ' + e.message); }
  }
}

function writeToLogSheet_(timestamp, level, message, data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.LOG_SHEET_NAME);
      logSheet.appendRow(['Timestamp', 'Level', 'Message', 'Data', 'Version']);
      logSheet.setFrozenRows(1);
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f3f3f3');
    }
    if (logSheet.getLastRow() > 1000) {
      const toDelete = Math.min(100, logSheet.getLastRow() - 1);
      if (toDelete > 0) logSheet.deleteRows(2, toDelete);
    }
    const dataStr = data ? JSON.stringify(data) : '';
    logSheet.appendRow([timestamp, level, message, dataStr, SCRIPT_VERSION]);
  } catch (error) { Logger.log('Error writing to log sheet: ' + error.message); }
}

/** ========= Headers ========= **/
function ensureShipstationExportHeaders_(sheet) {
  try {
    const expectedHeaders = [
      'Create Date', 'Order Number', 'Order ID', 'Ship To Name', 'Tracking Number',
      'Carrier', 'Service', 'Ship Date', 'Store ID', 'Batch ID', 'Shipping Cost',
      'Warehouse ID', 'Warehouse Name', 'Billing Cost', 'Store Name', 'Voided',
      'Shipment ID', 'Is Return Label', 'Insurance Cost', 'Items Count', 'Source Type',
      'Weight (oz)', 'Package Type', 'Dimensions', 'Carton Size'
    ];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(expectedHeaders);
    } else {
      const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), expectedHeaders.length)).getValues()[0];
      for (let i = 0; i < expectedHeaders.length; i++) {
        const cur = toKey(current[i] || '');
        const exp = toKey(expectedHeaders[i]);
        if (cur !== exp) sheet.getRange(1, i + 1).setValue(expectedHeaders[i]);
      }
    }
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight('bold').setBackground('#4CAF50').setFontColor('white');
    sheet.setFrozenRows(1);
    logMessage('Header row validated/repaired', LogLevel.INFO);
    return true;
  } catch (error) {
    logMessage('Error ensuring headers', LogLevel.ERROR, { error: error.message });
    return false;
  }
}

/** ========= Lock Service ========= **/
function acquireLock(lockName) {
  const lock = LockService.getScriptLock();
  logMessage(`Attempting to acquire lock: ${lockName}`, LogLevel.INFO);
  try {
    const hasLock = lock.tryLock(CONFIG.LOCK_TIMEOUT_SECONDS * 1000);
    if (!hasLock) {
      logMessage(`Failed to acquire lock: ${lockName}`, LogLevel.WARNING);
      return null;
    }
    logMessage(`Lock acquired: ${lockName}`, LogLevel.INFO);
    return lock;
  } catch (error) {
    logMessage(`Error acquiring lock: ${lockName}`, LogLevel.ERROR, { error: error.message });
    return null;
  }
}

function releaseLock(lock, lockName) {
  if (!lock) return;
  try {
    lock.releaseLock();
    logMessage(`Lock released: ${lockName}`, LogLevel.INFO);
  } catch (error) {
    logMessage(`Error releasing lock: ${lockName}`, LogLevel.WARNING, { error: error.message });
  }
}

/** ========= API ========= **/
function makeApiCallWithRetry(url, params = {}, retryCount = 0) {
  if (!params.muteHttpExceptions) params.muteHttpExceptions = true;
  const timeoutSeconds = params.timeoutSeconds || CONFIG.API_TIMEOUT;
  const finalParams = { ...params, timeoutSeconds };
  try {
    logMessage(`API Request: ${url.substring(0, 100)}...`, LogLevel.DEBUG, { attempt: retryCount + 1, maxRetries: CONFIG.API_MAX_RETRIES });
    const response = UrlFetchApp.fetch(url, finalParams);
    const statusCode = response.getResponseCode();
    const responseBody = response.getContentText();
    if (statusCode === 200) {
      let data = responseBody;
      if (responseBody && (responseBody.trim().startsWith('{') || responseBody.trim().startsWith('['))) {
        try { data = JSON.parse(responseBody); } catch { logMessage('Response is not valid JSON', LogLevel.WARNING); }
      }
      logMessage('API call successful', LogLevel.DEBUG, { statusCode });
      return { success: true, data, statusCode, error: null };
    }
    logMessage(`API returned non-200 status: ${statusCode}`, LogLevel.WARNING, { url: url.substring(0, 100), statusCode });
    if ((statusCode === 429 || statusCode >= 500) && retryCount < CONFIG.API_MAX_RETRIES) {
      return retryApiCall_(url, finalParams, retryCount, `Status ${statusCode}`);
    }
    return { success: false, data: null, statusCode, error: `API returned status ${statusCode}` };
  } catch (error) {
    logMessage(`API call exception: ${error.message}`, LogLevel.ERROR, { url: url.substring(0, 100), attempt: retryCount + 1 });
    if (retryCount < CONFIG.API_MAX_RETRIES) return retryApiCall_(url, finalParams, retryCount, error.message);
    return { success: false, data: null, statusCode: 0, error: `API call failed: ${error.message}` };
  }
}

function retryApiCall_(url, params, retryCount, reason) {
  const nextRetry = retryCount + 1;
  const jitter = Math.floor(Math.random() * 200);
  const delayMs = CONFIG.API_RETRY_DELAY_MS * Math.pow(2, retryCount) + jitter;
  logMessage(`Retrying API call (${nextRetry}/${CONFIG.API_MAX_RETRIES}) after ${delayMs}ms`, LogLevel.INFO, { reason });
  Utilities.sleep(delayMs);
  return makeApiCallWithRetry(url, params, nextRetry);
}

function validateApiResponse(data, expectedType) {
  if (!data) return { valid: false, error: 'Response data is null' };
  if (typeof data !== 'object') return { valid: false, error: 'Response is not an object' };
  switch (expectedType) {
    case 'shipments':
      if (!data.hasOwnProperty('shipments')) return { valid: false, error: 'Missing shipments property' };
      if (!Array.isArray(data.shipments)) return { valid: false, error: 'shipments is not an array' };
      break;
    case 'warehouses':
    case 'stores':
      if (!Array.isArray(data)) return { valid: false, error: 'Response is not an array' };
      break;
  }
  return { valid: true, error: null };
}

/** ========= Helpers ========= **/
function toKey(v) { return v === null || v === undefined ? '' : String(v).trim(); }

function parseEmails(emailString) {
  if (!emailString || emailString.trim() === '') return [];
  return String(emailString).split(/[,;]\s*/).map(e => e.trim()).filter(e => e.length > 0 && e.includes('@'));
}

function buildWarehouseMap_() {
  const ws = SpreadsheetApp.getActive().getSheetByName('Warehouses');
  if (!ws) return {};
  const rows = ws.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const id = toKey(rows[i][0]);
    const clientId = toKey(rows[i][2]);
    if (id && clientId) map[id] = clientId;
  }
  return map;
}

function buildWarehouseNameMap_() {
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName('Warehouses');
  if (!ws) { logMessage('Warehouses sheet not found', LogLevel.WARNING); return {}; }
  const rows = ws.getDataRange().getDisplayValues();
  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const id = String(rows[i][0] || '').trim();
    const name = String(rows[i][1] || '').trim();
    if (id) map[id] = name;
  }
  logMessage(`Built warehouse name map with ${Object.keys(map).length} warehouses`, LogLevel.INFO);
  return map;
}

function buildClientMap_() {
  const ws = SpreadsheetApp.getActive().getSheetByName('Warehouses');
  if (!ws) return {};
  const rows = ws.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const clientId = toKey(rows[i][2]);
    const name = toKey(rows[i][1]);
    if (clientId && name && !map[clientId]) map[clientId] = name;
  }
  return map;
}

function buildStoreMap_() {
  const ss = SpreadsheetApp.getActive();
  let ws = ss.getSheetByName('Stores');
  if (!ws) {
    ws = ss.insertSheet('Stores');
    ws.appendRow(['Store ID', 'Store Name', 'Client ID']);
    logMessage('Created new Stores sheet', LogLevel.INFO);
  }
  const rows = ws.getDataRange().getDisplayValues();
  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const id = String(rows[i][0] || '').trim();
    const name = String(rows[i][1] || '').trim();
    if (id) map[id] = name;
  }
  logMessage(`Built store map with ${Object.keys(map).length} stores`, LogLevel.INFO);
  return map;
}

function buildStoreClientMap_() {
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName('Stores');
  if (!ws) return {};
  const rows = ws.getDataRange().getDisplayValues();
  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const storeId = String(rows[i][0] || '').trim();
    const storeName = String(rows[i][1] || '').trim();
    const clientIdCol = String(rows[i][2] || '').trim();
    if (!storeId) continue;
    let clientId = clientIdCol || extractClientId_(storeName);
    if (clientId) map[storeId] = clientId;
  }
  logMessage(`Built store client map with ${Object.keys(map).length} stores`, LogLevel.DEBUG);
  return map;
}

function getClientIdForRow_(storeId, storeName, warehouseId, warehouseName, storeClientMap, warehouseClientMap, orderNumber) {
  const isMetsCubeStore = String(storeName || '').toLowerCase().includes('metscube');
  if (!isMetsCubeStore) {
    if (storeId && storeClientMap[storeId]) return storeClientMap[storeId];
    const storeClientId = extractClientId_(storeName);
    if (storeClientId) return storeClientId;
  }
  if (warehouseId && warehouseClientMap[warehouseId]) return warehouseClientMap[warehouseId];
  const warehouseClientId = extractClientId_(warehouseName);
  if (warehouseClientId) return warehouseClientId;
  if (isMetsCubeStore && orderNumber) {
    const orderClientId = extractClientIdFromOrderNumber_(orderNumber);
    if (orderClientId) return orderClientId;
  }
  return 'UNKNOWN';
}

function coerceToDate_(val) {
  if (val instanceof Date) return val;
  if (val === null || val === undefined || val === '') return null;
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

function getGlobalMarkup_() {
  const markup = PropertiesService.getScriptProperties().getProperty('COST_MARKUP_PERCENTAGE');
  if (!markup) return 0;
  const num = Number(markup);
  return isNaN(num) ? 0 : num;
}

function getWarehouseMarkup_(warehouseId) {
  const ws = SpreadsheetApp.getActive().getSheetByName('Warehouses');
  if (!ws) return getGlobalMarkup_();
  const rows = ws.getDataRange().getDisplayValues();
  for (let i = 1; i < rows.length; i++) {
    const id = toKey(rows[i][0]);
    if (id === toKey(warehouseId)) {
      const markupCell = toKey(rows[i][6]);
      if (!markupCell || markupCell.toLowerCase() === 'default') return getGlobalMarkup_();
      const markup = Number(markupCell);
      return isNaN(markup) ? getGlobalMarkup_() : markup;
    }
  }
  return getGlobalMarkup_();
}

function calculateBillingCost_(originalCost, markupPercentage) {
  const cost = Number(originalCost) || 0;
  if (cost === 0) return 0;
  return cost * (1 + markupPercentage / 100);
}

function normalizeCarrier(carrier) {
  if (!carrier) return 'OTHER';
  const lower = String(carrier).toLowerCase();
  if (lower.includes('usps') || lower.includes('stamps')) return 'USPS';
  if (lower.includes('ups')) return 'UPS';
  if (lower.includes('fedex')) return 'FedEx';
  if (lower.includes('dhl')) return 'DHL';
  return 'OTHER';
}

function cleanService(serviceCode) {
  if (!serviceCode) return '';
  const parts = String(serviceCode).split('_');
  parts.shift();
  return parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractClientId_(warehouseName) {
  if (!warehouseName) return '';
  const match = String(warehouseName).match(/^\[([A-Z]{3})\]/);
  return match ? match[1] : '';
}

function extractClientIdFromOrderNumber_(orderNumber) {
  if (!orderNumber) return '';
  const match = String(orderNumber).match(/^([A-Z]{3})[-_\s]/i);
  return match ? match[1].toUpperCase() : '';
}

function getCartonSizeSettings_() {
  const props = PropertiesService.getScriptProperties();
  return {
    S_MAX: parseFloat(props.getProperty('CARTON_SIZE_S_MAX')) || 350,
    M_MAX: parseFloat(props.getProperty('CARTON_SIZE_M_MAX')) || 1000,
    L_MAX: parseFloat(props.getProperty('CARTON_SIZE_L_MAX')) || 3500,
    XL_MAX: parseFloat(props.getProperty('CARTON_SIZE_XL_MAX')) || 999999
  };
}

function setCartonSizeSettings_(sMax, mMax, lMax, xlMax) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('CARTON_SIZE_S_MAX', String(sMax));
  props.setProperty('CARTON_SIZE_M_MAX', String(mMax));
  props.setProperty('CARTON_SIZE_L_MAX', String(lMax));
  props.setProperty('CARTON_SIZE_XL_MAX', String(xlMax));
  logMessage('Carton size settings updated', LogLevel.INFO, { sMax, mMax, lMax, xlMax });
}

function getCartonSize_(length, width, height, packageType) {
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  if (!l || !w || !h) return '';
  if (packageType) {
    const pkgLower = String(packageType).toLowerCase();
    if (pkgLower.includes('poly mailer') || pkgLower.includes('polymailer')) return 'PM';
  }
  const volume = l * w * h;
  const settings = getCartonSizeSettings_();
  let size;
  if (volume <= settings.S_MAX) size = 'S';
  else if (volume <= settings.M_MAX) size = 'M';
  else if (volume <= settings.L_MAX) size = 'L';
  else size = 'XL';
  if (packageType && String(packageType).toUpperCase().includes('DW')) {
    if (size === 'S') size = 'M';
    else if (size === 'M') size = 'L';
    else if (size === 'L') size = 'XL';
  }
  return size;
}

function safeGet(obj, path, defaultValue = null) {
  if (!obj || typeof obj !== 'object') return defaultValue;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, part)) return defaultValue;
    current = current[part];
  }
  return current !== undefined && current !== null ? current : defaultValue;
}

/** ========= Time Helpers ========= **/
function hasTimeRemaining() {
  const elapsed = new Date().getTime() - SCRIPT_START_TIME;
  const remaining = CONFIG.MAX_EXECUTION_TIME - elapsed;
  if (remaining < 30000 && remaining > 20000) logMessage('Approaching execution time limit', LogLevel.WARNING);
  return elapsed < CONFIG.MAX_EXECUTION_TIME;
}

function hasTimeRemainingBackfill() {
  const elapsed = new Date().getTime() - BACKFILL_START_TIME;
  const remaining = CONFIG.BACKFILL_MAX_EXECUTION_TIME - elapsed;
  if (remaining < 30000 && remaining > 20000) logMessage('Approaching backfill time limit', LogLevel.WARNING);
  return elapsed < CONFIG.BACKFILL_MAX_EXECUTION_TIME;
}

function getRemainingTime(isBackfill = false) {
  const startTime = isBackfill ? BACKFILL_START_TIME : SCRIPT_START_TIME;
  const maxTime = isBackfill ? CONFIG.BACKFILL_MAX_EXECUTION_TIME : CONFIG.MAX_EXECUTION_TIME;
  const elapsed = new Date().getTime() - startTime;
  return Math.floor((maxTime - elapsed) / 1000);
}

/** ========= Email Helper ========= **/
function sendErrorEmail(subject, body) {
  try {
    MailApp.sendEmail({
      to: CONFIG.ALERT_EMAIL,
      subject: subject,
      body: body + `\n\n---\nScript Version: ${SCRIPT_VERSION}\nTimestamp: ${new Date().toISOString()}`,
      name: 'MetsCube System Monitor',
      from: CONFIG.OPERATIONS_EMAIL,
      bcc: CONFIG.OPERATIONS_EMAIL
    });
  } catch (emailError) {
    logMessage('Failed to send error email', LogLevel.ERROR, { error: emailError.message });
  }
}

/** ========= Sheet Write Utils ========= **/
function writeBatchToSheet_(sheet, dataArray) {
  if (!dataArray || dataArray.length === 0) return { success: true, rowsWritten: 0, error: null };
  try {
    const cleanupResult = cleanupPlaceholderRows_(sheet);
    if (!cleanupResult.success) logMessage('Warning: Placeholder cleanup had issues', LogLevel.WARNING, cleanupResult);
    const finalLastRow = sheet.getLastRow();
    const targetRow = finalLastRow + 1;
    const numRows = dataArray.length;
    const numCols = dataArray[0].length;
    logMessage(`Preparing to write ${numRows} rows starting at row ${targetRow}`, LogLevel.DEBUG);
    const currentMaxRows = sheet.getMaxRows();
    const rowsNeeded = targetRow + numRows - 1;
    if (rowsNeeded > currentMaxRows) {
      const rowsToAdd = rowsNeeded - currentMaxRows + 10;
      logMessage(`Adding ${rowsToAdd} rows to sheet`, LogLevel.INFO);
      try { sheet.insertRowsAfter(currentMaxRows, rowsToAdd); }
      catch (insertError) { return { success: false, rowsWritten: 0, error: `Failed to insert rows: ${insertError.message}` }; }
    }
    try {
      const writeRange = sheet.getRange(targetRow, 1, numRows, numCols);
      logMessage(`Write range: ${writeRange.getA1Notation()}`, LogLevel.DEBUG);
      writeRange.setValues(dataArray);
      const voidedRowIndices = [];
      for (let i = 0; i < dataArray.length; i++) {
        if (String(dataArray[i][15]).toUpperCase() === 'YES') voidedRowIndices.push(i);
      }
      if (voidedRowIndices.length > 0) {
        voidedRowIndices.forEach(idx => { sheet.getRange(targetRow + idx, 1, 1, numCols).setFontColor('#CC0000'); });
        logMessage(`Applied red font to ${voidedRowIndices.length} voided rows`, LogLevel.DEBUG);
      }
      SpreadsheetApp.flush();
      logMessage(`Successfully wrote ${numRows} rows`, LogLevel.INFO);
      return { success: true, rowsWritten: numRows, error: null };
    } catch (rangeError) {
      logMessage('Batch write failed, attempting fallback', LogLevel.WARNING, { error: rangeError.message });
      return fallbackAppendRows_(sheet, dataArray);
    }
  } catch (error) {
    return { success: false, rowsWritten: 0, error: `Write failed: ${error.message}` };
  }
}

function applyVoidedRowFormatting_(sheet, startRow, dataArray) {
  if (!dataArray || dataArray.length === 0) return;
  const numCols = dataArray[0].length;
  const voidedRowIndices = [];
  for (let i = 0; i < dataArray.length; i++) {
    if (String(dataArray[i][15]).toUpperCase() === 'YES') voidedRowIndices.push(i);
  }
  if (voidedRowIndices.length > 0) {
    voidedRowIndices.forEach(idx => { sheet.getRange(startRow + idx, 1, 1, numCols).setFontColor('#CC0000'); });
    logMessage(`Applied red font to ${voidedRowIndices.length} voided rows`, LogLevel.DEBUG);
  }
}

function fallbackAppendRows_(sheet, dataArray) {
  logMessage('Using fallback: appending rows individually', LogLevel.INFO);
  let successCount = 0;
  let firstError = null;
  dataArray.forEach((row, index) => {
    try { sheet.appendRow(row); successCount++; }
    catch (appendError) { if (!firstError) firstError = appendError.message; logMessage(`Failed to append row ${index}`, LogLevel.ERROR, { error: appendError.message }); }
  });
  SpreadsheetApp.flush();
  logMessage(`Fallback complete: ${successCount} of ${dataArray.length} rows written`, LogLevel.INFO);
  return { success: successCount > 0, rowsWritten: successCount, error: firstError };
}

function cleanupPlaceholderRows_(sheet) {
  try {
    const currentLastRow = sheet.getLastRow();
    const maxRows = sheet.getMaxRows();
    if (currentLastRow < 2 || currentLastRow > maxRows) return { success: true, rowsDeleted: 0 };
    const startCheckRow = Math.max(2, currentLastRow - 19);
    let deletedRows = 0;
    for (let row = currentLastRow; row >= startCheckRow; row--) {
      try {
        const cellValue = sheet.getRange(row, 2).getValue();
        if (typeof cellValue === 'string' && cellValue.includes('No new shipments found')) {
          sheet.deleteRow(row);
          deletedRows++;
          logMessage(`Deleted placeholder row ${row}`, LogLevel.DEBUG);
        }
      } catch (rowError) { logMessage(`Error checking row ${row}`, LogLevel.DEBUG, { error: rowError.message }); }
    }
    return { success: true, rowsDeleted: deletedRows };
  } catch (error) { return { success: false, rowsDeleted: 0, error: error.message }; }
}

function validateWriteSuccess_(sheet, expectedNewRows) {
  try {
    const newLastRow = sheet.getLastRow();
    const actualDataRows = newLastRow - 1;
    logMessage(`Post-write validation: ${actualDataRows} total data rows`, LogLevel.DEBUG);
    if (actualDataRows < expectedNewRows) return { success: false, warning: `Expected ${expectedNewRows} rows, sheet has ${actualDataRows}` };
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}
