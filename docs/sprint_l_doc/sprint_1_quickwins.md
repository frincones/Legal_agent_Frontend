# Sprint 1: Quick Wins Ingest + R2

**Duracion:** 1 semana
**Estado:** Pendiente backend

## Objetivos

Ingestar las primeras 590 plantillas curadas de fuentes oficiales colombianas sin tocar el flow de usuario. Validar end-to-end el pipeline stream-only.

## Fuentes a ingestar

| Fuente | Docs | Tiempo | Costo emb |
|---|---|---|---|
| Colombia Compra (pliegos tipo) | 40 | 5 min | $0.10 |
| Defensoria del Pueblo (cartillas) | 200 | 30 min | $0.50 |
| ICBF (formatos familia) | 150 | 20 min | $0.30 |
| MinJusticia (SICAAC formatos) | 50 | 10 min | $0.10 |
| MinTrabajo (modelos) | 50 | 10 min | $0.10 |
| CCB (minutas societarias) | 100 | 2 horas | $0.20 |
| **TOTAL** | **590** | **~3 horas** | **$1.30** |

## Entregables backend

### 1. Migraciones SQL (additive)

```sql
-- Migration: M1_ingest_infrastructure.sql

CREATE TABLE IF NOT EXISTS ingest_queue (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source          text NOT NULL,
    url             text NOT NULL,
    url_hash        text NOT NULL UNIQUE,
    status          text NOT NULL DEFAULT 'pending',
    priority        integer DEFAULT 5,
    retries         integer DEFAULT 0,
    max_retries     integer DEFAULT 3,
    document_id     uuid REFERENCES documents(id),
    error_message   text,
    error_class     text,
    processing_ms   integer,
    discovered_at   timestamptz DEFAULT now(),
    started_at      timestamptz,
    completed_at    timestamptz
);

CREATE INDEX ingest_queue_status_priority_idx
    ON ingest_queue (status, priority, discovered_at)
    WHERE status = 'pending';

CREATE INDEX ingest_queue_source_status_idx
    ON ingest_queue (source, status);

CREATE TABLE IF NOT EXISTS ingest_runs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source          text NOT NULL,
    started_at      timestamptz DEFAULT now(),
    completed_at    timestamptz,
    stats_jsonb     jsonb NOT NULL DEFAULT '{}'
);

CREATE OR REPLACE VIEW ingest_dashboard AS
WITH stats AS (
    SELECT
        source,
        count(*) AS total,
        count(*) FILTER (WHERE status = 'completed') AS done,
        count(*) FILTER (WHERE status = 'failed') AS failed,
        sum(processing_ms) FILTER (WHERE status = 'completed') AS total_ms,
        avg(processing_ms) FILTER (WHERE status = 'completed') AS avg_ms,
        max(completed_at) AS last_completed
    FROM ingest_queue
    GROUP BY source
)
SELECT
    source,
    total,
    done,
    failed,
    round(100.0 * done / NULLIF(total, 0), 1) AS pct,
    round(total_ms / 60000.0, 1) AS minutes_spent,
    round(avg_ms / 1000.0, 1) AS avg_seconds_per_doc,
    last_completed,
    CASE
        WHEN done = total THEN 'completed'
        WHEN avg_ms IS NULL THEN 'pending'
        ELSE to_char(
            now() + ((total - done) * avg_ms * interval '1 millisecond'),
            'YYYY-MM-DD HH24:MI'
        )
    END AS eta
FROM stats
ORDER BY pct ASC;
```

```sql
-- Migration: M2_template_sections.sql

CREATE TABLE IF NOT EXISTS template_sections_catalog (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     uuid REFERENCES user_templates(id) ON DELETE CASCADE,
    section_key     text NOT NULL,
    section_title   text NOT NULL,
    section_order   integer NOT NULL,
    is_required     boolean DEFAULT true,
    content_md      text,
    instructions_md text,
    min_items       integer,
    variables_json  jsonb DEFAULT '[]',
    embedding       vector(1536),
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX template_sections_template_order_idx
    ON template_sections_catalog (template_id, section_order);

-- HNSW para busqueda semantica de secciones
CREATE INDEX template_sections_embedding_hnsw_idx
    ON template_sections_catalog
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- RLS: visibility via user_templates.firm_id
ALTER TABLE template_sections_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_sections_tenant_visibility"
    ON template_sections_catalog FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_templates t
            WHERE t.id = template_sections_catalog.template_id
              AND (t.firm_id IS NULL OR t.firm_id = auth.jwt_firm_id())
        )
    );
```

### 2. Estructura backend Python

```
backend/storage/
  r2_client.py              - boto3 con endpoint R2
  lazy_fetch.py             - fallback fetch desde fuente

backend/ingestion/
  stream_pipeline.py        - pipeline stream-only
  queue_manager.py          - gestor ingest_queue (claim/complete/fail)
  dedup.py                  - 3 estrategias (hash, citation_ref, similarity)
  binary_quantization.py    - vector → bit (cosine → hamming)
  embedder.py               - batch OpenAI embeddings con cache

backend/ingestion/sources/
  __init__.py
  base.py                   - clase abstracta SourceScraper
  colombia_compra.py        - 40 PDFs pliegos tipo
  defensoria.py             - 200 cartillas
  icbf.py                   - 150 formatos
  minjusticia.py            - 50 formatos SICAAC
  mintrabajo.py             - 50 modelos
  ccb.py                    - 100 minutas (semi-manual)
```

### 3. Pseudo-codigo pipeline stream-only

```python
# backend/ingestion/stream_pipeline.py

async def ingest_streaming(url: str, source: str, doc_type: str) -> str:
    """
    Pipeline stream-only: PDF nunca toca disco.
    1. Fetch en memoria
    2. Extract con Docling
    3. Chunk hybrid
    4. Embed batch
    5. Persist en Postgres + R2
    6. Discard PDF (GC)
    """
    doc_id = uuid4()

    # 1. FETCH
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, follow_redirects=True,
                                     headers={'User-Agent': 'LexAI-Bot/1.0'})
        response.raise_for_status()
        pdf_bytes = response.content

    # 2. EXTRACT (libera pdf_bytes inmediatamente)
    try:
        text, structured = docling_extract(pdf_bytes)
    finally:
        del pdf_bytes

    # 3. DEDUP check (skip si ya existe)
    existing = await dedup.is_duplicate(text, {'source': source, 'url': url})
    if existing:
        return existing

    # 4. CHUNK
    chunks = hybrid_chunker(text, max_tokens=1000, overlap=200)

    # 5. EMBED (batch 100)
    embeddings = await openai_embed_batch(chunks, model='text-embedding-3-small')
    binary_embs = [quantize_binary(e) for e in embeddings]

    # 6. PERSIST en transaccion
    async with pg_pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("""
                INSERT INTO documents (id, source, source_url, title, doc_type,
                                       chunk_count, ingested_at, content_hash)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
            """, doc_id, source, url, structured.title, doc_type,
                 len(chunks), sha256(text))

            await conn.executemany("""
                INSERT INTO chunks (document_id, chunk_index, chunk_text,
                                    embedding, embedding_binary)
                VALUES ($1, $2, $3, $4, $5)
            """, [(doc_id, i, c, e, b)
                  for i, (c, e, b) in enumerate(zip(chunks, embeddings, binary_embs))])

    # 7. R2 upload texto comprimido
    await r2_client.put_object(
        Bucket='lexai-corpus',
        Key=f'text/{doc_id}.txt.gz',
        Body=gzip.compress(text.encode('utf-8')),
        ContentType='text/plain',
        Tagging='curated' if doc_type == 'template' else 'sentencia',
    )

    return str(doc_id)
```

### 4. Comandos de ejecucion

```bash
# Setup one-time
alembic upgrade head  # aplica M1, M2

# Test connections
python -m backend.scripts.test_connections  # R2 + OpenAI + Postgres

# Quick wins ingest (Dia 1, ~3 horas total)
python -m backend.ingestion.run --source colombia_compra
python -m backend.ingestion.run --source defensoria
python -m backend.ingestion.run --source icbf
python -m backend.ingestion.run --source minjusticia
python -m backend.ingestion.run --source mintrabajo
python -m backend.ingestion.run --source ccb

# Validar
psql $DATABASE_URL -c "SELECT * FROM ingest_dashboard;"
```

## DONE criteria

- [ ] 2 migraciones SQL aplicadas sin downtime
- [ ] R2 client funcional (put/get/delete)
- [ ] 6 scrapers implementados con tests unit
- [ ] 590 plantillas en user_templates con quality_score >= 0.8
- [ ] 590 textos en R2 bajo `text/<doc_id>.txt.gz`
- [ ] ingest_dashboard view muestra 100% por cada fuente
- [ ] Postgres usage < 350 MB (margen 30%)
- [ ] R2 usage < 500 MB (margen 95%)
- [ ] Suite regresion pasa (chat normal, canvas casos, voice, RLS)

## Plan de rollback

```sql
-- Rollback Sprint 1 (en orden inverso)
DROP VIEW IF EXISTS ingest_dashboard;
DROP TABLE IF EXISTS template_sections_catalog CASCADE;
DROP TABLE IF EXISTS ingest_runs;
DROP TABLE IF EXISTS ingest_queue;

DELETE FROM user_templates
WHERE source IN ('colombia_compra', 'defensoria', 'icbf',
                 'minjusticia', 'mintrabajo', 'ccb');

-- R2: eliminar objetos con prefijo text/ y tag 'curated' del sprint
-- (script Python con boto3.list_objects + delete_objects)
```
