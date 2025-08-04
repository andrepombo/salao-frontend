# Salão Frontend

A modern React frontend application built with Vite for the Salão beauty salon management system. This application connects to a Django REST API backend to provide a complete salon booking and management experience.

## 🚀 Features

- **Modern UI**: Built with React 18 and Vite for fast development and optimal performance
- **Backend Integration**: Seamless connection to Django REST API backend
- **Responsive Design**: Mobile-first design with beautiful gradients and animations
- **API Service**: Centralized API service with axios for HTTP requests
- **Error Handling**: Comprehensive error handling and user feedback
- **Real-time Status**: Live backend connection status monitoring

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 5.x
- **HTTP Client**: Axios
- **Styling**: CSS3 with modern features (gradients, backdrop-filter, animations)
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Django backend running on `http://localhost:8000`

## 🚀 Getting Started

### Installation

```bash
# Clone the repository (if not already done)
git clone https://github.com/andrepombo/salao-frontend.git
cd salao-frontend

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:5173
```

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 🔧 Configuration

### Backend Connection

The frontend is configured to connect to the Django backend at `http://localhost:8000`. This can be modified in `/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000';
```

### CORS Configuration

The Django backend is already configured to accept requests from the Vite development server (`localhost:5173`). No additional CORS configuration is needed.

## 📁 Project Structure

```
salao-frontend/
├── public/                 # Static assets
├── src/
│   ├── services/
│   │   └── api.js         # API service and axios configuration
│   ├── App.jsx            # Main application component
│   ├── App.css            # Application styles
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## 🌐 API Integration

### API Service

The application includes a centralized API service (`/src/services/api.js`) that provides:

- **Base Configuration**: Axios instance with default settings
- **Authentication**: Token-based authentication support
- **Error Handling**: Automatic error handling and token refresh
- **Request/Response Interceptors**: For adding auth headers and handling common errors

## 🚨 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure Django backend is running on `http://localhost:8000`
   - Check that the health endpoint `/api/health/` is accessible
   - Verify CORS configuration in Django settings

2. **Vite Build Issues**
   - This project uses Vite 5.x for Node.js 18 compatibility
   - If you encounter crypto.hash errors, ensure you're using the correct Vite version

3. **CORS Errors**
   - The Django backend should include `localhost:5173` in `CORS_ALLOWED_ORIGINS`
   - Check that `django-cors-headers` is installed and configured

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

