# Sprint 5: Verifier Batch + Scorecard + Quality

**Duracion:** 1 semana

## Objetivos

Verificacion de citas post-generacion + scorecard de calidad + export PDF/Word + semantic caching.

## Migracion SQL

```sql
-- Migration: M7_template_usage_stats.sql

CREATE TABLE IF NOT EXISTS template_usage_stats (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id         uuid REFERENCES user_templates(id) ON DELETE CASCADE,
    generations_count   integer DEFAULT 0,
    user_ratings_sum    integer DEFAULT 0,
    user_ratings_count  integer DEFAULT 0,
    avg_judge_score     numeric(3,2),
    avg_citation_rate   numeric(3,2),
    last_used_at        timestamptz,
    updated_at          timestamptz DEFAULT now(),
    UNIQUE (template_id)
);

-- Lectura global (todos pueden ver stats)
ALTER TABLE template_usage_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_usage_stats_read"
    ON template_usage_stats FOR SELECT
    TO authenticated
    USING (true);
```

## Verifier batch

```python
# backend/utils/citation_verifier.py (extension)

async def verify_document_citations(
    document_md: str,
    generation_id: str,
    firm_id: str,
    pool,
) -> VerificationReport:
    """
    Verifica todas las citas del documento en batch.
    Emite events de progreso para SSE.
    """
    citations = extract_citations(document_md)
    verified, suspicious, not_found = [], [], []

    for i, cite in enumerate(citations):
        # 1. Cache lookup (jurisprudencia + leyes_normas)
        result = await cache_lookup(cite, pool)
        if not result.found:
            # 2. Live fetch (Corte CC, Senado)
            result = await live_fetch_citation(cite)

        if result.verified:
            verified.append(cite)
        elif result.suspicious:
            suspicious.append(cite)
        else:
            not_found.append(cite)

        # Emit progress event
        yield {'event': 'verification_progress',
               'data': {'checked': i+1, 'total': len(citations),
                       'found': len(verified), 'suspicious': len(suspicious)}}

    # Persist en generated_document_sections.citation_status
    await persist_citation_status(generation_id, verified, suspicious, not_found, pool)

    yield {'event': 'verification_done',
           'data': {'citation_rate': len(verified) / max(len(citations), 1),
                   'verified': verified, 'suspicious': suspicious, 'not_found': not_found}}
```

## Componentes frontend a crear

| Componente | Proposito |
|---|---|
| `CitationBadgeInline.tsx` | TipTap mark extension con popover (4 estados) |
| `QualityScorecard.tsx` | Card final con dimensiones de calidad |
| `DocumentExportMenu.tsx` | Dropdown PDF/Word/copy/link |
| `SemanticCache.ts` | Cache por similarity de queries |

## Semantic caching

```python
# backend/llm_routing/cache.py

class SemanticCache:
    """Cache por similarity de embeddings, no exact match."""

    def __init__(self, redis_client, similarity_threshold=0.95):
        self.redis = redis_client
        self.threshold = similarity_threshold

    async def lookup(self, query: str) -> Optional[str]:
        query_emb = await embed(query[:512])
        # Find nearest in cache
        candidates = await self.redis.zrange('cache:queries', 0, 100)
        for cand_key in candidates:
            cand_emb = await self.redis.get(f'cache:emb:{cand_key}')
            if cosine_sim(query_emb, cand_emb) >= self.threshold:
                return await self.redis.get(f'cache:result:{cand_key}')
        return None

    async def store(self, query: str, result: str, ttl=3600):
        key = hashlib.sha256(query.encode()).hexdigest()[:16]
        query_emb = await embed(query[:512])
        await self.redis.setex(f'cache:result:{key}', ttl, result)
        await self.redis.setex(f'cache:emb:{key}', ttl, query_emb.tobytes())
        await self.redis.zadd('cache:queries', {key: time.time()})
```

## DONE criteria

- [ ] Migracion M7 aplicada
- [ ] verify_document_citations batch implementado
- [ ] Citation Existence Rate >90% en docs generados
- [ ] Scorecard visible con metricas correctas
- [ ] Export PDF descarga valido
- [ ] Cache hit rate >30% post-warmup
- [ ] Self-critique loop opcional behind flag
