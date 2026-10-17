# Smart Code Analyzer — Вебзастосунок для аналізу та покращення програмного коду

Сучасна багатомовна Web-IDE платформа для статичного аналізу коду, аудиту програмної архітектури, розрахунку метрик якості (SEI MI, McCabe CCN), компіляції та автоматичного тестування проєктів.

---

## 📌 Опис проекту

**Smart Code Analyzer** — це інтегрована програмна Web-IDE система для автоматизованого багатомовного статичного аналізу архітектури, розрахунку метрик якості коду (Maintainability Index, Cyclomatic Complexity), компіляції в пам'яті, ізольованого виконання та автоматичного запуску модульних тестів.

Інтерфейс системи спроектовано у фірмовому стилі **JetBrains IDE (Dark / Darcula Theme)**, що забезпечує знайомий та професійний досвід роботи для інженерів-програмістів.

---

## 🚀 Ключові функціональні можливості

1. **Багатомовний статичний аналіз**:
   * Підтримка **Java 21**, **Python 3.12**, **TypeScript**, **JavaScript**.
   * 5 профілів перевірки: *Architecture & Coupling, Clean Code & SOLID, Modern Features, Performance, Security*.
   * Виявлення циклічних залежностей (Circular Dependencies) та сильного зв'язування (Tight Coupling).
   * Пошук запахів коду (God Class, небезпечний перехоплення помилок, блокуючі операції).

2. **Панель метрик якості програмного забезпечення**:
   * Розрахунок **Maintainability Index (MI)** (від 0 до 100 з категоріями A/B/C/D).
   * Визначення цикломатичної складності **Cyclomatic Complexity (CCN)**.
   * Підрахунок метрик обсягу (LOC, SLOC, коментарі, співвідношення коментарів).

3. **In-Memory Компілятор (`🔨 Build Project`)**:
   * Реальна компіляція Java 21 в оперативній пам'яті через `javax.tools.JavaCompiler`.
   * Діагностика помилок компіляції з точними координатами `[рядок:стовпчик]` та автопереходом до файлу.

4. **Середовище ізольованого запуску (`▶️ Run`)**:
   * Виконання методу `main()` у захищеному процесі з лімітом часу 5 секунд.
   * Вивід потоків `stdout` та `stderr` у термінальну консоль реального часу.

5. **Автоматизований Test Runner (`🧪 Run Tests`)**:
   * Генерація юніт-тестів на базі **JUnit 5**, **pytest** та **node:test**.
   * Запуск тестів з браузера та побудова звіту проходження у стилі IntelliJ Test Toolwindow.

6. **Експорт звітів аудиту**:
   * Завантаження повноцінного звіту у форматі **Markdown (`.md`)**.
   * Формування друкованого **PDF / Print-звіту** з детальними таблицями метрик.

7. **Історія аудитів та СУБД**:
   * Збереження результатів перевірок у реляційній базі даних **PostgreSQL**.
   * Зручний перегляд та порівняння попередніх аудитів через панель History.

---

## 🛠 Технологічний стек

* **Серверна частина (Backend)**:
  * Java 21 LTS, Spring Boot 3.3.4
  * Spring Data JPA, Hibernate ORM
  * JUnit 5 Platform Console Standalone
  * Maven 3.9
* **Клієнтська частина (Frontend)**:
  * React 18, TypeScript, Vite
  * Кастомний JetBrains IDE Dark UI (Vanilla CSS)
  * Lucide Icons
* **База даних**:
  * PostgreSQL 16
* **Контейнеризація**:
  * Docker, Docker Compose

---

## 🐳 Запуск через Docker Compose (Рекомендовано)

Для запуску всієї системи (Бекенд + Фронтенд + База даних PostgreSQL) однією командою:

```bash
docker compose up --build
```

Після запуску застосунок буде доступний за адресами:
* **Веб-інтерфейс (Frontend)**: [http://localhost](http://localhost) (порт 80)
* **REST API (Backend)**: [http://localhost:8080](http://localhost:8080)
* **База даних (PostgreSQL)**: `localhost:5432`

---

## 💻 Локальний запуск для розробки

### 1. Запуск бази даних PostgreSQL
```bash
docker run -d --name smartcode-postgres \
  -e POSTGRES_DB=smartcode_analyzer \
  -e POSTGRES_USER=smartcode_user \
  -e POSTGRES_PASSWORD=smartcode_secure_pass_2026 \
  -p 5432:5432 postgres:16-alpine
```

### 2. Запуск бекенду (Spring Boot)
```bash
mvn -f backend/pom.xml spring-boot:run
```
Сервер запуститься на порті **8080**. Запуск тестів:
```bash
mvn -f backend/pom.xml test
```

### 3. Запуск фронтенду (Vite Dev Server)
```bash
cd frontend
npm install
npm run dev
```
Фронтенд буде доступний за адресою: **[http://localhost:5173](http://localhost:5173)**.

---

## 📡 Основні REST API Ендпоінти

| Метод | URL | Опис |
| :--- | :--- | :--- |
| `POST` | `/api/v1/analyze` | Запуск багатофайлового статичного аналізу коду |
| `GET` | `/api/v1/analyze/history` | Отримання історії проведених аудитів |
| `GET` | `/api/v1/analyze/history/{id}` | Отримання деталей конкретного збереженого аудиту |
| `DELETE` | `/api/v1/analyze/history/{id}` | Видалення запису з історії |
| `POST` | `/api/v1/compile` | In-memory компіляція коду (`javac`) з діагностикою |
| `POST` | `/api/v1/run` | Виконання коду у захищеному процесі (Java, Python, TS/JS) |
| `POST` | `/api/v1/test/run` | Автоматизоване виконання згенерованих юніт-тестів |

---

## 📚 Документація

Детальний опис архітектури системи, UML-діаграми та математичні формули розрахунку метрик знаходяться у файлі:  
👉 **[docs/architecture.md](docs/architecture.md)**
