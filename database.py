import sqlite3

# الاتصال بقاعدة بيانات (ستُنشأ تلقائيًا إذا لم توجد)
conn = sqlite3.connect('website.db')  # سيتم حفظها في نفس مجلد المشروع

# إنشاء "جدول" لتخزين بيانات المستخدمين
cursor = conn.cursor()
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT
)
''')

# إضافة بيانات مثال
cursor.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", 
               ('ahmed', 'ahmed@example.com', '123456'))

# حفظ التغييرات وإغلاق الاتصال
conn.commit()
conn.close()
print("تم إنشاء قاعدة البيانات بنجاح!")
