from flask import Blueprint, request, jsonify
from src.models.gift_store import GiftStoreDB
from datetime import datetime

gift_store_bp = Blueprint('gift_store', __name__)
db = GiftStoreDB()

# CORS headers for all responses
@gift_store_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Handle preflight requests
@gift_store_bp.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 200

# Products endpoints
@gift_store_bp.route('/products', methods=['GET'])
def get_products():
    try:
        products = db.get_all_products()
        products_list = []
        for product in products:
            products_list.append({
                'id': product[0],
                'name': product[1],
                'category': product[2],
                'price': product[3],
                'cost': product[4],
                'stock': product[5],
                'min_stock': product[6],
                'description': product[7],
                'created_at': product[8],
                'updated_at': product[9]
            })
        return jsonify({'success': True, 'products': products_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/products', methods=['POST'])
def add_product():
    try:
        data = request.get_json()
        product_id = db.add_product(
            data['name'],
            data['category'],
            float(data['price']),
            float(data['cost']),
            int(data['stock']),
            int(data.get('min_stock', 5)),
            data.get('description', '')
        )
        return jsonify({'success': True, 'product_id': product_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.get_json()
        db.update_product(
            product_id,
            data['name'],
            data['category'],
            float(data['price']),
            float(data['cost']),
            int(data['stock']),
            int(data.get('min_stock', 5)),
            data.get('description', '')
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        db.delete_product(product_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Categories endpoints
@gift_store_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = db.get_all_categories()
        categories_list = []
        for category in categories:
            categories_list.append({
                'id': category[0],
                'name': category[1],
                'description': category[2],
                'created_at': category[3]
            })
        return jsonify({'success': True, 'categories': categories_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/categories', methods=['POST'])
def add_category():
    try:
        data = request.get_json()
        category_id = db.add_category(data['name'], data.get('description', ''))
        return jsonify({'success': True, 'category_id': category_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Customers endpoints
@gift_store_bp.route('/customers', methods=['GET'])
def get_customers():
    try:
        customers = db.get_all_customers()
        customers_list = []
        for customer in customers:
            customers_list.append({
                'id': customer[0],
                'name': customer[1],
                'phone': customer[2],
                'email': customer[3],
                'address': customer[4],
                'created_at': customer[5]
            })
        return jsonify({'success': True, 'customers': customers_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/customers', methods=['POST'])
def add_customer():
    try:
        data = request.get_json()
        customer_id = db.add_customer(
            data['name'],
            data.get('phone', ''),
            data.get('email', ''),
            data.get('address', '')
        )
        return jsonify({'success': True, 'customer_id': customer_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Orders endpoints
@gift_store_bp.route('/orders', methods=['GET'])
def get_orders():
    try:
        orders = db.get_all_orders()
        orders_list = []
        for order in orders:
            orders_list.append({
                'id': order[0],
                'customer_name': order[1],
                'total_amount': order[2],
                'discount': order[3],
                'final_amount': order[4],
                'status': order[5],
                'payment_method': order[6],
                'created_at': order[7]
            })
        return jsonify({'success': True, 'orders': orders_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        
        # Create customer if new
        customer_id = data.get('customer_id')
        if not customer_id and data.get('customer_name'):
            customer_id = db.add_customer(
                data['customer_name'],
                data.get('customer_phone', ''),
                data.get('customer_email', ''),
                data.get('customer_address', '')
            )
        
        # Create order
        order_id = db.create_order(
            customer_id,
            float(data['total_amount']),
            float(data.get('discount', 0)),
            data.get('payment_method', ''),
            data.get('notes', '')
        )
        
        # Add order items
        for item in data.get('items', []):
            db.add_order_item(
                order_id,
                item['product_id'],
                int(item['quantity']),
                float(item['unit_price'])
            )
            
            # Update product stock
            product = db.get_product_by_id(item['product_id'])
            if product:
                new_stock = product[5] - int(item['quantity'])  # stock is at index 5
                db.update_product_stock(item['product_id'], new_stock)
                
                # Add inventory movement
                db.add_inventory_movement(
                    item['product_id'],
                    'out',
                    int(item['quantity']),
                    f'Sale - Order #{order_id}',
                    order_id
                )
        
        return jsonify({'success': True, 'order_id': order_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order_details(order_id):
    try:
        order_details = db.get_order_details(order_id)
        if order_details['order']:
            order = order_details['order']
            order_data = {
                'id': order[0],
                'customer_id': order[1],
                'total_amount': order[2],
                'discount': order[3],
                'final_amount': order[4],
                'status': order[5],
                'payment_method': order[6],
                'notes': order[7],
                'created_at': order[8],
                'updated_at': order[9],
                'customer_name': order[10],
                'customer_phone': order[11],
                'customer_email': order[12],
                'customer_address': order[13]
            }
            
            items_data = []
            for item in order_details['items']:
                items_data.append({
                    'id': item[0],
                    'product_id': item[2],
                    'product_name': item[6],
                    'quantity': item[3],
                    'unit_price': item[4],
                    'total_price': item[5]
                })
            
            return jsonify({
                'success': True,
                'order': order_data,
                'items': items_data
            })
        else:
            return jsonify({'success': False, 'error': 'Order not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    try:
        data = request.get_json()
        db.update_order_status(order_id, data['status'])
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Expenses endpoints
@gift_store_bp.route('/expenses', methods=['GET'])
def get_expenses():
    try:
        expenses = db.get_all_expenses()
        expenses_list = []
        for expense in expenses:
            expenses_list.append({
                'id': expense[0],
                'description': expense[1],
                'amount': expense[2],
                'category': expense[3],
                'date': expense[4],
                'created_at': expense[5]
            })
        return jsonify({'success': True, 'expenses': expenses_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/expenses', methods=['POST'])
def add_expense():
    try:
        data = request.get_json()
        expense_id = db.add_expense(
            data['description'],
            float(data['amount']),
            data.get('category', ''),
            data.get('date')
        )
        return jsonify({'success': True, 'expense_id': expense_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    try:
        db.delete_expense(expense_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Reports endpoints
@gift_store_bp.route('/reports/low-stock', methods=['GET'])
def get_low_stock_report():
    try:
        products = db.get_low_stock_products()
        products_list = []
        for product in products:
            products_list.append({
                'id': product[0],
                'name': product[1],
                'category': product[2],
                'current_stock': product[5],
                'min_stock': product[6]
            })
        return jsonify({'success': True, 'products': products_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/reports/sales-summary', methods=['GET'])
def get_sales_summary():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        summary = db.get_sales_summary(start_date, end_date)
        if summary:
            return jsonify({
                'success': True,
                'total_orders': summary[0][0],
                'total_sales': summary[0][1] or 0
            })
        else:
            return jsonify({
                'success': True,
                'total_orders': 0,
                'total_sales': 0
            })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@gift_store_bp.route('/reports/top-products', methods=['GET'])
def get_top_products():
    try:
        limit = int(request.args.get('limit', 10))
        products = db.get_top_selling_products(limit)
        products_list = []
        for product in products:
            products_list.append({
                'name': product[0],
                'total_sold': product[1],
                'total_revenue': product[2]
            })
        return jsonify({'success': True, 'products': products_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

