from fastapi import FastAPI

from app.routes.analytics import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="RetailPulse API",
    description="Retail analytics and decision intelligence API",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router)


@app.get("/")
def root():
    return {
        "service": "RetailPulse API",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}