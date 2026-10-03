/**
 * Sinh supabase/seed_content.sql từ content/*.json (upsert, idempotent).
 * Dùng khi đồng bộ Git → Supabase mà KHÔNG cần service key trong repo: dán file SQL vào SQL editor.
 *   npx tsx scripts/content-to-sql.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { ContentSchema, SourcesFileSchema, validateReferences, validateReferencesExist } from '../src/content/schema'

const content = ContentSchema.parse(JSON.parse(readFileSync('content/cardiovascular.json', 'utf8')))
const { sources } = SourcesFileSchema.parse(JSON.parse(readFileSync('content/sources.json', 'utf8')))
const errs = [...validateReferences(content), ...validateReferencesExist(content, sources)]
if (errs.length) throw new Error(errs.join('\n'))

const q = (v: string | number | undefined | null) => (v === undefined || v === null ? 'null' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`)
const arr = (a: string[] | undefined) => (a && a.length ? `array[${a.map(q).join(',')}]::text[]` : 'null')
const arrE = (a: string[]) => (a.length ? `array[${a.map(q).join(',')}]::text[]` : `'{}'::text[]`)
const sha = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return '' } })()

const out: string[] = ['-- Sinh tự động bởi scripts/content-to-sql.ts — đừng sửa tay.', 'begin;']

out.push(`insert into public.sources (id,kind,title,authors,journal,publisher,year,doi,url,license,cited_by,note) values`)
out.push(sources.map((s) => `(${q(s.id)},${q(s.kind)},${q(s.title)},${arr(s.authors)},${q(s.journal)},${q(s.publisher)},${q(s.year)},${q(s.doi)},${q(s.url)},${q(s.license)},${q(s.citedBy)},${q(s.note)})`).join(',\n'))
out.push(`on conflict (id) do update set kind=excluded.kind,title=excluded.title,authors=excluded.authors,journal=excluded.journal,publisher=excluded.publisher,year=excluded.year,doi=excluded.doi,url=excluded.url,license=excluded.license,cited_by=excluded.cited_by,note=excluded.note;`)

out.push(`insert into public.structures (id,system,mesh_names,name_vi,name_latin,name_latin_ta2,name_en,grp,layer,description,"function",clinical,mnemonic,source,reviewed_by,reviewed_at,updated_at) values`)
out.push(content.structures.map((s) => `(${q(s.id)},${q(content.system)},${arrE(s.meshNames)},${q(s.nameVi)},${q(s.nameLatin)},${q(s.nameLatinTA2)},${q(s.nameEn)},${q(s.group)},${s.layer},${q(s.description)},${q(s.function)},${q(s.clinical)},${q(s.mnemonic)},${q(s.source)},${q(s.reviewedBy)},${s.reviewedAt ? q(s.reviewedAt) + '::date' : 'null'},now())`).join(',\n'))
out.push(`on conflict (id) do update set system=excluded.system,mesh_names=excluded.mesh_names,name_vi=excluded.name_vi,name_latin=excluded.name_latin,name_latin_ta2=excluded.name_latin_ta2,name_en=excluded.name_en,grp=excluded.grp,layer=excluded.layer,description=excluded.description,"function"=excluded."function",clinical=excluded.clinical,mnemonic=excluded.mnemonic,source=excluded.source,reviewed_by=excluded.reviewed_by,reviewed_at=excluded.reviewed_at,updated_at=now();`)

out.push(`delete from public.structure_sources where structure_id in (select id from public.structures where system=${q(content.system)});`)
const links = content.structures.flatMap((s) => s.references.map((r) => `(${q(s.id)},${q(r)})`))
if (links.length) out.push(`insert into public.structure_sources (structure_id,source_id) values\n${links.join(',\n')};`)

out.push(`delete from public.questions where system=${q(content.system)};`)
out.push(`insert into public.questions (id,system,type,prompt,target_structure_id,distractor_ids,difficulty,tags) values`)
out.push(content.questions.map((x) => x.type === 'click'
  ? `(${q(x.id)},${q(content.system)},'click',${q(x.prompt)},${q(x.answerStructureId)},null,${x.difficulty},${arrE(x.tags)})`
  : `(${q(x.id)},${q(content.system)},'name',null,${q(x.targetStructureId)},${arrE(x.distractorIds)},${x.difficulty},${arrE(x.tags)})`).join(',\n') + ';')

out.push(`insert into public.content_versions (system,version,git_sha,n_structures,n_questions,n_sources) values (${q(content.system)},${q(content.version)},${q(sha)},${content.structures.length},${content.questions.length},${sources.length});`)
out.push('commit;')

writeFileSync('supabase/seed_content.sql', out.join('\n') + '\n')
console.log(`✓ supabase/seed_content.sql — ${sources.length} nguồn, ${content.structures.length} cấu trúc, ${content.questions.length} câu hỏi, ${links.length} liên kết`)
