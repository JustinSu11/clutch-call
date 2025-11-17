# Clutch Call
Clutch Call is a student built website that uses AI to determine the best players and teams in their leagues using sports statistics.
The project is built using python and react.

# Requirements
* Python

# To run locally
Windows:
1. Install a virtual environment in the root directory
`py -m venv .venv`
2. Activate the venv
`.venv\Scripts\activate`
3. Move to backend directory
`cd backend`
4. Install requirements
`pip install -r requirements.txt`
5. Create a `.env` file in the root directory and copy the contents of `.env.dist` into your `.env` file
6. Replace the `FOOTBALL_DATA_API_KEY` with your personal api key if applicable
7. Ensure you are in the backend directory. If not `cd backend`
8. Run `python run_server.py` to start the backend server
9. Open a new terminal and move to the frontend directory `cd frontend`
10. Run `npm i` to install all frontend packages
11. Run `npm run dev` to start the frontend server
12. Go to `http://localhost:3000/` to view the app
13. When finished, remember to shut down both the frontend and backend servers using `Ctrl + C`


### Automatic NBA ML Model Training
The NBA machine learning models are now fully automated:
- **Automatic Training on Startup**: Models are automatically trained when the server starts if they don't exist
- **Scheduled Retraining**: Models are automatically retrained every night at 4:00 AM Central Time (CT/CDT/CST)
- **Zero Configuration**: No manual intervention needed - the system handles everything

See [backend/NBA_ML_AUTO_TRAINING.md](backend/NBA_ML_AUTO_TRAINING.md) for detailed documentation.
