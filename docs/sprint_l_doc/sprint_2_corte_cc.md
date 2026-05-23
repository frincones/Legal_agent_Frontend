# Sprint 2: Corte CC Bulk + Binary Embeddings

**Duracion:** 1 semana
**Estado:** Pendiente backend

## Objetivos

1. Ingestar 60K sentencias Corte Constitucional bulk (texto completo + embeddings)
2. Activar binary quantization de embeddings con A/B test
3. Habilitar APScheduler con primer cronjob real

## Migracion SQL: binary embeddings

```sql
-- Migration: M3_binary_embeddings.sql

ALTER TABLE chunks ADD COLUMN IF NOT EXISTS embedding_binary bit(1536);

CREATE OR REPLACE FUNCTION embedding_to_binary(vec vector(1536))
RETURNS bit(1536) AS $$
DECLARE
    bits text := '';
    el float;
BEGIN
    FOR i IN 1..1536 LOOP
        el := vec[i];
        bits := bits || CASE WHEN el >= 0 THEN '1' ELSE '0' END;
    END LOOP;
    RETURN bits::bit(1536);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION set_embedding_binary()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.embedding IS NOT NULL THEN
        NEW.embedding_binary := embedding_to_binary(NEW.embedding);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_chunks_binary
    BEFORE INSERT OR UPDATE OF embedding ON chunks
    FOR EACH ROW
    EXECUTE FUNCTION set_embedding_binary();

-- Backfill incremental (no bloquea)
DO $$
DECLARE
    batch_size int := 1000;
    rows_updated int := 1;
BEGIN
    WHILE rows_updated > 0 LOOP
        UPDATE chunks
        SET embedding_binary = embedding_to_binary(embedding)
        WHERE embedding_binary IS NULL
          AND embedding IS NOT NULL
          AND id IN (
              SELECT id FROM chunks
              WHERE embedding_binary IS NULL
                AND embedding IS NOT NULL
              LIMIT batch_size
          );
        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;

-- Indice HNSW binary (concurrent para no bloquear)
CREATE INDEX CONCURRENTLY chunks_embedding_binary_hnsw_idx
    ON chunks USING hnsw (embedding_binary bit_hamming_ops)
    WITH (m = 16, ef_construction = 64);
```

## Scraper Corte CC bulk

```python
# backend/ingestion/sources/corte_cc.py

CC_TYPES = ['T', 'C', 'SU', 'A']
YEAR_RANGE = range(2010, 2027)

async def discover_corte_cc_urls() -> list[str]:
    """Genera URLs predecibles para insertar en ingest_queue."""
    urls = []
    for year in YEAR_RANGE:
        yy = str(year)[-2:]
        for tipo in CC_TYPES:
            for num in range(1, 1000):
                num_padded = str(num).zfill(3)
                urls.append(
                    f"https://www.corteconstitucional.gov.co/"
                    f"relatoria/{year}/{tipo}-{num_padded}-{yy}.htm"
                )
    return urls

async def process_corte_cc(task: IngestTask) -> str:
    """Procesa una URL. Soft 404 -> skipped, success -> ingest."""
    async with httpx.AsyncClient(timeout=30) as client:
        await asyncio.sleep(0.5)  # throttle 2 req/s
        response = await client.get(task.url)

    if is_soft_404(response.text):
        await mark_task_skipped(task.id, reason='soft_404')
        return ''

    doc = parse_sentencia_cc(response.text)
    doc_id = await ingest_streaming(
        text=doc.text_completo,
        source='corte_cc',
        doc_type='sentencia',
        metadata={
            'numero': doc.numero,
            'magistrado': doc.magistrado,
            'fecha': doc.fecha,
            'tema': doc.tema,
            'materia': 'constitucional',
        }
    )
    return doc_id
```

## A/B test: binary vs float

```python
# backend/retrieval/ab_test.py

def get_embedding_column(firm_id: str) -> str:
    """Decide que columna usar segun feature flag + canary."""
    if os.getenv('BACKEND_USE_BINARY_EMBEDDINGS') != 'true':
        return 'embedding'

    # Canary: 10% de firms usan binary
    canary_pct = int(os.getenv('BINARY_EMBEDDINGS_CANARY_PCT', '10'))
    firm_hash = int(hashlib.md5(firm_id.encode()).hexdigest()[:8], 16)
    if firm_hash % 100 < canary_pct:
        return 'embedding_binary'

    return 'embedding'
```

## DONE criteria

- [ ] 60K sentencias Corte CC en jurisprudencia
- [ ] 100% chunks con embedding_binary calculado
- [ ] A/B test muestra <10% degradacion calidad
- [ ] APScheduler corriendo con job_cc_bulk en Railway
- [ ] Postgres < 400 MB
- [ ] Costo embeddings real < $25
- [ ] Pipeline UI muestra progreso correcto

## Costo: $24 USD (60K sentencias × 20K tokens × $0.02/1M)
