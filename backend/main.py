import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.utilities import SQLDatabase
from langchain_community.llms import Ollama
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain.agents import create_sql_agent
from langchain.agents.agent_types import AgentType

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or use http://localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
AGENT = None
DB_PATH = None

@app.post("/upload_db/")
async def upload_db(file: UploadFile = File(...)):
    if not file.filename.endswith(".db"):
        return {"error": "Only .db files are allowed"}

    save_path = f"uploaded_dbs/{file.filename}"
    os.makedirs("uploaded_dbs", exist_ok=True)

    with open(save_path, "wb") as f:
        f.write(await file.read())

    global AGENT, DB_PATH
    DB_PATH = save_path
    db_uri = f"sqlite:///{DB_PATH}"
    db = SQLDatabase.from_uri(db_uri)
    llm = Ollama(model="mistral-nemo:latest", temperature=0.1)
    toolkit = SQLDatabaseToolkit(db=db, llm=llm)

    AGENT = create_sql_agent(
        llm=llm,
        toolkit=toolkit,
        agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )

    return {"message": "Database uploaded successfully"}

@app.post("/ask/")
async def ask_question(question: str = Form(...)):
    if AGENT is None:
        return {"error": "Upload a .db file first"}

    try:
        result = AGENT.run(question)
        return {"answer": result}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
