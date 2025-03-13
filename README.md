# WhatsApp Water Bot

This is a WhatsApp bot that responds with water data. It listens to messages in WhatsApp groups and processes specific commands like `!agua <value>` to send water-related information.

## Features

- Responds to commands in WhatsApp groups.
- Stores and retrieves water-related data using Firebase.
- Deployed on Vercel for easy access.

## Technologies Used

- **Node.js**: Runtime environment for JavaScript.
- **Firebase**: Cloud platform for storing and retrieving data.
- **Vercel**: Deployment platform for hosting the application.
- **WhatsApp API**: To interact with WhatsApp messages in a group.

## How to Set Up Locally

1. Clone the repository:
    ```bash
    git clone https://github.com/wmsalves/bot-whatsapp-agua.git
    ```

2. Navigate to the project directory:
    ```bash
    cd bot-whatsapp-agua
    ```

3. Install the necessary dependencies:
    ```bash
    npm install
    ```

4. Create a `.env` file in the root of the project and set your environment variables for Firebase credentials.

   Example `.env` file:
    ```plaintext
    FIREBASE_PROJECT_ID=your-project-id
    FIREBASE_PRIVATE_KEY_ID=your-private-key-id
    FIREBASE_PRIVATE_KEY="your-private-key"
    FIREBASE_CLIENT_EMAIL=your-client-email
    FIREBASE_CLIENT_X509_CERT_URL=your-cert-url
    WA_AUTH_STATE_FILE=auth
    ALLOWED_GROUP_ID=your-group-id
    ADMIN_USERS=your-admin-users
    ```

5. Run the bot locally:
    ```bash
    node index.js
    ```

## Deploying on Vercel

1. Push the project to GitHub and make sure the repository is public or private with proper access.
2. Connect your GitHub repository to [Vercel](https://vercel.com).
3. Vercel will automatically detect your project and deploy it. Follow the setup instructions on Vercel's website.

## Firebase Configuration

Make sure to set up Firebase correctly with your project and credentials in the `.env` file. You can follow the official [Firebase Admin SDK documentation](https://firebase.google.com/docs/admin/setup) for more details.

## How the Bot Works

1. The bot listens for commands in a WhatsApp group.
2. When a user types `!agua <number>`, the bot fetches information about water consumption and sends a response.
3. Firebase is used to store any necessary data, and the bot responds based on predefined logic.

## Bot Commands

### `!agua <value>`
The `!agua <value>` command allows users to record their water intake. The bot will store the value in Firebase for later retrieval and tracking.

**Usage:**
- Command: `!agua 500`
- Function: Records 500ml of water for the user.

---

### `!consumo`
The `!consumo` command allows users to check their total water intake for the current day. It retrieves the user's daily water intake data and displays the total amount of water consumed so far.

**Usage:**
- Command: `!consumo`
- Function: Displays the total amount of water the user has consumed today, based on the daily water intake data.

---

### `!diminuir`
The `!diminuir` command allows users to decrease their recorded water intake from both the daily and weekly water intake tables. This is useful for correcting mistakes or adjusting the amount of water consumed.

**Usage:**
- Command: `!diminuir`
- Function: Decreases the user's recorded water intake for both the current day and the current week.

---

### `!limpardiario`
The `!limpardiario` command allows users to clear the daily water intake table, removing all data recorded for the current day. This is useful for correcting any mistakes or clearing the day's data.

**Usage:**
- Command: `!limpardiario`
- Function: Clears all water intake data recorded for the current day.

---

### `!limparsemanal`
The `!limparsemanal` command allows users to clear the weekly water intake table, removing all data recorded for the current week. This is useful for correcting any mistakes or clearing the week's data.

**Usage:**
- Command: `!limparsemanal`
- Function: Clears all water intake data recorded for the current week.

---

### `!rankingdiario`
The `!rankingdiario` command provides a ranking of all participants based on their daily water intake. It displays a list of users sorted by the amount of water they have recorded for the current day, encouraging healthy competition and daily tracking.

**Usage:**
- Command: `!rankingdiario`
- Function: Displays a list of users and their total water intake for the current day, ranked from highest to lowest.

---

### `!rankingsemanal`
The `!rankingsemanal` command provides a ranking of all participants based on their weekly water intake. It displays a list of users sorted by the amount of water they have recorded for the current week, encouraging healthy competition and weekly tracking.

**Usage:**
- Command: `!rankingsemanal`
- Function: Displays a list of users and their total water intake for the current week, ranked from highest to lowest.


## Contributing

Feel free to fork the repository, make changes, and submit a pull request!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
