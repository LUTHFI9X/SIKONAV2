FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    default-mysql-client

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy existing application directory
COPY . .

# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Expose port 8000
EXPOSE 8000

# Start Laravel server
CMD ["sh", "-c", "if [ -z \"$APP_URL\" ] || [ \"$APP_URL\" = \"http://\" ] || [ \"$APP_URL\" = \"https://\" ] || echo \"$APP_URL\" | grep -Fq '${{'; then export APP_URL='http://localhost'; fi; PORT_VALUE=$(printf '%s' \"${PORT:-8000}\" | tr -cd '0-9'); if [ -z \"$PORT_VALUE\" ]; then PORT_VALUE=8000; fi; php artisan optimize:clear || true; php artisan up || true; php artisan serve --host=0.0.0.0 --port=$PORT_VALUE"]
