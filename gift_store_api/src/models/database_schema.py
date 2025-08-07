import sqlite3
from datetime import datetime
import os

class DatabaseManager:
    def __init__(self, db_path='gift_store.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database and create all necessary tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create products table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price REAL NOT NULL,
                cost REAL NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                min_stock INTEGER NOT NULL DEFAULT 5,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create customers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create orders table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER,
                total_amount REAL NOT NULL,
                discount REAL DEFAULT 0,
                final_amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                payment_method TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers (id)
            )
        ''')
        
        # Create order_items table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                total_price REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        ''')
        
        # Create expenses table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT,
                date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create inventory_movements table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS inventory_movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                movement_type TEXT NOT NULL, -- 'in' or 'out'
                quantity INTEGER NOT NULL,
                reason TEXT,
                reference_id INTEGER, -- order_id if movement is due to sale
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        ''')
        
        # Create categories table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default categories
        default_categories = [
            ('هدايا رومانسية', 'هدايا للأزواج والمحبين'),
            ('هدايا أطفال', 'ألعاب وهدايا للأطفال'),
            ('هدايا رجالية', 'هدايا مخصصة للرجال'),
            ('هدايا نسائية', 'هدايا مخصصة للنساء'),
            ('هدايا مناسبات', 'هدايا للمناسبات الخاصة'),
            ('إكسسوارات', 'إكسسوارات متنوعة'),
            ('أخرى', 'فئات أخرى')
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)
        ''', default_categories)
        
        # Insert sample products
        sample_products = [
            ('باقة ورد أحمر', 'هدايا رومانسية', 150.0, 80.0, 20, 5, 'باقة ورد أحمر جميلة'),
            ('دبدوب كبير', 'هدايا أطفال', 200.0, 120.0, 15, 3, 'دبدوب ناعم وجميل'),
            ('ساعة رجالية', 'هدايا رجالية', 500.0, 300.0, 10, 2, 'ساعة رجالية أنيقة'),
            ('عطر نسائي', 'هدايا نسائية', 300.0, 180.0, 25, 5, 'عطر نسائي فاخر'),
            ('شوكولاتة فاخرة', 'هدايا مناسبات', 100.0, 60.0, 50, 10, 'شوكولاتة بلجيكية فاخرة')
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO products (name, category, price, cost, stock, min_stock, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', sample_products)
        
        conn.commit()
        conn.close()
        print("Database initialized successfully!")
    
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if query.strip().upper().startswith('SELECT'):
            results = cursor.fetchall()
            conn.close()
            return results
        else:
            conn.commit()
            last_id = cursor.lastrowid
            conn.close()
            return last_id

if __name__ == "__main__":
    # Initialize database
    db = DatabaseManager()
    print("Database setup completed!")

