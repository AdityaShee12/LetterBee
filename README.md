# LetterBee

LetterBee is a full-stack MERN-based real-time communication web application designed with a strong focus on security, scalability, and modern user experience. The platform enables users to communicate securely in real time, track user presence, share status updates, receive notifications, and make video calls within a fully responsive interface.

---

## Project Features

- Real-time messaging using WebSocket
- Online and offline user presence indicator
- Persistent chat history (users can view previous messages)
- End-to-End Encryption using AES with crypto
- Secure authentication using JWT
- Status upload and status viewing
- Media upload and storage using Cloudinary
- Clean and scalable RESTful API architecture
- Responsive design for mobile, tablet, and desktop devices

---

## Feature Status

| Feature | Status |
|-------|--------|
| Real-time messaging (WebSocket) | Completed |
| Online and offline user presence | Completed |
| Persistent chat history | Completed |
| AES End-to-End Encryption | Completed |
| JWT-based authentication | Completed |
| Media upload using Cloudinary | Completed |
| Google OAuth authentication | In Progress |
| Video calling using WebRTC | In Progress |
| Notification system | Planned |
| Group chat functionality | Planned |
| Responsive for tab, mobile | Planned |

---

## Tech Stack

### Frontend
- React.js
- React Router
- Redux Toolkit
- Tailwind CSS
- Crypto module for AES encryption

### Backend
- Node.js
- Express.js
- RESTful APIs
- JWT Authentication
- Crypto module for AES encryption

### Database
- MongoDB

### Real-Time and Media
- WebSocket for real-time messaging and presence
- WebRTC for video calling (in development)
- Cloudinary for media storage

### Authentication and Security
- JWT for secure authentication
- Google OAuth (in development)
- AES-based End-to-End Encryption

---

## System Architecture

Client (React with Redux)
communicates via REST APIs and WebSocket
with Server (Node.js and Express)
which interacts with MongoDB
and integrates Cloudinary, Google OAuth, and WebRTC services.

---

## Roadmap

### Phase 1 Completed
- One-to-one real-time chat system
- Online and offline user presence
- Encrypted messaging using AES
- Chat history persistence
- Media upload support
- Fully responsive user interface

### Phase 2 In Progress
- Google OAuth authentication
- One-to-one video calling using WebRTC
- Real-time notification system

### Phase 3 Planned
- Group chat
- Message reactions
- Push notifications
- Mobile application support

---

## Installation and Setup

### Step 1 Clone the Repository
git clone https://github.com/AdityaShee12/Chat_Book.git
cd Chat_Book

### Step 2 Backend Setup
cd Chat_Backend
npm install

Create a .env file inside the Chat_Backend folder and add the following:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CRYPTO_SECRET=your_aes_secret_key
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

Run the backend server:
npm run dev

---

### Step 3 Frontend Setup
cd Chat_Frontend
npm install
npm start

---

## Usage

- Register or log in using email and password
- Securely send and receive encrypted messages
- View online and offline users in real time
- Access previous chat history
- Upload and view user status updates
- Make video calls when the feature is enabled
- Use the application seamlessly across all devices

---

## Security Highlights

- JWT-based authentication
- AES End-to-End Encryption for messages
- Secure RESTful API design
- OAuth-based authentication under development

---

## Author

Aditya Shee  
GitHub: https://github.com/AdityaShee12

---

## License

This project is licensed under the MIT License.
