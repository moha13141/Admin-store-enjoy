// قاعدة البيانات المحلية باستخدام IndexedDB
class InvoiceDatabase {
    constructor() {
        this.dbName = 'EnjoyGiftsDB';
        this.version = 1;
        this.db = null;
    }

    // تهيئة قاعدة البيانات
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error('فشل في فتح قاعدة البيانات'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // إنشاء جدول الفواتير
                if (!db.objectStoreNames.contains('invoices')) {
                    const invoiceStore = db.createObjectStore('invoices', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // إنشاء فهارس للبحث
                    invoiceStore.createIndex('date', 'date', { unique: false });
                    invoiceStore.createIndex('customerName', 'customerName', { unique: false });
                    invoiceStore.createIndex('total', 'total', { unique: false });
                    invoiceStore.createIndex('status', 'status', { unique: false });
                }

                // إنشاء جدول المنتجات
                if (!db.objectStoreNames.contains('products')) {
                    const productStore = db.createObjectStore('products', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    productStore.createIndex('name', 'name', { unique: false });
                    productStore.createIndex('category', 'category', { unique: false });
                    productStore.createIndex('price', 'price', { unique: false });
                }

                // إنشاء جدول العملاء
                if (!db.objectStoreNames.contains('customers')) {
                    const customerStore = db.createObjectStore('customers', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    customerStore.createIndex('name', 'name', { unique: false });
                    customerStore.createIndex('phone', 'phone', { unique: false });
                    customerStore.createIndex('email', 'email', { unique: false });
                }
            };
        });
    }

    // حفظ فاتورة جديدة
    async saveInvoice(invoiceData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['invoices'], 'readwrite');
            const store = transaction.objectStore('invoices');
            
            // إضافة تاريخ الإنشاء والتحديث
            invoiceData.createdAt = new Date().toISOString();
            invoiceData.updatedAt = new Date().toISOString();
            
            const request = store.add(invoiceData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في حفظ الفاتورة'));
            };
        });
    }

    // تحديث فاتورة موجودة
    async updateInvoice(id, invoiceData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['invoices'], 'readwrite');
            const store = transaction.objectStore('invoices');
            
            // إضافة تاريخ التحديث
            invoiceData.updatedAt = new Date().toISOString();
            invoiceData.id = id;
            
            const request = store.put(invoiceData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في تحديث الفاتورة'));
            };
        });
    }

    // استرجاع فاتورة بالمعرف
    async getInvoice(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['invoices'], 'readonly');
            const store = transaction.objectStore('invoices');
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في استرجاع الفاتورة'));
            };
        });
    }

    // استرجاع جميع الفواتير
    async getAllInvoices() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['invoices'], 'readonly');
            const store = transaction.objectStore('invoices');
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في استرجاع الفواتير'));
            };
        });
    }

    // البحث في الفواتير
    async searchInvoices(searchTerm) {
        const allInvoices = await this.getAllInvoices();
        
        return allInvoices.filter(invoice => {
            return (
                invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.customerPhone?.includes(searchTerm) ||
                invoice.id?.toString().includes(searchTerm) ||
                invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }

    // فلترة الفواتير حسب التاريخ
    async getInvoicesByDateRange(startDate, endDate) {
        const allInvoices = await this.getAllInvoices();
        
        return allInvoices.filter(invoice => {
            const invoiceDate = new Date(invoice.date);
            return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
        });
    }

    // حذف فاتورة
    async deleteInvoice(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['invoices'], 'readwrite');
            const store = transaction.objectStore('invoices');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في حذف الفاتورة'));
            };
        });
    }

    // حفظ منتج
    async saveProduct(productData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            productData.createdAt = new Date().toISOString();
            productData.updatedAt = new Date().toISOString();
            
            const request = store.add(productData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في حفظ المنتج'));
            };
        });
    }

    // استرجاع جميع المنتجات
    async getAllProducts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في استرجاع المنتجات'));
            };
        });
    }

    // حفظ عميل
    async saveCustomer(customerData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['customers'], 'readwrite');
            const store = transaction.objectStore('customers');
            
            customerData.createdAt = new Date().toISOString();
            customerData.updatedAt = new Date().toISOString();
            
            const request = store.add(customerData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في حفظ العميل'));
            };
        });
    }

    // استرجاع جميع العملاء
    async getAllCustomers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['customers'], 'readonly');
            const store = transaction.objectStore('customers');
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في استرجاع العملاء'));
            };
        });
    }

    // تصدير البيانات
    async exportData() {
        const invoices = await this.getAllInvoices();
        const products = await this.getAllProducts();
        const customers = await this.getAllCustomers();
        
        return {
            invoices,
            products,
            customers,
            exportDate: new Date().toISOString(),
            version: this.version
        };
    }

    // استيراد البيانات
    async importData(data) {
        try {
            // مسح البيانات الحالية
            await this.clearAllData();
            
            // استيراد الفواتير
            if (data.invoices) {
                for (const invoice of data.invoices) {
                    delete invoice.id; // إزالة المعرف للسماح بإنشاء معرف جديد
                    await this.saveInvoice(invoice);
                }
            }
            
            // استيراد المنتجات
            if (data.products) {
                for (const product of data.products) {
                    delete product.id;
                    await this.saveProduct(product);
                }
            }
            
            // استيراد العملاء
            if (data.customers) {
                for (const customer of data.customers) {
                    delete customer.id;
                    await this.saveCustomer(customer);
                }
            }
            
            return true;
        } catch (error) {
            throw new Error('فشل في استيراد البيانات: ' + error.message);
        }
    }

    // مسح جميع البيانات
    async clearAllData() {
        const stores = ['invoices', 'products', 'customers'];
        
        for (const storeName of stores) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error(`فشل في مسح ${storeName}`));
            });
        }
    }

    // إحصائيات
    async getStatistics() {
        const invoices = await this.getAllInvoices();
        const products = await this.getAllProducts();
        const customers = await this.getAllCustomers();
        
        const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        const completedInvoices = invoices.filter(invoice => invoice.status === 'completed').length;
        const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
        
        return {
            totalInvoices: invoices.length,
            totalProducts: products.length,
            totalCustomers: customers.length,
            totalRevenue,
            completedInvoices,
            pendingInvoices,
            averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0
        };
    }
}

// إنشاء مثيل واحد من قاعدة البيانات
const invoiceDB = new InvoiceDatabase();

