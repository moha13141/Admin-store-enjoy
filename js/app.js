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

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = JSON.parse(e.target.result);

            // Clear existing data before import (optional, but safer)
            await window.resetStore(); // This will also logout and show login screen

            // Re-create store if it was deleted by resetStore
            if (data.storeSettings && data.storeSettings.store_id) {
                await window.createNewStore(data.storeSettings.name, data.storeSettings.owner_name);
                window.setCurrentStoreId(data.storeSettings.store_id);
            }

            // Import categories
            for (const cat of data.categories) {
                await window.createDocument(window.COLLECTION_CATEGORIES, { name: cat.name });
            }

            // Import products
            for (const prod of data.products) {
                await window.createDocument(window.COLLECTION_PRODUCTS, {
                    name: prod.name,
                    category_id: prod.category_id,
                    wholesale_price: prod.wholesale_price,
                    price: prod.price,
                    quantity: prod.quantity,
                    min_stock: prod.min_stock,
                });
            }

            // Import sales
            for (const sale of data.sales) {
                await window.createDocument(window.COLLECTION_SALES, {
                    invoice_number: sale.invoice_number,
                    customer_name: sale.customer_name,
                    customer_phone: sale.customer_phone,
                    sale_date: sale.sale_date,
                    products_sold: sale.products_sold,
                    subtotal: sale.subtotal,
                    paid_amount: sale.paid_amount,
                    status: sale.status,
                    notes: sale.notes,
                });
            }

            // Import expenses
            for (const exp of data.expenses) {
                await window.createDocument(window.COLLECTION_EXPENSES, {
                    description: exp.description,
                    amount: exp.amount,
                    date: exp.date,
                });
            }

            // Import revenues
            for (const rev of data.revenues) {
                await window.createDocument(window.COLLECTION_REVENUES, {
                    description: rev.description,
                    amount: rev.amount,
                    date: rev.date,
                });
            }

            // Import deleted invoices
            for (const delInv of data.deletedInvoices) {
                await window.createDocument(window.COLLECTION_DELETED_INVOICES, {
                    store_id: delInv.store_id,
                    invoice_number: delInv.invoice_number,
                    customer_name: delInv.customer_name,
                    customer_phone: delInv.customer_phone,
                    sale_date: delInv.sale_date,
                    products_sold: delInv.products_sold,
                    subtotal: delInv.subtotal,
                    paid_amount: delInv.paid_amount,
                    status: delInv.status,
                    deletedAt: delInv.deletedAt,
                    deletedDate: delInv.deletedDate,
                });
            }

            showNotification("تم استيراد البيانات بنجاح!", "success");
            hideLoginScreen();
            setTimeout(() => {
                initializeApp();
                setupEventListeners();
                updateCurrentDate();
                loadData();
            }, 500);

        } catch (error) {
            console.error("Error importing data:", error);
            showNotification("فشل استيراد البيانات: " + error.message, "error");
        }
    };
    reader.readAsText(file);
}

// Function to show notifications
function showNotification(message, type) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// Function to update current date display
function updateCurrentDate() {
    const currentDateElement = document.getElementById("current-date");
    if (currentDateElement) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = today.toLocaleDateString('ar-EG', options);
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        sales = await window.listDocuments(window.COLLECTION_SALES);
        displaySales(sales, "dashboard-sales-list");
        updateDashboardSummary();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        showNotification("فشل تحميل بيانات لوحة التحكم: " + error.message, "error");
    }
}

function updateDashboardSummary() {
    const totalSalesToday = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return saleDate === today;
    }).reduce((sum, sale) => sum + sale.subtotal, 0);

    const totalInvoicesToday = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return saleDate === today;
    }).length;

    document.getElementById("total-sales-today").textContent = `${totalSalesToday.toFixed(2)} جنيه`;
    document.getElementById("total-invoices-today").textContent = totalInvoicesToday;
}

function displaySales(salesArray, elementId) {
    const salesList = document.getElementById(elementId);
    salesList.innerHTML = "";
    if (salesArray.length === 0) {
        salesList.innerHTML = "<p class=\"no-data\">لا توجد مبيعات لعرضها.</p>";
        return;
    }

    salesArray.forEach((sale) => {
        const saleItem = document.createElement("div");
        saleItem.classList.add("sale-item");
        saleItem.innerHTML = `
            <div class="sale-details">
                <span class="invoice-number">فاتورة رقم: ${sale.invoice_number}</span>
                <span class="customer-name">العميل: ${sale.customer_name}</span>
                <span class="sale-amount">المبلغ: ${sale.subtotal.toFixed(2)} جنيه</span>
                <span class="sale-date">التاريخ: ${sale.sale_date}</span>
            </div>
            <div class="sale-actions">
                <button class="btn-edit" onclick="editInvoice('${sale.$id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="confirmDeleteInvoice('${sale.$id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        salesList.appendChild(saleItem);
    });
}

function filterDashboardSales() {
    const startDate = document.getElementById("dashboard-start-date").value;
    const endDate = document.getElementById("dashboard-end-date").value;

    let filteredSales = sales;

    if (startDate) {
        filteredSales = filteredSales.filter(sale => new Date(sale.sale_date) >= new Date(startDate));
    }
    if (endDate) {
        filteredSales = filteredSales.filter(sale => new Date(sale.sale_date) <= new Date(endDate));
    }

    displaySales(filteredSales, "dashboard-sales-list");
}

function searchSales() {
    const searchTerm = document.getElementById("dashboard-search").value.toLowerCase();
    const filteredSales = sales.filter(sale => 
        sale.invoice_number.toLowerCase().includes(searchTerm) ||
        sale.customer_name.toLowerCase().includes(searchTerm)
    );
    displaySales(filteredSales, "dashboard-sales-list");
}

// Sales tab functions
async function loadSalesTab() {
    try {
        products = await window.listDocuments(window.COLLECTION_PRODUCTS);
        categories = await window.listDocuments(window.COLLECTION_CATEGORIES);
        sales = await window.listDocuments(window.COLLECTION_SALES);
        displayProductsForSale();
        displaySales(sales, "sales-list");
        populateCategoryFilter();
    } catch (error) {
        console.error("Error loading sales tab data:", error);
        showNotification("فشل تحميل بيانات المبيعات: " + error.message, "error");
    }
}

function displayProductsForSale() {
    const productList = document.getElementById("product-selection-list");
    productList.innerHTML = "";
    if (products.length === 0) {
        productList.innerHTML = "<p class=\"no-data\">لا توجد منتجات لعرضها. يرجى إضافة منتجات في المخزون.</p>";
        return;
    }

    products.forEach((product) => {
        const productItem = document.createElement("div");
        productItem.classList.add("product-item");
        productItem.innerHTML = `
            <div class="product-details">
                <span class="product-name">${product.name}</span>
                <span class="product-price">${product.price.toFixed(2)} جنيه</span>
                <span class="product-stock">المخزون: ${product.quantity}</span>
            </div>
            <div class="product-actions">
                <input type="number" min="1" value="1" class="product-quantity-input" id="quantity-${product.$id}">
                <button class="btn-add-to-sale" onclick="addToSale('${product.$id}')"><i class="fas fa-cart-plus"></i></button>
            </div>
        `;
        productList.appendChild(productItem);
    });
}

function addToSale(productId) {
    const product = products.find(p => p.$id === productId);
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantity = parseInt(quantityInput.value);

    if (!product || isNaN(quantity) || quantity <= 0) {
        showNotification("كمية غير صالحة", "error");
        return;
    }

    if (quantity > product.quantity) {
        showNotification("الكمية المطلوبة أكبر من المخزون المتاح", "error");
        return;
    }

    const existingItemIndex = selectedProducts.findIndex(item => item.$id === productId);

    if (existingItemIndex > -1) {
        selectedProducts[existingItemIndex].selectedQuantity += quantity;
    } else {
        selectedProducts.push({ ...product, selectedQuantity: quantity });
    }

    updateSelectedProductsList();
    showNotification(`تم إضافة ${quantity} من ${product.name} إلى الفاتورة`, "success");
}

function updateSelectedProductsList() {
    const selectedProductsList = document.getElementById("selected-products-list");
    selectedProductsList.innerHTML = "";
    let total = 0;

    if (selectedProducts.length === 0) {
        selectedProductsList.innerHTML = "<p class=\"no-data\">لا توجد منتجات محددة.</p>";
        document.getElementById("subtotal").textContent = "0.00";
        document.getElementById("paid-amount").value = "0";
        document.getElementById("remaining-amount").textContent = "0.00";
        return;
    }

    selectedProducts.forEach((item, index) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <span>${item.name} (x${item.selectedQuantity}) - ${item.price.toFixed(2)} جنيه/وحدة</span>
            <span>${(item.price * item.selectedQuantity).toFixed(2)} جنيه</span>
            <button class="btn-remove" onclick="removeSelectedProduct(${index})"><i class="fas fa-times"></i></button>
        `;
        selectedProductsList.appendChild(listItem);
        total += item.price * item.selectedQuantity;
    });

    document.getElementById("subtotal").textContent = total.toFixed(2);
    calculateRemainingAmount();
}

function removeSelectedProduct(index) {
    selectedProducts.splice(index, 1);
    updateSelectedProductsList();
}

function calculateRemainingAmount() {
    const subtotal = parseFloat(document.getElementById("subtotal").textContent);
    const paidAmount = parseFloat(document.getElementById("paid-amount").value) || 0;
    const remaining = subtotal - paidAmount;
    document.getElementById("remaining-amount").textContent = remaining.toFixed(2);
}

async function completeSale() {
    const customerName = document.getElementById("customer-name").value.trim();
    const customerPhone = document.getElementById("customer-phone").value.trim();
    const saleDate = document.getElementById("sale-date").value;
    const subtotal = parseFloat(document.getElementById("subtotal").textContent);
    const paidAmount = parseFloat(document.getElementById("paid-amount").value) || 0;
    const remainingAmount = parseFloat(document.getElementById("remaining-amount").textContent);

    if (selectedProducts.length === 0) {
        showNotification("يرجى إضافة منتجات إلى الفاتورة", "error");
        return;
    }

    if (!customerName || !saleDate) {
        showNotification("يرجى إدخال اسم العميل وتاريخ البيع", "error");
        return;
    }

    if (subtotal <= 0) {
        showNotification("إجمالي الفاتورة يجب أن يكون أكبر من صفر", "error");
        return;
    }

    let status = "مدفوعة بالكامل";
    if (remainingAmount > 0) {
        status = "مدفوعة جزئياً";
    } else if (paidAmount === 0) {
        status = "غير مدفوعة";
    }

    // Generate a unique invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    try {
        // Create the sale document
        await window.createDocument(window.COLLECTION_SALES, {
            invoice_number: invoiceNumber,
            customer_name: customerName,
            customer_phone: customerPhone,
            sale_date: saleDate,
            products_sold: JSON.stringify(selectedProducts.map(p => ({ id: p.$id, name: p.name, quantity: p.selectedQuantity, price: p.price }))),
            subtotal: subtotal,
            paid_amount: paidAmount,
            status: status,
            notes: "", // Add notes field if available
        });

        // Update product quantities in inventory
        for (const item of selectedProducts) {
            const product = products.find(p => p.$id === item.$id);
            if (product) {
                const newQuantity = product.quantity - item.selectedQuantity;
                await window.updateDocument(window.COLLECTION_PRODUCTS, product.$id, { quantity: newQuantity });
            }
        }

        showNotification("تم إتمام عملية البيع بنجاح!", "success");
        clearSaleForm();
        loadSalesTab(); // Reload sales data
        loadDashboard(); // Reload dashboard data
    } catch (error) {
        console.error("Error completing sale:", error);
        showNotification("فشل إتمام عملية البيع: " + error.message, "error");
    }
}

function clearSaleForm() {
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-phone").value = "";
    document.getElementById("sale-date").value = new Date().toISOString().split("T")[0];
    document.getElementById("paid-amount").value = "0";
    selectedProducts = [];
    updateSelectedProductsList();
}

async function editInvoice(invoiceId) {
    try {
        const invoice = await window.getDocument(window.COLLECTION_SALES, invoiceId);
        if (!invoice) {
            showNotification("الفاتورة غير موجودة", "error");
            return;
        }

        // Populate modal with invoice data
        document.getElementById("edit-invoice-id").value = invoice.$id;
        document.getElementById("edit-invoice-number").textContent = invoice.invoice_number;
        document.getElementById("edit-customer-name").value = invoice.customer_name;
        document.getElementById("edit-customer-phone").value = invoice.customer_phone;
        document.getElementById("edit-sale-date").value = invoice.sale_date;
        document.getElementById("edit-subtotal").textContent = invoice.subtotal.toFixed(2);
        document.getElementById("edit-paid-amount").value = invoice.paid_amount;
        document.getElementById("edit-remaining-amount").textContent = (invoice.subtotal - invoice.paid_amount).toFixed(2);
        document.getElementById("edit-invoice-status").value = invoice.status;

        // Display products sold in the invoice
        const productsSoldList = document.getElementById("edit-products-sold-list");
        productsSoldList.innerHTML = "";
        const soldItems = JSON.parse(invoice.products_sold);
        soldItems.forEach(item => {
            const listItem = document.createElement("li");
            listItem.textContent = `${item.name} (x${item.quantity}) - ${item.price.toFixed(2)} جنيه`;
            productsSoldList.appendChild(listItem);
        });

        document.getElementById("invoice-edit-modal").style.display = "flex";
    } catch (error) {
        console.error("Error editing invoice:", error);
        showNotification("فشل تحميل بيانات الفاتورة: " + error.message, "error");
    }
}

function closeInvoiceModal() {
    document.getElementById("invoice-edit-modal").style.display = "none";
}

async function saveInvoiceChanges() {
    const invoiceId = document.getElementById("edit-invoice-id").value;
    const customerName = document.getElementById("edit-customer-name").value.trim();
    const customerPhone = document.getElementById("edit-customer-phone").value.trim();
    const saleDate = document.getElementById("edit-sale-date").value;
    const paidAmount = parseFloat(document.getElementById("edit-paid-amount").value) || 0;
    const status = document.getElementById("edit-invoice-status").value;

    if (!customerName || !saleDate) {
        showNotification("يرجى إدخال اسم العميل وتاريخ البيع", "error");
        return;
    }

    try {
        await window.updateDocument(window.COLLECTION_SALES, invoiceId, {
            customer_name: customerName,
            customer_phone: customerPhone,
            sale_date: saleDate,
            paid_amount: paidAmount,
            status: status,
        });
        showNotification("تم حفظ تغييرات الفاتورة بنجاح", "success");
        closeInvoiceModal();
        loadSalesTab(); // Reload sales data
        loadDashboard(); // Reload dashboard data
    } catch (error) {
        console.error("Error saving invoice changes:", error);
        showNotification("فشل حفظ تغييرات الفاتورة: " + error.message, "error");
    }
}

function confirmDeleteInvoice(invoiceId) {
    showConfirmationModal("هل أنت متأكد من حذف هذه الفاتورة؟", async () => {
        try {
            const invoice = await window.getDocument(window.COLLECTION_SALES, invoiceId);
            if (!invoice) {
                showNotification("الفاتورة غير موجودة", "error");
                return;
            }

            // Move to deletedInvoices collection
            await window.createDocument(window.COLLECTION_DELETED_INVOICES, {
                store_id: invoice.store_id,
                invoice_number: invoice.invoice_number,
                customer_name: invoice.customer_name,
                customer_phone: invoice.customer_phone,
                sale_date: invoice.sale_date,
                products_sold: invoice.products_sold,
                subtotal: invoice.subtotal,
                paid_amount: invoice.paid_amount,
                status: invoice.status,
                deletedAt: new Date().toISOString(),
                deletedDate: new Date().toLocaleDateString('ar-EG'),
            });

            // Delete from sales collection
            await window.deleteDocument(window.COLLECTION_SALES, invoiceId);

            showNotification("تم حذف الفاتورة بنجاح", "success");
            loadSalesTab(); // Reload sales data
            loadDashboard(); // Reload dashboard data
        } catch (error) {
            console.error("Error deleting invoice:", error);
            showNotification("فشل حذف الفاتورة: " + error.message, "error");
        }
    });
}

function filterSales() {
    const startDate = document.getElementById("sales-start-date").value;
    const endDate = document.getElementById("sales-end-date").value;
    const statusFilter = document.getElementById("sales-status-filter").value;

    let filteredSales = sales;

    if (startDate) {
        filteredSales = filteredSales.filter(sale => new Date(sale.sale_date) >= new Date(startDate));
    }
    if (endDate) {
        filteredSales = filteredSales.filter(sale => new Date(sale.sale_date) <= new Date(endDate));
    }
    if (statusFilter !== "all") {
        filteredSales = filteredSales.filter(sale => sale.status === statusFilter);
    }

    displaySales(filteredSales, "sales-list");
}

// Inventory tab functions
async function loadInventory() {
    try {
        products = await window.listDocuments(window.COLLECTION_PRODUCTS);
        categories = await window.listDocuments(window.COLLECTION_CATEGORIES);
        displayProducts(products);
        populateCategoryFilter("inventory-category-filter");
        populateCategorySelect("product-category");
        populateCategorySelect("edit-product-category");
    } catch (error) {
        console.error("Error loading inventory data:", error);
        showNotification("فشل تحميل بيانات المخزون: " + error.message, "error");
    }
}

function displayProducts(productsArray) {
    const productList = document.getElementById("product-list");
    productList.innerHTML = "";
    if (productsArray.length === 0) {
        productList.innerHTML = "<p class=\"no-data\">لا توجد منتجات لعرضها.</p>";
        return;
    }

    productsArray.forEach((product) => {
        const productItem = document.createElement("div");
        productItem.classList.add("product-item");
        productItem.innerHTML = `
            <div class="product-details">
                <span class="product-name">${product.name}</span>
                <span class="product-category">${getCategoryName(product.category_id)}</span>
                <span class="product-price">سعر البيع: ${product.price.toFixed(2)} جنيه</span>
                <span class="product-wholesale-price">سعر الجملة: ${product.wholesale_price.toFixed(2)} جنيه</span>
                <span class="product-stock">المخزون: ${product.quantity}</span>
                <span class="product-min-stock">حد أدنى: ${product.min_stock}</span>
            </div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct('${product.$id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="confirmDeleteProduct('${product.$id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        productList.appendChild(productItem);
    });
}

function getCategoryName(categoryId) {
    const category = categories.find(cat => cat.$id === categoryId);
    return category ? category.name : "غير مصنف";
}

function toggleProductForm() {
    const productForm = document.getElementById("add-product-form");
    productForm.classList.toggle("hidden");
    if (!productForm.classList.contains("hidden")) {
        populateCategorySelect("product-category");
    }
}

async function addCategory() {
    const categoryName = prompt("أدخل اسم الفئة الجديدة:");
    if (categoryName) {
        try {
            await window.createDocument(window.COLLECTION_CATEGORIES, { name: categoryName });
            showNotification("تم إضافة الفئة بنجاح", "success");
            loadInventory(); // Reload inventory to update categories
        } catch (error) {
            console.error("Error adding category:", error);
            showNotification("فشل إضافة الفئة: " + error.message, "error");
        }
    }
}

function populateCategorySelect(selectId) {
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = "<option value=\"\">اختر فئة</option>";
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.$id;
        option.textContent = category.name;
        selectElement.appendChild(option);
    });
}

async function saveProduct() {
    const productName = document.getElementById("product-name").value.trim();
    const productCategory = document.getElementById("product-category").value;
    const wholesalePrice = parseFloat(document.getElementById("wholesale-price").value);
    const retailPrice = parseFloat(document.getElementById("retail-price").value);
    const quantity = parseInt(document.getElementById("product-quantity").value);
    const minStock = parseInt(document.getElementById("min-stock").value);

    if (!productName || !productCategory || isNaN(wholesalePrice) || isNaN(retailPrice) || isNaN(quantity) || isNaN(minStock)) {
        showNotification("يرجى ملء جميع حقول المنتج بشكل صحيح", "error");
        return;
    }

    try {
        await window.createDocument(window.COLLECTION_PRODUCTS, {
            name: productName,
            category_id: productCategory,
            wholesale_price: wholesalePrice,
            price: retailPrice,
            quantity: quantity,
            min_stock: minStock,
        });
        showNotification("تم حفظ المنتج بنجاح", "success");
        clearProductForm();
        loadInventory(); // Reload inventory to show new product
    } catch (error) {
        console.error("Error saving product:", error);
        showNotification("فشل حفظ المنتج: " + error.message, "error");
    }
}

function clearProductForm() {
    document.getElementById("product-name").value = "";
    document.getElementById("product-category").value = "";
    document.getElementById("wholesale-price").value = "";
    document.getElementById("retail-price").value = "";
    document.getElementById("product-quantity").value = "";
    document.getElementById("min-stock").value = "";
}

async function editProduct(productId) {
    try {
        const product = await window.getDocument(window.COLLECTION_PRODUCTS, productId);
        if (!product) {
            showNotification("المنتج غير موجود", "error");
            return;
        }

        // Populate modal with product data
        document.getElementById("edit-product-id").value = product.$id;
        document.getElementById("edit-product-name").value = product.name;
        document.getElementById("edit-product-category").value = product.category_id;
        document.getElementById("edit-wholesale-price").value = product.wholesale_price;
        document.getElementById("edit-retail-price").value = product.price;
        document.getElementById("edit-product-quantity").value = product.quantity;
        document.getElementById("edit-min-stock").value = product.min_stock;

        document.getElementById("product-edit-modal").style.display = "flex";
    } catch (error) {
        console.error("Error editing product:", error);
        showNotification("فشل تحميل بيانات المنتج: " + error.message, "error");
    }
}

function closeProductModal() {
    document.getElementById("product-edit-modal").style.display = "none";
}

async function saveProductChanges() {
    const productId = document.getElementById("edit-product-id").value;
    const productName = document.getElementById("edit-product-name").value.trim();
    const productCategory = document.getElementById("edit-product-category").value;
    const wholesalePrice = parseFloat(document.getElementById("edit-wholesale-price").value);
    const retailPrice = parseFloat(document.getElementById("edit-retail-price").value);
    const quantity = parseInt(document.getElementById("edit-product-quantity").value);
    const minStock = parseInt(document.getElementById("edit-min-stock").value);

    if (!productName || !productCategory || isNaN(wholesalePrice) || isNaN(retailPrice) || isNaN(quantity) || isNaN(minStock)) {
        showNotification("يرجى ملء جميع حقول المنتج بشكل صحيح", "error");
        return;
    }

    try {
        await window.updateDocument(window.COLLECTION_PRODUCTS, productId, {
            name: productName,
            category_id: productCategory,
            wholesale_price: wholesalePrice,
            price: retailPrice,
            quantity: quantity,
            min_stock: minStock,
        });
        showNotification("تم حفظ تغييرات المنتج بنجاح", "success");
        closeProductModal();
        loadInventory(); // Reload inventory to show updated product
    } catch (error) {
        console.error("Error saving product changes:", error);
        showNotification("فشل حفظ تغييرات المنتج: " + error.message, "error");
    }
}

function confirmDeleteProduct(productId) {
    showConfirmationModal("هل أنت متأكد من حذف هذا المنتج؟", async () => {
        try {
            await window.deleteDocument(window.COLLECTION_PRODUCTS, productId);
            showNotification("تم حذف المنتج بنجاح", "success");
            loadInventory(); // Reload inventory to remove deleted product
        } catch (error) {
            console.error("Error deleting product:", error);
            showNotification("فشل حذف المنتج: " + error.message, "error");
        }
    });
}

// Expenses tab functions
async function loadExpenses() {
    try {
        expenses = await window.listDocuments(window.COLLECTION_EXPENSES);
        revenues = await window.listDocuments(window.COLLECTION_REVENUES);
        displayExpenses(expenses);
        displayRevenues(revenues);
        updateExpensesSummary();
    } catch (error) {
        console.error("Error loading expenses data:", error);
        showNotification("فشل تحميل بيانات المصروفات والإيرادات: " + error.message, "error");
    }
}

function displayExpenses(expensesArray) {
    const expensesList = document.getElementById("expenses-list");
    expensesList.innerHTML = "";
    if (expensesArray.length === 0) {
        expensesList.innerHTML = "<p class=\"no-data\">لا توجد مصروفات لعرضها.</p>";
        return;
    }

    expensesArray.forEach((expense) => {
        const expenseItem = document.createElement("div");
        expenseItem.classList.add("expense-item");
        expenseItem.innerHTML = `
            <div class="expense-details">
                <span class="expense-description">${expense.description}</span>
                <span class="expense-amount">${expense.amount.toFixed(2)} جنيه</span>
                <span class="expense-date">${expense.date}</span>
            </div>
            <div class="expense-actions">
                <button class="btn-delete" onclick="confirmDeleteExpense('${expense.$id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        expensesList.appendChild(expenseItem);
    });
}

function displayRevenues(revenuesArray) {
    const revenuesList = document.getElementById("revenues-list");
    revenuesList.innerHTML = "";
    if (revenuesArray.length === 0) {
        revenuesList.innerHTML = "<p class=\"no-data\">لا توجد إيرادات لعرضها.</p>";
        return;
    }

    revenuesArray.forEach((revenue) => {
        const revenueItem = document.createElement("div");
        revenueItem.classList.add("revenue-item");
        revenueItem.innerHTML = `
            <div class="revenue-details">
                <span class="revenue-description">${revenue.description}</span>
                <span class="revenue-amount">${revenue.amount.toFixed(2)} جنيه</span>
                <span class="revenue-date">${revenue.date}</span>
            </div>
            <div class="revenue-actions">
                <button class="btn-delete" onclick="confirmDeleteRevenue('${revenue.$id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        revenuesList.appendChild(revenueItem);
    });
}

function updateExpensesSummary() {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalRevenues = revenues.reduce((sum, rev) => sum + rev.amount, 0);
    const netProfit = totalRevenues - totalExpenses;

    document.getElementById("total-expenses").textContent = `${totalExpenses.toFixed(2)} جنيه`;
    document.getElementById("total-revenues").textContent = `${totalRevenues.toFixed(2)} جنيه`;
    document.getElementById("net-profit").textContent = `${netProfit.toFixed(2)} جنيه`;
}

async function addExpense() {
    const description = document.getElementById("expense-description").value.trim();
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const date = document.getElementById("expense-date").value;

    if (!description || isNaN(amount) || amount <= 0 || !date) {
        showNotification("يرجى ملء جميع حقول المصروفات بشكل صحيح", "error");
        return;
    }

    try {
        await window.createDocument(window.COLLECTION_EXPENSES, { description, amount, date });
        showNotification("تم إضافة المصروف بنجاح", "success");
        clearExpenseForm();
        loadExpenses(); // Reload expenses data
    } catch (error) {
        console.error("Error adding expense:", error);
        showNotification("فشل إضافة المصروف: " + error.message, "error");
    }
}

function clearExpenseForm() {
    document.getElementById("expense-description").value = "";
    document.getElementById("expense-amount").value = "";
    document.getElementById("expense-date").value = new Date().toISOString().split("T")[0];
}

async function addRevenue() {
    const description = document.getElementById("revenue-description").value.trim();
    const amount = parseFloat(document.getElementById("revenue-amount").value);
    const date = document.getElementById("revenue-date").value;

    if (!description || isNaN(amount) || amount <= 0 || !date) {
        showNotification("يرجى ملء جميع حقول الإيرادات بشكل صحيح", "error");
        return;
    }

    try {
        await window.createDocument(window.COLLECTION_REVENUES, { description, amount, date });
        showNotification("تم إضافة الإيراد بنجاح", "success");
        clearRevenueForm();
        loadExpenses(); // Reload revenues data
    } catch (error) {
        console.error("Error adding revenue:", error);
        showNotification("فشل إضافة الإيراد: " + error.message, "error");
    }
}

function clearRevenueForm() {
    document.getElementById("revenue-description").value = "";
    document.getElementById("revenue-amount").value = "";
    document.getElementById("revenue-date").value = new Date().toISOString().split("T")[0];
}

function confirmDeleteExpense(expenseId) {
    showConfirmationModal("هل أنت متأكد من حذف هذا المصروف؟", async () => {
        try {
            await window.deleteDocument(window.COLLECTION_EXPENSES, expenseId);
            showNotification("تم حذف المصروف بنجاح", "success");
            loadExpenses(); // Reload expenses data
        } catch (error) {
            console.error("Error deleting expense:", error);
            showNotification("فشل حذف المصروف: " + error.message, "error");
        }
    });
}

function confirmDeleteRevenue(revenueId) {
    showConfirmationModal("هل أنت متأكد من حذف هذا الإيراد؟", async () => {
        try {
            await window.deleteDocument(window.COLLECTION_REVENUES, revenueId);
            showNotification("تم حذف الإيراد بنجاح", "success");
            loadExpenses(); // Reload revenues data
        } catch (error) {
            console.error("Error deleting revenue:", error);
            showNotification("فشل حذف الإيراد: " + error.message, "error");
        }
    });
}

function filterExpenses() {
    const startDate = document.getElementById("expense-start-date").value;
    const endDate = document.getElementById("expense-end-date").value;

    let filteredExpenses = expenses;
    let filteredRevenues = revenues;

    if (startDate) {
        filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) >= new Date(startDate));
        filteredRevenues = filteredRevenues.filter(rev => new Date(rev.date) >= new Date(startDate));
    }
    if (endDate) {
        filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) <= new Date(endDate));
        filteredRevenues = filteredRevenues.filter(rev => new Date(rev.date) <= new Date(endDate));
    }

    displayExpenses(filteredExpenses);
    displayRevenues(filteredRevenues);
    updateExpensesSummary(); // This will re-calculate based on global expenses/revenues, not filtered ones. Needs adjustment if filtering affects summary.
}

function clearExpenseFilter() {
    document.getElementById("expense-start-date").value = "";
    document.getElementById("expense-end-date").value = "";
    loadExpenses(); // Reload to show all
}

// Reports tab functions
async function loadReports() {
    try {
        sales = await window.listDocuments(window.COLLECTION_SALES);
        expenses = await window.listDocuments(window.COLLECTION_EXPENSES);
        revenues = await window.listDocuments(window.COLLECTION_REVENUES);
        generateReport(); // Generate initial report
    } catch (error) {
        console.error("Error loading reports data:", error);
        showNotification("فشل تحميل بيانات التقارير: " + error.message, "error");
    }
}

function generateReport() {
    const reportStartDate = document.getElementById("report-start-date").value;
    const reportEndDate = document.getElementById("report-end-date").value;

    let filteredSales = sales;
    let filteredExpenses = expenses;
    let filteredRevenues = revenues;

    if (reportStartDate) {
        filteredSales = filteredSales.filter(sale => new Date(sale.sale_date) >= new Date(reportStartDate));
        filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) >= new Date(reportStartDate));
        filteredRevenues = filteredRevenues.filter(rev => new Date(rev.date) >= new Date(reportStartDate));
    }
    if (reportEndDate) {
        filteredSales = filteredSales.filter(sale => new Date(sale.sale_date) <= new Date(reportEndDate));
        filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) <= new Date(reportEndDate));
        filteredRevenues = filteredRevenues.filter(rev => new Date(rev.date) <= new Date(reportEndDate));
    }

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.subtotal, 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalRevenues = filteredRevenues.reduce((sum, rev) => sum + rev.amount, 0);
    const netProfit = totalRevenues + totalSales - totalExpenses; // Assuming sales are also revenue

    document.getElementById("report-total-sales").textContent = `${totalSales.toFixed(2)} جنيه`;
    document.getElementById("report-total-expenses").textContent = `${totalExpenses.toFixed(2)} جنيه`;
    document.getElementById("report-total-revenues").textContent = `${totalRevenues.toFixed(2)} جنيه`;
    document.getElementById("report-net-profit").textContent = `${netProfit.toFixed(2)} جنيه`;

    // Display top selling products (simple example, needs more logic for actual top sellers)
    const productSalesMap = {};
    filteredSales.forEach(sale => {
        const productsSold = JSON.parse(sale.products_sold);
        productsSold.forEach(item => {
            productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.quantity;
        });
    });

    const sortedProducts = Object.entries(productSalesMap).sort((a, b) => b[1] - a[1]);
    const topProductsList = document.getElementById("top-products-list");
    topProductsList.innerHTML = "";
    if (sortedProducts.length === 0) {
        topProductsList.innerHTML = "<p class=\"no-data\">لا توجد منتجات مباعة في الفترة المحددة.</p>";
    } else {
        sortedProducts.slice(0, 5).forEach(([name, quantity]) => {
            const listItem = document.createElement("li");
            listItem.textContent = `${name}: ${quantity} وحدة`;
            topProductsList.appendChild(listItem);
        });
    }

    // Display sales by category (simple example)
    const categorySalesMap = {};
    filteredSales.forEach(sale => {
        const productsSold = JSON.parse(sale.products_sold);
        productsSold.forEach(item => {
            const product = products.find(p => p.$id === item.id);
            if (product) {
                const categoryName = getCategoryName(product.category_id);
                categorySalesMap[categoryName] = (categorySalesMap[categoryName] || 0) + (item.quantity * item.price);
            }
        });
    });

    const sortedCategories = Object.entries(categorySalesMap).sort((a, b) => b[1] - a[1]);
    const categorySalesList = document.getElementById("category-sales-list");
    categorySalesList.innerHTML = "";
    if (sortedCategories.length === 0) {
        categorySalesList.innerHTML = "<p class=\"no-data\">لا توجد مبيعات حسب الفئة في الفترة المحددة.</p>";
    } else {
        sortedCategories.forEach(([name, amount]) => {
            const listItem = document.createElement("li");
            listItem.textContent = `${name}: ${amount.toFixed(2)} جنيه`;
            categorySalesList.appendChild(listItem);
        });
    }
}

// Admin tab functions
function adminLogin() {
    const adminPassword = prompt("أدخل كلمة مرور المسؤول:");
    if (adminPassword === "admin123") { // Replace with a secure method in production
        isAdminLoggedIn = true;
        showNotification("تم تسجيل دخول المسؤول بنجاح", "success");
        document.getElementById("admin-controls").classList.remove("hidden");
        document.getElementById("admin-login-btn").classList.add("hidden");
        document.getElementById("admin-logout-btn").classList.remove("hidden");
        loadAdminTab();
    } else if (adminPassword !== null) {
        showNotification("كلمة مرور المسؤول غير صحيحة", "error");
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    showNotification("تم تسجيل خروج المسؤول", "success");
    document.getElementById("admin-controls").classList.add("hidden");
    document.getElementById("admin-login-btn").classList.remove("hidden");
    document.getElementById("admin-logout-btn").classList.add("hidden");
    document.getElementById("deleted-invoices-list").innerHTML = ""; // Clear list
}

async function loadAdminTab() {
    if (isAdminLoggedIn) {
        try {
            deletedInvoices = await window.listDocuments(window.COLLECTION_DELETED_INVOICES);
            displayDeletedInvoices(deletedInvoices);
        } catch (error) {
            console.error("Error loading deleted invoices:", error);
            showNotification("فشل تحميل الفواتير المحذوفة: " + error.message, "error");
        }
    } else {
        document.getElementById("deleted-invoices-list").innerHTML = "<p class=\"no-data\">يرجى تسجيل الدخول كمسؤول لعرض الفواتير المحذوفة.</p>";
    }
}

function displayDeletedInvoices(invoicesArray) {
    const deletedInvoicesList = document.getElementById("deleted-invoices-list");
    deletedInvoicesList.innerHTML = "";
    if (invoicesArray.length === 0) {
        deletedInvoicesList.innerHTML = "<p class=\"no-data\">لا توجد فواتير محذوفة لعرضها.</p>";
        return;
    }

    invoicesArray.forEach((invoice) => {
        const invoiceItem = document.createElement("div");
        invoiceItem.classList.add("sale-item");
        invoiceItem.innerHTML = `
            <div class="sale-details">
                <span class="invoice-number">فاتورة رقم: ${invoice.invoice_number}</span>
                <span class="customer-name">العميل: ${invoice.customer_name}</span>
                <span class="sale-amount">المبلغ: ${invoice.subtotal.toFixed(2)} جنيه</span>
                <span class="sale-date">تاريخ الحذف: ${invoice.deletedDate}</span>
            </div>
            <div class="sale-actions">
                <button class="btn-restore" onclick="restoreDeletedInvoice('${invoice.$id}')"><i class="fas fa-undo"></i> استعادة</button>
            </div>
        `;
        deletedInvoicesList.appendChild(invoiceItem);
    });
}

function searchDeletedInvoices() {
    const searchTerm = document.getElementById("admin-search").value.toLowerCase();
    const filteredInvoices = deletedInvoices.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchTerm) ||
        invoice.customer_name.toLowerCase().includes(searchTerm)
    );
    displayDeletedInvoices(filteredInvoices);
}

async function restoreDeletedInvoice(invoiceId) {
    showConfirmationModal("هل أنت متأكد من استعادة هذه الفاتورة؟", async () => {
        try {
            const invoice = await window.getDocument(window.COLLECTION_DELETED_INVOICES, invoiceId);
            if (!invoice) {
                showNotification("الفاتورة المحذوفة غير موجودة", "error");
                return;
            }

            // Create in sales collection
            await window.createDocument(window.COLLECTION_SALES, {
                invoice_number: invoice.invoice_number,
                customer_name: invoice.customer_name,
                customer_phone: invoice.customer_phone,
                sale_date: invoice.sale_date,
                products_sold: invoice.products_sold,
                subtotal: invoice.subtotal,
                paid_amount: invoice.paid_amount,
                status: invoice.status,
                notes: "", // Restore notes if available
            });

            // Delete from deletedInvoices collection
            await window.deleteDocument(window.COLLECTION_DELETED_INVOICES, invoiceId);

            showNotification("تم استعادة الفاتورة بنجاح", "success");
            loadAdminTab(); // Reload admin data
            loadSalesTab(); // Reload sales data
            loadDashboard(); // Reload dashboard data
        } catch (error) {
            console.error("Error restoring invoice:", error);
            showNotification("فشل استعادة الفاتورة: " + error.message, "error");
        }
    });
}

// Global data loading
async function loadData() {
    try {
        // Load all data from Appwrite for the current store
        products = await window.listDocuments(window.COLLECTION_PRODUCTS);
        categories = await window.listDocuments(window.COLLECTION_CATEGORIES);
        sales = await window.listDocuments(window.COLLECTION_SALES);
        expenses = await window.listDocuments(window.COLLECTION_EXPENSES);
        revenues = await window.listDocuments(window.COLLECTION_REVENUES);
        deletedInvoices = await window.listDocuments(window.COLLECTION_DELETED_INVOICES);

        // Update UI components that depend on this data
        if (currentTab === "dashboard") {
            loadDashboard();
        } else if (currentTab === "sales") {
            loadSalesTab();
        } else if (currentTab === "inventory") {
            loadInventory();
        } else if (currentTab === "expenses") {
            loadExpenses();
        } else if (currentTab === "reports") {
            loadReports();
        } else if (currentTab === "admin") {
            loadAdminTab();
        } else if (currentTab === "settings") {
            loadSettings();
        }

    } catch (error) {
        console.error("Error loading all data:", error);
        showNotification("فشل تحميل البيانات الأساسية: " + error.message, "error");
    }
}

// Confirmation Modal functions
function showConfirmationModal(message, callback) {
    document.getElementById("confirmation-message").textContent = message;
    document.getElementById("confirmation-modal").style.display = "flex";
    confirmationCallback = callback;
}

function confirmDelete() {
    if (confirmationCallback) {
        confirmationCallback();
    }
    document.getElementById("confirmation-modal").style.display = "none";
    confirmationCallback = null;
}

function cancelDelete() {
    document.getElementById("confirmation-modal").style.display = "none";
    confirmationCallback = null;
}

// Initial load
loadData();

// Expose functions to the global scope
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
window.Query = appwrite.Query;

window.showLoginScreen = showLoginScreen;
window.hideLoginScreen = hideLoginScreen;
window.showCreateStoreForm = showCreateStoreForm;
window.showExistingStoreForm = showExistingStoreForm;
window.showMainLogin = showMainLogin;
window.loginExistingStore = loginExistingStore;
window.createNewStore = createNewStore;
window.showStoreSuccessForm = showStoreSuccessForm;
window.continueToApp = continueToApp;
window.initializeApp = initializeApp;
window.setupEventListeners = setupEventListeners;
window.toggleTheme = toggleTheme;
window.switchTab = switchTab;
window.loadSettings = loadSettings;
window.updateStoreStatistics = updateStoreStatistics;
window.manualSync = manualSync;
window.linkAnotherStore = linkAnotherStore;
window.resetStore = resetStore;
window.copyStoreId = copyStoreId;
window.exportData = exportData;
window.importData = importData;
window.showNotification = showNotification;
window.updateCurrentDate = updateCurrentDate;
window.loadDashboard = loadDashboard;
window.updateDashboardSummary = updateDashboardSummary;
window.displaySales = displaySales;
window.filterDashboardSales = filterDashboardSales;
window.searchSales = searchSales;
window.loadSalesTab = loadSalesTab;
window.displayProductsForSale = displayProductsForSale;
window.addToSale = addToSale;
window.updateSelectedProductsList = updateSelectedProductsList;
window.removeSelectedProduct = removeSelectedProduct;
window.calculateRemainingAmount = calculateRemainingAmount;
window.completeSale = completeSale;
window.clearSaleForm = clearSaleForm;
window.editInvoice = editInvoice;
window.closeInvoiceModal = closeInvoiceModal;
window.saveInvoiceChanges = saveInvoiceChanges;
window.confirmDeleteInvoice = confirmDeleteInvoice;
window.filterSales = filterSales;
window.loadInventory = loadInventory;
window.displayProducts = displayProducts;
window.getCategoryName = getCategoryName;
window.toggleProductForm = toggleProductForm;
window.addCategory = addCategory;
window.populateCategorySelect = populateCategorySelect;
window.saveProduct = saveProduct;
window.clearProductForm = clearProductForm;
window.editProduct = editProduct;
window.closeProductModal = closeProductModal;
window.saveProductChanges = saveProductChanges;
window.confirmDeleteProduct = confirmDeleteProduct;
window.loadExpenses = loadExpenses;
window.displayExpenses = displayExpenses;
window.displayRevenues = displayRevenues;
window.updateExpensesSummary = updateExpensesSummary;
window.addExpense = addExpense;
window.clearExpenseForm = clearExpenseForm;
window.addRevenue = addRevenue;
window.clearRevenueForm = clearRevenueForm;
window.confirmDeleteExpense = confirmDeleteExpense;
window.confirmDeleteRevenue = confirmDeleteRevenue;
window.filterExpenses = filterExpenses;
window.clearExpenseFilter = clearExpenseFilter;
window.loadReports = loadReports;
window.generateReport = generateReport;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.loadAdminTab = loadAdminTab;
window.displayDeletedInvoices = displayDeletedInvoices;
window.searchDeletedInvoices = searchDeletedInvoices;
window.restoreDeletedInvoice = restoreDeletedInvoice;
window.loadData = loadData;
window.showConfirmationModal = showConfirmationModal;
window.confirmDelete = confirmDelete;
window.cancelDelete = cancelDelete;


