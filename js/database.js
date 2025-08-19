const client = new appwrite.Client();

client
    .setEndpoint("https://fra.cloud.appwrite.io/v1") // Your Appwrite Endpoint
    .setProject("68a464d1003443ce30c4");               // Your Project ID

const databases = new appwrite.Databases(client);
const account = new appwrite.Account(client);

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

// Authentication and Store Management
async function createNewStore(storeName, ownerName) {
    try {
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
        const response = await databases.listDocuments(DATABASE_ID, collectionId, [...queries, appwrite.Query.equal("store_id", currentStoreId)]);
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

// Initialize Appwrite client on load
(async () => {
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


