"""Pydantic schemas for the Task Management API."""

from datetime import datetime
from typing import Literal, Optional

from sqlmodel import SQLModel


TaskPriority = Literal["LOW", "MEDIUM", "HIGH"]
TaskStatus = Literal["TODO", "IN_PROGRESS", "DONE"]


class TaskBase(SQLModel):
    project_id: int
    title: str
    description: Optional[str] = None
    priority: TaskPriority
    status: TaskStatus
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    evidence_url: Optional[str] = None
    is_active: bool = True


class TaskCreate(TaskBase):
    pass


class TaskUpdate(SQLModel):
    project_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    evidence_url: Optional[str] = None
    is_active: Optional[bool] = None


class TaskRead(TaskBase):
    id: int
    created_at: datetime
