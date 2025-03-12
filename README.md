# WhatsApp Bot for Water Management

This project is a **WhatsApp bot** designed for water consumption management. Users can interact with the bot by sending commands such as `!agua 500` to log 500 liters of water consumption or other configured features.

## Features

- **Automatic response** to text commands sent through WhatsApp.
- **Deployed on Vercel** for scalable and free hosting.
- **Configurable commands** to interact with the bot, such as `!agua 500`.

## Technologies Used

- **Node.js**: JavaScript runtime environment for the server-side.
- **Express**: Framework for handling HTTP routes and API endpoints.
- **Vercel**: Hosting platform for deploying the application.
- **dotenv**: To manage environment variables like API keys and credentials.
- **git**: Version control system for source code management.

## Running Locally

### Prerequisites

- Node.js (v14 or later)
- A code editor (recommended: [VS Code](https://code.visualstudio.com/))

### Steps

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/bot-whatsapp-water.git
   ```
2. Navigate to the project directory:
   ```bash
   cd bot-whatsapp-water
   ```
3. Install the dependecies:
   ```bash
   Install the dependencies:
   ```
4. Create a .env file at the root of the project and add your environment variables (for Vercel):
   ```bash
   # .env
   VERCEL_URL=https://your-vercel-deployment-url
   ```
5. Start the server locally:
   ```bash
   npm start
   ```
The server should run locally, usually on port 3000. You can test the application via the API endpoint.

6. Use ngrok (or any other tool) to generate a public URL and configure the webhook in your Twilio account, if needed.
 Example:
   ```bash
   ngrok http 3000
   ```
## Deploying on Vercel

  1. Log in to Vercel:
  ```bash
  vercel login
  ```
  2. To deploy the application, run:
  ```bash
  vercel
  ```
  Vercel will ask you a few questions about the project, and you can accept the default settings.
  
  3. After deployment, Vercel will provide a public URL for your app. You can use this URL to configure your WhatsApp bot and webhook.
