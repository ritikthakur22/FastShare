# FastShare

FastShare is an ultra-fast, peer-to-peer local file and clipboard sharing application. It enables seamless file transfers across different devices and operating systems without any setup, registration, or cloud dependency. Built with simplicity and speed in mind, FastShare connects devices on the same network instantly.

## 🚀 Features

- **Blazing Fast Transfers**: Uses WebRTC for direct device-to-device file transfers.
- **Cross-Platform Compatibility**: Works on Android, iOS, Windows, macOS, and Linux through any modern web browser.
- **Clipboard Syncing**: Automatically log and share your clipboard history with connected devices on your network.
- **No Installation Required**: Run it straight from your browser.
- **Secure & Private**: Files never touch an external server; they are transferred securely via peer-to-peer encryption.

## 🛠 Setup & Installation

To run FastShare locally on your network:

```bash
# Clone the repository
git clone https://github.com/ritikthakur22/FastShare.git

# Enter the directory
cd FastShare

# Install dependencies
npm install

# Start the application
npm start
```
Once the server is running, open `http://localhost:3000` in your web browser.

## 💡 How to Use
1. Ensure both devices are connected to the same Wi-Fi network.
2. Open FastShare on both devices.
3. Tap on a device's icon to send files, or right-click (long-press on mobile) to send a direct message or clipboard text.

## 📄 License
This project is open-source and available under the GNU General Public License v3.0.
\n## 👏 Credits\nFastShare is a modified and rebranded fork of [PairDrop](https://github.com/schlagmichdoch/PairDrop), which itself is a fork of Snapdrop. Huge thanks to the original developers for building such a robust P2P WebRTC architecture.
