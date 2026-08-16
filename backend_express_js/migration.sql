-- ============================================================
-- Cyber Khata POS - MySQL Migration Script
-- Migrates from MongoDB to MySQL (schema: cyber_khata)
-- Run this file against MySQL at localhost:3306
-- ============================================================

CREATE DATABASE IF NOT EXISTS `cyber_khata`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cyber_khata`;

-- ------------------------------------------------------------
-- shops
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shops` (
    `id`         VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `shopName`   VARCHAR(255)   NOT NULL UNIQUE,
    `customers`  INT            NOT NULL DEFAULT 0,
    `lenehain`   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `denehain`   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `createdAt`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id`             VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `username`       VARCHAR(255)  NOT NULL,
    `email`          VARCHAR(255)  NOT NULL UNIQUE,
    `password`       VARCHAR(255)  NOT NULL,
    `shops`          JSON          NULL,
    `job`            VARCHAR(100)  NOT NULL DEFAULT 'Normal User',
    `permissions`    JSON          NULL,
    `profilepicture` VARCHAR(500)  NOT NULL DEFAULT '/images/userprofilepicture/default.jpg',
    `rfid`           VARCHAR(255)  NOT NULL DEFAULT '',
    `fingerprint`    VARCHAR(255)  NOT NULL DEFAULT '',
    `createdAt`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
    `id`                     VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `customerName`           VARCHAR(255)   NULL,
    `customerMobileNumber`   BIGINT         NULL,
    `leneHain`               DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `deneHain`               DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `balance`                DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `customerType`           VARCHAR(100)   NULL,
    `customerCnic`           BIGINT         NULL,
    `customerEmail`          VARCHAR(255)   NULL,
    `customerAddress`        TEXT           NULL,
    `linkedShop`             VARCHAR(36)    NOT NULL,
    `status`                 TINYINT(1)     NOT NULL DEFAULT 1,
    `createdAt`              DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`              DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_customers_linkedShop` (`linkedShop`),
    INDEX `idx_customers_balance` (`balance`),
    CONSTRAINT `fk_customers_shop` FOREIGN KEY (`linkedShop`) REFERENCES `shops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- customergroups
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customergroups` (
    `id`                   VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `customerName`         VARCHAR(255)  NULL,
    `customerMobileNumber` BIGINT        NULL,
    `customerType`         VARCHAR(100)  NULL,
    `customerCnic`         BIGINT        NULL,
    `customerEmail`        VARCHAR(255)  NULL,
    `customerAddress`      TEXT          NULL,
    `createdAt`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Junction table for customergroup <-> customer/shop pairs
CREATE TABLE IF NOT EXISTS `customergroup_ids` (
    `id`              INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `groupId`         VARCHAR(36)   NOT NULL,
    `customerID`      VARCHAR(36)   NOT NULL,
    `shopID`          VARCHAR(36)   NOT NULL,
    INDEX `idx_cgids_groupId` (`groupId`),
    INDEX `idx_cgids_shopID` (`shopID`),
    CONSTRAINT `fk_cgids_group`    FOREIGN KEY (`groupId`)    REFERENCES `customergroups` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cgids_customer` FOREIGN KEY (`customerID`) REFERENCES `customers` (`id`)      ON DELETE CASCADE,
    CONSTRAINT `fk_cgids_shop`     FOREIGN KEY (`shopID`)     REFERENCES `shops` (`id`)          ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `id`          VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `name`        VARCHAR(255)  NOT NULL,
    `description` TEXT          NULL,
    `shop`        VARCHAR(36)   NOT NULL,
    `enabled`     TINYINT(1)    NOT NULL DEFAULT 1,
    `products`    INT           NOT NULL DEFAULT 0,
    `createdAt`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_category_name_shop` (`name`, `shop`),
    INDEX `idx_categories_shop` (`shop`),
    CONSTRAINT `fk_categories_shop` FOREIGN KEY (`shop`) REFERENCES `shops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- paymentmethods
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `paymentmethods` (
    `id`                   VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `name`                 VARCHAR(255)  NOT NULL,
    `description`          TEXT          NULL,
    `shop`                 VARCHAR(36)   NOT NULL,
    `iscustomerrequired`   TINYINT(1)    NOT NULL DEFAULT 0,
    `enabled`              TINYINT(1)    NOT NULL DEFAULT 1,
    `bills`                INT           NOT NULL DEFAULT 0,
    `createdAt`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_pm_name_shop` (`name`, `shop`),
    INDEX `idx_pm_shop` (`shop`),
    CONSTRAINT `fk_pm_shop` FOREIGN KEY (`shop`) REFERENCES `shops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- saletypes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `saletypes` (
    `id`          VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `name`        VARCHAR(255)  NOT NULL UNIQUE,
    `description` TEXT          NULL,
    `shop`        VARCHAR(36)   NOT NULL,
    `createdAt`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_saletypes_shop` (`shop`),
    CONSTRAINT `fk_saletypes_shop` FOREIGN KEY (`shop`) REFERENCES `shops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id`                       VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `name`                     VARCHAR(255)   NOT NULL,
    `itemCode`                 BIGINT         NULL,
    `barCode`                  BIGINT         NULL,
    `suplier`                  VARCHAR(36)    NULL,
    `supliersGroup`            VARCHAR(36)    NULL,
    `shop`                     VARCHAR(36)    NOT NULL,
    `onHand`                   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `cost`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `kharcha`                  DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `iskharchaincludedinsale`  TINYINT(1)     NOT NULL DEFAULT 1,
    `markup`                   JSON           NULL,
    `tax`                      JSON           NULL,
    `istaxincludedinsale`      TINYINT(1)     NOT NULL DEFAULT 1,
    `ispricechangeallowed`     TINYINT(1)     NOT NULL DEFAULT 1,
    `isservice`                TINYINT(1)     NOT NULL DEFAULT 0,
    `sale`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `isenabled`                TINYINT(1)     NOT NULL DEFAULT 1,
    `unit`                     DECIMAL(18,4)  NOT NULL DEFAULT 1,
    `reorder`                  DECIMAL(18,4)  NOT NULL DEFAULT 1,
    `description`              TEXT           NULL,
    `createdby`                VARCHAR(36)    NOT NULL,
    `category`                 VARCHAR(36)    NULL,
    `picture`                  JSON           NULL,
    `pictureby`                VARCHAR(36)    NULL,
    `status`                   VARCHAR(50)    NOT NULL DEFAULT 'pending',
    `modifiedby`               VARCHAR(36)    NULL,
    `createdAt`                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_products_shop` (`shop`),
    INDEX `idx_products_suplier` (`suplier`),
    INDEX `idx_products_category` (`category`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- producthistory
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `producthistory` (
    `id`                       VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `productId`                VARCHAR(36)    NOT NULL,
    `name`                     VARCHAR(255)   NOT NULL,
    `itemCode`                 BIGINT         NULL,
    `barCode`                  BIGINT         NULL,
    `suplier`                  VARCHAR(36)    NOT NULL,
    `supliersGroup`            VARCHAR(36)    NULL,
    `shop`                     VARCHAR(36)    NOT NULL,
    `onHand`                   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `cost`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `kharcha`                  DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `iskharchaincludedinsale`  TINYINT(1)     NOT NULL DEFAULT 1,
    `markup`                   JSON           NULL,
    `tax`                      JSON           NULL,
    `istaxincludedinsale`      TINYINT(1)     NOT NULL DEFAULT 1,
    `ispricechangeallowed`     TINYINT(1)     NOT NULL DEFAULT 1,
    `isservice`                TINYINT(1)     NOT NULL DEFAULT 0,
    `sale`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `isenabled`                TINYINT(1)     NOT NULL DEFAULT 1,
    `unit`                     DECIMAL(18,4)  NOT NULL DEFAULT 1,
    `description`              TEXT           NULL,
    `createdby`                VARCHAR(36)    NOT NULL,
    `category`                 VARCHAR(36)    NULL,
    `picture`                  JSON           NULL,
    `pictureby`                VARCHAR(36)    NULL,
    `status`                   VARCHAR(50)    NOT NULL DEFAULT 'pending',
    `docType`                  VARCHAR(50)    NULL,
    `modifiedby`               VARCHAR(36)    NULL,
    `createdAt`                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_ph_productId` (`productId`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- stockadjustrequests
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stockadjustrequests` (
    `id`            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `product`       VARCHAR(36)   NOT NULL,
    `productName`   VARCHAR(255)  NOT NULL,
    `adjustType`    ENUM('increase','decrease') NOT NULL,
    `qty`           DECIMAL(18,4) NOT NULL,
    `onHandBefore`  DECIMAL(18,4) NOT NULL,
    `onHandAfter`   DECIMAL(18,4) NOT NULL,
    `reason`        TEXT          NULL,
    `requestedBy`   VARCHAR(36)   NOT NULL,
    `status`        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    `reviewedBy`    VARCHAR(36)   NULL,
    `reviewNote`    TEXT          NULL,
    `createdAt`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_sar_product` (`product`),
    INDEX `idx_sar_requestedBy` (`requestedBy`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- documents
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `documents` (
    `id`            VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `doctype`       VARCHAR(100)   NOT NULL,
    `user`          VARCHAR(36)    NOT NULL,
    `verifier`      VARCHAR(36)    NULL,
    `status`        VARCHAR(50)    NOT NULL,
    `date`          VARCHAR(20)    NOT NULL,
    `time`          VARCHAR(50)    NOT NULL DEFAULT '',
    `customer`      VARCHAR(36)    NULL,
    `customerGroup` VARCHAR(36)    NULL,
    `linkedShop`    VARCHAR(36)    NOT NULL,
    `subtotal`      DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `discount`      DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `totalamount`   DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `payment`       JSON           NULL,
    `amountpaid`    DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `transaction`   VARCHAR(36)    NULL,
    `count`         INT            NULL,
    `createdAt`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_documents_linkedShop` (`linkedShop`),
    INDEX `idx_documents_customer` (`customer`),
    INDEX `idx_documents_status` (`status`),
    INDEX `idx_documents_date` (`date`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- documentnumbers  (counter for document numbering)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `documentnumbers` (
    `id`    VARCHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `name`  VARCHAR(255) NULL,
    `count` INT          NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- docitems  (document line items)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `docitems` (
    `id`           VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `document`     VARCHAR(36)    NOT NULL,
    `productData`  JSON           NULL,
    `product`      VARCHAR(36)    NOT NULL,
    `cost`         DECIMAL(18,4)  NOT NULL,
    `expense`      DECIMAL(18,4)  NOT NULL,
    `costExpense`  DECIMAL(18,4)  NOT NULL,
    `tax`          DECIMAL(18,4)  NOT NULL,
    `discount`     JSON           NULL,
    `sale`         DECIMAL(18,4)  NOT NULL,
    `finalprice`   DECIMAL(18,4)  NULL,
    `qty`          DECIMAL(18,4)  NOT NULL,
    `costamount`   DECIMAL(18,4)  NOT NULL,
    `saleamount`   DECIMAL(18,4)  NOT NULL,
    `user`         VARCHAR(36)    NOT NULL,
    `createdAt`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_docitems_document` (`document`),
    INDEX `idx_docitems_product` (`product`),
    CONSTRAINT `fk_docitems_document` FOREIGN KEY (`document`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- transactions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
    `id`                         VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `currentCustomer`            JSON           NOT NULL,
    `user`                       VARCHAR(36)    NULL,
    `date`                       VARCHAR(20)    NULL,
    `transactionType`            VARCHAR(100)   NULL,
    `method`                     VARCHAR(100)   NULL,
    `amount`                     DECIMAL(18,4)  NULL,
    `trnsType`                   VARCHAR(20)    NULL,
    `oldBalance`                 DECIMAL(18,4)  NULL,
    `newBalance`                 DECIMAL(18,4)  NULL,
    `transactionCollectedFrom`   VARCHAR(100)   NOT NULL DEFAULT 'counter',
    `daysToClear`                INT            NOT NULL DEFAULT 0,
    `remarks`                    TEXT           NULL,
    `warning_date`               DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `warning_resolved`           TINYINT(1)     NOT NULL DEFAULT 1,
    `warning_relation`           VARCHAR(255)   NOT NULL DEFAULT '',
    `deleting`                   TINYINT(1)     NOT NULL DEFAULT 0,
    `createdAt`                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_transactions_date` (`date`),
    INDEX `idx_transactions_createdAt` (`createdAt`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- cashregister
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cashregister` (
    `id`                         VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `user`                       VARCHAR(36)    NOT NULL,
    `customer`                   VARCHAR(36)    NULL,
    `shop`                       VARCHAR(36)    NULL,
    `document`                   VARCHAR(36)    NULL,
    `date`                       VARCHAR(20)    NOT NULL,
    `type`                       VARCHAR(100)   NOT NULL,
    `method`                     VARCHAR(100)   NOT NULL,
    `amount`                     DECIMAL(18,4)  NOT NULL DEFAULT 0,
    `category`                   VARCHAR(100)   NOT NULL DEFAULT 'calculate',
    `givento`                    VARCHAR(255)   NOT NULL DEFAULT '',
    `transactionCollectedFrom`   VARCHAR(100)   NOT NULL DEFAULT 'counter',
    `createdAt`                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cr_shop` (`shop`),
    INDEX `idx_cr_customer` (`customer`),
    INDEX `idx_cr_date` (`date`),
    INDEX `idx_cr_category` (`category`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- history  (shop balance snapshots)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `history` (
    `id`        VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `shopName`  VARCHAR(255)   NULL,
    `lenehain`  DECIMAL(18,4)  NULL,
    `denehain`  DECIMAL(18,4)  NULL,
    `createdAt` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- counters  (auto-increment helpers for product item codes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `counters` (
    `id`    VARCHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `name`  VARCHAR(255) NULL,
    `count` INT          NOT NULL DEFAULT 1
) ENGINE=InnoDB;
