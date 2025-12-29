from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random

app = FastAPI()

# Permite que o Frontend converse com o Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class Transaction(BaseModel):
    id: Optional[int] = None
    description: str
    amount: float
    type: str
    category: str
    date: str
    bank: Optional[str] = "Outros"

class Goal(BaseModel):
    id: Optional[int] = None
    name: str
    target_amount: float
    current_amount: float
    deadline: str
    priority: str

# --- DADOS MOCKADOS (Exemplo para o site não abrir vazio) ---
transactions = [
    {"id": 1, "description": "Salário Mensal", "amount": 8500.00, "type": "income", "category": "Salário", "date": "2023-10-01", "bank": "Itaú"},
    {"id": 2, "description": "Supermercado Extra", "amount": 850.45, "type": "expense", "category": "Alimentação", "date": "2023-10-05", "bank": "Nubank"},
    {"id": 3, "description": "Uber Viagem", "amount": 45.90, "type": "expense", "category": "Transporte", "date": "2023-10-06", "bank": "Nubank"},
]

stocks = [
    {"symbol": "PETR4", "quantity": 100, "price": 32.50, "date": "2023-01-15", "asset_type": "br_stock"},
    {"symbol": "VALE3", "quantity": 200, "price": 68.00, "date": "2023-03-10", "asset_type": "br_stock"},
    {"symbol": "AAPL", "quantity": 10, "price": 175.00, "date": "2023-05-05", "asset_type": "us_stock"},
    {"symbol": "BTC", "quantity": 0.5, "price": 150000.00, "date": "2023-06-01", "asset_type": "crypto"},
]

goals = [
    {"id": 1, "name": "Reserva de Emergência", "target_amount": 50000.00, "current_amount": 15000.00, "deadline": "2025-12-01", "priority": "Alta"},
    {"id": 2, "name": "Viagem Férias", "target_amount": 10000.00, "current_amount": 2500.00, "deadline": "2024-07-01", "priority": "Média"},
]

# --- ENDPOINTS ---

@app.get("/api/transactions")
def get_transactions():
    return transactions

@app.post("/api/transactions")
def create_transaction(tx: Transaction):
    tx.id = len(transactions) + 1
    transactions.append(tx.dict())
    return tx

@app.get("/api/dashboard/summary")
def get_summary():
    income = sum(t['amount'] for t in transactions if t['type'] == 'income')
    expense = sum(t['amount'] for t in transactions if t['type'] == 'expense')
    return {"total_balance": income - expense, "income": income, "expense": expense}

@app.get("/api/stocks")
def get_stocks():
    return stocks

@app.get("/api/stocks/grouped")
def get_grouped_stocks():
    grouped = {}
    for s in stocks:
        sym = s['symbol']
        if sym not in grouped:
            grouped[sym] = {
                "symbol": sym, 
                "quantity": 0, 
                "total_invested": 0.0, 
                "asset_type": s['asset_type'],
                "current_price": s['price'] 
            }
        grouped[sym]["quantity"] += s['quantity']
        grouped[sym]["total_invested"] += (s['quantity'] * s['price'])
    
    result = []
    for sym, data in grouped.items():
        avg_price = data["total_invested"] / data["quantity"] if data["quantity"] > 0 else 0
        data["average_price"] = avg_price
        result.append(data)
    return result

@app.get("/api/stocks/performance")
def get_stock_performance():
    return {
        "labels": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
        "portfolio": [1.2, 2.5, 1.8, 3.2, 4.0, 5.1], 
        "cdi": [0.8, 1.9, 2.9, 3.8, 4.8, 5.8] 
    }

@app.get("/api/goals")
def get_goals():
    return goals

@app.post("/api/goals")
def create_goal(goal: Goal):
    new_goal = goal.dict()
    new_goal["id"] = len(goals) + 1
    new_goal["current_amount"] = 0
    goals.append(new_goal)
    return new_goal
