# app/server.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app",    # ← same package-qualified path
                host="0.0.0.0",
                port=8000,
                log_level="debug",
                reload=True)