# ITM MSC SDP Assignment - Backend

This project is the backend part of the web application for managing and tracking shipments. It is built with Django.

## Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Database Configuration](#database-configuration)
- [Email Service](#email-service)
- [API Documentation](#api-documentation)
- [License](#license)

## Project Structure

The project structure is as follows:

```
backend/
├── apps/                   # Django apps
│   ├── shipments/          # Shipments app
│   │   ├── migrations/     # Database migrations
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API views
│   │   ├── serializers.py  # Serializers for API
│   │   ├── urls.py         # URL routing
│   │   ├── services.py     # Business logic
│   │   ├── holidays.py     # Holiday logic
│   │   └── ...             # Other files
│   └── ...                 # Other apps
├── project/                # Project settings
│   ├── settings.py         # Django settings
│   ├── urls.py             # Project URL routing
│   ├── asgi.py             # ASGI configuration
│   ├── wsgi.py             # WSGI configuration
│   └── ...                 # Other files
├── manage.py               # Django management script
├── requirements.txt        # Project dependencies
└── ...                     # Other files
```

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Python 3.8 or higher
- PostgreSQL (or any other database supported by Django)

## Setup

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-directory>/backend
    ```

2. **Create and activate a virtual environment:**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. **Install the dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4. **Set up the database:**

    Update the `DATABASES` setting in `project/settings.py` to configure your database.

    ```python
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'your_db_name',
            'USER': 'your_db_user',
            'PASSWORD': 'your_db_password',
            'HOST': 'localhost',
            'PORT': '5432',
        }
    }
    ```

5. **Configure the `.env` file:**

    Create a `.env` file in the `backend` directory and add the following environment variables:

    ```env
    DB_ENGINE="django.db.backends.postgresql"

    # Local database configuration
    DATABASE_NAME="ITM_SDP_Assignment"
    DATABASE_USER="postgres"
    DATABASE_PWD="root"
    DATABASE_HOST="localhost"
    DATABASE_PORT="5432"

    ENV="development"
    ENVIRONMENT="development"
    WEBAPP_URL="http://localhost:3000"

    # Swagger
    IS_SWAGGER_ENABLED=true
    SWAGGER_ADMIN_LOGIN_ENABLED=true

    # Email Service
    DJANGO_EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend"
    DJANGO_EMAIL_HOST="smtp.gmail.com"
    DJANGO_EMAIL_PORT=587
    DJANGO_EMAIL_HOST_USER="your_email@gmail.com"
    DJANGO_EMAIL_HOST_PASSWORD="your_email_password"
    ```

    The `DJANGO_EMAIL_HOST_USER` and `DJANGO_EMAIL_HOST_PASSWORD` are mandatory for the email service to work.

6. **Run migrations:**

    ```bash
    python manage.py migrate
    ```

7. **Create a superuser:**

    ```bash
    python manage.py createsuperuser
    ```

8. **Collect static files:** <-- Not Required when running the project Locally

    ```bash
    python manage.py collectstatic
    ```

## Running the Application

1. **Start the backend server:**

    There are two ways to run the backend server:

    - **Normal way:**

        ```bash
        cd <repository-directory>/backend
        source venv/bin/activate  # On Windows use `venv\Scripts\activate`
        python manage.py runserver
        ```

    - **With WebSocket support (for real-time shipment updates):**

        ```bash
        cd <repository-directory>/backend
        source venv/bin/activate  # On Windows use `venv\Scripts\activate`
        uvicorn project.asgi:application --host 127.0.0.1 --port 8000
        ```

## Environment Variables

The `.env` file should contain the following environment variables:

- `DB_ENGINE`: The database engine to use.
- `DATABASE_NAME`: The name of the database.
- `DATABASE_USER`: The database user.
- `DATABASE_PWD`: The database password.
- `DATABASE_HOST`: The database host.
- `DATABASE_PORT`: The database port.
- `ENV`: The environment (e.g., development, production).
- `ENVIRONMENT`: The environment (e.g., development, production).
- `WEBAPP_URL`: The URL of the frontend web application.
- `IS_SWAGGER_ENABLED`: A boolean value to enable or disable Swagger documentation.
- `SWAGGER_ADMIN_LOGIN_ENABLED`: A boolean value to enable or disable Swagger admin login.
- `DJANGO_EMAIL_BACKEND`: The email backend to use.
- `DJANGO_EMAIL_HOST`: The email host.
- `DJANGO_EMAIL_PORT`: The email port.
- `DJANGO_EMAIL_HOST_USER`: The email host user.
- `DJANGO_EMAIL_HOST_PASSWORD`: The email host password.

Example `.env` file:

```env
DB_ENGINE="django.db.backends.postgresql"
DATABASE_NAME="ITM_SDP_Assignment"
DATABASE_USER="postgres"
DATABASE_PWD="root"
DATABASE_HOST="localhost"
DATABASE_PORT="5432"
ENV="development"
ENVIRONMENT="development"
WEBAPP_URL="http://localhost:3000"
IS_SWAGGER_ENABLED=true
SWAGGER_ADMIN_LOGIN_ENABLED=true
DJANGO_EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend"
DJANGO_EMAIL_HOST="smtp.gmail.com"
DJANGO_EMAIL_PORT=587
DJANGO_EMAIL_HOST_USER="your_email@gmail.com"
DJANGO_EMAIL_HOST_PASSWORD="your_email_password"
```

## Database Configuration

Update the `DATABASES` setting in `project/settings.py` to configure your database.

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## Email Service

To send emails to recipients without printing them on the console (development work), add the following to the `.env` file:

```env
DJANGO_EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend"
DJANGO_EMAIL_HOST="smtp.gmail.com"
DJANGO_EMAIL_PORT=587
DJANGO_EMAIL_HOST_USER="your_email@gmail.com"
DJANGO_EMAIL_HOST_PASSWORD="your_email_password"
```

## API Documentation

The API documentation is available at the following endpoints:

- **Swagger UI:** `http://localhost:8000/swagger/schema/`
- **Redoc:** `http://localhost:8000/redoc/`

These endpoints provide detailed information about the available API endpoints and their usage.

## License

This project is licensed under the MIT License.