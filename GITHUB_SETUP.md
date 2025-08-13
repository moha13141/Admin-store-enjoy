# دليل إعداد GitHub - Enjoy The Gifts

## خطوات نشر المشروع على GitHub

### 1. إنشاء مستودع جديد على GitHub

1. **اذهب إلى GitHub.com وسجل دخولك**
2. **اضغط على زر "New" أو "+" في الأعلى**
3. **املأ بيانات المستودع:**
   - Repository name: `enjoy-gifts-store`
   - Description: `نظام متكامل لإدارة المبيعات والمخزون والفواتير - Enjoy The Gifts Store Management System`
   - اختر Public أو Private حسب رغبتك
   - **لا تختر** "Add a README file" (لأننا لدينا README بالفعل)
   - **لا تختر** "Add .gitignore" (لأننا لدينا .gitignore بالفعل)
4. **اضغط "Create repository"**

### 2. ربط المشروع المحلي بـ GitHub

افتح Terminal أو Command Prompt في مجلد المشروع وقم بتنفيذ الأوامر التالية:

```bash
# إضافة رابط المستودع البعيد (استبدل username باسم المستخدم الخاص بك)
git remote add origin https://github.com/username/enjoy-gifts-store.git

# رفع الملفات إلى GitHub
git push -u origin main
```

### 3. تفعيل GitHub Pages (للنشر المجاني)

1. **اذهب إلى صفحة المستودع على GitHub**
2. **اضغط على تبويب "Settings"**
3. **انتقل إلى قسم "Pages" من القائمة الجانبية**
4. **في قسم "Source":**
   - اختر "Deploy from a branch"
   - اختر "main" من قائمة Branch
   - اختر "/ (root)" من قائمة Folder
5. **اضغط "Save"**
6. **انتظر بضع دقائق حتى يكتمل النشر**
7. **ستحصل على رابط مثل:** `https://username.github.io/enjoy-gifts-store/`

## إعدادات إضافية مهمة

### 1. إضافة وصف للمستودع

في صفحة المستودع الرئيسية:
1. اضغط على أيقونة الترس بجانب "About"
2. أضف الوصف: `نظام متكامل لإدارة المبيعات والمخزون والفواتير مع دعم PWA`
3. أضف الموضوعات (Topics): `pwa`, `javascript`, `arabic`, `invoice-system`, `inventory-management`
4. أضف رابط الموقع إذا كان متاحاً
5. احفظ التغييرات

### 2. إنشاء ملف LICENSE (اختياري)

إذا كنت تريد إضافة ترخيص للمشروع:

1. في صفحة المستودع، اضغط "Add file" > "Create new file"
2. اكتب اسم الملف: `LICENSE`
3. اختر نوع الترخيص المناسب (مثل MIT License)
4. احفظ الملف

### 3. إعداد الحماية للفرع الرئيسي (اختياري)

لحماية الفرع الرئيسي من التعديلات المباشرة:

1. اذهب إلى Settings > Branches
2. اضغط "Add rule"
3. أدخل "main" في Branch name pattern
4. فعّل الخيارات المطلوبة
5. احفظ التغييرات

## تحديث المشروع

### إضافة تغييرات جديدة

```bash
# إضافة الملفات المعدلة
git add .

# إنشاء commit جديد
git commit -m "وصف التغييرات"

# رفع التغييرات إلى GitHub
git push origin main
```

### إنشاء إصدار جديد (Release)

1. في صفحة المستودع، اضغط "Releases"
2. اضغط "Create a new release"
3. أدخل رقم الإصدار (مثل v1.0.0)
4. أدخل عنوان ووصف الإصدار
5. أرفق ملفات إضافية إذا لزم الأمر
6. اضغط "Publish release"

## استكشاف الأخطاء

### مشكلة: "remote origin already exists"

```bash
# حذف الرابط الموجود
git remote remove origin

# إضافة الرابط الجديد
git remote add origin https://github.com/username/enjoy-gifts-store.git
```

### مشكلة: "Permission denied"

تأكد من:
- صحة اسم المستخدم وكلمة المرور
- أو استخدم Personal Access Token بدلاً من كلمة المرور

### مشكلة: GitHub Pages لا يعمل

تحقق من:
- أن الفرع المختار صحيح (main)
- وجود ملف index.html في المجلد الرئيسي
- انتظار بضع دقائق لاكتمال النشر

## نصائح مهمة

### 1. أمان المعلومات
- لا تضع كلمات مرور أو مفاتيح API في الكود
- استخدم ملف .gitignore لاستبعاد الملفات الحساسة

### 2. تنظيم الكود
- استخدم commit messages واضحة ومفيدة
- قم بعمل commit منتظم للتغييرات
- استخدم branches للمميزات الجديدة

### 3. التوثيق
- حافظ على تحديث ملف README.md
- أضف تعليقات واضحة في الكود
- وثّق أي تغييرات مهمة

## روابط مفيدة

- [GitHub Docs](https://docs.github.com/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**ملاحظة:** استبدل `username` في جميع الأوامر باسم المستخدم الخاص بك على GitHub.

