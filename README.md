# FreePOS

FreePOS is a Node.js and MongoDB-based point-of-sale application developed by Ujjal Bhattacharya in 2026.
It is a modern, lightweight POS platform built using Express, EJS templates, and MongoDB, designed for managing customers, inventory, sales, receivings, suppliers, employees, gift cards, expenses, and reporting.

## Key Features

- User authentication and role-based access control
- Customer, item, and supplier management
- Sales register, invoices, and receipts
- Receiving module for stock acquisition
- Employee and permissions management
- Gift card support
- Expense tracking and expense categories
- Configurable application settings and theming
- Server-rendered views with EJS templates

## Requirements

- Node.js 18+ (or a compatible modern Node.js runtime)
- npm
- MongoDB 6+ (local or hosted)

## Installation

1. Clone or copy the repository to your local machine.
2. Open a terminal in the project root folder.
3. Install dependencies:

```bash
npm install
```

## Configuration

FreePOS reads environment variables from your shell or a `.env` file via `dotenv`.
The following values are supported:

- `PORT` - HTTP port to listen on (default: `3000`)
- `MONGO_URI` - MongoDB connection string (default: `mongodb://localhost:27017/freepos`)
- `SESSION_SECRET` - Session encryption secret (default: `freepos_secret_key_123456`)
- `NODE_ENV` - Application environment (default: `development`)

Example `.env` file:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/freepos
SESSION_SECRET=your_very_secure_secret
NODE_ENV=production
```

## Running the App

Start the application in production mode:

```bash
npm start
```

Start the application in development mode with file watching:

```bash
npm run dev
```

After startup, open your browser at:

```
http://localhost:3000
```

## Database Seed and Default Access

On first startup, FreePOS seeds default configuration and an admin user.

Default admin credentials:

- Username: `admin`
- Password: `admin`

The seeded default company name is `FreePOS`.

## Project Structure

- `server.js` — application entrypoint and route configuration
- `config/` — database connector and seeder logic
- `controllers/` — business logic for each feature area
- `models/` — Mongoose schemas and data models
- `routes/` — HTTP route handlers for application pages
- `views/` — EJS templates for server-side rendering
- `public/` — static assets and uploads

## Dependencies

- `express` — web framework
- `ejs` — server-side templating
- `mongoose` — MongoDB object modeling
- `express-session` — session management
- `connect-mongo` — MongoDB session store
- `bcryptjs` — password hashing
- `multer` — file upload handling
- `dotenv` — environment variable loading

## Notes

- If you change the MongoDB database name, update `MONGO_URI` accordingly.
- Ensure MongoDB is running before starting the application.
- For production, use a strong `SESSION_SECRET` and secure MongoDB access.

## Author

Developed by Ujjal Bhattacharya, 2026.
