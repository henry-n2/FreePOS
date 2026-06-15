<div align="center">
  <img src="public\FreePOS2.png" alt="FreePOS Logo" width="150" height="150">
  
  # FreePOS
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6+-green?style=flat-square&logo=mongodb)](https://www.mongodb.com)
  [![Express](https://img.shields.io/badge/Express-4.x-black?style=flat-square&logo=express)](https://expressjs.com)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
  
  A modern, lightweight **Point-of-Sale (POS)** platform built with Node.js, Express, and MongoDB
  
  [Live Demo](#) • [Documentation](#documentation) • [Installation](#installation) • [Report Bug](../../issues) • [Request Feature](../../issues)
</div>

---

## 📋 Overview

FreePOS is a Node.js and MongoDB-based point-of-sale application developed by Ujjal Bhattacharya in 2026. It is a modern, lightweight POS platform built using Express, EJS templates, and MongoDB, designed for managing customers, inventory, sales, receivings, suppliers, employees, gift cards, expenses, and reporting.

Perfect for small to medium-sized retail businesses looking for a customizable, self-hosted POS solution.

## ✨ Key Features

✨ Key Features

- 🔐 **User Authentication** - Role-based access control with secure authentication
- 👥 **Customer Management** - Manage customer profiles and transaction history
- 📦 **Inventory Management** - Track items, suppliers, and stock locations
- 💳 **Sales & Invoicing** - Complete sales register with invoices and receipts
- 📥 **Receiving Module** - Streamlined stock acquisition and tracking
- 👔 **Employee Management** - Employee profiles with granular permissions
- 🎁 **Gift Cards** - Built-in gift card support
- 📊 **Expense Tracking** - Monitor expenses and categories
- 🎨 **Theming & Customization** - Configurable application settings
- 📱 **Responsive UI** - Server-rendered views with Bootstrap styling

## 📋 Requirements

📋 Requirements

- **Node.js** 18+ (or a compatible modern Node.js runtime)
- **npm** (Node Package Manager)
- **MongoDB** 6+ (local or hosted)

## 🚀 Quick Start

### Installation

1. Clone or copy the repository to your local machine:
```bash
git clone https://github.com/yourusername/freepos.git
cd freepos
```

2. Install dependencies:
```bash
npm install
```

## ⚙️ Configuration

⚙️ Configuration

FreePOS reads environment variables from your shell or a `.env` file via `dotenv`.

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/freepos
SESSION_SECRET=your_very_secure_secret
NODE_ENV=production
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port to listen on |
| `MONGO_URI` | `mongodb://localhost:27017/freepos` | MongoDB connection string |
| `SESSION_SECRET` | `freepos_secret_key_123456` | Session encryption secret |
| `NODE_ENV` | `development` | Application environment |

## ▶️ Running the App

### Production Mode
```bash
npm start
```

### Development Mode (with file watching)
```bash
npm run dev
```

After startup, open your browser at:
```
http://localhost:3000
```

### Default Admin Credentials

On first startup, FreePOS seeds a default admin user:

- **Username:** `admin`
- **Password:** `admin`  
- **Default Company:** `FreePOS`

⚠️ **Important:** Change these credentials after your first login!

## 📁 Project Structure

```
freepos/
├── server.js                 # Application entrypoint
├── config/
│   ├── db.js                # MongoDB connector
│   └── seeder.js            # Database seeding logic
├── controllers/             # Business logic
│   ├── customerController.js
│   ├── itemController.js
│   ├── saleController.js
│   └── ...
├── models/                  # Mongoose schemas
│   ├── Customer.js
│   ├── Item.js
│   ├── Sale.js
│   └── ...
├── routes/                  # Route handlers
│   ├── customers.js
│   ├── items.js
│   ├── sales.js
│   └── ...
├── views/                   # EJS templates
│   ├── partial/
│   ├── customers/
│   ├── sales/
│   └── ...
└── public/                  # Static assets
    ├── images/
    └── uploads/
```

## 📦 Dependencies

📦 Dependencies

- `express` — Web framework for Node.js
- `ejs` — Server-side templating engine
- `mongoose` — MongoDB object modeling
- `express-session` — Session management middleware
- `connect-mongo` — MongoDB session store
- `bcryptjs` — Password hashing and encryption
- `multer` — File upload handling
- `dotenv` — Environment variable loading

## 📝 Usage Guide

### Creating a Sale

1. Navigate to **Sales Register**
2. Add items from inventory
3. Apply discounts if needed
4. Select payment type
5. Print or email receipt

### Managing Inventory

1. Go to **Items Management**
2. Add new items with pricing and images
3. Track stock levels and locations
4. Set up Item Kits for bundle sales

### Employee Permissions

Assign granular permissions to employees:
- Customer Management
- Item Management
- Sales Operations
- Reporting & Analytics
- Settings Access

## 🔒 Security Notes

- ✅ Passwords are hashed using bcryptjs
- ✅ Sessions are encrypted with a secure secret
- ✅ Role-based access control (RBAC)
- ✅ CSRF protection available
- ⚠️ Always use a strong `SESSION_SECRET` in production
- ⚠️ Ensure MongoDB is behind a firewall
- ⚠️ Use HTTPS in production environments

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:** Ensure MongoDB is running and `MONGO_URI` is correct.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Change the `PORT` variable or kill the process using port 3000.

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution:** Run `npm install` to install all dependencies.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For support, email or open an issue on GitHub.

## 👨‍💻 Author

**Ujjal Bhattacharya**  
Developed in 2026

---

<div align="center">
  Made with ❤️ for retail businesses everywhere
</div>
