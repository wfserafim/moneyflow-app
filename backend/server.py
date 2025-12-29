from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # "income" or "expense"
    icon: str = "📁"
    color: str = "#6B7280"

class CategoryCreate(BaseModel):
    name: str
    type: str
    icon: Optional[str] = "📁"
    color: Optional[str] = "#6B7280"

class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # "bank", "cash", "credit_card"
    balance: float = 0.0
    currency: str = "BRL"
    # Campos para cartão de crédito
    credit_limit: Optional[float] = 0.0
    due_day: Optional[int] = 10  # Dia do vencimento (1-31)
    closing_day: Optional[int] = 5  # Dia do fechamento (1-31)
    current_invoice: Optional[float] = 0.0
    # Banco
    bank_name: Optional[str] = "Outro"
    bank_icon: Optional[str] = "bank"

class AccountCreate(BaseModel):
    name: str
    type: str
    balance: Optional[float] = 0.0
    currency: Optional[str] = "BRL"
    credit_limit: Optional[float] = 0.0
    due_day: Optional[int] = 10
    closing_day: Optional[int] = 5
    current_invoice: Optional[float] = 0.0
    bank_name: Optional[str] = "Outro"
    bank_icon: Optional[str] = "bank"

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    amount: float
    type: str  # "income" or "expense"
    category_id: str
    account_id: str
    date: str
    payment_method: Optional[str] = "cash"
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: str
    category_id: str
    account_id: str
    date: str
    payment_method: Optional[str] = "cash"
    tags: Optional[List[str]] = []

class StockHolding(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str  # PETR4, AAPL, BTC, etc
    quantity: float  # Changed to float for crypto decimals
    purchase_price: float
    purchase_date: str
    asset_type: str = "br_stock"  # br_stock, us_stock, crypto
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockCreate(BaseModel):
    symbol: str
    quantity: float
    purchase_price: float
    purchase_date: str
    asset_type: Optional[str] = "br_stock"

class AIExtractRequest(BaseModel):
    text: str

class AIExtractResponse(BaseModel):
    items: List[dict]

# ============ CATEGORIES API ============

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    cat_obj = Category(**category.model_dump())
    doc = cat_obj.model_dump()
    doc['created_at'] = doc.get('created_at', datetime.now(timezone.utc)).isoformat()
    await db.categories.insert_one(doc)
    return cat_obj

@api_router.post("/categories/seed")
async def seed_categories():
    """Seed default categories"""
    # Check if already seeded
    count = await db.categories.count_documents({})
    if count > 0:
        return {"message": "Categories already exist", "count": count}
    
    default_categories = [
        # Despesas
        {"id": str(uuid.uuid4()), "name": "Alimentação", "type": "expense", "icon": "🍔", "color": "#EF4444"},
        {"id": str(uuid.uuid4()), "name": "Transporte", "type": "expense", "icon": "🚗", "color": "#F59E0B"},
        {"id": str(uuid.uuid4()), "name": "Moradia", "type": "expense", "icon": "🏠", "color": "#10B981"},
        {"id": str(uuid.uuid4()), "name": "Saúde", "type": "expense", "icon": "💊", "color": "#06B6D4"},
        {"id": str(uuid.uuid4()), "name": "Educação", "type": "expense", "icon": "📚", "color": "#8B5CF6"},
        {"id": str(uuid.uuid4()), "name": "Lazer", "type": "expense", "icon": "🎮", "color": "#EC4899"},
        {"id": str(uuid.uuid4()), "name": "Compras", "type": "expense", "icon": "🛍️", "color": "#F97316"},
        {"id": str(uuid.uuid4()), "name": "Outros", "type": "expense", "icon": "📦", "color": "#6B7280"},
        # Receitas
        {"id": str(uuid.uuid4()), "name": "Salário", "type": "income", "icon": "💰", "color": "#10B981"},
        {"id": str(uuid.uuid4()), "name": "Freelance", "type": "income", "icon": "💼", "color": "#3B82F6"},
        {"id": str(uuid.uuid4()), "name": "Investimentos", "type": "income", "icon": "📈", "color": "#8B5CF6"},
        {"id": str(uuid.uuid4()), "name": "Outros", "type": "income", "icon": "💵", "color": "#10B981"},
    ]
    
    await db.categories.insert_many(default_categories)
    return {"message": "Categories seeded successfully", "count": len(default_categories)}

# ============ ACCOUNTS API ============

@api_router.get("/accounts", response_model=List[Account])
async def get_accounts():
    accounts = await db.accounts.find({}, {"_id": 0}).to_list(1000)
    return accounts

@api_router.post("/accounts", response_model=Account)
async def create_account(account: AccountCreate):
    acc_obj = Account(**account.model_dump())
    doc = acc_obj.model_dump()
    await db.accounts.insert_one(doc)
    return acc_obj

@api_router.put("/accounts/{account_id}")
async def update_account(account_id: str, account: AccountCreate):
    result = await db.accounts.update_one(
        {"id": account_id},
        {"$set": account.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account updated"}

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str):
    result = await db.accounts.delete_one({"id": account_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted"}

# ============ TRANSACTIONS API ============

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(type: Optional[str] = None, category_id: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    if category_id:
        query["category_id"] = category_id
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for txn in transactions:
        if isinstance(txn.get('created_at'), str):
            txn['created_at'] = datetime.fromisoformat(txn['created_at'])
    
    return transactions

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate):
    txn_obj = Transaction(**transaction.model_dump())
    doc = txn_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.transactions.insert_one(doc)
    
    # Update account balance
    account = await db.accounts.find_one({"id": transaction.account_id})
    if account:
        if transaction.type == "income":
            new_balance = account['balance'] + transaction.amount
        else:
            new_balance = account['balance'] - transaction.amount
        await db.accounts.update_one(
            {"id": transaction.account_id},
            {"$set": {"balance": new_balance}}
        )
    
    return txn_obj

@api_router.put("/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, transaction: TransactionCreate):
    """Update an existing transaction"""
    # Get old transaction to revert balance
    old_txn = await db.transactions.find_one({"id": transaction_id})
    if not old_txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Revert old transaction from account balance
    old_account = await db.accounts.find_one({"id": old_txn['account_id']})
    if old_account:
        if old_txn['type'] == "income":
            reverted_balance = old_account['balance'] - old_txn['amount']
        else:
            reverted_balance = old_account['balance'] + old_txn['amount']
        await db.accounts.update_one(
            {"id": old_txn['account_id']},
            {"$set": {"balance": reverted_balance}}
        )
    
    # Apply new transaction to account balance
    new_account = await db.accounts.find_one({"id": transaction.account_id})
    if new_account:
        if transaction.type == "income":
            new_balance = new_account['balance'] + transaction.amount
        else:
            new_balance = new_account['balance'] - transaction.amount
        await db.accounts.update_one(
            {"id": transaction.account_id},
            {"$set": {"balance": new_balance}}
        )
    
    # Update transaction
    update_data = transaction.model_dump()
    update_data['created_at'] = old_txn.get('created_at', datetime.now(timezone.utc).isoformat())
    
    result = await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {"message": "Transaction updated", "id": transaction_id}

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    # Get transaction to revert balance
    txn = await db.transactions.find_one({"id": transaction_id})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Revert account balance
    account = await db.accounts.find_one({"id": txn['account_id']})
    if account:
        if txn['type'] == "income":
            new_balance = account['balance'] - txn['amount']
        else:
            new_balance = account['balance'] + txn['amount']
        await db.accounts.update_one(
            {"id": txn['account_id']},
            {"$set": {"balance": new_balance}}
        )
    
    result = await db.transactions.delete_one({"id": transaction_id})
    return {"message": "Transaction deleted"}

# ============ DASHBOARD API ============

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(month: Optional[str] = None):
    """Get summary for dashboard"""
    query = {}
    if month:
        # Filter by month (format: YYYY-MM)
        query["date"] = {"$regex": f"^{month}"}
    
    all_transactions = await db.transactions.find(query, {"_id": 0}).to_list(10000)
    
    total_income = sum(t['amount'] for t in all_transactions if t['type'] == 'income')
    total_expense = sum(t['amount'] for t in all_transactions if t['type'] == 'expense')
    balance = total_income - total_expense
    
    # Get category breakdown
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    category_map = {c['id']: c for c in categories}
    
    expense_by_category = {}
    for txn in all_transactions:
        if txn['type'] == 'expense':
            cat_id = txn['category_id']
            cat_name = category_map.get(cat_id, {}).get('name', 'Outros')
            expense_by_category[cat_name] = expense_by_category.get(cat_name, 0) + txn['amount']
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "expense_by_category": expense_by_category,
        "transactions_count": len(all_transactions)
    }

# ============ AI EXTRACTION API ============

@api_router.post("/ai/extract", response_model=AIExtractResponse)
async def extract_transactions(request: AIExtractRequest):
    """Extract transaction details from natural language text using AI"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        # Get categories and accounts for context
        categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
        accounts = await db.accounts.find({}, {"_id": 0}).to_list(1000)
        
        category_list = ", ".join([f"{c['name']} ({c['type']})" for c in categories])
        account_list = ", ".join([f"{a['name']} ({a.get('bank_name', 'outro')})" for a in accounts])
        
        system_message = f"""Você é um assistente especializado em extrair informações de transações financeiras de texto em português.

Categorias disponíveis: {category_list}
Contas disponíveis: {account_list}

Extraia as seguintes informações do texto e retorne APENAS um JSON válido (sem markdown, sem explicações):
{{
  "items": [
    {{
      "description": "descrição da transação",
      "amount": valor numérico,
      "type": "income" ou "expense",
      "category_name": "nome da categoria mais apropriada",
      "payment_method": "cash", "debit", "credit" ou "pix",
      "date": "YYYY-MM-DD" (use hoje se não especificado),
      "bank_name": "nubank", "itau", "santander", "bb", "inter", "c6", "caixa", "bradesco", "picpay", "mercadopago" ou "other" (identifique o banco mencionado ou use "other")
    }}
  ]
}}

Exemplo de entrada: "nubank mercado hoje r$ 132,49 no débito"
Exemplo de saída: {{"items": [{{"description": "Mercado", "amount": 132.49, "type": "expense", "category_name": "Alimentação", "payment_method": "debit", "date": "2025-01-22", "bank_name": "nubank"}}]}}"""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"extract_{uuid.uuid4()}",
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=request.text)
        response = await chat.send_message(user_message)
        
        # Parse response
        response_text = response.strip()
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1])
        
        result = json.loads(response_text)
        
        # Match category names to IDs and find accounts by bank
        for item in result.get('items', []):
            cat_name = item.get('category_name', '')
            matching_cat = next((c for c in categories if c['name'].lower() == cat_name.lower()), None)
            if matching_cat:
                item['category_id'] = matching_cat['id']
            else:
                # Default to first category of the type
                default_cat = next((c for c in categories if c['type'] == item.get('type', 'expense')), categories[0] if categories else None)
                if default_cat:
                    item['category_id'] = default_cat['id']
                    item['category_name'] = default_cat['name']
            
            # Try to match account by bank name
            bank_name = item.get('bank_name', 'other')
            matching_account = next((a for a in accounts if a.get('bank_icon', 'other') == bank_name or a.get('bank_name', '').lower() == bank_name.lower()), None)
            if matching_account:
                item['suggested_account_id'] = matching_account['id']
                item['suggested_account_name'] = matching_account['name']
        
        return result
        
    except json.JSONDecodeError as e:
        logging.error(f"JSON decode error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        logging.error(f"AI extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")

# ============ STOCKS API ============

@api_router.get("/stocks/grouped")
async def get_stocks_grouped():
    """Get stocks grouped by symbol with average price"""
    stocks = await db.stocks.find({}, {"_id": 0}).to_list(1000)
    
    # Agrupar por símbolo e tipo de ativo
    grouped = {}
    for stock in stocks:
        key = f"{stock['symbol']}_{stock.get('asset_type', 'br_stock')}"
        if key not in grouped:
            grouped[key] = {
                'symbol': stock['symbol'],
                'asset_type': stock.get('asset_type', 'br_stock'),
                'total_quantity': 0,
                'total_invested': 0,
                'positions': []
            }
        
        grouped[key]['total_quantity'] += stock['quantity']
        grouped[key]['total_invested'] += stock['quantity'] * stock['purchase_price']
        grouped[key]['positions'].append({
            'id': stock['id'],
            'quantity': stock['quantity'],
            'purchase_price': stock['purchase_price'],
            'purchase_date': stock['purchase_date']
        })
    
    # Calcular preço médio
    result = []
    for key, data in grouped.items():
        avg_price = data['total_invested'] / data['total_quantity'] if data['total_quantity'] > 0 else 0
        result.append({
            'symbol': data['symbol'],
            'asset_type': data['asset_type'],
            'total_quantity': data['total_quantity'],
            'average_price': avg_price,
            'total_invested': data['total_invested'],
            'positions_count': len(data['positions']),
            'positions': data['positions']
        })
    
    return result

@api_router.get("/stocks", response_model=List[StockHolding])
async def get_stocks():
    stocks = await db.stocks.find({}, {"_id": 0}).to_list(1000)
    for stock in stocks:
        if isinstance(stock.get('created_at'), str):
            stock['created_at'] = datetime.fromisoformat(stock['created_at'])
    return stocks

@api_router.post("/stocks", response_model=StockHolding)
async def create_stock(stock: StockCreate):
    stock_obj = StockHolding(**stock.model_dump())
    doc = stock_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.stocks.insert_one(doc)
    return stock_obj

@api_router.delete("/stocks/{stock_id}")
async def delete_stock(stock_id: str):
    result = await db.stocks.delete_one({"id": stock_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stock not found")
    return {"message": "Stock deleted"}

@api_router.get("/stocks/quote/{symbol}")
async def get_stock_quote(symbol: str, asset_type: str = "br_stock"):
    """Get real-time quote for stocks or crypto"""
    try:
        if asset_type == "crypto":
            # CoinGecko API for crypto (free, no key needed)
            crypto_ids = {
                "BTC": "bitcoin",
                "ETH": "ethereum",
                "USDT": "tether",
                "BNB": "binancecoin",
                "SOL": "solana",
                "XRP": "ripple",
                "ADA": "cardano",
                "DOGE": "dogecoin",
                "DOT": "polkadot",
                "MATIC": "matic-network"
            }
            
            coin_id = crypto_ids.get(symbol.upper(), symbol.lower())
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd,brl&include_24hr_change=true"
            
            response = requests.get(url, timeout=10)
            data = response.json()
            
            if coin_id in data:
                coin_data = data[coin_id]
                price_brl = coin_data.get('brl', 0)
                change_24h = coin_data.get('brl_24h_change', 0)
                
                return {
                    "symbol": symbol.upper(),
                    "price": price_brl,
                    "change": change_24h,
                    "change_percent": change_24h,
                    "volume": 0,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "asset_type": "crypto",
                    "currency": "BRL"
                }
        
        elif asset_type == "us_stock":
            # US stocks via Alpha Vantage
            api_key = os.environ.get('ALPHA_VANTAGE_KEY', 'demo')
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={api_key}"
            
            response = requests.get(url, timeout=10)
            data = response.json()
            
            quote = data.get('Global Quote', {})
            if quote:
                price = float(quote.get('05. price', 0))
                # Convert USD to BRL (rough estimate: 1 USD = 5 BRL)
                price_brl = price * 5.0
                
                return {
                    "symbol": symbol,
                    "price": price_brl,
                    "change": float(quote.get('09. change', 0)) * 5.0,
                    "change_percent": float(str(quote.get('10. change percent', '0')).replace('%', '')),
                    "volume": int(quote.get('06. volume', 0)),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "asset_type": "us_stock",
                    "currency": "BRL (convertido)"
                }
        
        else:  # br_stock
            api_key = os.environ.get('ALPHA_VANTAGE_KEY', 'demo')
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}.SA&apikey={api_key}"
            
            response = requests.get(url, timeout=10)
            data = response.json()
            
            quote = data.get('Global Quote', {})
            if quote:
                return {
                    "symbol": symbol,
                    "price": float(quote.get('05. price', 0)),
                    "change": float(quote.get('09. change', 0)),
                    "change_percent": float(str(quote.get('10. change percent', '0')).replace('%', '')),
                    "volume": int(quote.get('06. volume', 0)),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "asset_type": "br_stock",
                    "currency": "BRL"
                }
        
        # Fallback: return demo data
        return {
            "symbol": symbol,
            "price": 100.00,
            "change": 2.50,
            "change_percent": 2.56,
            "volume": 1000000,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "asset_type": asset_type,
            "note": "Demo data - API limit reached or unavailable",
            "currency": "BRL"
        }
        
    except Exception as e:
        logging.error(f"Stock quote error: {e}")
        # Return demo data on error
        return {
            "symbol": symbol,
            "price": 100.00,
            "change": 2.50,
            "change_percent": 2.56,
            "volume": 1000000,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "asset_type": asset_type,
            "note": "Demo data - API error",
            "currency": "BRL"
        }

# ============ CREDIT CARD INVOICES API ============

@api_router.get("/accounts/{account_id}/invoice")
async def get_credit_card_invoice(account_id: str, month: Optional[str] = None):
    """Get credit card invoice for a specific month"""
    account = await db.accounts.find_one({"id": account_id})
    if not account or account['type'] != 'credit_card':
        raise HTTPException(status_code=404, detail="Credit card not found")
    
    # Get transactions for this credit card
    query = {"account_id": account_id, "type": "expense"}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(1000)
    
    total = sum(t['amount'] for t in transactions)
    remaining_limit = account.get('credit_limit', 0) - total
    
    return {
        "account_id": account_id,
        "account_name": account['name'],
        "total": total,
        "credit_limit": account.get('credit_limit', 0),
        "remaining_limit": remaining_limit,
        "due_day": account.get('due_day', 10),
        "closing_day": account.get('closing_day', 5),
        "transactions": transactions
    }

# ============ SETTINGS API ============

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_name: Optional[str] = "Usuário"
    currency: Optional[str] = "BRL"
    theme: Optional[str] = "light"
    language: Optional[str] = "pt-BR"

class SettingsUpdate(BaseModel):
    user_name: Optional[str] = "Usuário"
    currency: Optional[str] = "BRL"
    theme: Optional[str] = "light"
    language: Optional[str] = "pt-BR"

@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        # Return default settings
        return {
            "id": str(uuid.uuid4()),
            "user_name": "Usuário",
            "currency": "BRL",
            "theme": "light",
            "language": "pt-BR"
        }
    return settings

@api_router.put("/settings")
async def update_settings(settings: SettingsUpdate):
    existing = await db.settings.find_one({})
    if existing:
        await db.settings.update_one(
            {"id": existing['id']},
            {"$set": settings.model_dump()}
        )
    else:
        new_settings = Settings(**settings.model_dump())
        await db.settings.insert_one(new_settings.model_dump())
    
    return await get_settings()

# ============ ROOT ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "MoneyFlow API - Seu Dinheiro Sob Controle Total", "version": "2.0.0"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
