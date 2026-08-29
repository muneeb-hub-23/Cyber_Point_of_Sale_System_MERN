use cyber_khata;
-- =============================================================
-- Bulk reset negative product stock to zero for a single shop
-- and create approved stock-adjust entries for each product.
-- Runs in a single transaction.
-- =============================================================
-- 1. Set your parameters at the top
SET @shopId      = '66fabdcb4b2b9081a705bb1a';
SET @requestedBy = '6773a7ab5cdbe2a1c2025cc7';
SET @reviewedBy  = '6773a7ab5cdbe2a1c2025cc7';
SET @reason      = 'Stock correction: negative on-hand reset to zero';
SET @reviewNote  = 'Bulk auto-approved adjustment';

START TRANSACTION;

-- Create an approved stock-adjust request for every product with negative onHand.
-- adjustType = 'increase' because going from -N to 0 is an increase of N units.
INSERT INTO stockadjustrequests
    (id, product, productName, adjustType, qty, onHandBefore, onHandAfter, reason, requestedBy, status, reviewedBy, reviewNote)
SELECT
    UUID()                             AS id,
    p.id,
    p.name,
    'increase'                         AS adjustType,
    ABS(p.onHand)                      AS qty,
    p.onHand                           AS onHandBefore,
    0                                  AS onHandAfter,
    @reason                            AS reason,
    @requestedBy                       AS requestedBy,
    'approved'                         AS status,
    @reviewedBy                        AS reviewedBy,
    @reviewNote                        AS reviewNote
FROM products p
WHERE p.shop   = @shopId
  AND p.onHand < 0;

-- Set the actual product onHand to zero for the same rows.
UPDATE products
SET onHand = 0
WHERE shop   = @shopId
  AND onHand < 0;

COMMIT;
