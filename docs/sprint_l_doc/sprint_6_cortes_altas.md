# Sprint 6: Cortes Altas + Validacion Final + Canary

**Duracion:** 1 semana

## Objetivos

1. Completar corpus colombiano: Corte Suprema + Consejo de Estado + DIAN + JEP + datos.gov.co
2. Endurecer produccion: tests E2E + load testing + monitoring
3. Canary deployment 10% usuarios

## Scrapers a implementar

### Corte Suprema de Justicia
- URL: `https://cortesuprema.gov.co/corte/index.php/relatorias/`
- Volumen: ~100K sentencias (laboral, civil, penal)
- Tiempo: 12 horas distribuidas
- Costo: $40

### Consejo de Estado
- URL: `https://www.consejodeestado.gov.co/relatorias/`
- Volumen: ~200K sentencias administrativas
- Tiempo: 24 horas distribuidas
- Costo: $80
- Reto: buscador requiere JS, considerar Selenium para URL discovery

### DIAN Conceptos
- URL: `https://www.dian.gov.co/normatividad/Conceptos/`
- Volumen: ~15K conceptos tributarios
- Tiempo: 4 horas
- Costo: $15

### JEP
- URL: `https://www.jep.gov.co/Sala-de-Prensa/Paginas/Resoluciones.aspx`
- Volumen: ~2K decisiones
- Tiempo: 2 horas
- Costo: $4

## Hugging Face backup nocturno

```python
# backend/storage/hf_backup.py

from huggingface_hub import HfApi, HfFileSystem

async def daily_hf_backup():
    """Sync incremental R2 → HF Datasets."""
    api = HfApi(token=os.getenv('HUGGINGFACE_TOKEN'))
    fs = HfFileSystem(token=os.getenv('HUGGINGFACE_TOKEN'))

    # 1. List R2 objects modificados ult 24h
    cutoff = datetime.now() - timedelta(hours=24)
    new_objects = await r2_list_modified_after(cutoff)

    # 2. Upload incremental
    for obj_key in new_objects:
        local_temp = await r2_download_temp(obj_key)
        api.upload_file(
            path_or_fileobj=local_temp,
            path_in_repo=obj_key,
            repo_id=os.getenv('HF_DATASET_REPO'),
            repo_type='dataset',
            commit_message=f'sync {obj_key}',
        )

    # 3. Logear stats
    await log_backup_run(uploaded=len(new_objects), status='success')
```

## Canary deployment

### Plan rollout
1. **Day 1**: 10% usuarios via `DOC_GEN_USER_ALLOWLIST`
2. **Day 3**: 25% si KPIs verdes
3. **Day 7**: 50%
4. **Day 14**: 100%

### KPIs a monitorear
- `time_to_first_content` (p50, p95)
- `doc_accepted_without_edit` (%)
- `citation_verified_rate` (%)
- `quality_judge_score` (avg)
- `error_rate` por endpoint
- `cost_per_doc` (USD)

### Rollback automatico
```python
async def check_canary_health():
    metrics = await fetch_canary_metrics(hours=1)
    if (
        metrics.error_rate > 0.05
        or metrics.cost_per_doc > 0.15
        or metrics.citation_rate < 0.80
    ):
        await disable_canary_flag()
        await alert_sentry('canary_rollback_triggered', metrics)
```

## Validacion final del corpus

```sql
-- backend/scripts/validate_corpus.sql
SELECT
    source,
    count(*) AS docs,
    avg(quality_score) AS avg_quality,
    count(*) FILTER (WHERE quality_score >= 0.8) AS high_quality
FROM documents d
LEFT JOIN user_templates t ON t.ingest_doc_id = d.id
GROUP BY source
ORDER BY docs DESC;

-- Verificar cobertura por materia
SELECT
    materia,
    count(*) AS docs,
    array_agg(DISTINCT doc_type) AS tipos
FROM documents
GROUP BY materia;

-- Storage final
SELECT
    pg_size_pretty(pg_database_size(current_database())) AS db_size,
    (SELECT count(*) FROM documents) AS total_docs,
    (SELECT count(*) FROM chunks) AS total_chunks,
    (SELECT count(*) FROM user_templates WHERE quality_score >= 0.8) AS quality_templates;
```

## Tests E2E

```typescript
// tests/e2e/document_generation_full_flow.spec.ts

test('Usuario genera tutela completa end-to-end', async ({ page }) => {
  await page.goto('/v2/inicio');

  // 1. Activar flag (solo en test env)
  await page.evaluate(() => {
    window.localStorage.setItem('lexai-doc-gen-v2-enabled', 'true');
  });

  // 2. Escribir intent en composer
  await page.fill('textarea', 'Redacta una tutela por derecho a la salud para mi cliente Juan Perez');
  await page.press('textarea', 'Enter');

  // 3. Esperar redireccion a canvas
  await page.waitForURL('**/v2/canvas/draft*');

  // 4. Verificar params form aparece
  await expect(page.locator('text=Datos para el tutela')).toBeVisible();

  // 5. Llenar form
  await page.fill('[id="param-accionante"]', 'Juan Perez');
  await page.fill('[id="param-accionada"]', 'EPS Sanitas');
  await page.click('text=Continuar con estos datos');

  // 6. Esperar streaming (max 60s)
  await page.waitForSelector('[data-section-status="done"]', { timeout: 60000 });

  // 7. Verificar 8 secciones completadas
  const sections = await page.locator('[data-section-status="done"]').count();
  expect(sections).toBeGreaterThanOrEqual(6);

  // 8. Verificar scorecard
  await expect(page.locator('text=Calidad del documento')).toBeVisible();
  await expect(page.locator('text=Citas válidas')).toBeVisible();
});
```

## DONE criteria

- [ ] 4 scrapers nuevos implementados y ejecutados
- [ ] Corpus completo: ~540K docs
- [ ] HF backup nocturno funcional
- [ ] Canary 10% activo sin issues por 48h
- [ ] Tests E2E pasan
- [ ] Postgres < 450 MB
- [ ] R2 < 8 GB
- [ ] Costo total bulk: <$200
- [ ] Plan rollout 50% → 100% definido y aprobado
