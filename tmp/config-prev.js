/**
 * UNIFIED SALES DASHBOARD - CONFIGURATION FILE
 * * Instructions:
 * 1. Make sure this file is in the SAME folder as your index.html
 * 2. Make sure all your data files (.xlsx) are inside the DATA_FOLDER.
 */

window.DASHBOARD_CONFIG = {

    // 1. Define the folder path for all data files
    DATA_FOLDER: 'sales_data',

    // 2. Define the Customer Master filename (must be in DATA_FOLDER)
    CUSTOMER_MASTER_FILE: 'Customer_Master_Report_24092025.xlsx',

    // 3. Define all Invoice Data files to load (must be in DATA_FOLDER)
    // As requested, this is set to load only "invoice.xlsx".
    INVOICE_DATA_FILES: [
      'invoice.xlsx'
    ],

    // 4. Product list for 'High-Volume' & 'Unbilled' filters
    // These products are NON-CORE and are EXCLUDED from the 9 Ltr total.
    EXCLUDED_PRODUCTS_LIST: [
      'TW SHINER SPONGE',
      'CHAIN LUBE',
      'CHAIN CLEANER',
      'BRAKE CLEANER',
      'FUELINJECT',
      'ANTI RUST LUB SPRAY',
      'THROTTLEBODYCLEANER',
      'MICRO FBR CLOTH',
      'AIOHELMET CLEANER',
      'TW SHINER 3 IN 1'
    ],

    // 5. Product list for 'Power1 Customer Count' filter
    // (This checks for an EXACT match on the product name)
    POWER1_PRODUCTS_LIST: [
      "POWER1 4T 10W-30, 10X.9L MK",
      "POWER1 4T 10W-30, 10X1L MK",
      "POWER1 4T 15W-40, 10X1L MK",
      "POWER1 CRUISE4T 20W50 10X1.2HMK",
      "POWER1 CRUISE 4T20W-50,10X1L",
      "POWER1 ULTIMATE4T10W-40,6X1LMK",
      "POWER1CRUISE4T 15W50,4X2.5L MK"
    ],
    
    // 6. Brand lists for 'Count' filters
    // (These checks look for brand names that *contain* these words, case-insensitive)
    
    // 'Activ' Filter:
    ACTIV_BRANDS_INCLUDE: [
        'ACTIV'
    ],
    ACTIV_BRANDS_EXCLUDE: [
        'ACTIV ESSENTIAL'
    ],
    
    // 'Magnatec' Filter: UPDATED with all 3 brands
    MAGNATEC_BRANDS_INCLUDE: [
        'MAGNATEC', 
        'MAGNTEC SUV', 
        'MAGNATEC DIESEL'
    ],
    
    // 'CRB' Filter:
    CRB_BRANDS_INCLUDE: [
        'CRB TURBOMAX'
    ],
    
    // 'Autocare' Filter: (with correct space spelling)
    AUTOCARE_BRANDS_INCLUDE: [
      'AUTO CARE EXTERIOR',
      'AUTO CARE MAINTENANCE'
    ],

    // 7. Column Header Mappings
    // These MUST exactly match the headers in your Excel files.
    COLUMNS: {
        // --- Invoice Data File Columns ---
        INVOICE_DATE: 'Invoice Date',
        SE_NAME: 'Sales Executive Name',
        CUSTOMER_NAME: 'Customer Name',
        CUSTOMER_CODE: 'Customer Code',
        BRAND_NAME: 'Product Brand Name',
        PRODUCT_NAME: 'Product Name',
        PRODUCT_VOLUME: 'Product Volume',
        PACK_SIZE: 'Pack Size',
        TOTAL_VALUE: 'Total Value incl VAT/GST',

        // --- Customer Master File Columns ---
        MASTER_CUSTOMER_CODE: 'Customer Code',
        MASTER_CUSTOMER_NAME: 'Customer Name',
        MASTER_SE_NAME: 'Sales Executive'
    }
};