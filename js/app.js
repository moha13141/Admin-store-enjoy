import { 
    COLLECTION_STORES, 
    COLLECTION_PRODUCTS, 
    COLLECTION_SALES, 
    COLLECTION_CATEGORIES, 
    COLLECTION_EXPENSES, 
    COLLECTION_REVENUES, 
    COLLECTION_DELETED_INVOICES, 
    createNewStore, 
    loginExistingStore, 
    logoutStore, 
    createDocument, 
    listDocuments, 
    getDocument, 
    updateDocument, 
    deleteDocument, 
    getCurrentStoreId, 
    setCurrentStoreId, 
    Query 
} from "./database.js";

// Global variables
let products = [];
let categories = [];
let sales = [];
let expenses = [];
let revenues = [];
let deletedInvoices = [];
let selectedProducts = [];
let currentTab = 'dashboard';
let isDarkMode = localStorage.getItem("darkMode") === "true";
let confirmationCallback = null;
let isAdminLoggedIn = false;

// Initialize the application
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
    const storeId = getCurrentStoreId();
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

    if (!storeId.startsWith("store_")) {
        showNotification("معرف المتجر غير صحيح", "error");
        return;
    }

    try {
        await loginExistingStore(storeId);
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
        const newStore = await createNewStore(storeName, ownerName);
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
        storeIdDisplay.textContent = getCurrentStoreId();
    }
    updateStoreStatistics();
}

async function updateStoreStatistics() {
    try {
        const productsCount = (await listDocuments(COLLECTION_PRODUCTS)).length;
        const salesCount = (await listDocuments(COLLECTION_SALES)).length;
        const totalRevenue = (await listDocuments(COLLECTION_REVENUES)).reduce((sum, r) => sum + r.amount, 0);

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
            await logoutStore();
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
                COLLECTION_PRODUCTS,
                COLLECTION_SALES,
                COLLECTION_CATEGORIES,
                COLLECTION_EXPENSES,
                COLLECTION_REVENUES,
                COLLECTION_DELETED_INVOICES,
            ];

            for (const collectionId of collections) {
                const docs = await listDocuments(collectionId); // Get all docs for current store
                for (const doc of docs) {
                    await deleteDocument(collectionId, doc.$id);
                }
            }
            // Finally, delete the store document itself
            await deleteDocument(COLLECTION_STORES, getCurrentStoreId());
            await logoutStore();

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
            products: await listDocuments(COLLECTION_PRODUCTS),
            categories: await listDocuments(COLLECTION_CATEGORIES),
            sales: await listDocuments(COLLECTION_SALES),
            expenses: await listDocuments(COLLECTION_EXPENSES),
            revenues: await listDocuments(COLLECTION_REVENUES),
            deletedInvoices: await listDocuments(COLLECTION_DELETED_INVOICES),
            storeSettings: await getDocument(COLLECTION_STORES, getCurrentStoreId()),
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

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = JSON.parse(e.target.result);

            // Clear existing data before import (optional, but safer)
            await resetStore(); // This will also logout and show login screen

            // Re-login with the same store ID or create new if needed
            const storeIdToImport = data.storeSettings?.store_id || getCurrentStoreId();
            if (storeIdToImport) {
                await loginExistingStore(storeIdToImport);
            } else {
                // If no store ID in backup, create a new one
                const newStore = await createNewStore("Imported Store", "Imported Owner");
                setCurrentStoreId(newStore.store_id);
            }

            // Import data into Appwrite
            if (data.products) {
                for (const item of data.products) {
                    await createDocument(COLLECTION_PRODUCTS, item);
                }
            }
            if (data.categories) {
                for (const item of data.categories) {
                    await createDocument(COLLECTION_CATEGORIES, item);
                }
            }
            if (data.sales) {
                for (const item of data.sales) {
                    await createDocument(COLLECTION_SALES, item);
                }
            }
            if (data.expenses) {
                for (const item of data.expenses) {
                    await createDocument(COLLECTION_EXPENSES, item);
                }
            }
            if (data.revenues) {
                for (const item of data.revenues) {
                    await createDocument(COLLECTION_REVENUES, item);
                }
            }
            if (data.deletedInvoices) {
                for (const item of data.deletedInvoices) {
                    await createDocument(COLLECTION_DELETED_INVOICES, item);
                }
            }

            loadData();
            showNotification("تم استيراد البيانات بنجاح", "success");
            hideLoginScreen(); // Ensure app is visible after import
        } catch (error) {
            showNotification("خطأ في استيراد البيانات: " + error.message, "error");
            console.error("Import error:", error);
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm("هل أنت متأكد من أنك تريد مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.")) {
        resetStore(); // Use resetStore to clear Appwrite data
    }
}

function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };

    const dateString = now.toLocaleDateString("ar-EG", options);
    document.getElementById("current-date").textContent = dateString;
}

async function loadData() {
    try {
        products = await listDocuments(COLLECTION_PRODUCTS);
        categories = await listDocuments(COLLECTION_CATEGORIES);
        sales = await listDocuments(COLLECTION_SALES);
        expenses = await listDocuments(COLLECTION_EXPENSES);
        revenues = await listDocuments(COLLECTION_REVENUES);
        deletedInvoices = await listDocuments(COLLECTION_DELETED_INVOICES);

        loadDashboard();
        loadInventory();
        loadExpenses();
        loadReports();
        loadAdminTab();
    } catch (error) {
        console.error("Error loading data from Appwrite:", error);
        showNotification("فشل تحميل البيانات: " + error.message, "error");
    }
}

function loadDashboard() {
    const today = new Date().toISOString().split("T")[0];
    const todaySales = sales.filter((sale) => sale.date === today);

    displaySales(todaySales, "sales-list");
    displaySales(sales.filter((sale) => sale.date !== today), "previous-sales-list");
}

function loadSalesTab() {
    loadProductsForSale();
    loadCategories();
}

function loadProductsForSale() {
    const grid = document.getElementById("products-grid");

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد منتجات متاحة</h3>
                <p>لم يتم إضافة أي منتجات بعد. يرجى إضافة منتجات من قسم إدارة المخزون أولاً.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = products
        .map(
            (product) => `
            <div class="product-card" onclick="addToSale(
                ${product.$id}
            )">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toFixed(2)} جنيه</div>
                <div class="product-stock">المتوفر: ${product.quantity}</div>
                <div class="status ${getStockStatus(
                product.quantity,
                product.min_stock || 5
            )}">${getStockStatusText(product.quantity, product.min_stock || 5)}</div>
            </div>
        `
        )
        .join("");
}

function loadCategories() {
    const categoriesContainer = document.getElementById("product-categories");
    const categorySelect = document.getElementById("product-category");
    const availableCategories = document.getElementById("available-categories");

    // Load categories for filtering
    categoriesContainer.innerHTML = `
        <div class="category-item active" data-category="all">جميع الفئات</div>
        ${categories
            .map(
                (category) => `
                <div class="category-item" data-category="${category.$id}">
                    ${category.name}
                </div>
            `
            )
            .join("")}
    `;

    // Load categories for product form
    categorySelect.innerHTML = `
        <option value="">اختر فئة</option>
        ${categories
            .map(
                (category) => `
                <option value="${category.$id}">${category.name}</option>
            `
            )
            .join("")}
    `;

    // Load available categories with delete option
    if (categories.length === 0) {
        availableCategories.innerHTML = `
            <div class="empty-state">
                <p>لا توجد فئات متاحة</p>
            </div>
        `;
    } else {
        availableCategories.innerHTML = categories
            .map(
                (category) => `
                <div class="category-item">
                    ${category.name}
                    <button class="delete-category" onclick="deleteCategory(
                        '${category.$id}'
                    )">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `
            )
            .join("");
    }

    // Add event listeners for category filtering
    document.querySelectorAll(".category-item").forEach((item) => {
        item.addEventListener("click", function () {
            document.querySelectorAll(".category-item").forEach((cat) =>
                cat.classList.remove("active")
            );
            this.classList.add("active");
            filterProductsByCategory(this.dataset.category);
        });
    });
}

function checkNegativeStock() {
    const negativeProducts = products.filter((p) => p.quantity < 0);
    const reorderAlert = document.getElementById("reorder-alert");
    const reorderList = document.getElementById("reorder-list");

    if (negativeProducts.length > 0) {
        reorderAlert.style.display = "block";
        reorderList.innerHTML = negativeProducts
            .map(
                (product) => `
            <div class="reorder-item">
                <span>${product.name}</span>
                <span style="color: var(--danger); font-weight: bold;">الكمية: ${product.quantity}</span>
            </div>
        `
            )
            .join("");
    } else {
        reorderAlert.style.display = "none";
    }
}

function loadInventory() {
    const grid = document.getElementById("inventory-grid");
    const reorderAlert = document.getElementById("reorder-alert");
    const reorderList = document.getElementById("reorder-list");

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد منتجات في المخزون</h3>
                <p>لم يتم إضافة أي منتجات بعد. يمكنك البدء بإضافة منتج جديد باستخدام الزر بالأعلى.</p>
            </div>
        `;
        reorderAlert.style.display = "none";
        return;
    }

    // Check for products that need reordering (including negative quantities)
    const reorderProducts = products.filter(
        (product) => product.quantity <= (product.min_stock || 5)
    );

    if (reorderProducts.length > 0) {
        reorderAlert.style.display = "block";
        reorderList.innerHTML = reorderProducts
            .map(
                (product) => `
            <div class="reorder-item">
                <span>${product.name}</span>
                <span style="color: ${product.quantity < 0 ? "var(--danger)" : "inherit"}">الكمية: ${product.quantity} (الحد الأدنى: ${product.min_stock || 5})</span>
            </div>
        `
            )
            .join("");
    } else {
        reorderAlert.style.display = "none";
    }

    grid.innerHTML = products
        .map((product) => {
            const profit = (product.price || 0) - (product.wholesale_price || 0);
            return `
            <div class="product-card">
                <div class="product-name">${product.name}</div>
                <div class="product-wholesale-price">سعر الجملة: ${(product.wholesale_price || 0).toFixed(2)} جنيه</div>
                <div class="product-price">سعر البيع: ${(product.price || 0).toFixed(2)} جنيه</div>
                <div class="product-profit">الربح: ${profit.toFixed(2)} جنيه</div>
                <div class="product-stock" onclick="editQuantity(
                    '${product.$id}'
                )" style="color: ${product.quantity < 0 ? "var(--danger)" : "inherit"}">الكمية: ${product.quantity}</div>
                <div class="status ${getStockStatus(
                product.quantity,
                product.min_stock || 5
            )}">${getStockStatusText(product.quantity, product.min_stock || 5)}</div>
                <div class="product-actions">
                    <button class="btn btn-sm btn-info" onclick="openProductModal(
                        '${product.$id}'
                    )">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="showDeleteConfirmation(
                        'product',
                        '${product.$id}'
                    )">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
        })
        .join("");

    checkNegativeStock();
}

function loadExpenses() {
    const today = new Date().toISOString().split("T")[0];
    const todayExpenses = expenses.filter((expense) => expense.date === today);
    const todayRevenues = revenues.filter((revenue) => revenue.date === today);

    const todayExpensesTotal = todayExpenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
    );
    const todayRevenuesTotal = todayRevenues.reduce(
        (sum, revenue) => sum + parseFloat(revenue.amount),
        0
    );
    const netProfit = todayRevenuesTotal - todayExpensesTotal;

    // Update the summary cards with correct IDs
    document.getElementById("today-expenses-total").textContent = 
        `${todayExpensesTotal.toFixed(2)} جنيه`;
    document.getElementById("today-income-total").textContent = 
        `${todayRevenuesTotal.toFixed(2)} جنيه`;
    document.getElementById("today-net-profit").textContent = 
        `${netProfit.toFixed(2)} جنيه`;

    // Set today's date as default for new entries
    document.getElementById("expense-date").value = today;
    document.getElementById("revenue-date").value = today;

    displayExpenses(expenses, "expenses-list");
    displayRevenues(revenues, "revenue-list");
}

function loadReports() {
    const totalExpenses = expenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
    );
    const totalRevenues = revenues.reduce(
        (sum, revenue) => sum + parseFloat(revenue.amount),
        0
    );
    const netProfit = totalRevenues - totalExpenses;

    document.getElementById("report-total-sales").textContent = 
        `${sales.reduce((sum, sale) => sum + sale.subtotal, 0).toFixed(2)} جنيه`;
    document.getElementById("report-total-expenses").textContent = 
        `${totalExpenses.toFixed(2)} جنيه`;
    document.getElementById("report-total-revenues").textContent = 
        `${totalRevenues.toFixed(2)} جنيه`;
    document.getElementById("report-net-profit").textContent = 
        `${netProfit.toFixed(2)} جنيه`;

    // Populate sales report table
    const salesReportTableBody = document.getElementById("sales-report-table-body");
    salesReportTableBody.innerHTML = sales
        .map(
            (sale) => `
            <tr>
                <td>${sale.invoice_number}</td>
                <td>${sale.sale_date}</td>
                <td>${sale.customer_name}</td>
                <td>${sale.customer_phone || "لا يوجد"}</td>
                <td>${sale.subtotal.toFixed(2)} جنيه</td>
                <td>${sale.paid_amount.toFixed(2)} جنيه</td>
                <td>${(sale.subtotal - sale.paid_amount).toFixed(2)} جنيه</td>
                <td>${getStatusText(sale.status)}</td>
            </tr>
        `
        )
        .join("");

    // Populate expenses report table
    const expensesReportTableBody = document.getElementById("expenses-report-table-body");
    expensesReportTableBody.innerHTML = expenses
        .map(
            (expense) => `
            <tr>
                <td>${expense.description}</td>
                <td>${expense.amount.toFixed(2)} جنيه</td>
                <td>${expense.date}</td>
            </tr>
        `
        )
        .join("");

    // Populate revenues report table
    const revenuesReportTableBody = document.getElementById("revenues-report-table-body");
    revenuesReportTableBody.innerHTML = revenues
        .map(
            (revenue) => `
            <tr>
                <td>${revenue.description}</td>
                <td>${revenue.amount.toFixed(2)} جنيه</td>
                <td>${revenue.date}</td>
            </tr>
        `
        )
        .join("");
}

function loadAdminTab() {
    if (isAdminLoggedIn) {
        document.getElementById("admin-content-area").style.display = "block";
        document.getElementById("admin-login-area").style.display = "none";
        loadDeletedInvoices();
    } else {
        document.getElementById("admin-content-area").style.display = "none";
        document.getElementById("admin-login-area").style.display = "block";
    }
}

function adminLogin() {
    const password = document.getElementById("admin-password").value;
    // For simplicity, a hardcoded password. In a real app, use Appwrite Auth for users/roles.
    if (password === "admin123") {
        isAdminLoggedIn = true;
        showNotification("تم تسجيل دخول المسؤول بنجاح", "success");
        loadAdminTab();
    } else {
        showNotification("كلمة مرور المسؤول غير صحيحة", "error");
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    showNotification("تم تسجيل خروج المسؤول", "info");
    loadAdminTab();
}

async function addCategory() {
    const newCategoryName = document.getElementById("new-category-name").value.trim();
    if (!newCategoryName) {
        showNotification("يرجى إدخال اسم الفئة", "error");
        return;
    }

    try {
        await createDocument(COLLECTION_CATEGORIES, { name: newCategoryName });
        document.getElementById("new-category-name").value = "";
        showNotification("تم إضافة الفئة بنجاح", "success");
        loadCategories();
    } catch (error) {
        showNotification("فشل إضافة الفئة: " + error.message, "error");
    }
}

async function deleteCategory(categoryId) {
    try {
        await deleteDocument(COLLECTION_CATEGORIES, categoryId);
        showNotification("تم حذف الفئة بنجاح", "success");
        loadCategories();
    } catch (error) {
        showNotification("فشل حذف الفئة: " + error.message, "error");
    }
}

async function saveProduct() {
    const productName = document.getElementById("product-name").value.trim();
    const productCategory = document.getElementById("product-category").value;
    const wholesalePrice = parseFloat(document.getElementById("wholesale-price").value) || 0;
    const productPrice = parseFloat(document.getElementById("product-price").value) || 0;
    const productQuantity = parseInt(document.getElementById("product-quantity").value) || 0;
    const minStock = parseInt(document.getElementById("min-stock").value) || 0;

    if (!productName || !productCategory || productPrice <= 0) {
        showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    try {
        await createDocument(COLLECTION_PRODUCTS, {
            name: productName,
            category_id: productCategory,
            wholesale_price: wholesalePrice,
            price: productPrice,
            quantity: productQuantity,
            min_stock: minStock,
        });
        showNotification("تم حفظ المنتج بنجاح", "success");
        // Clear form
        document.getElementById("product-name").value = "";
        document.getElementById("product-category").value = "";
        document.getElementById("wholesale-price").value = "";
        document.getElementById("product-price").value = "";
        document.getElementById("product-quantity").value = "";
        document.getElementById("min-stock").value = "";
        loadInventory();
    } catch (error) {
        showNotification("فشل حفظ المنتج: " + error.message, "error");
    }
}

function toggleProductForm() {
    const form = document.getElementById("add-product-form");
    form.style.display = form.style.display === "none" ? "block" : "none";
}

function addToSale(productId) {
    const product = products.find((p) => p.$id === productId);
    if (!product) return;

    const existingProduct = selectedProducts.find((p) => p.$id === productId);

    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        selectedProducts.push({
            $id: product.$id,
            name: product.name,
            price: product.price,
            quantity: 1,
            maxQuantity: product.quantity,
        });
    }

    displaySelectedProducts();
    updateSaleSummary();
}

function displaySelectedProducts() {
    const container = document.getElementById("selected-products");

    if (selectedProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-basket"></i>
                <h3>لم يتم تحديد أي منتجات</h3>
                <p>اختر المنتجات من القائمة أعلاه لإضافتها إلى البيع.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = selectedProducts
        .map(
            (product) => `
            <div class="sale-product-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4>${product.name}</h4>
                        <p>السعر: ${product.price.toFixed(2)} جنيه</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button class="btn btn-sm btn-info" onclick="changeQuantity(
                            '${product.$id}',
                            -1
                        )">-</button>
                        <span style="font-weight: bold; min-width: 30px; text-align: center;">${product.quantity}</span>
                        <button class="btn btn-sm btn-info" onclick="changeQuantity(
                            '${product.$id}',
                            1
                        )">+</button>
                        <button class="btn btn-sm btn-danger" onclick="removeFromSale(
                            '${product.$id}'
                        )">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <strong>الإجمالي: ${(product.price * product.quantity).toFixed(2)} جنيه</strong>
                </div>
            </div>
        `
        )
        .join("");
}

function changeQuantity(productId, change) {
    const selectedProduct = selectedProducts.find((p) => p.$id === productId);
    if (!selectedProduct) return;

    const newQuantity = selectedProduct.quantity + change;

    if (newQuantity <= 0) {
        removeFromSale(productId);
        return;
    }

    selectedProduct.quantity = newQuantity;
    displaySelectedProducts();
    updateSaleSummary();
}

function removeFromSale(productId) {
    selectedProducts = selectedProducts.filter((p) => p.$id !== productId);
    displaySelectedProducts();
    updateSaleSummary();
}

function updateSaleSummary() {
    const summaryDiv = document.getElementById("sale-summary");

    if (selectedProducts.length === 0) {
        summaryDiv.style.display = "none";
        return;
    }

    summaryDiv.style.display = "block";

    const subtotal = selectedProducts.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
    );
    document.getElementById("subtotal").textContent = `${subtotal.toFixed(2)} جنيه`;

    calculateRemainingAmount();
}

function calculateRemainingAmount() {
    const subtotal = selectedProducts.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
    );
    const paidAmount = parseFloat(document.getElementById("paid-amount").value) || 0;
    const remaining = subtotal - paidAmount;

    document.getElementById("remaining-amount").textContent = 
        `${remaining.toFixed(2)} جنيه`;
}

async function completeSale() {
    const customerName = document.getElementById("customer-name").value.trim();
    const customerPhone = document.getElementById("customer-phone").value.trim();
    const saleDate = document.getElementById("sale-date").value;
    const paidAmount = parseFloat(document.getElementById("paid-amount").value) || 0;
    const orderStatus = document.getElementById("order-status").value;
    const notes = document.getElementById("sale-notes").value.trim();

    if (!customerName || selectedProducts.length === 0) {
        showNotification("يرجى إدخال اسم العميل وتحديد المنتجات", "error");
        return;
    }

    const subtotal = selectedProducts.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
    );
    const remaining = subtotal - paidAmount;

    const newSale = {
        invoice_number: `INV-${Date.now()}`,
        customer_name: customerName,
        customer_phone: customerPhone,
        sale_date: saleDate,
        products_sold: JSON.stringify(selectedProducts), // Store products as JSON string
        subtotal: subtotal,
        paid_amount: paidAmount,
        status: orderStatus,
        notes: notes,
    };

    try {
        await createDocument(COLLECTION_SALES, newSale);

        // Update product quantities in Appwrite
        for (const selectedProduct of selectedProducts) {
            const product = products.find((p) => p.$id === selectedProduct.$id);
            if (product) {
                await updateDocument(COLLECTION_PRODUCTS, product.$id, {
                    quantity: product.quantity - selectedProduct.quantity,
                });
            }
        }

        // Add sale to revenues if paid amount > 0
        if (paidAmount > 0) {
            await createDocument(COLLECTION_REVENUES, {
                description: `مبيعات - ${customerName} - ${customerPhone || "بدون رقم"} - فاتورة ${newSale.invoice_number}`,
                amount: paidAmount,
                date: saleDate,
            });
        }

        // Clear form
        document.getElementById("customer-name").value = "";
        document.getElementById("customer-phone").value = "";
        document.getElementById("paid-amount").value = "";
        document.getElementById("order-status").value = "pending";
        document.getElementById("sale-notes").value = "";
        selectedProducts = [];

        displaySelectedProducts();
        updateSaleSummary();

        showNotification("تم تسجيل البيع بنجاح", "success");

        // Reload all data after successful sale
        await loadData();
        switchTab("dashboard");
    } catch (error) {
        showNotification("فشل تسجيل البيع: " + error.message, "error");
    }
}

async function addExpense() {
    const description = document.getElementById("expense-description").value.trim();
    const amount = parseFloat(document.getElementById("expense-amount").value) || 0;
    const date = document.getElementById("expense-date").value;

    if (!description || !amount || amount <= 0 || !date) {
        showNotification("يرجى ملء جميع حقول المصروف", "error");
        return;
    }

    try {
        await createDocument(COLLECTION_EXPENSES, {
            description: description,
            amount: amount,
            date: date,
        });
        showNotification("تم إضافة المصروف بنجاح", "success");
        document.getElementById("expense-description").value = "";
        document.getElementById("expense-amount").value = "";
        loadExpenses();
    } catch (error) {
        showNotification("فشل إضافة المصروف: " + error.message, "error");
    }
}

async function addRevenue() {
    const description = document.getElementById("revenue-description").value.trim();
    const amount = parseFloat(document.getElementById("revenue-amount").value) || 0;
    const date = document.getElementById("revenue-date").value;

    if (!description || !amount || amount <= 0 || !date) {
        showNotification("يرجى ملء جميع حقول الإيراد", "error");
        return;
    }

    try {
        await createDocument(COLLECTION_REVENUES, {
            description: description,
            amount: amount,
            date: date,
        });
        showNotification("تم إضافة الإيراد بنجاح", "success");
        document.getElementById("revenue-description").value = "";
        document.getElementById("revenue-amount").value = "";
        loadExpenses();
    } catch (error) {
        showNotification("فشل إضافة الإيراد: " + error.message, "error");
    }
}

function filterExpenses() {
    const filterDate = document.getElementById("filter-expense-date").value;

    if (!filterDate) {
        displayExpenses(expenses, "expenses-list");
        displayRevenues(revenues, "revenue-list");
        return;
    }

    const filteredExpenses = expenses.filter((expense) => expense.date === filterDate);
    const filteredRevenues = revenues.filter((revenue) => revenue.date === filterDate);

    displayExpenses(filteredExpenses, "expenses-list");
    displayRevenues(filteredRevenues, "revenue-list");
}

function clearExpenseFilter() {
    document.getElementById("filter-expense-date").value = "";
    displayExpenses(expenses, "expenses-list");
    displayRevenues(revenues, "revenue-list");
}

function displayExpenses(expensesList, containerId) {
    const container = document.getElementById(containerId);

    if (expensesList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>لا توجد مصروفات مسجلة</h3>
                <p>لم يتم تسجيل أي مصروفات بعد.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = expensesList
        .map(
            (expense) => `
            <div class="sale-product-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4>${expense.description}</h4>
                        <p>${expense.date}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <strong style="color: var(--expense);">${parseFloat(
                expense.amount
            ).toFixed(2)} جنيه</strong>
                        <button class="btn btn-sm btn-danger" onclick="showDeleteConfirmation(
                            'expense',
                            '${expense.$id}'
                        )">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `
        )
        .join("");
}

function displayRevenues(revenuesList, containerId) {
    const container = document.getElementById(containerId);

    if (revenuesList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-coins"></i>
                <h3>لا توجد إيرادات مسجلة</h3>
                <p>لم يتم تسجيل أي إيرادات بعد.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = revenuesList
        .map(
            (revenue) => `
            <div class="sale-product-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4>${revenue.description}</h4>
                        <p>${revenue.date}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <strong style="color: var(--income);">${parseFloat(
                revenue.amount
            ).toFixed(2)} جنيه</strong>
                        <button class="btn btn-sm btn-danger" onclick="showDeleteConfirmation(
                            'revenue',
                            '${revenue.$id}'
                        )">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `
        )
        .join("");
}

function displaySales(salesList, containerId) {
    const container = document.getElementById(containerId);

    if (salesList.length === 0) {
        const emptyMessage = 
            containerId === "sales-list"
                ? {
                    icon: "fas fa-file-invoice",
                    title: "لا توجد مبيعات مسجلة",
                    desc: "لم تقم بإضافة أي مبيعات بعد. يمكنك البدء بإضافة بيع جديد باستخدام الزر بالأعلى.",
                }
                : {
                    icon: "fas fa-history",
                    title: "لا توجد مبيعات سابقة",
                    desc: "لم يتم تسجيل أي مبيعات سابقة بعد.",
                };

        container.innerHTML = `
            <div class="empty-state">
                <i class="${emptyMessage.icon}"></i>
                <h3>${emptyMessage.title}</h3>
                <p>${emptyMessage.desc}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = salesList
        .map(
            (sale) => `
            <div class="sale-product-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4>${sale.customer_name} - ${sale.customer_phone || "لا يوجد رقم"}</h4>
                        <p>فاتورة: ${sale.invoice_number}</p>
                        <p>${sale.sale_date}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="text-align: center;">
                            <div>${(sale.subtotal || 0).toFixed(2)} جنيه</div>
                            <small>الإجمالي</small>
                        </div>
                        <div style="text-align: center;">
                            <div class="editable-amount" onclick="openInvoiceModal(
                                '${sale.$id}'
                            )" style="cursor: pointer; color: var(--primary); text-decoration: underline;">${(sale.paid_amount || 0).toFixed(2)} جنيه</div>
                            <small>المدفوع</small>
                        </div>
                        <div style="text-align: center;">
                            <div>${(sale.subtotal - sale.paid_amount).toFixed(2)} جنيه</div>
                            <small>المتبقي</small>
                        </div>
                        <div style="text-align: center;">
                            <span class="status ${getStatusClass(sale.status)}">${getStatusText(sale.status)}</span>
                            <small>الحالة</small>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="showDeleteConfirmation(
                            'sale',
                            '${sale.$id}'
                        )">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `
        )
        .join("");
}

function filterDashboardSales() {
    const filterDate = document.getElementById("filter-date").value;

    if (!filterDate) {
        loadDashboard();
        return;
    }

    const filteredSales = sales.filter((sale) => sale.sale_date === filterDate);
    displaySales(filteredSales, "sales-list");
}

function searchSales() {
    const searchTerm = document.getElementById("dashboard-search").value.toLowerCase();

    if (!searchTerm) {
        loadDashboard();
        return;
    }

    const filteredSales = sales.filter(
        (sale) =>
            sale.customer_name.toLowerCase().includes(searchTerm) ||
            sale.invoice_number.toLowerCase().includes(searchTerm) ||
            (sale.customer_phone && sale.customer_phone.toLowerCase().includes(searchTerm))
    );

    displaySales(filteredSales, "sales-list");
}

function filterProductsByCategory(categoryId) {
    const grid = document.getElementById("products-grid");

    let filteredProducts = products;
    if (categoryId !== "all") {
        filteredProducts = products.filter((product) => product.category_id === categoryId);
    }

    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد منتجات في هذه الفئة</h3>
                <p>لم يتم إضافة أي منتجات في هذه الفئة بعد.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredProducts
        .map(
            (product) => `
            <div class="product-card" onclick="addToSale(
                '${product.$id}'
            )">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toFixed(2)} جنيه</div>
                <div class="product-stock">المتوفر: ${product.quantity}</div>
                <div class="status ${getStockStatus(
                product.quantity,
                product.min_stock || 5
            )}">${getStockStatusText(product.quantity, product.min_stock || 5)}</div>
            </div>
        `
        )
        .join("");
}

function getStockStatus(quantity, minStock) {
    if (quantity <= 0) return "status-out-of-stock";
    if (quantity <= minStock) return "status-low-stock";
    return "status-in-stock";
}

function getStockStatusText(quantity, minStock) {
    if (quantity <= 0) return "نفد المخزون";
    if (quantity <= minStock) return "مخزون منخفض";
    return "متوفر";
}

function getStatusText(status) {
    const statusMap = {
        pending: "معلق",
        "in-progress": "قيد التنفيذ",
        completed: "مكتمل",
        cancelled: "ملغي",
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const statusClassMap = {
        pending: "status-pending",
        "in-progress": "status-in-progress",
        completed: "status-completed",
        cancelled: "status-cancelled",
    };
    return statusClassMap[status] || "";
}

function showDeleteConfirmation(type, id) {
    const modal = document.getElementById("confirmation-modal");
    const title = document.getElementById("confirmation-title");
    const message = document.getElementById("confirmation-message");

    const typeMap = {
        product: "المنتج",
        category: "الفئة",
        sale: "البيع",
        expense: "المصروف",
        revenue: "الإيراد",
        "deleted-invoice": "الفاتورة المحذوفة",
    };

    title.textContent = `تأكيد حذف ${typeMap[type]}`;
    message.textContent = 
        `هل أنت متأكد من أنك تريد حذف هذا ${typeMap[type]}؟ لا يمكن التراجع عن هذا الإجراء.`;

    confirmationCallback = () => deleteItem(type, id);
    modal.classList.add("show");
}

function confirmDelete() {
    if (confirmationCallback) {
        confirmationCallback();
        confirmationCallback = null;
    }
    cancelDelete();
}

function cancelDelete() {
    const modal = document.getElementById("confirmation-modal");
    modal.classList.remove("show");
    confirmationCallback = null;
}

async function deleteItem(type, id) {
    try {
        switch (type) {
            case "product":
                await deleteDocument(COLLECTION_PRODUCTS, id);
                break;
            case "category":
                await deleteDocument(COLLECTION_CATEGORIES, id);
                break;
            case "sale":
                const saleToDelete = sales.find((s) => s.$id === id);
                if (saleToDelete) {
                    await createDocument(COLLECTION_DELETED_INVOICES, {
                        ...saleToDelete,
                        deletedAt: new Date().toISOString(),
                        deletedDate: new Date().toLocaleDateString("ar-EG"),
                        products_sold: JSON.stringify(JSON.parse(saleToDelete.products_sold)), // Ensure it's a string
                    });
                }
                await deleteDocument(COLLECTION_SALES, id);
                // Remove associated revenue entry
                const oldRevenueDescription = `مبيعات - فاتورة ${saleToDelete.invoice_number}`;
                const newRevenueDescription = `مبيعات - ${saleToDelete.customer_name} - ${saleToDelete.customer_phone || "بدون رقم"} - فاتورة ${saleToDelete.invoice_number}`;

                const revenueToDelete = revenues.find(
                    (r) => r.description === oldRevenueDescription || r.description === newRevenueDescription
                );
                if (revenueToDelete) {
                    await deleteDocument(COLLECTION_REVENUES, revenueToDelete.$id);
                }
                break;
            case "deleted-invoice":
                await deleteDocument(COLLECTION_DELETED_INVOICES, id);
                showNotification("تم الحذف النهائي للفاتورة", "success");
                loadData(); // Reload data to update admin tab
                return; // Return early to avoid the generic success message
            case "expense":
                await deleteDocument(COLLECTION_EXPENSES, id);
                break;
            case "revenue":
                await deleteDocument(COLLECTION_REVENUES, id);
                break;
        }
        showNotification("تم الحذف بنجاح", "success");
        loadData(); // Reload all data after deletion
    } catch (error) {
        showNotification("فشل الحذف: " + error.message, "error");
    }
}

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type} show`;

    const iconMap = {
        success: "fas fa-check-circle",
        error: "fas fa-exclamation-circle",
        warning: "fas fa-exclamation-triangle",
        info: "fas fa-info-circle",
    };

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${iconMap[type]}"></i>
        </div>
        <div class="notification-content">${message}</div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 400);
    }, 3000);
}

// Product Modal Functions
let currentEditingProductId = null;

async function openProductModal(productId) {
    try {
        const product = await getDocument(COLLECTION_PRODUCTS, productId);
        if (!product) return;

        currentEditingProductId = productId;

        // Fill modal with current product data
        document.getElementById("modal-wholesale-price").value = product.wholesale_price || 0;
        document.getElementById("modal-selling-price").value = product.price || 0;
        document.getElementById("modal-quantity").value = product.quantity || 0;

        // Show modal
        const modal = document.getElementById("product-edit-modal");
        modal.classList.add("show");
    } catch (error) {
        showNotification("فشل فتح نافذة تعديل المنتج: " + error.message, "error");
    }
}

function closeProductModal() {
    const modal = document.getElementById("product-edit-modal");
    modal.classList.remove("show");
    currentEditingProductId = null;
}

async function saveProductChanges() {
    if (!currentEditingProductId) return;

    const wholesalePrice = parseFloat(document.getElementById("modal-wholesale-price").value) || 0;
    const sellingPrice = parseFloat(document.getElementById("modal-selling-price").value) || 0;
    const quantity = parseInt(document.getElementById("modal-quantity").value) || 0;

    if (sellingPrice <= 0) {
        showNotification("يرجى إدخال سعر بيع صحيح", "error");
        return;
    }

    try {
        await updateDocument(COLLECTION_PRODUCTS, currentEditingProductId, {
            wholesale_price: wholesalePrice,
            price: sellingPrice,
            quantity: quantity,
        });

        loadInventory();
        closeProductModal();
        showNotification("تم تحديث المنتج بنجاح", "success");
    } catch (error) {
        showNotification("فشل تحديث المنتج: " + error.message, "error");
    }
}

// Invoice Modal Functions
let currentEditingSaleId = null;

async function openInvoiceModal(saleId) {
    try {
        const sale = await getDocument(COLLECTION_SALES, saleId);
        if (!sale) return;

        currentEditingSaleId = saleId;

        // Fill modal with current sale data
        document.getElementById("modal-paid-amount").value = sale.paid_amount || 0;

        // Show modal
        const modal = document.getElementById("invoice-edit-modal");
        modal.classList.add("show");
    } catch (error) {
        showNotification("فشل فتح نافذة تعديل الفاتورة: " + error.message, "error");
    }
}

function closeInvoiceModal() {
    const modal = document.getElementById("invoice-edit-modal");
    modal.classList.remove("show");
    currentEditingSaleId = null;
}

async function saveInvoiceChanges() {
    if (!currentEditingSaleId) return;

    const paidAmount = parseFloat(document.getElementById("modal-paid-amount").value) || 0;

    if (paidAmount < 0) {
        showNotification("يرجى إدخال مبلغ صحيح", "error");
        return;
    }

    try {
        const sale = await getDocument(COLLECTION_SALES, currentEditingSaleId);
        const oldPaidAmount = sale.paid_amount || 0;

        await updateDocument(COLLECTION_SALES, currentEditingSaleId, {
            paid_amount: paidAmount,
            // remaining_amount: sale.subtotal - paidAmount, // Appwrite will calculate if needed
        });

        await updateRevenueForSale(sale, oldPaidAmount, paidAmount);

        loadData(); // Reload all data to update dashboard and expenses
        closeInvoiceModal();
        showNotification("تم تحديث الفاتورة وقائمة الإيرادات بنجاح", "success");
    } catch (error) {
        showNotification("فشل تحديث الفاتورة: " + error.message, "error");
    }
}

async function updateRevenueForSale(sale, oldPaidAmount, newPaidAmount) {
    const newRevenueDescription = 
        `مبيعات - ${sale.customer_name} - ${sale.customer_phone || "بدون رقم"} - فاتورة ${sale.invoice_number}`;

    const existingRevenue = revenues.find(
        (r) => r.description === newRevenueDescription
    );

    if (existingRevenue) {
        if (newPaidAmount > 0) {
            await updateDocument(COLLECTION_REVENUES, existingRevenue.$id, {
                amount: newPaidAmount,
                date: sale.sale_date,
            });
        } else {
            await deleteDocument(COLLECTION_REVENUES, existingRevenue.$id);
        }
    } else {
        if (newPaidAmount > 0) {
            await createDocument(COLLECTION_REVENUES, {
                description: newRevenueDescription,
                amount: newPaidAmount,
                date: sale.sale_date,
            });
        }
    }
}

// Financial Reports Filter Functions
async function filterFinancialReports() {
    const fromDate = document.getElementById("financial-from-date").value;
    const toDate = document.getElementById("financial-to-date").value;

    if (!fromDate || !toDate) {
        showNotification("يرجى تحديد تاريخ البداية والنهاية", "warning");
        return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
        showNotification("تاريخ البداية يجب أن يكون قبل تاريخ النهاية", "error");
        return;
    }

    try {
        const filteredRevenues = await listDocuments(COLLECTION_REVENUES, [
            Query.greaterThanEqual("date", fromDate),
            Query.lessThanEqual("date", toDate),
        ]);
        const filteredExpenses = await listDocuments(COLLECTION_EXPENSES, [
            Query.greaterThanEqual("date", fromDate),
            Query.lessThanEqual("date", toDate),
        ]);

        const totalRevenue = filteredRevenues.reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        document.getElementById("total-revenue").textContent = 
            `${totalRevenue.toFixed(2)} جنيه`;
        document.getElementById("total-expenses").textContent = 
            `${totalExpenses.toFixed(2)} جنيه`;
        document.getElementById("total-net-profit").textContent = 
            `${netProfit.toFixed(2)} جنيه`;

        // Update report tables with filtered data
        const salesReportTableBody = document.getElementById("sales-report-table-body");
        salesReportTableBody.innerHTML = filteredRevenues
            .filter(r => r.description.startsWith("مبيعات"))
            .map(
                (revenue) => {
                    // Attempt to find the original sale for more details
                    const originalSale = sales.find(s => revenue.description.includes(s.invoice_number));
                    return `
                    <tr>
                        <td>${originalSale?.invoice_number || "N/A"}</td>
                        <td>${revenue.date}</td>
                        <td>${originalSale?.customer_name || "N/A"}</td>
                        <td>${originalSale?.customer_phone || "N/A"}</td>
                        <td>${originalSale?.subtotal?.toFixed(2) || "N/A"} جنيه</td>
                        <td>${revenue.amount.toFixed(2)} جنيه</td>
                        <td>${(originalSale?.subtotal - revenue.amount)?.toFixed(2) || "N/A"} جنيه</td>
                        <td>${getStatusText(originalSale?.status || "N/A")}</td>
                    </tr>
                `;
                }
            )
            .join("");

        const expensesReportTableBody = document.getElementById("expenses-report-table-body");
        expensesReportTableBody.innerHTML = filteredExpenses
            .map(
                (expense) => `
                <tr>
                    <td>${expense.description}</td>
                    <td>${expense.amount.toFixed(2)} جنيه</td>
                    <td>${expense.date}</td>
                </tr>
            `
            )
            .join("");

        const revenuesReportTableBody = document.getElementById("revenues-report-table-body");
        revenuesReportTableBody.innerHTML = filteredRevenues
            .map(
                (revenue) => `
                <tr>
                    <td>${revenue.description}</td>
                    <td>${revenue.amount.toFixed(2)} جنيه</td>
                    <td>${revenue.date}</td>
                </tr>
            `
            )
            .join("");

    } catch (error) {
        showNotification("فشل تصفية التقارير المالية: " + error.message, "error");
    }
}

async function generateReport() {
    // This function now just reloads the reports tab with current data
    loadReports();
    showNotification("تم تحديث التقرير", "info");
}

async function loadDeletedInvoices() {
    try {
        const tbody = document.getElementById("deleted-invoices-table");
        const deleted = await listDocuments(COLLECTION_DELETED_INVOICES);

        if (deleted.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <i class="fas fa-trash-alt"></i>
                            <h3>لا توجد فواتير محذوفة</h3>
                            <p>لم يتم حذف أي فواتير بعد.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = deleted
            .map(
                (invoice) => `
                <tr>
                    <td>${invoice.invoice_number}</td>
                    <td>${invoice.sale_date}</td>
                    <td>${invoice.customer_name}</td>
                    <td>${invoice.customer_phone || "لا يوجد"}</td>
                    <td>${(invoice.subtotal || 0).toFixed(2)} جنيه</td>
                    <td>${(invoice.paid_amount || 0).toFixed(2)} جنيه</td>
                    <td>${invoice.deletedDate}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="restoreInvoice(
                            '${invoice.$id}'
                        )">
                            <i class="fas fa-undo"></i> استعادة
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="permanentlyDeleteInvoice(
                            '${invoice.$id}'
                        )">
                            <i class="fas fa-trash-alt"></i> حذف نهائي
                        </button>
                    </td>
                </tr>
            `
            )
            .join("");
    } catch (error) {
        console.error("Error loading deleted invoices:", error);
        showNotification("فشل تحميل الفواتير المحذوفة: " + error.message, "error");
    }
}

async function searchDeletedInvoices() {
    const searchTerm = document.getElementById("admin-search-input").value.toLowerCase();
    const fromDate = document.getElementById("admin-from-date").value;
    const toDate = document.getElementById("admin-to-date").value;

    let queries = [];
    if (searchTerm) {
        queries.push(Query.or(
            Query.search("customer_name", searchTerm),
            Query.search("invoice_number", searchTerm),
            Query.search("customer_phone", searchTerm)
        ));
    }
    if (fromDate) {
        queries.push(Query.greaterThanEqual("deletedDate", fromDate));
    }
    if (toDate) {
        queries.push(Query.lessThanEqual("deletedDate", toDate));
    }

    try {
        const filteredInvoices = await listDocuments(COLLECTION_DELETED_INVOICES, queries);
        const tbody = document.getElementById("deleted-invoices-table");

        if (filteredInvoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <h3>لا توجد نتائج</h3>
                            <p>لم يتم العثور على فواتير محذوفة تطابق البحث.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredInvoices
            .map(
                (invoice) => `
                <tr>
                    <td>${invoice.invoice_number}</td>
                    <td>${invoice.sale_date}</td>
                    <td>${invoice.customer_name}</td>
                    <td>${invoice.customer_phone || "لا يوجد"}</td>
                    <td>${(invoice.subtotal || 0).toFixed(2)} جنيه</td>
                    <td>${(invoice.paid_amount || 0).toFixed(2)} جنيه</td>
                    <td>${invoice.deletedDate}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="restoreInvoice(
                            '${invoice.$id}'
                        )">
                            <i class="fas fa-undo"></i> استعادة
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="permanentlyDeleteInvoice(
                            '${invoice.$id}'
                        )">
                            <i class="fas fa-trash-alt"></i> حذف نهائي
                        </button>
                    </td>
                </tr>
            `
            )
            .join("");
    } catch (error) {
        showNotification("فشل البحث في الفواتير المحذوفة: " + error.message, "error");
    }
}

async function restoreInvoice(invoiceId) {
    try {
        const invoiceToRestore = await getDocument(COLLECTION_DELETED_INVOICES, invoiceId);
        if (!invoiceToRestore) return;

        // Remove deletion metadata (not needed for Appwrite, just for local copy)
        delete invoiceToRestore.deletedAt;
        delete invoiceToRestore.deletedDate;

        // Add back to sales
        await createDocument(COLLECTION_SALES, {
            ...invoiceToRestore,
            products_sold: JSON.stringify(JSON.parse(invoiceToRestore.products_sold)), // Ensure it's a string
        });

        // Remove from deleted invoices
        await deleteDocument(COLLECTION_DELETED_INVOICES, invoiceId);

        // Restore revenue entry if paid amount > 0
        if (invoiceToRestore.paid_amount > 0) {
            const revenueDescription = 
                `مبيعات - ${invoiceToRestore.customer_name} - ${invoiceToRestore.customer_phone || "بدون رقم"} - فاتورة ${invoiceToRestore.invoice_number}`;
            await createDocument(COLLECTION_REVENUES, {
                description: revenueDescription,
                amount: invoiceToRestore.paid_amount,
                date: invoiceToRestore.sale_date,
            });
        }

        showNotification("تم استعادة الفاتورة بنجاح", "success");
        loadData(); // Reload all data
    } catch (error) {
        showNotification("فشل استعادة الفاتورة: " + error.message, "error");
    }
}

function permanentlyDeleteInvoice(invoiceId) {
    showDeleteConfirmation("deleted-invoice", invoiceId);
}

// Global function to load all data (used by service worker and initial load)
window.loadAllData = loadData;


