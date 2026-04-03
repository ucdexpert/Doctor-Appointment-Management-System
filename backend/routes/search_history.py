from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import SearchHistory, User
from middleware.auth import require_role
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/search-history", tags=["Search History"])


class SearchHistoryResponse(BaseModel):
    id: int
    search_query: str
    filters: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SaveSearchRequest(BaseModel):
    search_query: str
    filters: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
def save_search(
    search_data: SaveSearchRequest,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Save a search to history"""
    
    new_search = SearchHistory(
        patient_id=current_user.id,
        search_query=search_data.search_query,
        filters=search_data.filters
    )
    
    db.add(new_search)
    db.commit()
    db.refresh(new_search)
    
    return {"message": "Search saved", "id": new_search.id}


@router.get("/my", response_model=List[SearchHistoryResponse])
def get_my_searches(
    limit: int = 10,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Get recent searches"""
    
    searches = db.query(SearchHistory).filter(
        SearchHistory.patient_id == current_user.id
    ).order_by(SearchHistory.created_at.desc()).limit(limit).all()
    
    return searches


@router.delete("/{search_id}")
def delete_search(
    search_id: int,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Delete a search from history"""
    
    search = db.query(SearchHistory).filter(
        SearchHistory.id == search_id,
        SearchHistory.patient_id == current_user.id
    ).first()
    
    if not search:
        raise HTTPException(status_code=404, detail="Search not found")
    
    db.delete(search)
    db.commit()
    
    return {"message": "Search deleted"}


@router.delete("/my/clear")
def clear_search_history(
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Clear all search history"""
    
    db.query(SearchHistory).filter(
        SearchHistory.patient_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"message": "Search history cleared"}
