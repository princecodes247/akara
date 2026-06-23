# Akara

Akara is a secure, premium release management application designed to handle private GitHub repository releases and promote them to public target repositories with infinite scale and zero hosting bandwidth costs.

## 🚀 Key Features

- **GitHub Release Promotion (Route B)**: Toggling a release to **Public** automatically copies metadata and streams release assets from a private source repository directly to a public target repository on GitHub. The server streams the bytes on the fly, avoiding local disk storage completely.
- **Auto-Demotion Sync**: Marking a release as **Draft** instantly deletes the published release from the target repository, unpublishing it.
- **Secure Token Architecture**: Replaces client-side/session storage of sensitive GitHub access tokens. Instead, tokens are stored securely in a central `users` collection in MongoDB, completely removed from stateless JWT payloads, and dynamically resolved on the server-side context at runtime.
- **Monarch ORM Integration**: Uses Monarch ORM to manage type-safe schemas and coordinate relations between users, projects, and release mappings.
- **Modern Monorepo Layout**: Unified monorepo structure containing both the Express/Bun backend and Next.js/React frontend with preserved Git histories.

---

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

## 🗄️ Database Schemas

Akara manages data relations using three main schemas defined in `backend/src/db.ts`:

### 1. User Schema (`users`)
Stores authenticated user records and dynamically retrieved GitHub OAuth tokens.
```typescript
const userSchema = createSchema("users", {
  githubId: string(),     // Numeric GitHub ID stored as string
  username: string(),     // GitHub Username
  githubToken: string(),  // Active OAuth access token
});
```

### 2. Project Schema (`projects`)
Represents projects linking source repositories to a target public release repository.
```typescript
const projectSchema = createSchema("projects", {
  name: string(),
  sourceRepos: array(string()),
  targetRepo: string().nullable(),
  userId: objectId().optional(), // Linked project owner
});
```

### 3. Release Mapping Schema (`releaseMappings`)
Tracks the status and target replication IDs of individual project releases.
```typescript
const releaseMappingSchema = createSchema("releaseMappings", {
  projectId: objectId(),
  sourceReleaseId: string(),
  targetReleaseId: string().nullable(),
  status: literal("draft", "public").default("draft"),
  isCurrent: boolean().default(false),
  releaseData: mixed().optional(),
});
```

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
