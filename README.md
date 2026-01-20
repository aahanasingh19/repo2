# One-cart(MERN, Docker,Docker-compose, Nginx, Rabbitmq) Deployed on aws EC2
# 🛒 One_Cart

### Speech-Powered E-Commerce Platform

A modern, full-featured e-commerce website with hands-free navigation powered by voice commands. One_Cart demonstrates the future of accessible online shopping by integrating the Web Speech API to create a seamless, inclusive user experience.


---

## 🌟 Features

### 🎤 Voice Navigation
- **Hands-Free Shopping**: Navigate the entire platform using voice commands
- **Accessibility First**: Designed to make online shopping accessible to everyone

### 🛍️ E-Commerce Functionality
- Complete product catalog with categories and collections
- Shopping cart management
- Secure checkout process
- Order tracking and history
- User authentication and profiles

### 👨‍💼 Admin Panel
- Product management (Add, Edit, Delete)
- Order management and fulfillment
- User management
- Analytics and reporting dashboard
- Inventory tracking

### 🎨 Modern UI/UX
- Responsive design for all devices
- Clean and intuitive interface
- Fast loading times
- Smooth animations and transitions

---

## 🎯 Voice Commands Examples

Get started with these voice commands:

- `"Open cart"` - View your shopping cart
- `"Open collections"` - Browse product collections
- `"Open search"` - Open search bar
- `"Open Orders"` -  Open orders page
- `"Close search"` - Close search bar
- `"View orders"` - See your order history

*More commands available in the app!*

---

## 🚀 Getting Started
## 🐳 Docker Setup (Recommended)

One_Cart is fully **Dockerized**, allowing you to run the entire application (Frontend, Backend, Admin Panel, and Database) with a single command.

---

### 📦 Prerequisites

Make sure you have the following installed:

- Docker (v20 or higher)
- Docker Compose (v2 or higher)

Check installation:
```bash
docker --version
docker compose version
```

### Installation

1. **Navigate to the repository folder**
   ```bash
   cd One_Cart
   ```



3. **Set up environment variables**
   ```bash
   cd frontend
   cp .env.example .env
  
   ```
   Edit `.env` and add your configuration:
   ```
   VITE_FIREBASE_APIKEY=FIREBASE_API_KEY
   VITE_RAZORPAY_KEY_ID=RAZORPAY_KEY_ID
   ```

  cd backend


  Edit `.env` and add your configuration:
  ```
  PORT = 8000
  MONGODB_URL= MONGODB_ATLAS_URL
  JWT_SECRET=JWT_SECRET
  ADMIN_EMAIL=ADMIN_EMAIL
  ADMIN_PASSWORD=ADMIN_PASSWORD
  CLOUDINARY_NAME=CLOUDINARY_NAME
  CLOUDINARY_APIKEY=CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET
  RAZORPAY_KEY_SECRET=RAZORPAY_KEY_SECRET
  RAZORPAY_KEY_ID=RAZORPAY_KEY_ID
  RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=EMAIL_ID
  EMAIL_PASS=MAIL_APP_PASSWORD

   ```

5. **Build and start all services**
   ```
   docker compose up --build
   ```

6. **Run in detached mode(optional)**
   ```
   docker compose up -d
   ```

7. **Access the application**
   
   - Frontend: `http://localhost`
   - Admin Panel: `http://localhost/admin`
   - Backend API: `http://localhost/api/`

---

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Web Speech API** - Voice recognition

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **Rabbitmq** - Asynchronous email processing

### Additional Tools
- **Razorpay** - Payment processing
- **Cloudinary** - Image management
- **Context API** - State management

---

## 📁 Project Structure

```
One_Cart/
├── frontend/                 # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── services/      # API services
│   ├── public/            # Static assets
    └── Dockerfile         # Docker file
├── admin/                 # Admin Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── services/      # API services
│   ├── public/            # Static assets
│    └── Dockerfile         # Docker file
├── backend/                # Backend application
│   ├── controllers/       # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── Dockerfile         # Docker file
│   └── config/            # Configuration files
├── nginx/
│   └── default.conf
└── README.md             # Documentation
└── docker-compose.yaml    #docker-compose


```

---

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

If you have any questions or need help, please contact the maintainer.

---

## ⭐ Show your support

Give a ⭐️ if this project helped you or if you find it interesting!

---

<p align="center">Made with ❤️ for accessible e-commerce</p>
