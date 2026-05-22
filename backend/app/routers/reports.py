from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
import math
import csv
import io

from app.database import get_db
from app.dependencies import get_current_active_user, require_admin, require_manager_or_admin, log_audit, get_client_ip
from app.models.user import User
from app.models.beneficiary import RationCardHolder, RationCard, RationCardStatus
from app.models.shop import Shop
from app.models.warehouse import Warehouse
from app.models.stock import StockItem, Commodity
from app.models.distribution import Distribution, DistributionStatus
from app.models.notification import Notification
from app.models.report import MonthlyReport
from app.schemas.report import (
    DashboardStats, StockSummaryResponse, StockSummaryItem,
    DistributionSummaryResponse, DistributionSummaryItem,
    MonthlyReportCreate, MonthlyReportResponse, MonthlyReportListResponse,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year

    total_beneficiaries = db.query(RationCardHolder).filter(RationCardHolder.is_active == True).count()
    total_ration_cards = db.query(RationCard).count()
    active_ration_cards = db.query(RationCard).filter(RationCard.status == RationCardStatus.active).count()
    total_shops = db.query(Shop).count()
    active_shops = db.query(Shop).filter(Shop.is_active == True).count()
    total_warehouses = db.query(Warehouse).count()
    total_stock_items = db.query(StockItem).count()
    low_stock_alerts = db.query(StockItem).filter(StockItem.quantity <= StockItem.minimum_quantity).count()
    total_users = db.query(User).filter(User.is_active == True).count()
    unread_notifications = db.query(Notification).filter(Notification.is_read == False).count()

    # This month distributions
    month_dists = db.query(Distribution).filter(
        Distribution.distribution_month == current_month,
        Distribution.distribution_year == current_year,
    ).all()

    distributions_this_month = len(month_dists)
    total_rice = sum(d.rice_quantity for d in month_dists)
    total_wheat = sum(d.wheat_quantity for d in month_dists)
    total_sugar = sum(d.sugar_quantity for d in month_dists)
    total_oil = sum(d.oil_quantity for d in month_dists)

    return DashboardStats(
        total_beneficiaries=total_beneficiaries,
        total_ration_cards=total_ration_cards,
        active_ration_cards=active_ration_cards,
        total_shops=total_shops,
        active_shops=active_shops,
        total_warehouses=total_warehouses,
        total_stock_items=total_stock_items,
        low_stock_alerts=low_stock_alerts,
        distributions_this_month=distributions_this_month,
        total_rice_distributed_this_month=total_rice,
        total_wheat_distributed_this_month=total_wheat,
        total_sugar_distributed_this_month=total_sugar,
        total_oil_distributed_this_month=total_oil,
        total_users=total_users,
        unread_notifications=unread_notifications,
    )


@router.get("/stock-summary", response_model=StockSummaryResponse)
def get_stock_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    commodities = db.query(Commodity).filter(Commodity.is_active == True).all()
    items_list = []
    total_value = 0.0

    for commodity in commodities:
        stock_items = db.query(StockItem).filter(StockItem.commodity_id == commodity.id).all()
        total_qty = sum(s.quantity for s in stock_items)
        low_stock_count = sum(1 for s in stock_items if s.quantity <= s.minimum_quantity)
        warehouse_ids = set(s.warehouse_id for s in stock_items if s.warehouse_id)
        commodity_value = sum(s.quantity * s.cost_per_unit for s in stock_items)
        total_value += commodity_value

        items_list.append(StockSummaryItem(
            commodity_name=commodity.name,
            unit=commodity.unit,
            total_quantity=total_qty,
            low_stock_count=low_stock_count,
            warehouse_count=len(warehouse_ids),
        ))

    return StockSummaryResponse(items=items_list, total_value=total_value)


@router.get("/distribution-summary", response_model=DistributionSummaryResponse)
def get_distribution_summary(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    shop_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    filter_month = month or now.month
    filter_year = year or now.year

    query = db.query(
        Distribution.shop_id,
        Shop.name,
        func.count(Distribution.id).label("total_cards"),
        func.sum(Distribution.rice_quantity).label("rice"),
        func.sum(Distribution.wheat_quantity).label("wheat"),
        func.sum(Distribution.sugar_quantity).label("sugar"),
        func.sum(Distribution.oil_quantity).label("oil"),
    ).join(Shop, Distribution.shop_id == Shop.id).filter(
        Distribution.distribution_month == filter_month,
        Distribution.distribution_year == filter_year,
    ).group_by(Distribution.shop_id, Shop.name)

    if shop_id:
        query = query.filter(Distribution.shop_id == shop_id)

    results = query.all()
    items = [
        DistributionSummaryItem(
            shop_id=r.shop_id,
            shop_name=r.name,
            month=filter_month,
            year=filter_year,
            total_cards_distributed=r.total_cards,
            rice=r.rice or 0.0,
            wheat=r.wheat or 0.0,
            sugar=r.sugar or 0.0,
            oil=r.oil or 0.0,
        )
        for r in results
    ]

    return DistributionSummaryResponse(items=items, total=len(items))


@router.get("/monthly", response_model=MonthlyReportListResponse)
def list_monthly_reports(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    shop_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(MonthlyReport).order_by(
        MonthlyReport.report_year.desc(), MonthlyReport.report_month.desc()
    )
    if shop_id:
        query = query.filter(MonthlyReport.shop_id == shop_id)
    if year:
        query = query.filter(MonthlyReport.report_year == year)

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()

    return MonthlyReportListResponse(items=items, total=total)


@router.post("/generate-monthly", response_model=MonthlyReportResponse, status_code=status.HTTP_201_CREATED)
def generate_monthly_report(
    request: Request,
    payload: MonthlyReportCreate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    # Check if report already exists
    existing = db.query(MonthlyReport).filter(
        MonthlyReport.report_month == payload.report_month,
        MonthlyReport.report_year == payload.report_year,
        MonthlyReport.shop_id == payload.shop_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report already exists for this month/year/shop combination",
        )

    dist_query = db.query(Distribution).filter(
        Distribution.distribution_month == payload.report_month,
        Distribution.distribution_year == payload.report_year,
    )
    if payload.shop_id:
        dist_query = dist_query.filter(Distribution.shop_id == payload.shop_id)

    distributions = dist_query.all()

    # Count unique beneficiaries
    card_ids = set(d.card_id for d in distributions)

    report = MonthlyReport(
        shop_id=payload.shop_id,
        report_month=payload.report_month,
        report_year=payload.report_year,
        total_beneficiaries=len(card_ids),
        total_rice_distributed=sum(d.rice_quantity for d in distributions),
        total_wheat_distributed=sum(d.wheat_quantity for d in distributions),
        total_sugar_distributed=sum(d.sugar_quantity for d in distributions),
        total_oil_distributed=sum(d.oil_quantity for d in distributions),
        total_transactions=len(distributions),
        generated_by=current_user.id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    log_audit(
        db=db, user_id=current_user.id, action="GENERATE_REPORT", resource="reports",
        resource_id=report.id,
        details={"month": payload.report_month, "year": payload.report_year},
        ip_address=get_client_ip(request),
    )

    return report


@router.get("/export/csv")
def export_distributions_csv(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    shop_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Distribution).filter(
        Distribution.distribution_month == month,
        Distribution.distribution_year == year,
    )
    if shop_id:
        query = query.filter(Distribution.shop_id == shop_id)

    distributions = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Distribution ID", "Card ID", "Shop ID", "Month", "Year",
        "Rice (kg)", "Wheat (kg)", "Sugar (kg)", "Oil (L)",
        "Status", "Distributed By", "Created At",
    ])
    for d in distributions:
        writer.writerow([
            d.id, d.card_id, d.shop_id, d.distribution_month, d.distribution_year,
            d.rice_quantity, d.wheat_quantity, d.sugar_quantity, d.oil_quantity,
            d.status.value, d.distributed_by, d.created_at.isoformat(),
        ])

    csv_content = output.getvalue()
    filename = f"distributions_{year}_{month:02d}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
