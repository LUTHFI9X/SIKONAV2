# 🚀 Panduan Deploy SiKONA - PHP + MySQL

## Quick Deploy Options

| Platform | Difficulty | Cost | Link |
|----------|------------|------|------|
| Railway | ⭐ Easy | Free tier | [railway.app](https://railway.app) |
| Render | ⭐ Easy | Free tier | [render.com](https://render.com) |
| Shared Hosting | ⭐⭐ Medium | $3-10/mo | Hostinger, Niagahoster |
| VPS | ⭐⭐⭐ Hard | $5+/mo | DigitalOcean, Vultr |

---

## 🚂 Option 1: Deploy ke Railway (Rekomendasi)

### Step 1: Buat Akun Railway
1. Buka [railway.app](https://railway.app)
2. Sign up dengan GitHub

### Step 2: Setup Project
```bash
# Install Railway CLI (optional)
npm install -g @railway/cli
railway login
```

### Step 3: Buat Project Baru
1. Di Railway Dashboard, klik **"New Project"**
2. Pilih **"Empty Project"**

### Step 4: Tambahkan MySQL Database
1. Klik **"+ New"** → **"Database"** → **"MySQL"**
2. Railway akan otomatis membuat database
3. Klik MySQL service → **"Variables"** tab
4. Catat variabel berikut:
  - `MYSQLHOST`
  - `MYSQLPORT`
  - `MYSQLDATABASE`
  - `MYSQLUSER`
  - `MYSQLPASSWORD`

### Step 5: Deploy Backend Laravel
1. Klik **"+ New"** → **"GitHub Repo"**
2. Pilih repository Anda
3. Set **Root Directory** ke: `backend`
4. Di **Service Settings → Config as Code**, set path file config ke: `/backend/railway.json`

### Step 6: Set Environment Variables
Di Railway, tambahkan variabel berikut:

```env
APP_NAME=SiKONA
APP_ENV=production
APP_KEY=base64:GENERATE_NEW_KEY
APP_DEBUG=false
# Untuk deploy pertama, gunakan URL valid sederhana dulu
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

LOG_CHANNEL=stderr

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

FRONTEND_URL=https://your-frontend.com
SANCTUM_STATEFUL_DOMAINS=your-frontend.com,localhost:5173
```

### Step 7: Generate APP_KEY
```bash
cd backend
php artisan key:generate --show
# Copy output dan paste ke Railway APP_KEY
```

### Step 8: Import Database (Manual)
Buka Railway MySQL → **"Data"** tab → **"Import"** → Upload `database/sikona_mysql.sql`

Atau via terminal:
```bash
# Connect ke Railway MySQL
mysql -h $MYSQLHOST -P $MYSQLPORT -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < database/sikona_mysql.sql
```

### Step 9: Generate Public URL
1. Klik Laravel service
2. Klik **"Settings"** → **"Networking"**
3. Klik **"Generate Domain"**
4. API Anda tersedia di: `https://xxx.railway.app`
5. Update `APP_URL` di service variables menjadi domain tersebut, lalu redeploy

---

## 🖥️ Option 2: Deploy ke Shared Hosting (cPanel)

### Step 1: Persiapan Lokal
```bash
cd backend

# Install dependencies tanpa dev
composer install --no-dev --optimize-autoloader

# Generate optimized files
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 2: Buat Database di cPanel
1. Login ke cPanel
2. MySQL Databases → Create Database: `sikona_db`
3. Create User → Buat user dengan password kuat
4. Add User to Database → Pilih ALL PRIVILEGES

### Step 3: Import SQL
1. Buka phpMyAdmin
2. Pilih database `sikona_db`
3. Tab **"Import"** → Upload `sikona_mysql.sql`

### Step 4: Upload Files
Via File Manager atau FTP, upload struktur:

```
public_html/
├── sikona-api/              # Folder backend
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env                 # Edit sesuai server
│   └── public/
│       └── index.php
```

### Step 5: Point Domain ke public/
Buat symlink atau edit `.htaccess` di root:
```apache
RewriteEngine On
RewriteRule ^(.*)$ sikona-api/public/$1 [L]
```

### Step 6: Edit .env
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=cpanel_username_sikona_db
DB_USERNAME=cpanel_username_dbuser
DB_PASSWORD=your_password
```

### Step 7: Set Permissions
Via SSH atau File Manager:
```bash
chmod -R 775 storage bootstrap/cache
```

### Step 8: Run Migrations (jika belum import SQL)
Via SSH:
```bash
cd ~/sikona-api
php artisan migrate --seed
php artisan storage:link
```

---

## 🐳 Option 3: Deploy dengan Docker

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DB_CONNECTION=mysql
      - DB_HOST=db
      - DB_PORT=3306
      - DB_DATABASE=sikona_db
      - DB_USERNAME=sikona
      - DB_PASSWORD=secret
    depends_on:
      - db
    volumes:
      - ./backend:/var/www/html
      
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: sikona_db
      MYSQL_USER: sikona
      MYSQL_PASSWORD: secret
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/sikona_mysql.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  mysql_data:
```

### backend/Dockerfile
```dockerfile
FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip

RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

CMD php artisan serve --host=0.0.0.0 --port=8000
```

### Run Docker:
```bash
docker-compose up -d
docker-compose exec app php artisan migrate --seed
```

---

## 🔧 Troubleshooting

### Error 500 / Blank Page
```bash
# Check Laravel log
tail -f storage/logs/laravel.log

# Fix permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Database Connection Refused
- Cek DB_HOST: gunakan `localhost` atau `127.0.0.1`
- Pastikan MySQL service running
- Cek firewall tidak block port 3306

### CORS Error di Frontend
Edit `config/cors.php`:
```php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:5173'),
    'https://your-frontend-domain.com',
],
```

### Class Not Found
```bash
composer dump-autoload
php artisan config:clear
php artisan cache:clear
```

---

## 👥 Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@sikona.com | password | Admin |
| auditor1@sikona.com | password | Auditor |
| auditee1@sikona.com | password | Auditee |

---

## ✅ Checklist Sebelum Production

- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` di-generate ulang
- [ ] Password database kuat
- [ ] HTTPS enabled
- [ ] CORS dikonfigurasi dengan benar
- [ ] Backup database rutin
- [ ] Rate limiting aktif
- [ ] Log monitoring aktif
