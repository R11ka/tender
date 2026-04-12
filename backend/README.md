# TenderFlow — Платформа управления тендерными закупками

[![Django](https://img.shields.io/badge/Django-5.0-green?logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-24.0-blue?logo=docker)](https://www.docker.com/)

Веб-приложение для автоматизации процесса тендерных закупок. Позволяет импортировать инженерные листы, управлять позициями, вести коммуникацию с поставщиками, фиксировать результаты торгов и формировать итоговые закупочные лоты.

![Dashboard Screenshot](https://via.placeholder.com/800x400?text=Скриншот+Дашборда+TenderFlow) <!-- Ты можешь вставить сюда свой скрин -->

## 🚀 Ключевые возможности

- **Импорт ИЛ:** Загрузка и парсинг Excel (.xlsx) и CSV файлов с автоматическим созданием позиций.
- **Управление позициями:** Редактирование наименований, количества, целевой цены и статусов.
- **Документооборот:** Прикрепление файлов (ТЗ, КП, чертежи, протоколы) к каждой позиции.
- **Система комментариев:** Обсуждение и фиксация уточнений внутри позиций.
- **Завершение торгов:** Удобный интерфейс для ввода данных победителя (цена, поставщик, сроки).
- **Объединение в лоты:** Группировка позиций в закупочные лоты с отслеживанием статуса.
- **Разграничение прав:** Роли «Менеджер» (полный доступ) и «Наблюдатель» (только чтение).
- **JWT-авторизация:** Безопасная система Refresh/Access токенов.

## 🛠 Стек технологий

| Уровень | Технологии |
| :--- | :--- |
| **Backend** | Python 3.11, Django 5.0, Django REST Framework, Simple JWT |
| **Frontend** | React 18, React Router, Axios, CSS Modules |
| **Database** | PostgreSQL 15 |
| **Deployment** | Docker, Docker Compose, Gunicorn |
| **Design** | Figma (Гайдлайн и дизайн-система) |

## 📦 Локальный запуск (Docker)

Самый простой способ развернуть проект — использовать Docker Compose.

### Предварительные требования

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Инструкция по запуску

1.  **Клонируйте репозиторий:**
    ```bash
    git clone <your-repo-url>
    cd <your-project-folder>