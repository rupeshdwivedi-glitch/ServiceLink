from fastapi import FastAPI

app = FastAPI(title="ServiceLink API")


@app.get("/")
def read_root():
    return {"message": "ServiceLink API is running"}
