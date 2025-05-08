

# 📘 API Documentation

Welcome to the API documentation. This guide outlines all available endpoints, their purposes, and required data for interaction.

---

## 🔐 Authentication

### `GET /api/auth/google`
Initiates Google OAuth authentication.

- **Request Body**: _None_

---

### `GET /api/auth/google/callback`
Handles the callback after Google OAuth login.

- **Request Body**: _None_

---

### `POST /api/auth/signup`
Registers a new user.

- **Request Body** (JSON):
  ```json
  {
    "email": "user@example.com",
    "password": "yourPassword",
    "username": "yourUsername"
  }

---

### `POST /api/auth/login`

Logs in a user.

* **Request Body** (JSON):

  ```json
  {
    "email": "user@example.com",
    "password": "yourPassword"
  }
  ```

---

### `GET /api/auth/logout`

Logs out the authenticated user.

* **Headers**:

  * `Authorization: Bearer <token>`

---

## 📊 User Dashboard

### `GET /api/dashboard/`

Returns data relevant to the logged-in user's dashboard.

* **Headers**:

  * `Authorization: Bearer <token>`

---

## 📂 Public Content

### `GET /api/public/`

Fetches a list of publicly available stories.

* **Request Body**: *None*

---

### `GET /api/public/search`

Searches public stories.

* **Query Parameter**:

  * `query`: Search keyword (e.g., `/api/public/search?query=adventure`)

---

## ✍️ Stories

### `POST /api/stories/add`

Creates a new story.

* **Headers**:

  * `Authorization: Bearer <token>`
* **Request Body** (JSON):

  ```json
  {
    "title": "Story Title",
    "content": "The full story text...",
    "visibility": "public"
  }
  ```

---

### `GET /api/stories/byId/:id`

Fetches a specific story by ID.

* **Path Parameter**:

  * `:id`: Story ID

---

### `GET /api/stories/edit/:id`

Fetches story details for editing.

* **Path Parameter**:

  * `:id`: Story ID
* **Headers**:

  * `Authorization: Bearer <token>`

---

### `DELETE /api/stories/:id`

Deletes a story by ID.

* **Path Parameter**:

  * `:id`: Story ID
* **Headers**:

  * `Authorization: Bearer <token>`

---

### `GET /api/stories/user/:userId`

Fetches stories written by a specific user.

* **Path Parameter**:

  * `:userId`: User's ID

---

### `POST /api/stories/like/:id`

Likes a story.

* **Path Parameter**:

  * `:id`: Story ID
* **Headers**:

  * `Authorization: Bearer <token>`

---

### `POST /api/stories/dislike/:id`

Dislikes a story.

* **Path Parameter**:

  * `:id`: Story ID
* **Headers**:

  * `Authorization: Bearer <token>`

---

### `POST /api/stories/comment/:id`

Adds a comment to a story.

* **Path Parameter**:

  * `:id`: Story ID
* **Request Body** (JSON):

  ```json
  {
    "text": "This is an insightful comment!"
  }
  ```
* **Headers**:

  * `Authorization: Bearer <token>`

---

## 🧭 Miscellaneous

### `GET /api`

Returns a welcome message.

* **Request Body**: *None*

---

### `GET /api/routes`

Lists all available API endpoints.

* **Request Body**: *None*

```
