# Smart-Contract-Displayer
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Web3.js](https://img.shields.io/badge/web3.js-F16822?style=flat&logo=web3.js&logoColor=white)](https://web3js.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Dotenv](https://img.shields.io/badge/dotenv-E6A117?style=flat&logo=dotenv&logoColor=white)](https://www.npmjs.com/package/dotenv)

![Project GIF](https://github.com/Arthur-001/Smart-Contract-Displayer/blob/main/assets/Gifs/smartContAnalyzer.gif)

## Project Overview

The **Smart-Contract-Displayer** is an open-source project designed to provide comprehensive information about a given smart contract. It consists of a robust backend server and an intuitive frontend interface, working together to retrieve and display crucial details, functions, and events associated with a smart contract on the blockchain.

This tool aims to simplify the process of inspecting and understanding smart contracts, making blockchain interactions more transparent and accessible for developers, auditors, and enthusiasts.

## Features

* **Smart Contract Information Display:** Presents key details of a smart contract.
* **Server-Side Logic:** Handles requests and interacts with the blockchain.
* **User-Friendly Frontend:** Provides a clear and interactive interface for users.
* **Open Source:** Encourages community contributions and further development.

## Technologies Used

This project leverages the following core technologies and libraries:

* **Web3.js:** A collection of libraries that allow you to interact with a local or remote Ethereum node using HTTP, IPC, or WebSocket. It's crucial for blockchain interaction.
* **Express.js:** A fast, unopinionated, minimalist web framework for Node.js, used for building the server-side API.
* **Dotenv:** A zero-dependency module that loads environment variables from a `.env` file into `process.env`, ensuring secure handling of sensitive information like API keys.

## Getting Started

To set up and run this project locally, follow these steps:

### Prerequisites

* Node.js (LTS version recommended)
* npm (Node Package Manager) or Yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Arthur-001/Smart-Contract-Displayer.git](https://github.com/Arthur-001/Smart-Contract-Displayer.git)
    cd Smart-Contract-Displayer
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    npm run dev 
    ```

### Configuration

Create a `.env` file in your main project directory and add necessary environment variables, such as your blockchain RPC URL.