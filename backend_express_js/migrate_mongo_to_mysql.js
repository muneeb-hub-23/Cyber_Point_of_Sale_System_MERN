/**
 * MongoDB -> MySQL Migration Script
 * ===================================
 * 1. Creates all MySQL tables (schema) automatically.
 * 2. Reads all data from MongoDB and inserts into MySQL.
 *
 * Usage:
 *   node migrate_mongo_to_mysql.js
 */

'use strict'

const mongoose = require('mongoose')
const mysql    = require('mysql2/promise')
const dbConfig = require('./config')

const MONGO_URI = 'mongodb://localhost:27017/cyber_khata'

// ─── helpers ────────────────────────────────────────────────────────────────

const str  = v => (v == null ? null : String(v))
const num  = v => (v == null ? null : Number(v))
const bool = v => (v ? 1 : 0)
const json = v => {
    if (v == null) return null
    if (typeof v === 'string') return v
    return JSON.stringify(v)
}
const id = v => {
    if (!v) return null
    if (typeof v === 'string') return v
    if (v._id) return String(v._id)
    return String(v)
}

// Simple upsert — skips rows whose id already exists
async function upsert(pool, table, row) {
    const keys = Object.keys(row).filter(k => row[k] !== undefined)
    if (!keys.length) return
    const cols = keys.map(k => `\`${k}\``).join(', ')
    const vals = keys.map(k => row[k])
    const placeholders = keys.map(() => '?').join(', ')
    await pool.query(
        `INSERT IGNORE INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
        vals
    )
}

// ─── Schema DDL ─────────────────────────────────────────────────────────────

const SCHEMA_SQL = `
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS \`shops\` (
    \`id\`         VARCHAR(36)    NOT NULL PRIMARY KEY,
    \`shopName\`   VARCHAR(255)   NOT NULL,
    \`customers\`  INT            NOT NULL DEFAULT 0,
    \`lenehain\`   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`denehain\`   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`createdAt\`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\`             VARCHAR(36)   NOT NULL PRIMARY KEY,
    \`username\`       VARCHAR(255)  NOT NULL,
    \`email\`          VARCHAR(255)  NOT NULL,
    \`password\`       VARCHAR(255)  NOT NULL,
    \`shops\`          JSON          NULL,
    \`job\`            VARCHAR(100)  NOT NULL DEFAULT 'Normal User',
    \`permissions\`    JSON          NULL,
    \`profilepicture\` VARCHAR(500)  NOT NULL DEFAULT '/images/userprofilepicture/default.jpg',
    \`rfid\`           VARCHAR(255)  NOT NULL DEFAULT '',
    \`fingerprint\`    VARCHAR(255)  NOT NULL DEFAULT '',
    \`createdAt\`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`customers\` (
    \`id\`                     VARCHAR(36)    NOT NULL PRIMARY KEY,
    \`customerName\`           VARCHAR(255)   NULL,
    \`customerMobileNumber\`   BIGINT         NULL,
    \`leneHain\`               DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`deneHain\`               DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`balance\`                DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`customerType\`           VARCHAR(100)   NULL,
    \`customerCnic\`           BIGINT         NULL,
    \`customerEmail\`          VARCHAR(255)   NULL,
    \`customerAddress\`        TEXT           NULL,
    \`linkedShop\`             VARCHAR(36)    NOT NULL,
    \`status\`                 TINYINT(1)     NOT NULL DEFAULT 1,
    \`createdAt\`              DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`              DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_customers_linkedShop\` (\`linkedShop\`),
    INDEX \`idx_customers_balance\` (\`balance\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`customergroups\` (
    \`id\`                   VARCHAR(36)   NOT NULL PRIMARY KEY,
    \`customerName\`         VARCHAR(255)  NULL,
    \`customerMobileNumber\` BIGINT        NULL,
    \`customerType\`         VARCHAR(100)  NULL,
    \`customerCnic\`         BIGINT        NULL,
    \`customerEmail\`        VARCHAR(255)  NULL,
    \`customerAddress\`      TEXT          NULL,
    \`createdAt\`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`customergroup_ids\` (
    \`id\`         INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`groupId\`    VARCHAR(36)   NOT NULL,
    \`customerID\` VARCHAR(36)   NOT NULL,
    \`shopID\`     VARCHAR(36)   NOT NULL,
    INDEX \`idx_cgids_groupId\` (\`groupId\`),
    INDEX \`idx_cgids_shopID\` (\`shopID\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`categories\` (
    \`id\`          VARCHAR(36)   NOT NULL PRIMARY KEY,
    \`name\`        VARCHAR(255)  NOT NULL,
    \`description\` TEXT          NULL,
    \`shop\`        VARCHAR(36)   NOT NULL,
    \`enabled\`     TINYINT(1)    NOT NULL DEFAULT 1,
    \`products\`    INT           NOT NULL DEFAULT 0,
    \`createdAt\`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_categories_shop\` (\`shop\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`paymentmethods\` (
    \`id\`                 VARCHAR(36)   NOT NULL PRIMARY KEY,
    \`name\`               VARCHAR(255)  NOT NULL,
    \`description\`        TEXT          NULL,
    \`shop\`               VARCHAR(36)   NOT NULL,
    \`iscustomerrequired\` TINYINT(1)    NOT NULL DEFAULT 0,
    \`enabled\`            TINYINT(1)    NOT NULL DEFAULT 1,
    \`bills\`              INT           NOT NULL DEFAULT 0,
    \`createdAt\`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_pm_shop\` (\`shop\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`saletypes\` (
    \`id\`          VARCHAR(36)   NOT NULL PRIMARY KEY,
    \`name\`        VARCHAR(255)  NOT NULL,
    \`description\` TEXT          NULL,
    \`shop\`        VARCHAR(36)   NOT NULL,
    \`createdAt\`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_saletypes_shop\` (\`shop\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`products\` (
    \`id\`                       VARCHAR(36)    NOT NULL PRIMARY KEY,
    \`name\`                     VARCHAR(255)   NOT NULL,
    \`itemCode\`                 BIGINT         NULL,
    \`barCode\`                  BIGINT         NULL,
    \`suplier\`                  VARCHAR(36)    NULL,
    \`supliersGroup\`            VARCHAR(36)    NULL,
    \`shop\`                     VARCHAR(36)    NOT NULL,
    \`onHand\`                   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`cost\`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`kharcha\`                  DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`iskharchaincludedinsale\`  TINYINT(1)     NOT NULL DEFAULT 1,
    \`markup\`                   JSON           NULL,
    \`tax\`                      JSON           NULL,
    \`istaxincludedinsale\`      TINYINT(1)     NOT NULL DEFAULT 1,
    \`ispricechangeallowed\`     TINYINT(1)     NOT NULL DEFAULT 1,
    \`isservice\`                TINYINT(1)     NOT NULL DEFAULT 0,
    \`sale\`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`isenabled\`                TINYINT(1)     NOT NULL DEFAULT 1,
    \`unit\`                     DECIMAL(18,4)  NOT NULL DEFAULT 1,
    \`reorder\`                  DECIMAL(18,4)  NOT NULL DEFAULT 1,
    \`description\`              TEXT           NULL,
    \`createdby\`                VARCHAR(36)    NOT NULL,
    \`category\`                 VARCHAR(36)    NULL,
    \`picture\`                  JSON           NULL,
    \`pictureby\`                VARCHAR(36)    NULL,
    \`status\`                   VARCHAR(50)    NOT NULL DEFAULT 'pending',
    \`modifiedby\`               VARCHAR(36)    NULL,
    \`createdAt\`                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_products_shop\` (\`shop\`),
    INDEX \`idx_products_suplier\` (\`suplier\`),
    INDEX \`idx_products_category\` (\`category\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`producthistory\` (
    \`id\`                       VARCHAR(36)    NOT NULL PRIMARY KEY,
    \`productId\`                VARCHAR(36)    NOT NULL,
    \`name\`                     VARCHAR(255)   NOT NULL,
    \`itemCode\`                 BIGINT         NULL,
    \`barCode\`                  BIGINT         NULL,
    \`suplier\`                  VARCHAR(36)    NOT NULL DEFAULT '',
    \`supliersGroup\`            VARCHAR(36)    NULL,
    \`shop\`                     VARCHAR(36)    NOT NULL DEFAULT '',
    \`onHand\`                   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`cost\`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`kharcha\`                  DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`iskharchaincludedinsale\`  TINYINT(1)     NOT NULL DEFAULT 1,
    \`markup\`                   JSON           NULL,
    \`tax\`                      JSON           NULL,
    \`istaxincludedinsale\`      TINYINT(1)     NOT NULL DEFAULT 1,
    \`ispricechangeallowed\`     TINYINT(1)     NOT NULL DEFAULT 1,
    \`isservice\`                TINYINT(1)     NOT NULL DEFAULT 0,
    \`sale\`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`isenabled\`                TINYINT(1)     NOT NULL DEFAULT 1,
    \`unit\`                     DECIMAL(18,4)  NOT NULL DEFAULT 1,
    \`description\`              TEXT           NULL,
    \`createdby\`                VARCHAR(36)    NOT NULL DEFAULT 'system',
    \`category\`                 VARCHAR(36)    NULL,
    \`picture\`                  JSON           NULL,
    \`pictureby\`                VARCHAR(36)    NULL,
    \`status\`                   VARCHAR(50)    NOT NULL DEFAULT 'pending',
    \`docType\`                  VARCHAR(50)    NULL,
    \`modifiedby\`               VARCHAR(36)    NULL,
    \`createdAt\`                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_ph_productId\` (\`productId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`stockadjustrequests\` (
    \`id\`            VARCHAR(36)   NOT NULL PRIMARY KEY,
    \`product\`       VARCHAR(36)   NOT NULL,
    \`productName\`   VARCHAR(255)  NOT NULL DEFAULT '',
    \`adjustType\`    VARCHAR(50)   NOT NULL DEFAULT 'increase',
    \`qty\`           DECIMAL(18,4) NOT NULL DEFAULT 0,
    \`onHandBefore\`  DECIMAL(18,4) NOT NULL DEFAULT 0,
    \`onHandAfter\`   DECIMAL(18,4) NOT NULL DEFAULT 0,
    \`reason\`        TEXT          NULL,
    \`requestedBy\`   VARCHAR(36)   NOT NULL DEFAULT '',
    \`status\`        VARCHAR(50)   NOT NULL DEFAULT 'pending',
    \`reviewedBy\`    VARCHAR(36)   NULL,
    \`reviewNote\`    TEXT          NULL,
    \`createdAt\`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_sar_product\` (\`product\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`documents\` (
    \`id\`            VARCHAR(36)    NOT NULL PRIMARY KEY,
    \`doctype\`       VARCHAR(100)   NOT NULL,
    \`user\`          VARCHAR(36)    NOT NULL,
    \`verifier\`      VARCHAR(36)    NULL,
    \`status\`        VARCHAR(50)    NOT NULL,
    \`date\`          VARCHAR(20)    NOT NULL,
    \`time\`          VARCHAR(50)    NOT NULL DEFAULT '',
    \`customer\`      VARCHAR(36)    NULL,
    \`customerGroup\` VARCHAR(36)    NULL,
    \`linkedShop\`    VARCHAR(36)    NOT NULL,
    \`subtotal\`      DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`discount\`      DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`totalamount\`   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`payment\`       JSON           NULL,
    \`amountpaid\`    DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`transaction\`   VARCHAR(36)    NULL,
    \`count\`         INT            NULL,
    \`createdAt\`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_documents_linkedShop\` (\`linkedShop\`),
    INDEX \`idx_documents_customer\` (\`customer\`),
    INDEX \`idx_documents_status\` (\`status\`),
    INDEX \`idx_documents_date\` (\`date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`documentnumbers\` (
    \`id\`    VARCHAR(36)  NOT NULL PRIMARY KEY,
    \`name\`  VARCHAR(255) NULL,
    \`count\` INT          NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`docitems\` (
    \`id\`           VARCHAR(36)    NOT NULL PRIMARY KEY,
    \`document\`     VARCHAR(36)    NOT NULL,
    \`productData\`  JSON           NULL,
    \`product\`      VARCHAR(36)    NOT NULL,
    \`cost\`         DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`expense\`      DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`costExpense\`  DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`tax\`          DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`discount\`     JSON           NULL,
    \`sale\`         DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`finalprice\`   DECIMAL(18,4)  NULL,
    \`qty\`          DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`costamount\`   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`saleamount\`   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`user\`         VARCHAR(36)    NOT NULL,
    \`createdAt\`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_docitems_document\` (\`document\`),
    INDEX \`idx_docitems_product\` (\`product\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`transactions\` (
    \`id\`                         VARCHAR(36)    NOT NULL PRIMARY KEY,
    \`currentCustomer\`            JSON           NOT NULL,
    \`user\`                       VARCHAR(36)    NULL,
    \`date\`                       VARCHAR(20)    NULL,
    \`transactionType\`            VARCHAR(100)   NULL,
    \`method\`                     VARCHAR(100)   NULL,
    \`amount\`                     DECIMAL(18,4)  NULL,
    \`trnsType\`                   VARCHAR(20)    NULL,
    \`oldBalance\`                 DECIMAL(18,4)  NULL,
    \`newBalance\`                 DECIMAL(18,4)  NULL,
    \`transactionCollectedFrom\`   VARCHAR(100)   NOT NULL DEFAULT 'counter',
    \`daysToClear\`                INT            NOT NULL DEFAULT 0,
    \`remarks\`                    TEXT           NULL,
    \`warning_date\`               DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`warning_resolved\`           TINYINT(1)     NOT NULL DEFAULT 1,
    \`warning_relation\`           VARCHAR(255)   NOT NULL DEFAULT '',
    \`deleting\`                   TINYINT(1)     NOT NULL DEFAULT 0,
    \`createdAt\`                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_transactions_date\` (\`date\`),
    INDEX \`idx_transactions_createdAt\` (\`createdAt\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`cashregister\` (
    \`id\`                         VARCHAR(36)    NOT NULL PRIMARY KEY,
    \`user\`                       VARCHAR(36)    NOT NULL DEFAULT '',
    \`customer\`                   VARCHAR(36)    NULL,
    \`shop\`                       VARCHAR(36)    NULL,
    \`document\`                   VARCHAR(36)    NULL,
    \`date\`                       VARCHAR(20)    NOT NULL,
    \`type\`                       VARCHAR(100)   NOT NULL,
    \`method\`                     VARCHAR(100)   NOT NULL,
    \`amount\`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    \`category\`                   VARCHAR(100)   NOT NULL DEFAULT 'calculate',
    \`givento\`                    VARCHAR(255)   NOT NULL DEFAULT '',
    \`transactionCollectedFrom\`   VARCHAR(100)   NOT NULL DEFAULT 'counter',
    \`createdAt\`                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_cr_shop\` (\`shop\`),
    INDEX \`idx_cr_customer\` (\`customer\`),
    INDEX \`idx_cr_date\` (\`date\`),
    INDEX \`idx_cr_category\` (\`category\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`history\` (
    \`id\`        VARCHAR(36)    NOT NULL PRIMARY KEY,
    \`shopName\`  VARCHAR(255)   NULL,
    \`lenehain\`  DECIMAL(18,4)  NULL,
    \`denehain\`  DECIMAL(18,4)  NULL,
    \`createdAt\` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`counters\` (
    \`id\`    VARCHAR(36)  NOT NULL PRIMARY KEY,
    \`name\`  VARCHAR(255) NULL,
    \`count\` INT          NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
`

// ─── Mongoose schema stubs (schema-less read) ────────────────────────────────

const Schema = mongoose.Schema
const anySchema = new Schema({}, { strict: false, timestamps: true })

function model(name, collection) {
    try { return mongoose.model(name) }
    catch (_) { return mongoose.model(name, anySchema, collection) }
}

// ─── progress helper ─────────────────────────────────────────────────────────

function progress(current, total) {
    if (total === 0) return
    const pct = Math.floor((current / total) * 100)
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5))
    process.stdout.write(`\r  [${bar}] ${pct}% (${current}/${total})`)
    if (current === total) process.stdout.write('\n')
}

// ─── main ────────────────────────────────────────────────────────────────────

async function run() {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log('MongoDB connected.')

    console.log('Connecting to MySQL...')
    // Create pool without multipleStatements for normal queries
    const pool = await mysql.createPool({ ...dbConfig, multipleStatements: true })
    console.log('MySQL connected.')

    // ── Create schema ────────────────────────────────────────────────────────
    console.log('\nCreating tables (if not exist)...')
    const statements = SCHEMA_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0)
    for (const stmt of statements) {
        await pool.query(stmt)
    }
    console.log('Tables ready.\n')

    // Disable FK checks for fast bulk insert
    await pool.query('SET FOREIGN_KEY_CHECKS = 0')

    // ── shops ────────────────────────────────────────────────────────────────
    const ShopM = model('Shop', 'shops')
    const shops = await ShopM.find({}).lean()
    console.log(`Migrating ${shops.length} shops...`)
    for (let i = 0; i < shops.length; i++) {
        const s = shops[i]
        await upsert(pool, 'shops', {
            id:        id(s._id),
            shopName:  str(s.shopName),
            customers: num(s.customers) || 0,
            lenehain:  num(s.lenehain)  || 0,
            denehain:  num(s.denehain)  || 0,
            createdAt: s.createdAt || new Date(),
            updatedAt: s.updatedAt || new Date(),
        })
        progress(i + 1, shops.length)
    }

    // ── users ────────────────────────────────────────────────────────────────
    const UserM = model('User', 'users')
    const users = await UserM.find({}).lean()
    console.log(`Migrating ${users.length} users...`)
    for (let i = 0; i < users.length; i++) {
        const u = users[i]
        await upsert(pool, 'users', {
            id:             id(u._id),
            username:       str(u.username),
            email:          str(u.email),
            password:       str(u.password),
            shops:          json(u.shops || []),
            job:            str(u.job) || 'Normal User',
            permissions:    json(u.permissions || []),
            profilepicture: str(u.profilepicture) || '/images/userprofilepicture/default.jpg',
            rfid:           str(u.rfid) || '',
            fingerprint:    str(u.fingerprint) || '',
            createdAt:      u.createdAt || new Date(),
            updatedAt:      u.updatedAt || new Date(),
        })
        progress(i + 1, users.length)
    }

    // ── customers ────────────────────────────────────────────────────────────
    const CustomerM = model('Customer', 'customers')
    const customers = await CustomerM.find({}).lean()
    console.log(`Migrating ${customers.length} customers...`)
    for (let i = 0; i < customers.length; i++) {
        const c = customers[i]
        await upsert(pool, 'customers', {
            id:                   id(c._id),
            customerName:         str(c.customerName),
            customerMobileNumber: num(c.customerMobileNumber),
            leneHain:             num(c.leneHain) || 0,
            deneHain:             num(c.deneHain) || 0,
            balance:              num(c.balance)  || 0,
            customerType:         str(c.customerType),
            customerCnic:         num(c.customerCnic),
            customerEmail:        str(c.customerEmail),
            customerAddress:      str(c.customerAddress),
            linkedShop:           id(c.linkedShop),
            status:               c.status !== false ? 1 : 0,
            createdAt:            c.createdAt || new Date(),
            updatedAt:            c.updatedAt || new Date(),
        })
        progress(i + 1, customers.length)
    }

    // ── customergroups ───────────────────────────────────────────────────────
    const CGroupM = model('CustomerGroup', 'customergroups')
    const cgroups = await CGroupM.find({}).lean()
    console.log(`Migrating ${cgroups.length} customer groups...`)
    for (let i = 0; i < cgroups.length; i++) {
        const g = cgroups[i]
        await upsert(pool, 'customergroups', {
            id:                   id(g._id),
            customerName:         str(g.customerName),
            customerMobileNumber: num(g.customerMobileNumber),
            customerType:         str(g.customerType),
            customerCnic:         num(g.customerCnic),
            customerEmail:        str(g.customerEmail),
            customerAddress:      str(g.customerAddress),
            createdAt:            g.createdAt || new Date(),
            updatedAt:            g.updatedAt || new Date(),
        })
        const ids = Array.isArray(g.ids) ? g.ids : []
        for (const entry of ids) {
            const cid = id(entry.customerID)
            const sid = id(entry.shopID)
            if (!cid || !sid) continue
            await pool.query(
                'INSERT IGNORE INTO `customergroup_ids` (groupId, customerID, shopID) VALUES (?,?,?)',
                [id(g._id), cid, sid]
            )
        }
        progress(i + 1, cgroups.length)
    }

    // ── categories ───────────────────────────────────────────────────────────
    const CatM = model('Category', 'categories')
    const cats = await CatM.find({}).lean()
    console.log(`Migrating ${cats.length} categories...`)
    for (let i = 0; i < cats.length; i++) {
        const c = cats[i]
        await upsert(pool, 'categories', {
            id:          id(c._id),
            name:        str(c.name),
            description: str(c.description),
            shop:        id(c.shop),
            enabled:     c.enabled !== false ? 1 : 0,
            products:    num(c.products) || 0,
            createdAt:   c.createdAt || new Date(),
            updatedAt:   c.updatedAt || new Date(),
        })
        progress(i + 1, cats.length)
    }

    // ── paymentmethods ───────────────────────────────────────────────────────
    const PmM = model('PaymentMethod', 'paymentmethods')
    const pms = await PmM.find({}).lean()
    console.log(`Migrating ${pms.length} payment methods...`)
    for (let i = 0; i < pms.length; i++) {
        const p = pms[i]
        await upsert(pool, 'paymentmethods', {
            id:                  id(p._id),
            name:                str(p.name),
            description:         str(p.description),
            shop:                id(p.shop),
            iscustomerrequired:  bool(p.iscustomerrequired),
            enabled:             p.enabled !== false ? 1 : 0,
            bills:               num(p.bills) || 0,
            createdAt:           p.createdAt || new Date(),
            updatedAt:           p.updatedAt || new Date(),
        })
        progress(i + 1, pms.length)
    }

    // ── saletypes ────────────────────────────────────────────────────────────
    const StM = model('SaleType', 'saletypes')
    const sts = await StM.find({}).lean()
    console.log(`Migrating ${sts.length} sale types...`)
    for (let i = 0; i < sts.length; i++) {
        const s = sts[i]
        await upsert(pool, 'saletypes', {
            id:          id(s._id),
            name:        str(s.name),
            description: str(s.description),
            shop:        id(s.shop),
            createdAt:   s.createdAt || new Date(),
            updatedAt:   s.updatedAt || new Date(),
        })
        progress(i + 1, sts.length)
    }

    // ── products ─────────────────────────────────────────────────────────────
    const ProdM = model('Product', 'products')
    const prods = await ProdM.find({}).lean()
    console.log(`Migrating ${prods.length} products...`)
    for (let i = 0; i < prods.length; i++) {
        const p = prods[i]
        await upsert(pool, 'products', {
            id:                      id(p._id),
            name:                    str(p.name),
            itemCode:                num(p.itemCode),
            barCode:                 num(p.barCode),
            suplier:                 id(p.suplier),
            supliersGroup:           id(p.supliersGroup),
            shop:                    id(p.shop),
            onHand:                  num(p.onHand) || 0,
            cost:                    num(p.cost)   || 0,
            kharcha:                 num(p.kharcha) || 0,
            iskharchaincludedinsale: bool(p.iskharchaincludedinsale),
            markup:                  json(p.markup),
            tax:                     json(p.tax),
            istaxincludedinsale:     bool(p.istaxincludedinsale),
            ispricechangeallowed:    bool(p.ispricechangeallowed !== false),
            isservice:               bool(p.isservice),
            sale:                    num(p.sale) || 0,
            isenabled:               bool(p.isenabled !== false),
            unit:                    num(p.unit) || 1,
            reorder:                 num(p.reorder) || 1,
            description:             str(p.description),
            createdby:               id(p.createdby) || 'system',
            category:                id(p.category),
            picture:                 json(p.picture),
            pictureby:               id(p.pictureby),
            status:                  str(p.status) || 'pending',
            modifiedby:              id(p.modifiedby),
            createdAt:               p.createdAt || new Date(),
            updatedAt:               p.updatedAt || new Date(),
        })
        progress(i + 1, prods.length)
    }

    // ── producthistory ───────────────────────────────────────────────────────
    const PhM = model('ProductHistory', 'producthistories')
    const phs = await PhM.find({}).lean()
    console.log(`Migrating ${phs.length} product history records...`)
    for (let i = 0; i < phs.length; i++) {
        const p = phs[i]
        await upsert(pool, 'producthistory', {
            id:                      id(p._id),
            productId:               id(p.id || p.productId) || id(p._id),
            name:                    str(p.name),
            itemCode:                num(p.itemCode),
            barCode:                 num(p.barCode),
            suplier:                 str(id(p.suplier)) || '',
            supliersGroup:           id(p.supliersGroup),
            shop:                    str(id(p.shop)) || '',
            onHand:                  num(p.onHand) || 0,
            cost:                    num(p.cost) || 0,
            kharcha:                 num(p.kharcha) || 0,
            iskharchaincludedinsale: bool(p.iskharchaincludedinsale),
            markup:                  json(p.markup),
            tax:                     json(p.tax),
            istaxincludedinsale:     bool(p.istaxincludedinsale),
            ispricechangeallowed:    bool(p.ispricechangeallowed !== false),
            isservice:               bool(p.isservice),
            sale:                    num(p.sale) || 0,
            isenabled:               bool(p.isenabled !== false),
            unit:                    num(p.unit) || 1,
            description:             str(p.description),
            createdby:               str(id(p.createdby)) || 'system',
            category:                id(p.category),
            picture:                 json(p.picture),
            pictureby:               id(p.pictureby),
            status:                  str(p.status) || 'pending',
            docType:                 str(p.docType),
            modifiedby:              id(p.modifiedby),
            createdAt:               p.createdAt || new Date(),
            updatedAt:               p.updatedAt || new Date(),
        })
        if ((i + 1) % 1000 === 0 || i + 1 === phs.length) progress(i + 1, phs.length)
    }

    // ── documents ────────────────────────────────────────────────────────────
    const DocM = model('Document', 'documents')
    const docs = await DocM.find({}).lean()
    console.log(`Migrating ${docs.length} documents...`)
    for (let i = 0; i < docs.length; i++) {
        const d = docs[i]
        await upsert(pool, 'documents', {
            id:            id(d._id),
            doctype:       str(d.doctype),
            user:          id(d.user) || 'system',
            verifier:      id(d.verifier),
            status:        str(d.status),
            date:          str(d.date),
            time:          str(d.time) || '',
            customer:      id(d.customer),
            customerGroup: id(d.customerGroup),
            linkedShop:    id(d.linkedShop),
            subtotal:      num(d.subtotal) || 0,
            discount:      num(d.discount) || 0,
            totalamount:   num(d.totalamount) || 0,
            payment:       json(d.payment),
            amountpaid:    num(d.amountpaid) || 0,
            transaction:   id(d.transaction),
            count:         num(d.count),
            createdAt:     d.createdAt || new Date(),
            updatedAt:     d.updatedAt || new Date(),
        })
        if ((i + 1) % 1000 === 0 || i + 1 === docs.length) progress(i + 1, docs.length)
    }

    // ── document numbers ─────────────────────────────────────────────────────
    const DnM = model('DocumentNumber', 'documentnumbers')
    const dns = await DnM.find({}).lean()
    console.log(`Migrating ${dns.length} document number records...`)
    for (let i = 0; i < dns.length; i++) {
        const d = dns[i]
        await upsert(pool, 'documentnumbers', {
            id:    id(d._id),
            name:  str(d.name),
            count: num(d.count) || 1,
        })
        progress(i + 1, dns.length)
    }

    // ── docitems ─────────────────────────────────────────────────────────────
    const DiM = model('DocumentItem', 'docitems')
    const dis = await DiM.find({}).lean()
    console.log(`Migrating ${dis.length} document items...`)
    for (let i = 0; i < dis.length; i++) {
        const d = dis[i]
        await upsert(pool, 'docitems', {
            id:          id(d._id),
            document:    id(d.document),
            productData: json(d.productData),
            product:     id(d.product) || 'unknown',
            cost:        num(d.cost) || 0,
            expense:     num(d.expense) || 0,
            costExpense: num(d.costExpense) || 0,
            tax:         num(d.tax) || 0,
            discount:    json(d.discount),
            sale:        num(d.sale) || 0,
            finalprice:  num(d.finalprice),
            qty:         num(d.qty) || 0,
            costamount:  num(d.costamount) || 0,
            saleamount:  num(d.saleamount) || 0,
            user:        id(d.user) || 'system',
            createdAt:   d.createdAt || new Date(),
            updatedAt:   d.updatedAt || new Date(),
        })
        if ((i + 1) % 1000 === 0 || i + 1 === dis.length) progress(i + 1, dis.length)
    }

    // ── transactions ─────────────────────────────────────────────────────────
    const TrM = model('Transaction', 'transactions')
    const trs = await TrM.find({}).lean()
    console.log(`Migrating ${trs.length} transactions...`)
    for (let i = 0; i < trs.length; i++) {
        const t = trs[i]
        const cc = t.currentCustomer
        const ccJson = json(cc ? {
            _id: id(cc._id || cc),
            id:  id(cc._id || cc),
            customerName:         cc.customerName,
            customerMobileNumber: cc.customerMobileNumber,
            balance:              cc.balance,
            leneHain:             cc.leneHain,
            deneHain:             cc.deneHain,
            linkedShop:           id(cc.linkedShop),
            customerType:         cc.customerType,
        } : {})
        const w = t.warning || {}
        await upsert(pool, 'transactions', {
            id:                      id(t._id),
            currentCustomer:         ccJson,
            user:                    id(t.user),
            date:                    str(t.date),
            transactionType:         str(t.transactionType),
            method:                  str(t.method),
            amount:                  num(t.amount),
            trnsType:                str(t.trnsType),
            oldBalance:              num(t.oldBalance),
            newBalance:              num(t.newBalance),
            transactionCollectedFrom: str(t.transactionCollectedFrom) || 'counter',
            daysToClear:             num(t.daysToClear) || 0,
            remarks:                 str(t.remarks) || '',
            warning_date:            num(w.date) || 0,
            warning_resolved:        bool(w.resolved !== false),
            warning_relation:        str(w.relation) || '',
            deleting:                bool(t.deleting),
            createdAt:               t.createdAt || new Date(),
            updatedAt:               t.updatedAt || new Date(),
        })
        if ((i + 1) % 1000 === 0 || i + 1 === trs.length) progress(i + 1, trs.length)
    }

    // ── cashregister ─────────────────────────────────────────────────────────
    const CrM = model('CashRegister', 'cashregisters')
    const crs = await CrM.find({}).lean()
    console.log(`Migrating ${crs.length} cash register entries...`)
    for (let i = 0; i < crs.length; i++) {
        const c = crs[i]
        await upsert(pool, 'cashregister', {
            id:                      id(c._id),
            user:                    id(c.user) || '',
            customer:                id(c.customer),
            shop:                    id(c.shop),
            document:                id(c.document),
            date:                    str(c.date),
            type:                    str(c.type),
            method:                  str(c.method),
            amount:                  num(c.amount) || 0,
            category:                str(c.category) || 'calculate',
            givento:                 str(c.givento) || '',
            transactionCollectedFrom: str(c.transactionCollectedFrom) || 'counter',
            createdAt:               c.createdAt || new Date(),
            updatedAt:               c.updatedAt || new Date(),
        })
        if ((i + 1) % 1000 === 0 || i + 1 === crs.length) progress(i + 1, crs.length)
    }

    // ── history ──────────────────────────────────────────────────────────────
    const HisM = model('History', 'histories')
    const hiss = await HisM.find({}).lean()
    console.log(`Migrating ${hiss.length} history records...`)
    for (let i = 0; i < hiss.length; i++) {
        const h = hiss[i]
        await upsert(pool, 'history', {
            id:        id(h._id),
            shopName:  str(h.shopName),
            lenehain:  num(h.lenehain),
            denehain:  num(h.denehain),
            createdAt: h.createdAt || new Date(),
            updatedAt: h.updatedAt || new Date(),
        })
        if ((i + 1) % 1000 === 0 || i + 1 === hiss.length) progress(i + 1, hiss.length)
    }

    // ── counters ─────────────────────────────────────────────────────────────
    const CntM = model('Counter', 'counters')
    const cnts = await CntM.find({}).lean()
    console.log(`Migrating ${cnts.length} counters...`)
    for (let i = 0; i < cnts.length; i++) {
        const c = cnts[i]
        await upsert(pool, 'counters', {
            id:    id(c._id),
            name:  str(c.name),
            count: num(c.count) || 1,
        })
        progress(i + 1, cnts.length)
    }

    // ── stock adjust requests ─────────────────────────────────────────────────
    const SarM = model('StockAdjustRequest', 'stockadjustrequests')
    const sars = await SarM.find({}).lean()
    console.log(`Migrating ${sars.length} stock adjust requests...`)
    for (let i = 0; i < sars.length; i++) {
        const s = sars[i]
        await upsert(pool, 'stockadjustrequests', {
            id:           id(s._id),
            product:      id(s.product) || 'unknown',
            productName:  str(s.productName) || '',
            adjustType:   str(s.adjustType) || 'increase',
            qty:          num(s.qty) || 0,
            onHandBefore: num(s.onHandBefore) || 0,
            onHandAfter:  num(s.onHandAfter)  || 0,
            reason:       str(s.reason),
            requestedBy:  id(s.requestedBy) || '',
            status:       str(s.status) || 'pending',
            reviewedBy:   id(s.reviewedBy),
            reviewNote:   str(s.reviewNote),
            createdAt:    s.createdAt || new Date(),
            updatedAt:    s.updatedAt || new Date(),
        })
        progress(i + 1, sars.length)
    }

    // Re-enable FK checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1')

    console.log('\nMigration complete!')
    await mongoose.disconnect()
    await pool.end()
}

run().catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
})
