import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.deps import get_db
from app.models.policy import Policy, PolicyNodeLink
from app.schemas.policy import PolicyCreate, PolicyUpdate, PolicyResponse, PolicyLinkRequest

router = APIRouter(tags=["policies"])


async def _load_policy(db: AsyncSession, policy_id: uuid.UUID) -> Policy:
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


async def _node_ids_for(db: AsyncSession, policy_id: uuid.UUID) -> list[uuid.UUID]:
    result = await db.execute(
        select(PolicyNodeLink.node_id).where(PolicyNodeLink.policy_id == policy_id)
    )
    return [row[0] for row in result.all()]


def _to_response(policy: Policy, node_ids: list[uuid.UUID]) -> PolicyResponse:
    return PolicyResponse(
        id=policy.id,
        project_id=policy.project_id,
        title=policy.title,
        description=policy.description,
        severity=policy.severity,
        status=policy.status,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
        node_ids=node_ids,
    )


@router.get("/projects/{project_id}/policies", response_model=list[PolicyResponse])
async def list_policies(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Policy).where(Policy.project_id == project_id).order_by(Policy.created_at.desc())
    )
    policies = result.scalars().all()
    out = []
    for p in policies:
        node_ids = await _node_ids_for(db, p.id)
        out.append(_to_response(p, node_ids))
    return out


@router.post("/projects/{project_id}/policies", response_model=PolicyResponse, status_code=201)
async def create_policy(project_id: uuid.UUID, data: PolicyCreate, db: AsyncSession = Depends(get_db)):
    policy = Policy(
        id=uuid.uuid4(),
        project_id=project_id,
        title=data.title,
        description=data.description,
        severity=data.severity,
    )
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return _to_response(policy, [])


@router.get("/policies/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    policy = await _load_policy(db, policy_id)
    node_ids = await _node_ids_for(db, policy_id)
    return _to_response(policy, node_ids)


@router.patch("/policies/{policy_id}", response_model=PolicyResponse)
async def update_policy(policy_id: uuid.UUID, data: PolicyUpdate, db: AsyncSession = Depends(get_db)):
    policy = await _load_policy(db, policy_id)
    if data.title is not None:
        policy.title = data.title
    if data.description is not None:
        policy.description = data.description
    if data.severity is not None:
        policy.severity = data.severity
    if data.status is not None:
        policy.status = data.status
    await db.commit()
    await db.refresh(policy)
    node_ids = await _node_ids_for(db, policy_id)
    return _to_response(policy, node_ids)


@router.delete("/policies/{policy_id}", status_code=204)
async def delete_policy(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    policy = await _load_policy(db, policy_id)
    await db.delete(policy)
    await db.commit()


@router.put("/policies/{policy_id}/nodes", response_model=PolicyResponse)
async def set_policy_nodes(policy_id: uuid.UUID, body: PolicyLinkRequest, db: AsyncSession = Depends(get_db)):
    policy = await _load_policy(db, policy_id)
    await db.execute(delete(PolicyNodeLink).where(PolicyNodeLink.policy_id == policy_id))
    for node_id in body.node_ids:
        db.add(PolicyNodeLink(policy_id=policy_id, node_id=node_id))
    await db.commit()
    node_ids = await _node_ids_for(db, policy_id)
    return _to_response(policy, node_ids)
