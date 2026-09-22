# 🚑 SERD PHP Backend for XAMPP & phpMyAdmin

This folder contains the complete, zero-dependency PHP backend for the **SERD (Smart Emergency Response & Dispatch)** system, designed to run natively on **XAMPP (Apache + MySQL / phpMyAdmin)**.

---

## 📁 File Structure

| File | Purpose |
|------|---------|
| `config.php` | Database credentials, CORS headers helper, JSON response utilities |
| `db.php` | PDO MySQL connection with auto-database creation and schema verification |
| `schema.sql` | Complete MySQL schema with sample incidents, CAD profiles, and telemetry |
| `index.php` | Master API Router (clean REST endpoints) |
| `health.php` | Health diagnostics & MySQL connection verification |
| `incidents.php` | Emergency incident dispatch, list, and status updates |
| `profile.php` | Medical CAD Pass and user emergency info synchronization |
| `broadcast.php` | Safety check-in "I AM SAFE" notifications logging |
| `telemetry.php` | Emergency apparatus (Ambulance, Fire, Police) GPS telemetry |
| `.htaccess` | Apache URL rewriting and CORS configuration |

---

## 🚀 Quick Setup in XAMPP (Under 2 Minutes)

### Step 1: Start XAMPP Services
1. Open the **XAMPP Control Panel**.
2. Click **Start** for **Apache**.
3. Click **Start** for **MySQL**.

---

### Step 2: Set Up the Database in phpMyAdmin
1. Open your browser and go to:
   ```
   http://localhost/phpmyadmin
   ```
2. Click on the **Import** tab in the top navigation bar.
3. Click **Choose File** and select `api/schema.sql` from this project.
4. Click **Import** (or **Go**) at the bottom.
5. phpMyAdmin will create the `serd_db` database and populate all tables with initial data (`incidents`, `user_profile`, `allergies`, `telemetry_units`, `safety_broadcasts`).

*(Note: `db.php` also features auto-provisioning, so it will attempt to create the database and tables automatically on first connection if MySQL is running!)*

---

### Step 3: Deploying into XAMPP `htdocs`

You can either:
- **Option A (Full project in htdocs)**: Place the entire `serd` project folder in:
  ```
  C:\xampp\htdocs\serd
  ```
  The API will be available at:
  ```
  http://localhost/serd/api/health.php
  ```
  or via clean URL:
  ```
  http://localhost/serd/api/health
  ```

- **Option B (API folder in htdocs)**: Copy the `api` folder directly to `C:\xampp\htdocs\api`:
  ```
  http://localhost/api/health.php
  ```

---

## 📡 API Endpoints

All endpoints return standard JSON responses and support CORS for seamless integration with the React app:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` or `/api/health.php` | Backend & MySQL connection health check |
| `GET` | `/api/incidents` or `/api/incidents.php` | Fetch active CAD emergency incidents |
| `POST` | `/api/incidents` or `/api/incidents.php` | Dispatch a new 911/CAD emergency incident |
| `GET` | `/api/incidents/{id}` | Fetch single incident by CAD ID |
| `PATCH` | `/api/incidents/{id}/status` | Update incident status (`en_route`, `on_scene`, etc.) |
| `POST` | `/api/contacts/broadcast-safe` | Broadcast & log "I AM SAFE" check-in |
| `GET` | `/api/profile` or `/api/profile.php` | Retrieve Medical CAD Pass & user record |
| `POST` | `/api/profile` or `/api/profile.php` | Synchronize medical details & emergency contact |
| `GET` | `/api/telemetry/units` or `/api/telemetry.php` | Get real-time emergency apparatus GPS coordinates |

---

## ⚙️ Connecting the Frontend

In the application's **Settings > Backend & CAD API**:
1. Enter your XAMPP URL in the **API Base URL Override** input, for example:
   ```
   http://localhost/serd/api
   ```
   *(or `http://localhost/api`)*
2. Click **Apply**.
3. The app will immediately test the connection to your Apache/MySQL server, showing live latency and database status!
