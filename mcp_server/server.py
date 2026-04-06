from fastapi import FastAPI
from pydantic import BaseModel
import subprocess

app = FastAPI()

class CodeRequest(BaseModel):
    code: str

@app.get("/")
def read_root():
    return {"message": "PyMastery MCP Server Running"}

@app.post("/run")
def run_code(req: CodeRequest):
    try:
        result = subprocess.run(
            ["python3", "-c", req.code],
            capture_output=True,
            text=True,
            timeout=2
        )
        return {"output": result.stdout, "error": result.stderr}
    except subprocess.TimeoutExpired:
        return {"error": "Execution Timeout"}
