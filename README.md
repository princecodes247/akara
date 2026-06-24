# Akara

Akara is a simple release management application designed to allow sharing multiple project releases easily.


## 🛠️ Tech Stack

### Backend
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Express 5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via [Monarch ORM](https://github.com/monarch-orm/monarch-orm))
- **Auth**: Stateless JWTs mapped to database-backed user records

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons & Animation**: [Lucide React](https://lucide.dev/) & [Framer Motion](https://www.framer.com/motion/)

---

## ⚙️ Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed on your machine.
- MongoDB instance running locally (`mongodb://localhost:27017`) or a connection URI.
- A GitHub Developer Application configured for OAuth.

### Environment Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=4000
DATABASE_URL=mongodb://localhost:27017/akara_dev
JWT_SECRET=your_jwt_secret_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Installation

1. **Install Backend Dependencies**:
   ```bash
   cd backend
   bun install
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

### Running the App

Start the development servers for both modules:

**Backend**:
```bash
cd backend
bun run dev
```

**Frontend**:
```bash
cd frontend
npm run dev
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
