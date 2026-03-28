# Real-Time Match Commentary Application

A robust real-time sports commentary system built with Node.js, Express, WebSockets, and Drizzle ORM.

## Features

- **Real-Time Updates**: Match commentary and status updates via WebSockets.
- **REST API**: Secure endpoints for managing matches and commentary.
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations.
- **Security**: Integrated with Arcjet for rate limiting and security middleware.
- **Performance Monitoring**: Integrated with APM Insight.

## Tech Stack

- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Real-time**: `ws` (WebSockets)
- **Validation**: Zod
- **Security**: Arcjet

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (e.g., Neon.tech)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:bodajava/real-time-application.git
   cd real-time-application
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your credentials.
   ```bash
   cp .env.example .env
   ```

### Running the Application

- **Development Mode**:
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

### Database Management

- **Generate Migrations**:
  ```bash
  npm run db:generate
  ```

- **Run Migrations**:
  ```bash
  npm run db:migrate
  ```

- **Test Connection**:
  ```bash
  npm run db:test
  ```

## License

ISC
