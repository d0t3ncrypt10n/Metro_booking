# MetroGo - Metro Booking Service

🚀 **Live Demo**: [https://metro-booking-service.vercel.app](https://metro-booking-service.vercel.app)

A modern, feature-rich metro booking and network management system built with React, TypeScript, and Tailwind CSS.

**Backend API**: [https://server-omega-livid-e3sqobxnpo.vercel.app](https://server-omega-livid-e3sqobxnpo.vercel.app)

## Features

### Passenger Features
- **Journey Planning**: Search and plan routes between stations with real-time route calculation
- **Interactive Metro Map**: Zoom, pan, and explore the metro network with animated route highlighting
- **Station Details**: View station information, facilities, and interchange connections
- **Recent Searches**: Quick access to previously searched routes
- **Dark Mode**: Full dark mode support with system preference detection
- **Booking System**: Secure ticket booking with OTP authentication
- **QR Code Tickets**: Digital tickets with QR codes for easy validation

### Admin Features (Restricted Access)
- **Network Management**: Add, edit, and remove stations and lines
- **Drag & Drop Reordering**: Easily reorder stations on metro lines
- **Interchange Detection**: Automatic detection and flagging of interchange stations
- **Bulk Import/Export**: Upload network data via CSV or JSON files
- **Version Compatibility Matrix**: View upgrade paths between network versions
- **Real-time Updates**: Changes reflect immediately on the passenger map

### Technical Features
- **Data-Driven Architecture**: Single source of truth from JSON configuration
- **Dijkstra's Algorithm**: Optimal route calculation with interchange detection
- **Dynamic SVG Rendering**: Metro map generated from station coordinates
- **LocalStorage Persistence**: Network changes and user sessions saved locally
- **Responsive Design**: Mobile-first design with adaptive layouts
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: React Router v6
- **State Management**: Zustand
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library
- **Icons**: Material Symbols

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/d0t3ncrypt10n/Metro_booking.git
cd Metro_booking
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## Project Structure

```
metro-booking-service/
├── public/
│   ├── mini-metro-network.json      # Network configuration
│   ├── sample-bulk-import.json      # Sample import file
│   └── sample-bulk-import.csv       # Sample CSV import
├── src/
│   ├── components/
│   │   ├── atoms/                   # Basic UI components
│   │   ├── molecules/               # Composite components
│   │   ├── organisms/               # Complex components
│   │   └── layouts/                 # Layout components
│   ├── hooks/                       # Custom React hooks
│   ├── pages/                       # Page components
│   ├── services/                    # Business logic
│   ├── store/                       # State management
│   ├── styles/                      # Design tokens
│   ├── types/                       # TypeScript types
│   ├── utils/                       # Utility functions
│   ├── App.tsx                      # Main app component
│   └── main.tsx                     # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Authentication

### Twilio SMS/Voice Authentication
The application now uses **Twilio** for secure phone-based authentication:

- **SMS OTP**: Receive verification codes via text message
- **Voice OTP**: Get codes via automated phone call
- **JWT Tokens**: Secure session management with 7-day expiry
- **Rate Limiting**: Protection against abuse (3 OTP requests/minute)
- **Secure OTP Storage**: Cryptographically hashed with SHA-256
- **Auto-Expiry**: OTPs expire after 5 minutes

### Setup Instructions

1. **Install Backend Dependencies**:
```bash
cd server
npm install
```

2. **Configure Environment**:
The Twilio credentials are already set up in `server/.env`. For production, update the `JWT_SECRET`.

3. **Start Backend Server**:
```bash
cd server
npm run dev
```

4. **Start Frontend** (in a new terminal):
```bash
npm run dev
```

5. **Test Authentication**:
- Navigate to the login page
- Enter your name and phone number (with country code, e.g., +919876543210)
- Choose SMS or Voice delivery
- Enter the 6-digit OTP received
- You'll be logged in for 7 days

📖 **Detailed Setup Guide**: See [TWILIO_SETUP.md](./TWILIO_SETUP.md) for complete instructions.

### Admin Access
- Restricted to specific credentials:
  - **Name**: Jayant
  - **Phone**: +919472747641
- Full network management capabilities

## Network Configuration

The metro network is configured in `public/mini-metro-network.json`:

```json
{
  "lines": [
    {
      "id": "red",
      "name": "Red Line",
      "color": "#E53935",
      "stations": [
        {
          "id": "station_1",
          "name": "Station Name",
          "x": 100,
          "y": 200
        }
      ]
    }
  ]
}
```

## Key Features Explained

### Route Calculation
- Uses Dijkstra's algorithm for shortest path
- Considers distance and interchange penalties
- Automatic interchange detection
- Multiple route options with duration estimates

### Interactive Map
- Zoom in/out with mouse wheel or buttons
- Pan by dragging
- Click stations for details
- Animated route highlighting
- Real-time journey visualization

### Admin Panel
- Drag-and-drop station reordering
- Add/remove stations from lines
- Bulk import via CSV/JSON
- Export network configuration
- Version compatibility matrix
- Network statistics dashboard

### Dark Mode
- System preference detection
- Manual toggle in header
- Smooth transitions
- Persistent preference

## Testing

Run tests:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Design inspiration from modern metro systems
- Icons from Material Symbols
- Built with React and TypeScript

## Contact

Jayant - Admin & Maintainer

Project Link: [https://github.com/d0t3ncrypt10n/Metro_booking](https://github.com/d0t3ncrypt10n/Metro_booking)
