


// Content from database.js

const client = new Appwrite.Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1") // Your Appwrite Endpoint
    .setProject("68a464d1003443ce30c4");               // Your Project ID

const databases = new Appwrite.Databases(client);
const account = new Appwrite.Account(client);

const DATABASE_ID = "68a46621003128385801"; // Your Database ID

// Collection IDs
const COLLECTION_STORES = "stores";
const COLLECTION_PRODUCTS = "products";
const COLLECTION_SALES = "sales";
const COLLECTION_CATEGORIES = "categories";
const COLLECTION_EXPENSES = "expenses";
const COLLECTION_REVENUES = "revenues";
const COLLECTION_DELETED_INVOICES = "deletedInvoices";

let currentStoreId = null;

// Function to get current store ID
function getCurrentStoreId() {
    return currentStoreId;
}

// Function to set current store ID
function setCurrentStoreId(storeId) {
    currentStoreId = storeId;
    localStorage.setItem("storeId", storeId); // Keep in localStorage for persistence
}

// Wait for Appwrite SDK to load
function waitForAppwrite() {
    return new Promise((resolve, reject) => {
        if (typeof Appwrite !== 'undefined') {
            resolve();
        } else {
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof Appwrite !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts > 50) { // Wait up to 5 seconds
                    clearInterval(checkInterval);
                    reject(new Error('Appwrite SDK failed to load'));
                }
            }, 100);
        }
    });
}

// Authentication and Store Management
async function createNewStore(storeName, ownerName) {
    try {
        // Wait for Appwrite SDK to be loaded
        await waitForAppwrite();
        
        const user = await account.createAnonymousSession();
        const storeId = user.$id; // Use user ID as store ID for simplicity

        const response = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_STORES,
            storeId,
            {
                store_id: storeId,
                name: storeName,
                owner_name: ownerName,
                created_at: new Date().toISOString()
            }
        );
        setCurrentStoreId(storeId);
        return response;
    } catch (error) {
        console.error("Error creating new store:", error);
        throw error;
    }
}

async function loginExistingStore(storeId) {
    try {
        // Check if store exists (optional, but good for validation)
        const store = await databases.getDocument(DATABASE_ID, COLLECTION_STORES, storeId);
        setCurrentStoreId(storeId);
        return store;
    } catch (error) {
        console.error("Error logging in existing store:", error);
        throw error;
    }
}

async function logoutStore() {
    try {
        await account.deleteSession("current");
        currentStoreId = null;
        localStorage.removeItem("storeId");
        // Clear all local data related to the store
        localStorage.clear();
        return true;
    } catch (error) {
        console.error("Error logging out:", error);
        throw error;
    }
}

// Generic CRUD operations
async function createDocument(collectionId, data) {
    if (!currentStoreId) throw new Error("No store ID set. Please login or create a store.");
    try {
        return await databases.createDocument(DATABASE_ID, collectionId, "unique()", { ...data, store_id: currentStoreId });
    } catch (error) {
        console.error(`Error creating document in ${collectionId}:`, error);
        throw error;
    }
}

async function listDocuments(collectionId, queries = []) {
    if (!currentStoreId) return []; // Return empty if no store ID
    try {
        const response = await databases.listDocuments(DATABASE_ID, collectionId, [...queries, Appwrite.Query.equal("store_id", currentStoreId)]);
        return response.documents;
    } catch (error) {
        console.error(`Error listing documents from ${collectionId}:`, error);
        throw error;
    }
}

async function getDocument(collectionId, documentId) {
    if (!currentStoreId) throw new Error("No store ID set. Please login or create a store.");
    try {
        return await databases.getDocument(DATABASE_ID, collectionId, documentId);
    } catch (error) {
        console.error(`Error getting document from ${collectionId}:`, error);
        throw error;
    }
}

async function updateDocument(collectionId, documentId, data) {
    if (!currentStoreId) throw new Error("No store ID set. Please login or create a store.");
    try {
        return await databases.updateDocument(DATABASE_ID, collectionId, documentId, data);
    } catch (error) {
        console.error(`Error updating document in ${collectionId}:`, error);
        throw error;
    }
}

async function deleteDocument(collectionId, documentId) {
    if (!currentStoreId) throw new Error("No store ID set. Please login or create a store.");
    try {
        return await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
    } catch (error) {
        console.error(`Error deleting document from ${collectionId}:`, error);
        throw error;
    }
}

// Expose functions and constants to the global scope
window.getCurrentStoreId = getCurrentStoreId;
window.setCurrentStoreId = setCurrentStoreId;
window.createNewStore = createNewStore;
window.loginExistingStore = loginExistingStore;
window.logoutStore = logoutStore;
window.createDocument = createDocument;
window.listDocuments = listDocuments;
window.getDocument = getDocument;
window.updateDocument = updateDocument;
window.deleteDocument = deleteDocument;

window.COLLECTION_STORES = COLLECTION_STORES;
window.COLLECTION_PRODUCTS = COLLECTION_PRODUCTS;
window.COLLECTION_SALES = COLLECTION_SALES;
window.COLLECTION_CATEGORIES = COLLECTION_CATEGORIES;
window.COLLECTION_EXPENSES = COLLECTION_EXPENSES;
window.COLLECTION_REVENUES = COLLECTION_REVENUES;
window.COLLECTION_DELETED_INVOICES = COLLECTION_DELETED_INVOICES;

// Initialize Appwrite client on load
(async () => {
    // Wait for Appwrite SDK to be loaded
    if (typeof Appwrite === 'undefined') {
        console.warn('Appwrite SDK not loaded yet, waiting...');
        return;
    }
    
    const storedStoreId = localStorage.getItem("storeId");
    if (storedStoreId) {
        currentStoreId = storedStoreId;
        try {
            await account.get(); // Try to get current session
        } catch (error) {
            console.warn("No active session found for stored store ID, attempting anonymous login.");
            try {
                await account.createAnonymousSession();
            } catch (anonError) {
                console.error("Failed to create anonymous session:", anonError);
                currentStoreId = null; // Clear store ID if session fails
                localStorage.removeItem("storeId");
            }
        }
    }
})();




// Content from app.js

// Global variables
let products = [];
let categories = [];
let sales = [];
let expenses = [];
let revenues = [];
let deletedInvoices = [];
let currentTab = 'dashboard';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let isAdminLoggedIn = false;
let currentEditingProduct = null;
let currentEditingInvoice = null;
let currentDeleteTarget = null;

document.addEventListener("DOMContentLoaded", function () {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        showLoginScreen();
    } else {
        hideLoginScreen();
        initializeApp();
        setupEventListeners();
        updateCurrentDate();
        loadData();
    }

    setupLoginEventListeners();
});

function isUserLoggedIn() {
    const storeId = window.getCurrentStoreId();
    return storeId !== null && storeId !== "" && storeId !== "undefined";
}

function showLoginScreen() {
    const loginScreen = document.getElementById("login-screen");
    const container = document.querySelector(".container");

    if (loginScreen && container) {
        loginScreen.style.display = "flex";
        loginScreen.classList.remove("hidden");
        container.style.display = "none";

        // Reset to main login view
        showMainLogin();
    }
}

function hideLoginScreen() {
    const loginScreen = document.getElementById("login-screen");
    const container = document.querySelector(".container");

    if (loginScreen && container) {
        loginScreen.classList.add("hidden");
        container.style.display = "block";

        setTimeout(() => {
            loginScreen.style.display = "none";
        }, 500);
    }
}

function setupLoginEventListeners() {
    // No need for tab switching anymore
}

function showCreateStoreForm() {
    document.querySelector(".login-content").style.display = "none";
    document.getElementById("create-store-form").style.display = "block";
    document.getElementById("existing-store-form").style.display = "none";
}

function showExistingStoreForm() {
    document.querySelector(".login-content").style.display = "none";
    document.getElementById("create-store-form").style.display = "none";
    document.getElementById("existing-store-form").style.display = "block";
}

function showMainLogin() {
    document.querySelector(".login-content").style.display = "block";
    document.getElementById("create-store-form").style.display = "none";
    document.getElementById("existing-store-form").style.display = "none";

    // Clear form inputs
    document.getElementById("new-store-name").value = "";
    document.getElementById("store-owner").value = "";
    document.getElementById("existing-store-id").value = "";
}

async function loginExistingStore() {
    const storeId = document.getElementById("existing-store-id").value.trim();

    if (!storeId) {
        showNotification("يرجى إدخال معرف المتجر", "error");
        return;
    }

    try {
        await window.loginExistingStore(storeId);
        showNotification("تم تسجيل الدخول بنجاح", "success");
        hideLoginScreen();
        setTimeout(() => {
            initializeApp();
            setupEventListeners();
            updateCurrentDate();
            loadData();
        }, 500);
    } catch (error) {
        showNotification("فشل تسجيل الدخول: " + error.message, "error");
    }
}

async function createNewStore() {
    const storeName = document.getElementById("new-store-name").value.trim();
    const ownerName = document.getElementById("store-owner").value.trim();

    if (!storeName || !ownerName) {
        showNotification("يرجى ملء جميع الحقول", "error");
        return;
    }

    try {
        const newStore = await window.createNewStore(storeName, ownerName);
        showStoreSuccessForm(newStore.store_id);
    } catch (error) {
        showNotification("فشل إنشاء المتجر: " + error.message, "error");
    }
}

function showStoreSuccessForm(storeId) {
    document.querySelector(".login-content").style.display = "none";
    document.getElementById("create-store-form").style.display = "none";
    document.getElementById("existing-store-form").style.display = "none";
    document.getElementById("store-success-form").style.display = "block";

    // Update the store ID display
    document.getElementById("new-store-id-display").textContent = storeId;
}

function continueToApp() {
    hideLoginScreen();

    setTimeout(() => {
        initializeApp();
        setupEventListeners();
        updateCurrentDate();
        loadData();
        showNotification("مرحباً بك في متجرك الجديد!", "success");
    }, 500);
}

function initializeApp() {
    // Apply saved theme
    if (isDarkMode) {
        document.body.classList.add("dark-mode");
        document.getElementById("theme-toggle").innerHTML = 
            "<i class=\"fas fa-sun\"></i>";
        document.getElementById("theme-toggle").classList.remove("moon");
        document.getElementById("theme-toggle").classList.add("sun");
    }

    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("sale-date").value = today;
    document.getElementById("expense-date").value = today;
    document.getElementById("revenue-date").value = today;
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", function () {
            switchTab(this.dataset.tab);
        });
    });

    // Theme toggle
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

    // Product management
    document.getElementById("add-product-btn").addEventListener("click", toggleProductForm);
    document.getElementById("add-category-btn").addEventListener("click", addCategory);
    document.getElementById("save-product-btn").addEventListener("click", saveProduct);

    // Sales management
    document.getElementById("add-sale-btn").addEventListener("click", () => switchTab("sales"));
    document.getElementById("complete-sale-btn").addEventListener("click", completeSale);
    document.getElementById("paid-amount").addEventListener("input", calculateRemainingAmount);

    // Expense management
    document.getElementById("add-expense-btn").addEventListener("click", addExpense);
    document.getElementById("add-revenue-btn").addEventListener("click", addRevenue);
    document.getElementById("filter-expenses-btn").addEventListener("click", filterExpenses);
    document.getElementById("clear-expense-filter-btn").addEventListener("click", clearExpenseFilter);

    // Reports
    document.getElementById("generate-report-btn").addEventListener("click", generateReport);
    document.getElementById("filter-sales-btn").addEventListener("click", filterSales);
    document.getElementById("filter-dashboard-sales-btn").addEventListener("click", filterDashboardSales);
    document.getElementById("dashboard-search").addEventListener("input", searchSales);

    // Admin
    document.getElementById("admin-login-btn").addEventListener("click", adminLogin);
    document.getElementById("admin-logout-btn").addEventListener("click", adminLogout);
    document.getElementById("admin-search-btn").addEventListener("click", searchDeletedInvoices);

    // Modals
    document.getElementById("confirm-delete").addEventListener("click", confirmDelete);
    document.getElementById("cancel-delete").addEventListener("click", cancelDelete);
    document.getElementById("product-edit-modal").addEventListener("click", function(event) {
        if (event.target === this) closeProductModal();
    });
    document.getElementById("invoice-edit-modal").addEventListener("click", function(event) {
        if (event.target === this) closeInvoiceModal();
    });
    document.querySelector(".modal-close").addEventListener("click", closeProductModal);
    document.querySelector("#invoice-edit-modal .modal-close").addEventListener("click", closeInvoiceModal);
    document.getElementById("save-product-changes-btn").addEventListener("click", saveProductChanges);
    document.getElementById("save-invoice-changes-btn").addEventListener("click", saveInvoiceChanges);

    // Settings
    document.getElementById("manual-sync-btn").addEventListener("click", manualSync);
    document.getElementById("link-another-store-btn").addEventListener("click", linkAnotherStore);
    document.getElementById("reset-store-btn").addEventListener("click", resetStore);
    document.getElementById("copy-store-id-btn").addEventListener("click", copyStoreId);
    document.getElementById("export-data-btn").addEventListener("click", exportData);
    document.getElementById("import-file").addEventListener("change", importData);
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark-mode", isDarkMode);
    localStorage.setItem("darkMode", isDarkMode);
    const themeToggle = document.getElementById("theme-toggle");
    if (isDarkMode) {
        themeToggle.innerHTML = "<i class=\"fas fa-sun\"></i>";
        themeToggle.classList.remove("moon");
        themeToggle.classList.add("sun");
    } else {
        themeToggle.innerHTML = "<i class=\"fas fa-moon\"></i>";
        themeToggle.classList.remove("sun");
        themeToggle.classList.add("moon");
    }
}

function switchTab(tabName) {
    document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
    });
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.remove("active");
    });

    document.getElementById(`${tabName}-content`).classList.add("active");
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add("active");
    currentTab = tabName;

    // Load data specific to the tab
    if (tabName === "dashboard") {
        loadDashboard();
    } else if (tabName === "sales") {
        loadSalesTab();
    } else if (tabName === "inventory") {
        loadInventory();
    } else if (tabName === "expenses") {
        loadExpenses();
    } else if (tabName === "reports") {
        loadReports();
    } else if (tabName === "admin") {
        loadAdminTab();
    } else if (tabName === "settings") {
        loadSettings();
    }
}

async function loadSettings() {
    const storeIdDisplay = document.getElementById("store-id-display");
    if (storeIdDisplay) {
        storeIdDisplay.textContent = window.getCurrentStoreId();
    }
    updateStoreStatistics();
}

async function updateStoreStatistics() {
    try {
        const productsCount = (await window.listDocuments(window.COLLECTION_PRODUCTS)).length;
        const salesCount = (await window.listDocuments(window.COLLECTION_SALES)).length;
        const totalRevenue = (await window.listDocuments(window.COLLECTION_REVENUES)).reduce((sum, r) => sum + r.amount, 0);

        document.getElementById("total-products").textContent = productsCount;
        document.getElementById("total-invoices").textContent = salesCount;
        document.getElementById("total-revenue").textContent = `${totalRevenue.toFixed(2)} جنيه`;
        document.getElementById("total-transactions").textContent = "0"; // Placeholder for pending transactions
    } catch (error) {
        console.error("Error updating store statistics:", error);
    }
}

async function manualSync() {
    const syncBtn = document.getElementById("manual-sync-btn");
    const originalText = syncBtn.innerHTML;
    syncBtn.innerHTML = "<i class=\"fas fa-spin fa-sync-alt\"></i> جاري المزامنة...";
    syncBtn.disabled = true;

    try {
        await loadData(); // Reload all data from Appwrite
        showNotification("تم تحديث البيانات بنجاح", "success");
    } catch (error) {
        showNotification("فشل المزامنة: " + error.message, "error");
    } finally {
        syncBtn.innerHTML = originalText;
        syncBtn.disabled = false;
    }
}

async function linkAnotherStore() {
    if (confirm("هل تريد ربط متجر آخر؟ سيتم تسجيل خروجك من المتجر الحالي.")) {
        try {
            await window.logoutStore();
            showLoginScreen();
            showMainLogin();
            showNotification("يمكنك الآن ربط متجر آخر", "success");
        } catch (error) {
            showNotification("فشل ربط متجر آخر: " + error.message, "error");
        }
    }
}

async function resetStore() {
    if (confirm("هل أنت متأكد من إعادة تعيين المتجر؟ سيتم حذف جميع البيانات ولا يمكن التراجع عن هذا الإجراء.")) {
        try {
            // Delete all documents for the current store across all collections
            const collections = [
                window.COLLECTION_PRODUCTS,
                window.COLLECTION_SALES,
                window.COLLECTION_CATEGORIES,
                window.COLLECTION_EXPENSES,
                window.COLLECTION_REVENUES,
                window.COLLECTION_DELETED_INVOICES,
            ];

            for (const collectionId of collections) {
                const docs = await window.listDocuments(collectionId); // Get all docs for current store
                for (const doc of docs) {
                    await window.deleteDocument(collectionId, doc.$id);
                }
            }
            // Finally, delete the store document itself
            await window.deleteDocument(window.COLLECTION_STORES, window.getCurrentStoreId());
            await window.logoutStore();

            showLoginScreen();
            showMainLogin();
            showNotification("تم إعادة تعيين المتجر بنجاح", "success");
        } catch (error) {
            showNotification("فشل إعادة تعيين المتجر: " + error.message, "error");
        }
    }
}

function copyStoreId() {
    const storeIdElement = document.getElementById("store-id-display");
    const storeId = storeIdElement.textContent;

    navigator.clipboard.writeText(storeId).then(() => {
        showNotification("تم نسخ معرف المتجر بنجاح", "success");
        const copyBtn = document.getElementById("copy-store-id-btn");
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = "<i class=\"fas fa-check\"></i> تم النسخ";
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    }).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = storeId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showNotification("تم نسخ معرف المتجر بنجاح", "success");
    });
}

async function exportData() {
    try {
        const data = {
            products: await window.listDocuments(window.COLLECTION_PRODUCTS),
            categories: await window.listDocuments(window.COLLECTION_CATEGORIES),
            sales: await window.listDocuments(window.COLLECTION_SALES),
            expenses: await window.listDocuments(window.COLLECTION_EXPENSES),
            revenues: await window.listDocuments(window.COLLECTION_REVENUES),
            deletedInvoices: await window.listDocuments(window.COLLECTION_DELETED_INVOICES),
            storeSettings: await window.getDocument(window.COLLECTION_STORES, window.getCurrentStoreId()),
            exportDate: new Date().toISOString(),
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(dataBlob);
        link.download = `enjoy-gifts-backup-${new Date().toISOString().split("T")[0]}.json`;
        link.click();

        showNotification("تم تصدير البيانات بنجاح", "success");
    } catch (error) {
        showNotification("فشل تصدير البيانات: " + error.message, "error");
    }
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Import products
        if (data.products) {
            for (const product of data.products) {
                await window.createDocument(window.COLLECTION_PRODUCTS, {
                    name: product.name,
                    price: product.price,
                    wholesale_price: product.wholesale_price,
                    quantity: product.quantity,
                    min_stock: product.min_stock,
                    category: product.category
                });
            }
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)


// Content from sync.js

// This file will handle data synchronization logic if needed.
// For now, Appwrite SDK handles most of the real-time updates and data fetching.
// Future enhancements could include more complex offline-first strategies or background sync.

// Example: A simple function to trigger a data reload
function triggerDataSync() {
    console.log("Data sync triggered.");
    // In a real scenario, this might involve fetching latest data from Appwrite
    // and updating the UI, or pushing local changes to the server.
    // For now, loadData() in app.js already fetches fresh data.
}

// Expose to global scope
window.triggerDataSync = triggerDataSync;



