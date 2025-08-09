// Firebase Configuration - إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCOEKziNXjzEz2UyJIaM011A",
  authDomain: "enjoy-gifts-sync.firebaseapp.com",
  projectId: "enjoy-gifts-sync",
  storageBucket: "enjoy-gifts-sync.firebasestorage.app",
  messagingSenderId: "794585503500",
  appId: "1:794585503500:web:ded22a8b6498792d5cd659",
  measurementId: "G-FHLV60LM89"
};

// متغيرات Firebase العامة
let app, db;

// تهيئة Firebase
async function initializeFirebase() {
    try {
        // تحميل Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // تهيئة Firebase
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        
        // حفظ المراجع للاستخدام لاحقاً
        window.firebaseModules = {
            collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy
        };
        
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return false;
    }
}

// قاعدة البيانات المحلية والسحابية
class InvoiceDatabase {
    constructor() {
        this.dbName = 'EnjoyGiftsDB';
        this.version = 1;
        this.db = null;
        this.storeId = null;
        this.isOnline = navigator.onLine;
        this.firebaseInitialized = false;
        
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
        try {
            // تهيئة Firebase أولاً
            this.firebaseInitialized = await initializeFirebase();
            
            // تهيئة قاعدة البيانات المحلية
            await this.initLocalDB();
            
            // تهيئة معرف المتجر
            await this.initStoreId();
            
            console.log('Database initialized successfully');
            return this.db;
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
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
        try {
            this.storeId = 'store_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('storeId', this.storeId);
            
            // إنشاء مجموعة جديدة في Firebase إذا كان متاحاً
            if (this.firebaseInitialized && this.isOnline && window.firebaseModules) {
                try {
                    const { collection, addDoc } = window.firebaseModules;
                    await addDoc(collection(db, 'stores'), {
                        storeId: this.storeId,
                        createdAt: new Date(),
                        name: 'Enjoy The Gifts Store'
                    });
                    console.log('Store created in Firebase');
                } catch (error) {
                    console.warn('Could not create store in Firebase:', error);
                    // لا نرمي خطأ هنا لأن المتجر المحلي تم إنشاؤه بنجاح
                }
            }
            
            return this.storeId;
        } catch (error) {
            console.error('Error creating new store:', error);
            throw new Error('فشل في إنشاء المتجر: ' + error.message);
        }
    }

    // ربط متجر موجود
    async connectToStore(storeId) {
        try {
            this.storeId = storeId;
            localStorage.setItem('storeId', this.storeId);
            
            // مزامنة البيانات من Firebase إذا كان متاحاً
            if (this.firebaseInitialized && this.isOnline) {
                await this.syncFromFirebase();
            }
            
            return true;
        } catch (error) {
            console.error('Error connecting to store:', error);
            throw new Error('فشل في ربط المتجر: ' + error.message);
        }
    }

    // مزامنة البيانات من Firebase
    async syncFromFirebase() {
        if (!this.firebaseInitialized || !this.isOnline || !this.storeId || !window.firebaseModules) {
            return;
        }

        try {
            const { collection, query, where, getDocs } = window.firebaseModules;

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

            console.log('Data synced from Firebase successfully');

        } catch (error) {
            console.error('خطأ في مزامنة البيانات من Firebase:', error);
        }
    }

    // مزامنة التغييرات المعلقة
    async syncPendingChanges() {
        if (!this.firebaseInitialized || !this.isOnline || !this.storeId || !window.firebaseModules) {
            return;
        }

        try {
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
        } catch (error) {
            console.error('Error syncing pending changes:', error);
        }
    }

    // حفظ فاتورة جديدة
    async saveInvoice(invoiceData) {
        try {
            // إضافة معرف المتجر
            invoiceData.storeId = this.storeId;
            invoiceData.createdAt = new Date().toISOString();
            invoiceData.updatedAt = new Date().toISOString();

            // حفظ محلياً
            const localId = await this.saveInvoiceLocally(invoiceData);
            
            // حفظ على Firebase إذا كان متصلاً
            if (this.firebaseInitialized && this.isOnline && window.firebaseModules) {
                try {
                    const { collection, addDoc } = window.firebaseModules;
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
        } catch (error) {
            console.error('Error saving invoice:', error);
            throw new Error('فشل في حفظ الفاتورة: ' + error.message);
        }
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

    // حفظ منتج
    async saveProduct(productData) {
        try {
            productData.storeId = this.storeId;
            productData.createdAt = new Date().toISOString();
            productData.updatedAt = new Date().toISOString();
            
            const localId = await this.saveProductLocally(productData);
            
            if (this.firebaseInitialized && this.isOnline && window.firebaseModules) {
                try {
                    const { collection, addDoc } = window.firebaseModules;
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
        } catch (error) {
            console.error('Error saving product:', error);
            throw new Error('فشل في حفظ المنتج: ' + error.message);
        }
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
        if (!window.firebaseModules) return;
        
        const { collection, addDoc } = window.firebaseModules;
        const docRef = await addDoc(collection(db, change.type), change.data);
        
        // تحديث المعرف المحلي
        if (change.type === 'invoices') {
            await this.updateInvoiceFirebaseId(change.data.id, docRef.id);
        } else if (change.type === 'products') {
            await this.updateProductFirebaseId(change.data.id, docRef.id);
        }
    }

    // مزامنة تحديث إلى Firebase
    async syncUpdateToFirebase(change) {
        if (!window.firebaseModules || !change.data.firebaseId) return;
        
        const { doc, updateDoc } = window.firebaseModules;
        const docRef = doc(db, change.type, change.data.firebaseId);
        await updateDoc(docRef, change.data);
    }

    // مزامنة حذف إلى Firebase
    async syncDeleteToFirebase(change) {
        if (!window.firebaseModules || !change.data.firebaseId) return;
        
        const { doc, deleteDoc } = window.firebaseModules;
        const docRef = doc(db, change.type, change.data.firebaseId);
        await deleteDoc(docRef);
    }

    // الحصول على حالة المزامنة
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            storeId: this.storeId,
            hasStoreId: !!this.storeId,
            firebaseInitialized: this.firebaseInitialized
        };
    }

    // إحصائيات
    async getStatistics() {
        try {
            const invoices = await this.getAllInvoices();
            const products = await this.getAllProducts();
            const pendingChanges = await this.getPendingChanges();
            
            const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
            const completedInvoices = invoices.filter(invoice => invoice.status === 'completed').length;
            const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
            
            return {
                storeId: this.storeId,
                isOnline: this.isOnline,
                firebaseInitialized: this.firebaseInitialized,
                totalInvoices: invoices.length,
                totalProducts: products.length,
                totalRevenue,
                completedInvoices,
                pendingInvoices,
                pendingChanges: pendingChanges.length,
                averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return {
                storeId: this.storeId,
                isOnline: this.isOnline,
                firebaseInitialized: this.firebaseInitialized,
                totalInvoices: 0,
                totalProducts: 0,
                totalRevenue: 0,
                completedInvoices: 0,
                pendingInvoices: 0,
                pendingChanges: 0,
                averageInvoiceValue: 0
            };
        }
    }
}

// إنشاء مثيل واحد من قاعدة البيانات وجعله متاحاً عالمياً
window.invoiceDB = new InvoiceDatabase();

