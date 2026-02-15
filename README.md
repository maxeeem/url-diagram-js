# AI PlantUML Generator (JS Version)

This project is a JavaScript port of the original Python Flask application, designed for deployment on Netlify.

## Prerequisites

- Node.js (v18 or later)
- Netlify CLI (optional, for local development)

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Create a `.env` file in the root directory and add your OpenAI API key and optional access code:
    ```env
    OPENAI_API_KEY=your_openai_api_key
    ACCESS_CODE=optional_access_code
    ```

## Local Development

To run the project locally using Netlify Dev:

```bash
npm start
```

This will start a local server at `http://localhost:8888`.

## Deployment to Netlify

1.  Push the code to a GitHub repository.
2.  Connect the repository to Netlify.
3.  Set the environment variables (`OPENAI_API_KEY`, `ACCESS_CODE`) in the Netlify dashboard.
4.  Deploy!

## Project Structure

- `public/`: Static frontend files (HTML, CSS, JS).
- `netlify/functions/`: Serverless functions for backend logic.
- `netlify.toml`: Netlify configuration file.
