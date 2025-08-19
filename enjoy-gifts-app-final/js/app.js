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
        }

        // Import categories
        if (data.categories) {
            for (const category of data.categories) {
                await window.createDocument(window.COLLECTION_CATEGORIES, {
                    name: category.name
                });
            }
        }

        // Import sales
        if (data.sales) {
            for (const sale of data.sales) {
                await window.createDocument(window.COLLECTION_SALES, {
                    invoice_number: sale.invoice_number,
                    customer_name: sale.customer_name,
                    customer_phone: sale.customer_phone,
                    sale_date: sale.sale_date,
                    products_sold: sale.products_sold,
                    subtotal: sale.subtotal,
                    paid_amount: sale.paid_amount,
                    status: sale.status
                });
            }
        }

        // Import expenses
        if (data.expenses) {
            for (const expense of data.expenses) {
                await window.createDocument(window.COLLECTION_EXPENSES, {
                    description: expense.description,
                    amount: expense.amount,
                    date: expense.date
                });
            }
        }

        // Import revenues
        if (data.revenues) {
            for (const revenue of data.revenues) {
                await window.createDocument(window.COLLECTION_REVENUES, {
                    description: revenue.description,
                    amount: revenue.amount,
                    date: revenue.date
                });
            }
        }

        showNotification("تم استيراد البيانات بنجاح", "success");
        loadData(); // Reload all data
    } catch (error) {
        showNotification("فشل استيراد البيانات: " + error.message, "error");
    }
}

// Product Management Functions
function toggleProductForm() {
    const form = document.getElementById("product-form");
    const isVisible = form.style.display === "block";
    form.style.display = isVisible ? "none" : "block";
    
    if (!isVisible) {
        document.getElementById("product-name").focus();
    }
}

async function addCategory() {
    const categoryName = prompt("أدخل اسم الفئة الجديدة:");
    if (categoryName && categoryName.trim()) {
        try {
            await window.createDocument(window.COLLECTION_CATEGORIES, {
                name: categoryName.trim()
            });
            
            showNotification("تم إضافة الفئة بنجاح", "success");
            await loadCategories();
        } catch (error) {
            showNotification("فشل إضافة الفئة: " + error.message, "error");
        }
    }
}

async function saveProduct() {
    const name = document.getElementById("product-name").value.trim();
    const price = parseFloat(document.getElementById("product-price").value);
    const wholesalePrice = parseFloat(document.getElementById("product-wholesale-price").value);
    const quantity = parseInt(document.getElementById("product-quantity").value);
    const minStock = parseInt(document.getElementById("product-min-stock").value);
    const category = document.getElementById("product-category").value;

    if (!name || isNaN(price) || isNaN(quantity)) {
        showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    try {
        await window.createDocument(window.COLLECTION_PRODUCTS, {
            name: name,
            price: price,
            wholesale_price: wholesalePrice || 0,
            quantity: quantity,
            min_stock: minStock || 0,
            category: category
        });

        showNotification("تم حفظ المنتج بنجاح", "success");
        
        // Clear form
        document.getElementById("product-form").reset();
        document.getElementById("product-form").style.display = "none";
        
        // Reload inventory
        await loadInventory();
    } catch (error) {
        showNotification("فشل حفظ المنتج: " + error.message, "error");
    }
}

// Sales Management Functions
async function completeSale() {
    const customerName = document.getElementById("customer-name").value.trim();
    const customerPhone = document.getElementById("customer-phone").value.trim();
    const saleDate = document.getElementById("sale-date").value;
    const paidAmount = parseFloat(document.getElementById("paid-amount").value) || 0;

    const selectedProducts = [];
    document.querySelectorAll(".product-item.selected").forEach(item => {
        const productId = item.dataset.productId;
        const product = products.find(p => p.$id === productId);
        const quantityInput = item.querySelector(".quantity-input");
        const quantity = parseInt(quantityInput.value) || 1;
        
        if (product && quantity > 0) {
            selectedProducts.push({
                id: product.$id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                total: product.price * quantity
            });
        }
    });

    if (!customerName || selectedProducts.length === 0) {
        showNotification("يرجى إدخال اسم العميل واختيار منتج واحد على الأقل", "error");
        return;
    }

    const subtotal = selectedProducts.reduce((sum, item) => sum + item.total, 0);
    const invoiceNumber = generateInvoiceNumber();
    const status = paidAmount >= subtotal ? "مدفوع" : "غير مدفوع";

    try {
        // Create sale record
        await window.createDocument(window.COLLECTION_SALES, {
            invoice_number: invoiceNumber,
            customer_name: customerName,
            customer_phone: customerPhone,
            sale_date: saleDate,
            products_sold: JSON.stringify(selectedProducts),
            subtotal: subtotal,
            paid_amount: paidAmount,
            status: status
        });

        // Update product quantities
        for (const item of selectedProducts) {
            const product = products.find(p => p.$id === item.id);
            if (product) {
                await window.updateDocument(window.COLLECTION_PRODUCTS, item.id, {
                    quantity: product.quantity - item.quantity
                });
            }
        }

        showNotification("تم إتمام البيع بنجاح", "success");
        
        // Clear form and selections
        clearSaleForm();
        
        // Reload data
        await loadData();
        
        // Switch to dashboard
        switchTab("dashboard");
    } catch (error) {
        showNotification("فشل إتمام البيع: " + error.message, "error");
    }
}

function generateInvoiceNumber() {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `INV-${timestamp}`;
}

function clearSaleForm() {
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-phone").value = "";
    document.getElementById("paid-amount").value = "";
    
    document.querySelectorAll(".product-item").forEach(item => {
        item.classList.remove("selected");
        const quantityInput = item.querySelector(".quantity-input");
        if (quantityInput) quantityInput.value = "1";
    });
    
    updateSaleTotal();
}

function calculateRemainingAmount() {
    const paidAmount = parseFloat(document.getElementById("paid-amount").value) || 0;
    const subtotal = calculateSaleSubtotal();
    const remaining = subtotal - paidAmount;
    
    const remainingElement = document.getElementById("remaining-amount");
    if (remainingElement) {
        remainingElement.textContent = `${remaining.toFixed(2)} جنيه`;
        remainingElement.className = remaining > 0 ? "remaining positive" : "remaining zero";
    }
}

function calculateSaleSubtotal() {
    let subtotal = 0;
    document.querySelectorAll(".product-item.selected").forEach(item => {
        const productId = item.dataset.productId;
        const product = products.find(p => p.$id === productId);
        const quantityInput = item.querySelector(".quantity-input");
        const quantity = parseInt(quantityInput.value) || 1;
        
        if (product) {
            subtotal += product.price * quantity;
        }
    });
    return subtotal;
}

function updateSaleTotal() {
    const subtotal = calculateSaleSubtotal();
    const subtotalElement = document.getElementById("sale-subtotal");
    if (subtotalElement) {
        subtotalElement.textContent = `${subtotal.toFixed(2)} جنيه`;
    }
    calculateRemainingAmount();
}

// Expense Management Functions
async function addExpense() {
    const description = document.getElementById("expense-description").value.trim();
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const date = document.getElementById("expense-date").value;

    if (!description || isNaN(amount) || !date) {
        showNotification("يرجى ملء جميع الحقول", "error");
        return;
    }

    try {
        await window.createDocument(window.COLLECTION_EXPENSES, {
            description: description,
            amount: amount,
            date: date
        });

        showNotification("تم إضافة المصروف بنجاح", "success");
        
        // Clear form
        document.getElementById("expense-description").value = "";
        document.getElementById("expense-amount").value = "";
        
        // Reload expenses
        await loadExpenses();
    } catch (error) {
        showNotification("فشل إضافة المصروف: " + error.message, "error");
    }
}

async function addRevenue() {
    const description = document.getElementById("revenue-description").value.trim();
    const amount = parseFloat(document.getElementById("revenue-amount").value);
    const date = document.getElementById("revenue-date").value;

    if (!description || isNaN(amount) || !date) {
        showNotification("يرجى ملء جميع الحقول", "error");
        return;
    }

    try {
        await window.createDocument(window.COLLECTION_REVENUES, {
            description: description,
            amount: amount,
            date: date
        });

        showNotification("تم إضافة الإيراد بنجاح", "success");
        
        // Clear form
        document.getElementById("revenue-description").value = "";
        document.getElementById("revenue-amount").value = "";
        
        // Reload expenses
        await loadExpenses();
    } catch (error) {
        showNotification("فشل إضافة الإيراد: " + error.message, "error");
    }
}

function filterExpenses() {
    const startDate = document.getElementById("expense-start-date").value;
    const endDate = document.getElementById("expense-end-date").value;
    
    if (!startDate || !endDate) {
        showNotification("يرجى تحديد تاريخ البداية والنهاية", "error");
        return;
    }
    
    displayExpenses(startDate, endDate);
}

function clearExpenseFilter() {
    document.getElementById("expense-start-date").value = "";
    document.getElementById("expense-end-date").value = "";
    displayExpenses();
}

// Data Loading Functions
async function loadData() {
    try {
        await Promise.all([
            loadProducts(),
            loadCategories(),
            loadSales(),
            loadExpenses(),
            loadRevenues(),
            loadDeletedInvoices()
        ]);
        
        // Update current tab display
        if (currentTab === "dashboard") {
            loadDashboard();
        } else if (currentTab === "inventory") {
            loadInventory();
        } else if (currentTab === "sales") {
            loadSalesTab();
        } else if (currentTab === "expenses") {
            displayExpenses();
        }
    } catch (error) {
        console.error("Error loading data:", error);
        showNotification("فشل تحميل البيانات: " + error.message, "error");
    }
}

async function loadProducts() {
    try {
        products = await window.listDocuments(window.COLLECTION_PRODUCTS);
    } catch (error) {
        console.error("Error loading products:", error);
        products = [];
    }
}

async function loadCategories() {
    try {
        categories = await window.listDocuments(window.COLLECTION_CATEGORIES);
        updateCategoryDropdowns();
    } catch (error) {
        console.error("Error loading categories:", error);
        categories = [];
    }
}

async function loadSales() {
    try {
        sales = await window.listDocuments(window.COLLECTION_SALES);
    } catch (error) {
        console.error("Error loading sales:", error);
        sales = [];
    }
}

async function loadExpenses() {
    try {
        expenses = await window.listDocuments(window.COLLECTION_EXPENSES);
    } catch (error) {
        console.error("Error loading expenses:", error);
        expenses = [];
    }
}

async function loadRevenues() {
    try {
        revenues = await window.listDocuments(window.COLLECTION_REVENUES);
    } catch (error) {
        console.error("Error loading revenues:", error);
        revenues = [];
    }
}

async function loadDeletedInvoices() {
    try {
        deletedInvoices = await window.listDocuments(window.COLLECTION_DELETED_INVOICES);
    } catch (error) {
        console.error("Error loading deleted invoices:", error);
        deletedInvoices = [];
    }
}

function updateCategoryDropdowns() {
    const categorySelects = document.querySelectorAll("#product-category, #filter-category");
    categorySelects.forEach(select => {
        // Keep the first option (default)
        const firstOption = select.firstElementChild;
        select.innerHTML = "";
        if (firstOption) {
            select.appendChild(firstOption);
        }
        
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.name;
            option.textContent = category.name;
            select.appendChild(option);
        });
    });
}

// Display Functions
function loadDashboard() {
    displayRecentSales();
    displayLowStockProducts();
    updateDashboardStats();
}

function displayRecentSales() {
    const container = document.getElementById("recent-sales");
    if (!container) return;

    const recentSales = sales.slice(-5).reverse();
    
    if (recentSales.length === 0) {
        container.innerHTML = "<p>لا توجد مبيعات حديثة</p>";
        return;
    }

    container.innerHTML = recentSales.map(sale => `
        <div class="sale-item">
            <div class="sale-info">
                <h4>فاتورة ${sale.invoice_number}</h4>
                <p>العميل: ${sale.customer_name}</p>
                <p>التاريخ: ${sale.sale_date}</p>
            </div>
            <div class="sale-amount ${sale.status === 'مدفوع' ? 'paid' : 'unpaid'}">
                ${sale.subtotal.toFixed(2)} جنيه
                <span class="status">${sale.status}</span>
            </div>
        </div>
    `).join("");
}

function displayLowStockProducts() {
    const container = document.getElementById("low-stock-products");
    if (!container) return;

    const lowStockProducts = products.filter(product => 
        product.quantity <= (product.min_stock || 5)
    );
    
    if (lowStockProducts.length === 0) {
        container.innerHTML = "<p>جميع المنتجات متوفرة بكميات كافية</p>";
        return;
    }

    container.innerHTML = lowStockProducts.map(product => `
        <div class="low-stock-item">
            <span class="product-name">${product.name}</span>
            <span class="stock-quantity ${product.quantity === 0 ? 'out-of-stock' : 'low-stock'}">
                ${product.quantity} متبقي
            </span>
        </div>
    `).join("");
}

function updateDashboardStats() {
    const totalSales = sales.reduce((sum, sale) => sum + sale.subtotal, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRevenues = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
    const netProfit = totalSales + totalRevenues - totalExpenses;

    document.getElementById("total-sales").textContent = `${totalSales.toFixed(2)} جنيه`;
    document.getElementById("total-expenses").textContent = `${totalExpenses.toFixed(2)} جنيه`;
    document.getElementById("net-profit").textContent = `${netProfit.toFixed(2)} جنيه`;
    document.getElementById("total-products-count").textContent = products.length;
}

function loadInventory() {
    displayProducts();
}

function displayProducts() {
    const container = document.getElementById("products-list");
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = "<p>لا توجد منتجات مسجلة</p>";
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-item" data-product-id="${product.$id}">
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>السعر: ${product.price} جنيه</p>
                <p>الكمية: ${product.quantity}</p>
                ${product.category ? `<p>الفئة: ${product.category}</p>` : ""}
            </div>
            <div class="product-actions">
                <button onclick="editProduct('${product.$id}')" class="btn-edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct('${product.$id}')" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join("");
}

function loadSalesTab() {
    displayProductsForSale();
    updateSaleTotal();
}

function displayProductsForSale() {
    const container = document.getElementById("products-for-sale");
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = "<p>لا توجد منتجات متاحة للبيع</p>";
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-item" data-product-id="${product.$id}" onclick="toggleProductSelection('${product.$id}')">
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>السعر: ${product.price} جنيه</p>
                <p>المتوفر: ${product.quantity}</p>
            </div>
            <div class="product-quantity">
                <input type="number" class="quantity-input" value="1" min="1" max="${product.quantity}" 
                       onclick="event.stopPropagation()" onchange="updateSaleTotal()">
            </div>
        </div>
    `).join("");
}

function toggleProductSelection(productId) {
    const productItem = document.querySelector(`[data-product-id="${productId}"]`);
    if (productItem) {
        productItem.classList.toggle("selected");
        updateSaleTotal();
    }
}

function displayExpenses(startDate = null, endDate = null) {
    const expensesContainer = document.getElementById("expenses-list");
    const revenuesContainer = document.getElementById("revenues-list");
    
    if (!expensesContainer || !revenuesContainer) return;

    let filteredExpenses = expenses;
    let filteredRevenues = revenues;

    if (startDate && endDate) {
        filteredExpenses = expenses.filter(expense => 
            expense.date >= startDate && expense.date <= endDate
        );
        filteredRevenues = revenues.filter(revenue => 
            revenue.date >= startDate && revenue.date <= endDate
        );
    }

    // Display expenses
    if (filteredExpenses.length === 0) {
        expensesContainer.innerHTML = "<p>لا توجد مصروفات</p>";
    } else {
        expensesContainer.innerHTML = filteredExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <h4>${expense.description}</h4>
                    <p>التاريخ: ${expense.date}</p>
                </div>
                <div class="expense-amount">
                    ${expense.amount.toFixed(2)} جنيه
                </div>
                <button onclick="deleteExpense('${expense.$id}')" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join("");
    }

    // Display revenues
    if (filteredRevenues.length === 0) {
        revenuesContainer.innerHTML = "<p>لا توجد إيرادات</p>";
    } else {
        revenuesContainer.innerHTML = filteredRevenues.map(revenue => `
            <div class="revenue-item">
                <div class="revenue-info">
                    <h4>${revenue.description}</h4>
                    <p>التاريخ: ${revenue.date}</p>
                </div>
                <div class="revenue-amount">
                    ${revenue.amount.toFixed(2)} جنيه
                </div>
                <button onclick="deleteRevenue('${revenue.$id}')" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join("");
    }

    // Update totals
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRevenues = filteredRevenues.reduce((sum, revenue) => sum + revenue.amount, 0);
    
    document.getElementById("expenses-total").textContent = `${totalExpenses.toFixed(2)} جنيه`;
    document.getElementById("revenues-total").textContent = `${totalRevenues.toFixed(2)} جنيه`;
}

// Reports Functions
function loadReports() {
    generateReport();
}

function generateReport() {
    const startDate = document.getElementById("report-start-date").value;
    const endDate = document.getElementById("report-end-date").value;
    
    let filteredSales = sales;
    if (startDate && endDate) {
        filteredSales = sales.filter(sale => 
            sale.sale_date >= startDate && sale.sale_date <= endDate
        );
    }
    
    displaySalesReport(filteredSales);
}

function displaySalesReport(salesData) {
    const container = document.getElementById("sales-report");
    if (!container) return;

    if (salesData.length === 0) {
        container.innerHTML = "<p>لا توجد مبيعات في الفترة المحددة</p>";
        return;
    }

    const totalSales = salesData.reduce((sum, sale) => sum + sale.subtotal, 0);
    const paidSales = salesData.filter(sale => sale.status === "مدفوع");
    const unpaidSales = salesData.filter(sale => sale.status === "غير مدفوع");

    container.innerHTML = `
        <div class="report-summary">
            <div class="summary-item">
                <h4>إجمالي المبيعات</h4>
                <p>${totalSales.toFixed(2)} جنيه</p>
            </div>
            <div class="summary-item">
                <h4>عدد الفواتير</h4>
                <p>${salesData.length}</p>
            </div>
            <div class="summary-item">
                <h4>المدفوع</h4>
                <p>${paidSales.length} فاتورة</p>
            </div>
            <div class="summary-item">
                <h4>غير المدفوع</h4>
                <p>${unpaidSales.length} فاتورة</p>
            </div>
        </div>
        <div class="sales-list">
            ${salesData.map(sale => `
                <div class="sale-item">
                    <div class="sale-info">
                        <h4>فاتورة ${sale.invoice_number}</h4>
                        <p>العميل: ${sale.customer_name}</p>
                        <p>التاريخ: ${sale.sale_date}</p>
                    </div>
                    <div class="sale-amount ${sale.status === 'مدفوع' ? 'paid' : 'unpaid'}">
                        ${sale.subtotal.toFixed(2)} جنيه
                        <span class="status">${sale.status}</span>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function filterSales() {
    generateReport();
}

function filterDashboardSales() {
    const startDate = document.getElementById("dashboard-start-date").value;
    const endDate = document.getElementById("dashboard-end-date").value;
    
    let filteredSales = sales;
    if (startDate && endDate) {
        filteredSales = sales.filter(sale => 
            sale.sale_date >= startDate && sale.sale_date <= endDate
        );
    }
    
    displayFilteredDashboardSales(filteredSales);
}

function displayFilteredDashboardSales(salesData) {
    const container = document.getElementById("filtered-sales-list");
    if (!container) return;

    if (salesData.length === 0) {
        container.innerHTML = "<p>لا توجد مبيعات في الفترة المحددة</p>";
        return;
    }

    container.innerHTML = salesData.map(sale => `
        <div class="sale-item">
            <div class="sale-info">
                <h4>فاتورة ${sale.invoice_number}</h4>
                <p>العميل: ${sale.customer_name}</p>
                <p>التاريخ: ${sale.sale_date}</p>
            </div>
            <div class="sale-amount ${sale.status === 'مدفوع' ? 'paid' : 'unpaid'}">
                ${sale.subtotal.toFixed(2)} جنيه
                <span class="status">${sale.status}</span>
            </div>
            <div class="sale-actions">
                <button onclick="editInvoice('${sale.$id}')" class="btn-edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteInvoice('${sale.$id}')" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join("");
}

function searchSales() {
    const searchTerm = document.getElementById("dashboard-search").value.toLowerCase();
    const filteredSales = sales.filter(sale => 
        sale.customer_name.toLowerCase().includes(searchTerm) ||
        sale.invoice_number.toLowerCase().includes(searchTerm)
    );
    
    displayFilteredDashboardSales(filteredSales);
}

// Admin Functions
function loadAdminTab() {
    if (isAdminLoggedIn) {
        document.getElementById("admin-login-section").style.display = "none";
        document.getElementById("admin-content").style.display = "block";
        displayDeletedInvoices();
    } else {
        document.getElementById("admin-login-section").style.display = "block";
        document.getElementById("admin-content").style.display = "none";
    }
}

function adminLogin() {
    const password = document.getElementById("admin-password").value;
    if (password === "admin123") { // Change this to a secure password
        isAdminLoggedIn = true;
        document.getElementById("admin-password").value = "";
        loadAdminTab();
        showNotification("تم تسجيل دخول المدير بنجاح", "success");
    } else {
        showNotification("كلمة مرور المدير غير صحيحة", "error");
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    loadAdminTab();
    showNotification("تم تسجيل خروج المدير", "success");
}

function displayDeletedInvoices() {
    const container = document.getElementById("deleted-invoices-list");
    if (!container) return;

    if (deletedInvoices.length === 0) {
        container.innerHTML = "<p>لا توجد فواتير محذوفة</p>";
        return;
    }

    container.innerHTML = deletedInvoices.map(invoice => `
        <div class="deleted-invoice-item">
            <div class="invoice-info">
                <h4>فاتورة ${invoice.invoice_number}</h4>
                <p>العميل: ${invoice.customer_name}</p>
                <p>تاريخ البيع: ${invoice.sale_date}</p>
                <p>تاريخ الحذف: ${invoice.deletedDate}</p>
            </div>
            <div class="invoice-amount">
                ${invoice.subtotal.toFixed(2)} جنيه
                <span class="status">${invoice.status}</span>
            </div>
        </div>
    `).join("");
}

function searchDeletedInvoices() {
    const searchTerm = document.getElementById("admin-search").value.toLowerCase();
    const filteredInvoices = deletedInvoices.filter(invoice => 
        invoice.customer_name.toLowerCase().includes(searchTerm) ||
        invoice.invoice_number.toLowerCase().includes(searchTerm)
    );
    
    const container = document.getElementById("deleted-invoices-list");
    if (!container) return;

    if (filteredInvoices.length === 0) {
        container.innerHTML = "<p>لا توجد نتائج</p>";
        return;
    }

    container.innerHTML = filteredInvoices.map(invoice => `
        <div class="deleted-invoice-item">
            <div class="invoice-info">
                <h4>فاتورة ${invoice.invoice_number}</h4>
                <p>العميل: ${invoice.customer_name}</p>
                <p>تاريخ البيع: ${invoice.sale_date}</p>
                <p>تاريخ الحذف: ${invoice.deletedDate}</p>
            </div>
            <div class="invoice-amount">
                ${invoice.subtotal.toFixed(2)} جنيه
                <span class="status">${invoice.status}</span>
            </div>
        </div>
    `).join("");
}

// Edit and Delete Functions
async function editProduct(productId) {
    const product = products.find(p => p.$id === productId);
    if (!product) return;

    currentEditingProduct = product;
    
    // Fill modal with product data
    document.getElementById("edit-product-name").value = product.name;
    document.getElementById("edit-product-price").value = product.price;
    document.getElementById("edit-product-wholesale-price").value = product.wholesale_price || "";
    document.getElementById("edit-product-quantity").value = product.quantity;
    document.getElementById("edit-product-min-stock").value = product.min_stock || "";
    document.getElementById("edit-product-category").value = product.category || "";
    
    // Show modal
    document.getElementById("product-edit-modal").style.display = "flex";
}

async function saveProductChanges() {
    if (!currentEditingProduct) return;

    const name = document.getElementById("edit-product-name").value.trim();
    const price = parseFloat(document.getElementById("edit-product-price").value);
    const wholesalePrice = parseFloat(document.getElementById("edit-product-wholesale-price").value);
    const quantity = parseInt(document.getElementById("edit-product-quantity").value);
    const minStock = parseInt(document.getElementById("edit-product-min-stock").value);
    const category = document.getElementById("edit-product-category").value;

    if (!name || isNaN(price) || isNaN(quantity)) {
        showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    try {
        await window.updateDocument(window.COLLECTION_PRODUCTS, currentEditingProduct.$id, {
            name: name,
            price: price,
            wholesale_price: wholesalePrice || 0,
            quantity: quantity,
            min_stock: minStock || 0,
            category: category
        });

        showNotification("تم تحديث المنتج بنجاح", "success");
        closeProductModal();
        await loadProducts();
        displayProducts();
    } catch (error) {
        showNotification("فشل تحديث المنتج: " + error.message, "error");
    }
}

function closeProductModal() {
    document.getElementById("product-edit-modal").style.display = "none";
    currentEditingProduct = null;
}

async function deleteProduct(productId) {
    const product = products.find(p => p.$id === productId);
    if (!product) return;

    currentDeleteTarget = { type: "product", id: productId, name: product.name };
    document.getElementById("delete-item-name").textContent = product.name;
    document.getElementById("delete-modal").style.display = "flex";
}

async function editInvoice(saleId) {
    const sale = sales.find(s => s.$id === saleId);
    if (!sale) return;

    currentEditingInvoice = sale;
    
    // Fill modal with sale data
    document.getElementById("edit-customer-name").value = sale.customer_name;
    document.getElementById("edit-customer-phone").value = sale.customer_phone || "";
    document.getElementById("edit-sale-date").value = sale.sale_date;
    document.getElementById("edit-paid-amount").value = sale.paid_amount;
    
    // Show modal
    document.getElementById("invoice-edit-modal").style.display = "flex";
}

async function saveInvoiceChanges() {
    if (!currentEditingInvoice) return;

    const customerName = document.getElementById("edit-customer-name").value.trim();
    const customerPhone = document.getElementById("edit-customer-phone").value.trim();
    const saleDate = document.getElementById("edit-sale-date").value;
    const paidAmount = parseFloat(document.getElementById("edit-paid-amount").value);

    if (!customerName || !saleDate || isNaN(paidAmount)) {
        showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    const status = paidAmount >= currentEditingInvoice.subtotal ? "مدفوع" : "غير مدفوع";

    try {
        await window.updateDocument(window.COLLECTION_SALES, currentEditingInvoice.$id, {
            customer_name: customerName,
            customer_phone: customerPhone,
            sale_date: saleDate,
            paid_amount: paidAmount,
            status: status
        });

        showNotification("تم تحديث الفاتورة بنجاح", "success");
        closeInvoiceModal();
        await loadSales();
        if (currentTab === "dashboard") {
            displayFilteredDashboardSales(sales);
        }
    } catch (error) {
        showNotification("فشل تحديث الفاتورة: " + error.message, "error");
    }
}

function closeInvoiceModal() {
    document.getElementById("invoice-edit-modal").style.display = "none";
    currentEditingInvoice = null;
}

async function deleteInvoice(saleId) {
    const sale = sales.find(s => s.$id === saleId);
    if (!sale) return;

    currentDeleteTarget = { type: "invoice", id: saleId, data: sale };
    document.getElementById("delete-item-name").textContent = `فاتورة ${sale.invoice_number}`;
    document.getElementById("delete-modal").style.display = "flex";
}

async function deleteExpense(expenseId) {
    const expense = expenses.find(e => e.$id === expenseId);
    if (!expense) return;

    currentDeleteTarget = { type: "expense", id: expenseId, name: expense.description };
    document.getElementById("delete-item-name").textContent = expense.description;
    document.getElementById("delete-modal").style.display = "flex";
}

async function deleteRevenue(revenueId) {
    const revenue = revenues.find(r => r.$id === revenueId);
    if (!revenue) return;

    currentDeleteTarget = { type: "revenue", id: revenueId, name: revenue.description };
    document.getElementById("delete-item-name").textContent = revenue.description;
    document.getElementById("delete-modal").style.display = "flex";
}

async function confirmDelete() {
    if (!currentDeleteTarget) return;

    try {
        if (currentDeleteTarget.type === "product") {
            await window.deleteDocument(window.COLLECTION_PRODUCTS, currentDeleteTarget.id);
            await loadProducts();
            displayProducts();
            showNotification("تم حذف المنتج بنجاح", "success");
            
        } else if (currentDeleteTarget.type === "invoice") {
            // Move to deleted invoices before deleting
            const saleData = currentDeleteTarget.data;
            await window.createDocument(window.COLLECTION_DELETED_INVOICES, {
                store_id: window.getCurrentStoreId(),
                invoice_number: saleData.invoice_number,
                customer_name: saleData.customer_name,
                customer_phone: saleData.customer_phone || "",
                sale_date: saleData.sale_date,
                products_sold: saleData.products_sold,
                subtotal: saleData.subtotal,
                paid_amount: saleData.paid_amount,
                status: saleData.status,
                deletedAt: new Date().toISOString(),
                deletedDate: new Date().toISOString().split("T")[0]
            });
            
            await window.deleteDocument(window.COLLECTION_SALES, currentDeleteTarget.id);
            await loadSales();
            await loadDeletedInvoices();
            if (currentTab === "dashboard") {
                displayFilteredDashboardSales(sales);
            }
            showNotification("تم حذف الفاتورة بنجاح", "success");
            
        } else if (currentDeleteTarget.type === "expense") {
            await window.deleteDocument(window.COLLECTION_EXPENSES, currentDeleteTarget.id);
            await loadExpenses();
            displayExpenses();
            showNotification("تم حذف المصروف بنجاح", "success");
            
        } else if (currentDeleteTarget.type === "revenue") {
            await window.deleteDocument(window.COLLECTION_REVENUES, currentDeleteTarget.id);
            await loadRevenues();
            displayExpenses();
            showNotification("تم حذف الإيراد بنجاح", "success");
        }
        
        cancelDelete();
    } catch (error) {
        showNotification("فشل الحذف: " + error.message, "error");
    }
}

function cancelDelete() {
    document.getElementById("delete-modal").style.display = "none";
    currentDeleteTarget = null;
}

// Utility Functions
function updateCurrentDate() {
    const today = new Date().toISOString().split("T")[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add("show");
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Expose functions to window object
window.isUserLoggedIn = isUserLoggedIn;
window.showLoginScreen = showLoginScreen;
window.hideLoginScreen = hideLoginScreen;
window.setupLoginEventListeners = setupLoginEventListeners;
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
window.toggleProductForm = toggleProductForm;
window.addCategory = addCategory;
window.saveProduct = saveProduct;
window.completeSale = completeSale;
window.generateInvoiceNumber = generateInvoiceNumber;
window.clearSaleForm = clearSaleForm;
window.calculateRemainingAmount = calculateRemainingAmount;
window.calculateSaleSubtotal = calculateSaleSubtotal;
window.updateSaleTotal = updateSaleTotal;
window.addExpense = addExpense;
window.addRevenue = addRevenue;
window.filterExpenses = filterExpenses;
window.clearExpenseFilter = clearExpenseFilter;
window.loadData = loadData;
window.loadProducts = loadProducts;
window.loadCategories = loadCategories;
window.loadSales = loadSales;
window.loadExpenses = loadExpenses;
window.loadRevenues = loadRevenues;
window.loadDeletedInvoices = loadDeletedInvoices;
window.updateCategoryDropdowns = updateCategoryDropdowns;
window.loadDashboard = loadDashboard;
window.displayRecentSales = displayRecentSales;
window.displayLowStockProducts = displayLowStockProducts;
window.updateDashboardStats = updateDashboardStats;
window.loadInventory = loadInventory;
window.displayProducts = displayProducts;
window.loadSalesTab = loadSalesTab;
window.displayProductsForSale = displayProductsForSale;
window.toggleProductSelection = toggleProductSelection;
window.displayExpenses = displayExpenses;
window.loadReports = loadReports;
window.generateReport = generateReport;
window.displaySalesReport = displaySalesReport;
window.filterSales = filterSales;
window.filterDashboardSales = filterDashboardSales;
window.displayFilteredDashboardSales = displayFilteredDashboardSales;
window.searchSales = searchSales;
window.loadAdminTab = loadAdminTab;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.displayDeletedInvoices = displayDeletedInvoices;
window.searchDeletedInvoices = searchDeletedInvoices;
window.editProduct = editProduct;
window.saveProductChanges = saveProductChanges;
window.closeProductModal = closeProductModal;
window.deleteProduct = deleteProduct;
window.editInvoice = editInvoice;
window.saveInvoiceChanges = saveInvoiceChanges;
window.closeInvoiceModal = closeInvoiceModal;
window.deleteInvoice = deleteInvoice;
window.deleteExpense = deleteExpense;
window.deleteRevenue = deleteRevenue;
window.confirmDelete = confirmDelete;
window.cancelDelete = cancelDelete;
window.updateCurrentDate = updateCurrentDate;
window.showNotification = showNotification;

