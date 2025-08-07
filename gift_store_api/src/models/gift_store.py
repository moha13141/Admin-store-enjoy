import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Optional

class GiftStoreDB:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'gift_store.db')
    
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if query.strip().upper().startswith('SELECT'):
                results = cursor.fetchall()
                return results
            else:
                conn.commit()
                return cursor.lastrowid
        finally:
            conn.close()
    
    # Products methods
    def get_all_products(self):
        """Get all products"""
        query = """
            SELECT id, name, category, price, cost, stock, min_stock, description, 
                   created_at, updated_at FROM products ORDER BY name
        """
        return self.execute_query(query)
    
    def get_product_by_id(self, product_id):
        """Get product by ID"""
        query = "SELECT * FROM products WHERE id = ?"
        results = self.execute_query(query, (product_id,))
        return results[0] if results else None
    
    def add_product(self, name, category, price, cost, stock, min_stock=5, description=""):
        """Add new product"""
        query = """
            INSERT INTO products (name, category, price, cost, stock, min_stock, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        return self.execute_query(query, (name, category, price, cost, stock, min_stock, description))
    
    def update_product(self, product_id, name, category, price, cost, stock, min_stock, description):
        """Update product"""
        query = """
            UPDATE products 
            SET name=?, category=?, price=?, cost=?, stock=?, min_stock=?, description=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        """
        return self.execute_query(query, (name, category, price, cost, stock, min_stock, description, product_id))
    
    def delete_product(self, product_id):
        """Delete product"""
        query = "DELETE FROM products WHERE id = ?"
        return self.execute_query(query, (product_id,))
    
    def update_product_stock(self, product_id, new_stock):
        """Update product stock"""
        query = "UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        return self.execute_query(query, (new_stock, product_id))
    
    # Categories methods
    def get_all_categories(self):
        """Get all categories"""
        query = "SELECT * FROM categories ORDER BY name"
        return self.execute_query(query)
    
    def add_category(self, name, description=""):
        """Add new category"""
        query = "INSERT INTO categories (name, description) VALUES (?, ?)"
        return self.execute_query(query, (name, description))
    
    # Customers methods
    def get_all_customers(self):
        """Get all customers"""
        query = "SELECT * FROM customers ORDER BY name"
        return self.execute_query(query)
    
    def add_customer(self, name, phone="", email="", address=""):
        """Add new customer"""
        query = "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)"
        return self.execute_query(query, (name, phone, email, address))
    
    def get_customer_by_id(self, customer_id):
        """Get customer by ID"""
        query = "SELECT * FROM customers WHERE id = ?"
        results = self.execute_query(query, (customer_id,))
        return results[0] if results else None
    
    # Orders methods
    def create_order(self, customer_id, total_amount, discount=0, payment_method="", notes=""):
        """Create new order"""
        final_amount = total_amount - discount
        query = """
            INSERT INTO orders (customer_id, total_amount, discount, final_amount, payment_method, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        return self.execute_query(query, (customer_id, total_amount, discount, final_amount, payment_method, notes))
    
    def add_order_item(self, order_id, product_id, quantity, unit_price):
        """Add item to order"""
        total_price = quantity * unit_price
        query = """
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?)
        """
        return self.execute_query(query, (order_id, product_id, quantity, unit_price, total_price))
    
    def get_all_orders(self):
        """Get all orders with customer info"""
        query = """
            SELECT o.id, c.name as customer_name, o.total_amount, o.discount, 
                   o.final_amount, o.status, o.payment_method, o.created_at
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC
        """
        return self.execute_query(query)
    
    def get_order_details(self, order_id):
        """Get order details with items"""
        order_query = """
            SELECT o.*, c.name as customer_name, c.phone, c.email, c.address
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        """
        order = self.execute_query(order_query, (order_id,))
        
        items_query = """
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        """
        items = self.execute_query(items_query, (order_id,))
        
        return {
            'order': order[0] if order else None,
            'items': items
        }
    
    def update_order_status(self, order_id, status):
        """Update order status"""
        query = "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        return self.execute_query(query, (status, order_id))
    
    # Expenses methods
    def add_expense(self, description, amount, category="", date=None):
        """Add new expense"""
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        query = "INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)"
        return self.execute_query(query, (description, amount, category, date))
    
    def get_all_expenses(self):
        """Get all expenses"""
        query = "SELECT * FROM expenses ORDER BY date DESC"
        return self.execute_query(query)
    
    def delete_expense(self, expense_id):
        """Delete expense"""
        query = "DELETE FROM expenses WHERE id = ?"
        return self.execute_query(query, (expense_id,))
    
    # Inventory movements
    def add_inventory_movement(self, product_id, movement_type, quantity, reason="", reference_id=None):
        """Add inventory movement"""
        query = """
            INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, reference_id)
            VALUES (?, ?, ?, ?, ?)
        """
        return self.execute_query(query, (product_id, movement_type, quantity, reason, reference_id))
    
    # Reports and analytics
    def get_low_stock_products(self):
        """Get products with low stock"""
        query = "SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC"
        return self.execute_query(query)
    
    def get_sales_summary(self, start_date=None, end_date=None):
        """Get sales summary"""
        if start_date and end_date:
            query = """
                SELECT COUNT(*) as total_orders, SUM(final_amount) as total_sales
                FROM orders 
                WHERE DATE(created_at) BETWEEN ? AND ?
            """
            return self.execute_query(query, (start_date, end_date))
        else:
            query = "SELECT COUNT(*) as total_orders, SUM(final_amount) as total_sales FROM orders"
            return self.execute_query(query)
    
    def get_top_selling_products(self, limit=10):
        """Get top selling products"""
        query = """
            SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            GROUP BY p.id, p.name
            ORDER BY total_sold DESC
            LIMIT ?
        """
        return self.execute_query(query, (limit,))

