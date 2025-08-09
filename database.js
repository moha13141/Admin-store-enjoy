// Firebase Configuration - يجب إضافة إعدادات Firebase هنا
const firebaseConfig = {
  apiKey: "AIzaSyCOEKziNXjzEz2UyJIaM011A",
  authDomain: "enjoy-gifts-sync.firebaseapp.com",
  projectId: "enjoy-gifts-sync",
  storageBucket: "enjoy-gifts-sync.firebasestorage.app",
  messagingSenderId: "794585503500",
  appId: "1:794585503500:web:ded22a8b6498792d5cd659",
  measurementId: "G-FHLV60LM89"
};

// تهيئة Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// قاعدة البيانات المحلية والسحابية
class InvoiceDatabase {
    constructor() {
        this.dbName = 'EnjoyGiftsDB';
        this.version = 1;
        this.db = null;
        this.storeId = null;
        this.isOnline = navigator.onLine;
        
        // مراقبة حالة الاتصال
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingChanges();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // تهيئة قاعدة البيانات
    async init() {
        await this.initLocalDB();
        await this.initStoreId();
        return this.db;
    }

    // تهيئة قاعدة البيانات المحلية
    async initLocalDB() {
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
                    
                    invoiceStore.createIndex('date', 'date', { unique: false });
                    invoiceStore.createIndex('customerName', 'customerName', { unique: false });
                    invoiceStore.createIndex('total', 'total', { unique: false });
                    invoiceStore.createIndex('status', 'status', { unique: false });
                    invoiceStore.createIndex('firebaseId', 'firebaseId', { unique: false });
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
                    productStore.createIndex('firebaseId', 'firebaseId', { unique: false });
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
                    customerStore.createIndex('firebaseId', 'firebaseId', { unique: false });
                }

                // إنشاء جدول التغييرات المعلقة
                if (!db.objectStoreNames.contains('pendingChanges')) {
                    const pendingStore = db.createObjectStore('pendingChanges', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    pendingStore.createIndex('type', 'type', { unique: false });
                    pendingStore.createIndex('action', 'action', { unique: false });
                    pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // إنشاء جدول إعدادات المتجر
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', { 
                        keyPath: 'key'
                    });
                }
            };
        });
    }

    // تهيئة معرف المتجر
    async initStoreId() {
        const storedId = localStorage.getItem('storeId');
        if (storedId) {
            this.storeId = storedId;
        }
    }

    // إنشاء متجر جديد
    async createNewStore() {
        this.storeId = 'store_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('storeId', this.storeId);
        
        // إنشاء مجموعة جديدة في Firebase
        try {
            await addDoc(collection(db, 'stores'), {
                storeId: this.storeId,
                createdAt: new Date(),
                name: 'Enjoy The Gifts Store'
            });
        } catch (error) {
            console.error('خطأ في إنشاء المتجر على Firebase:', error);
        }
        
        return this.storeId;
    }

    // ربط متجر موجود
    async connectToStore(storeId) {
        this.storeId = storeId;
        localStorage.setItem('storeId', this.storeId);
        
        // مزامنة البيانات من Firebase
        await this.syncFromFirebase();
        
        return true;
    }

    // مزامنة البيانات من Firebase
    async syncFromFirebase() {
        if (!this.isOnline || !this.storeId) return;

        try {
            // مزامنة الفواتير
            const invoicesQuery = query(
                collection(db, 'invoices'), 
                where('storeId', '==', this.storeId)
            );
            const invoicesSnapshot = await getDocs(invoicesQuery);
            
            for (const docSnap of invoicesSnapshot.docs) {
                const data = docSnap.data();
                data.firebaseId = docSnap.id;
                await this.saveInvoiceLocally(data);
            }

            // مزامنة المنتجات
            const productsQuery = query(
                collection(db, 'products'), 
                where('storeId', '==', this.storeId)
            );
            const productsSnapshot = await getDocs(productsQuery);
            
            for (const docSnap of productsSnapshot.docs) {
                const data = docSnap.data();
                data.firebaseId = docSnap.id;
                await this.saveProductLocally(data);
            }

            // مزامنة العملاء
            const customersQuery = query(
                collection(db, 'customers'), 
                where('storeId', '==', this.storeId)
            );
            const customersSnapshot = await getDocs(customersQuery);
            
            for (const docSnap of customersSnapshot.docs) {
                const data = docSnap.data();
                data.firebaseId = docSnap.id;
                await this.saveCustomerLocally(data);
            }

        } catch (error) {
            console.error('خطأ في مزامنة البيانات من Firebase:', error);
        }
    }

    // مزامنة التغييرات المعلقة
    async syncPendingChanges() {
        if (!this.isOnline || !this.storeId) return;

        const pendingChanges = await this.getPendingChanges();
        
        for (const change of pendingChanges) {
            try {
                switch (change.action) {
                    case 'add':
                        await this.syncAddToFirebase(change);
                        break;
                    case 'update':
                        await this.syncUpdateToFirebase(change);
                        break;
                    case 'delete':
                        await this.syncDeleteToFirebase(change);
                        break;
                }
                
                // حذف التغيير المعلق بعد المزامنة
                await this.removePendingChange(change.id);
                
            } catch (error) {
                console.error('خطأ في مزامنة التغيير:', error);
            }
        }
    }

    // حفظ فاتورة جديدة
    async saveInvoice(invoiceData) {
        // إضافة معرف المتجر
        invoiceData.storeId = this.storeId;
        invoiceData.createdAt = new Date().toISOString();
        invoiceData.updatedAt = new Date().toISOString();

        // حفظ محلياً
        const localId = await this.saveInvoiceLocally(invoiceData);
        
        // حفظ على Firebase إذا كان متصلاً
        if (this.isOnline) {
            try {
                const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
                
                // تحديث المعرف المحلي بمعرف Firebase
                await this.updateInvoiceFirebaseId(localId, docRef.id);
                
            } catch (error) {
                console.error('خطأ في حفظ الفاتورة على Firebase:', error);
                // إضافة إلى قائمة التغييرات المعلقة
                await this.addPendingChange('invoices', 'add', invoiceData);
            }
        } else {
            // إضافة إلى قائمة التغييرات المعلقة
            await this.addPendingChange('invoices', 'add', invoiceData);
        }
        
        return localId;
    }

    // حفظ فاتورة محلياً
    async saveInvoiceLocally(invoiceData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['invoices'], 'readwrite');
            const store = transaction.objectStore('invoices');
            
            const request = store.add(invoiceData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في حفظ الفاتورة محلياً'));
            };
        });
    }

    // تحديث معرف Firebase للفاتورة
    async updateInvoiceFirebaseId(localId, firebaseId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['invoices'], 'readwrite');
            const store = transaction.objectStore('invoices');
            
            const getRequest = store.get(localId);
            
            getRequest.onsuccess = () => {
                const invoice = getRequest.result;
                if (invoice) {
                    invoice.firebaseId = firebaseId;
                    const updateRequest = store.put(invoice);
                    
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(new Error('فشل في تحديث معرف Firebase'));
                }
            };
            
            getRequest.onerror = () => {
                reject(new Error('فشل في العثور على الفاتورة'));
            };
        });
    }

    // تحديث فاتورة موجودة
    async updateInvoice(id, invoiceData) {
        invoiceData.updatedAt = new Date().toISOString();
        invoiceData.id = id;
        
        // تحديث محلياً
        await this.updateInvoiceLocally(id, invoiceData);
        
        // تحديث على Firebase إذا كان متصلاً
        if (this.isOnline && invoiceData.firebaseId) {
            try {
                const docRef = doc(db, 'invoices', invoiceData.firebaseId);
                await updateDoc(docRef, invoiceData);
            } catch (error) {
                console.error('خطأ في تحديث الفاتورة على Firebase:', error);
                await this.addPendingChange('invoices', 'update', invoiceData);
            }
        } else {
            await this.addPendingChange('invoices', 'update', invoiceData);
        }
        
        return id;
    }

    // تحديث فاتورة محلياً
    async updateInvoiceLocally(id, invoiceData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['invoices'], 'readwrite');
            const store = transaction.objectStore('invoices');
            
            const request = store.put(invoiceData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في تحديث الفاتورة محلياً'));
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
        const invoice = await this.getInvoice(id);
        
        // حذف محلياً
        await this.deleteInvoiceLocally(id);
        
        // حذف من Firebase إذا كان متصلاً
        if (this.isOnline && invoice.firebaseId) {
            try {
                const docRef = doc(db, 'invoices', invoice.firebaseId);
                await deleteDoc(docRef);
            } catch (error) {
                console.error('خطأ في حذف الفاتورة من Firebase:', error);
                await this.addPendingChange('invoices', 'delete', { firebaseId: invoice.firebaseId });
            }
        } else if (invoice.firebaseId) {
            await this.addPendingChange('invoices', 'delete', { firebaseId: invoice.firebaseId });
        }
        
        return true;
    }

    // حذف فاتورة محلياً
    async deleteInvoiceLocally(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['invoices'], 'readwrite');
            const store = transaction.objectStore('invoices');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في حذف الفاتورة محلياً'));
            };
        });
    }

    // حفظ منتج
    async saveProduct(productData) {
        productData.storeId = this.storeId;
        productData.createdAt = new Date().toISOString();
        productData.updatedAt = new Date().toISOString();
        
        const localId = await this.saveProductLocally(productData);
        
        if (this.isOnline) {
            try {
                const docRef = await addDoc(collection(db, 'products'), productData);
                await this.updateProductFirebaseId(localId, docRef.id);
            } catch (error) {
                console.error('خطأ في حفظ المنتج على Firebase:', error);
                await this.addPendingChange('products', 'add', productData);
            }
        } else {
            await this.addPendingChange('products', 'add', productData);
        }
        
        return localId;
    }

    // حفظ منتج محلياً
    async saveProductLocally(productData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            const request = store.add(productData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في حفظ المنتج محلياً'));
            };
        });
    }

    // تحديث معرف Firebase للمنتج
    async updateProductFirebaseId(localId, firebaseId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            const getRequest = store.get(localId);
            
            getRequest.onsuccess = () => {
                const product = getRequest.result;
                if (product) {
                    product.firebaseId = firebaseId;
                    const updateRequest = store.put(product);
                    
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(new Error('فشل في تحديث معرف Firebase'));
                }
            };
            
            getRequest.onerror = () => {
                reject(new Error('فشل في العثور على المنتج'));
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
        customerData.storeId = this.storeId;
        customerData.createdAt = new Date().toISOString();
        customerData.updatedAt = new Date().toISOString();
        
        const localId = await this.saveCustomerLocally(customerData);
        
        if (this.isOnline) {
            try {
                const docRef = await addDoc(collection(db, 'customers'), customerData);
                await this.updateCustomerFirebaseId(localId, docRef.id);
            } catch (error) {
                console.error('خطأ في حفظ العميل على Firebase:', error);
                await this.addPendingChange('customers', 'add', customerData);
            }
        } else {
            await this.addPendingChange('customers', 'add', customerData);
        }
        
        return localId;
    }

    // حفظ عميل محلياً
    async saveCustomerLocally(customerData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['customers'], 'readwrite');
            const store = transaction.objectStore('customers');
            
            const request = store.add(customerData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في حفظ العميل محلياً'));
            };
        });
    }

    // تحديث معرف Firebase للعميل
    async updateCustomerFirebaseId(localId, firebaseId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['customers'], 'readwrite');
            const store = transaction.objectStore('customers');
            
            const getRequest = store.get(localId);
            
            getRequest.onsuccess = () => {
                const customer = getRequest.result;
                if (customer) {
                    customer.firebaseId = firebaseId;
                    const updateRequest = store.put(customer);
                    
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(new Error('فشل في تحديث معرف Firebase'));
                }
            };
            
            getRequest.onerror = () => {
                reject(new Error('فشل في العثور على العميل'));
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

    // إضافة تغيير معلق
    async addPendingChange(type, action, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
            const store = transaction.objectStore('pendingChanges');
            
            const change = {
                type,
                action,
                data,
                timestamp: new Date().toISOString()
            };
            
            const request = store.add(change);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في إضافة التغيير المعلق'));
            };
        });
    }

    // استرجاع التغييرات المعلقة
    async getPendingChanges() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingChanges'], 'readonly');
            const store = transaction.objectStore('pendingChanges');
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في استرجاع التغييرات المعلقة'));
            };
        });
    }

    // حذف تغيير معلق
    async removePendingChange(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
            const store = transaction.objectStore('pendingChanges');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = () => {
                reject(new Error('فشل في حذف التغيير المعلق'));
            };
        });
    }

    // مزامنة إضافة إلى Firebase
    async syncAddToFirebase(change) {
        const docRef = await addDoc(collection(db, change.type), change.data);
        
        // تحديث المعرف المحلي
        if (change.type === 'invoices') {
            await this.updateInvoiceFirebaseId(change.data.id, docRef.id);
        } else if (change.type === 'products') {
            await this.updateProductFirebaseId(change.data.id, docRef.id);
        } else if (change.type === 'customers') {
            await this.updateCustomerFirebaseId(change.data.id, docRef.id);
        }
    }

    // مزامنة تحديث إلى Firebase
    async syncUpdateToFirebase(change) {
        if (change.data.firebaseId) {
            const docRef = doc(db, change.type, change.data.firebaseId);
            await updateDoc(docRef, change.data);
        }
    }

    // مزامنة حذف إلى Firebase
    async syncDeleteToFirebase(change) {
        if (change.data.firebaseId) {
            const docRef = doc(db, change.type, change.data.firebaseId);
            await deleteDoc(docRef);
        }
    }

    // تصدير البيانات
    async exportData() {
        const invoices = await this.getAllInvoices();
        const products = await this.getAllProducts();
        const customers = await this.getAllCustomers();
        
        return {
            storeId: this.storeId,
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
            
            // تعيين معرف المتجر
            if (data.storeId) {
                this.storeId = data.storeId;
                localStorage.setItem('storeId', this.storeId);
            }
            
            // استيراد الفواتير
            if (data.invoices) {
                for (const invoice of data.invoices) {
                    delete invoice.id;
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
        const stores = ['invoices', 'products', 'customers', 'pendingChanges'];
        
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
        const pendingChanges = await this.getPendingChanges();
        
        const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        const completedInvoices = invoices.filter(invoice => invoice.status === 'completed').length;
        const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
        
        return {
            storeId: this.storeId,
            isOnline: this.isOnline,
            totalInvoices: invoices.length,
            totalProducts: products.length,
            totalCustomers: customers.length,
            totalRevenue,
            completedInvoices,
            pendingInvoices,
            pendingChanges: pendingChanges.length,
            averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0
        };
    }

    // الحصول على حالة المزامنة
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            storeId: this.storeId,
            hasStoreId: !!this.storeId
        };
    }
}

// إنشاء مثيل واحد من قاعدة البيانات
const invoiceDB = new InvoiceDatabase();

