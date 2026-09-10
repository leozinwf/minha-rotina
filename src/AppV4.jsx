import React, { useEffect, useMemo, useState } from 'react'
import {
  Archive, ArchiveRestore, BedDouble, BriefcaseBusiness, CalendarDays, Check,
  ChevronLeft, ChevronRight, CirclePlus, ClipboardCheck, Clock3, Copy,
  Dumbbell, Eye, EyeOff, GripVertical, Home, Lightbulb, PawPrint, Pencil,
  Pin, PinOff, Repeat2, Sparkles, StickyNote, Trash2, Utensils,
  WashingMachine, X
} from 'lucide-react'
import { loadState, saveState } from './storage'
import './v4.css'

const COLORS = [
  ['blue', 'Trabalho', '#356CF1'], ['green', 'Saúde', '#24945A'],
  ['purple', 'Estudo', '#7650D8'], ['yellow', 'Casa', '#E3A008'],
  ['orange', 'Pessoal', '#EB6A23'], ['red', 'Importante', '#D94444'],
  ['gray', 'Neutro', '#626B64'], ['pink', 'Lazer', '#C74783']
].map(([key,label,hex]) => ({ key,label,hex }))

const ICONS = {
  work: BriefcaseBusiness, gym: Dumbbell, dogs: PawPrint, study: ClipboardCheck,
  trash: Trash2, food: Utensils, laundry: WashingMachine, sleep: BedDouble,
  note: StickyNote, idea: Lightbulb, default: Clock3
}

const WEEK = [
  { key:1, short:'Seg' }, { key:2, short:'Ter' }, { key:3, short:'Qua' },
  { key:4, short:'Qui' }, { key:5, short:'Sex' }, { key:6, short:'Sáb' }, { key:0, short:'Dom' }
]

const id = () => crypto.randomUUID()
const keyOf = d => [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x }
const toMin = t => { if (!t) return null; const [h,m] = t.split(':').map(Number); return h*60+m }
const colorHex = key => COLORS.find(c => c.key === key)?.hex || '#626B64'
const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : ''
const ptDate = new Intl.DateTimeFormat('pt-BR', { weekday:'long', day:'2-digit', month:'long' })
const ptMonth = new Intl.DateTimeFormat('pt-BR', { month:'long', year:'numeric' })

function Icon({ name, size=17 }) {
  const C = ICONS[name] || ICONS.default
  return <C size={size}/>
}

function classify(title='') {
  const s = title.toLowerCase()
  const rules = [
    [['academia','treino','caminhada','passear','cachorro'], ['green','gym']],
    [['estudar','estudo','curso','aula','ler','leitura'], ['purple','study']],
    [['trabalho','escritório','reunião','office','expediente'], ['blue','work']],
    [['lixo','limpar','limpeza','banheiro','pano','casa'], ['yellow','trash']],
    [['roupa','lavanderia'], ['yellow','laundry']],
    [['marmita','cozinhar','comida','mercado','almoço','jantar'], ['orange','food']],
    [['dormir','sono','acordar'], ['gray','sleep']],
    [['urgente','importante'], ['red','default']],
    [['lazer','filme','jogo','descanso','livre'], ['pink','default']]
  ]
  for (const [terms, result] of rules) if (terms.some(t => s.includes(t))) return { color:result[0], icon:result[1] }
  return { color:'gray', icon:'default' }
}

function seed() {
  const routine = (title,time,endTime,days,color,icon,details='') => ({ id:id(), title,time,endTime,days,color,icon,details })
  return {
    version:4,
    routines:[
      routine('Sono','23:00','08:00',[0,1,2,3,4,5,6],'gray','sleep','Horário-base de sono.'),
      routine('Colocar lixo para fora','08:10','08:20',[1,3,5],'yellow','trash'),
      routine('Trabalho — entrada','09:00','09:10',[1,2,3,4,5],'blue','work'),
      routine('Almoço','12:00','13:00',[1,2,3,4,5],'orange','food'),
      routine('Academia','12:05','13:00',[1,2,5],'green','gym'),
      routine('Trabalho — saída','18:00','18:10',[1,2,3,4,5],'red','work','Encerrar e anotar o próximo passo.'),
      routine('Passear com os cachorros','18:30','19:00',[0,1,2,3,4,5,6],'green','dogs'),
      routine('Estudar 1h','20:00','21:00',[0,1,2,3,4,5,6],'purple','study'),
      routine('Projeto pessoal','21:10','22:00',[2,6],'orange','work'),
      routine('Planejar amanhã','22:15','22:25',[0,1,2,3,4,5,6],'purple','study'),
      routine('Lavar roupa','19:00','19:40',[2,4,6],'yellow','laundry'),
      routine('Passar pano / limpeza rápida','19:10','19:40',[2],'yellow','trash'),
      routine('Limpar banheiro','19:10','19:50',[4],'yellow','trash'),
      routine('Reciclável','09:00','09:15',[6],'yellow','trash'),
      routine('Limpeza maior da casa','10:00','12:00',[6],'yellow','trash'),
      routine('Preparar marmitas / congelados','15:00','17:00',[0],'orange','food'),
      routine('Planejar a semana','20:00','20:30',[0],'purple','study'),
      routine('Noite livre','20:00','23:00',[5],'pink','default')
    ],
    tasks:[
      { id:id(), title:'Dia de escritório', date:'2026-09-09', time:'08:00', endTime:'18:30', color:'blue', icon:'work', details:'Deslocamento + trabalho presencial.' },
      { id:id(), title:'Home office', date:'2026-09-10', time:'09:00', endTime:'18:00', color:'green', icon:'work', details:'Exceção desta semana.' },
      { id:id(), title:'Repor marmitas no freezer', date:'2026-09-13', time:'17:00', endTime:'17:30', color:'orange', icon:'food', details:'Criar estoque anti-delivery.' },
      { id:id(), title:'Revisar o que funcionou na rotina', date:'2026-09-20', time:'19:30', endTime:'20:00', color:'purple', icon:'study', details:'' },
      { id:id(), title:'Planejar outubro', date:'2026-09-27', time:'19:30', endTime:'20:15', color:'red', icon:'default', details:'' }
    ],
    priorities:{}, completions:{},
    notes:[
      { id:id(), title:'Ideias para projetos pessoais', body:'• Melhorias do Minha Rotina\n• Ideias rápidas da semana', category:'Ideias', color:'orange', favorite:true, archived:false, private:false, createdAt:Date.now() },
      { id:id(), title:'Checklist da casa', body:'Lixo seg/qua/sex\nReciclável sábado\nRoupa 2–3x por semana', category:'Casa', color:'yellow', favorite:false, archived:false, private:false, createdAt:Date.now() }
    ],
    noteCategories:['Ideias','Casa','Trabalho','Estudo','Pessoal'],
    quickTemplates:[
      { id:'office', title:'Dia de escritório', time:'08:00', endTime:'18:30', color:'blue', icon:'work', details:'Deslocamento + trabalho presencial.' },
      { id:'gym', title:'Academia', time:'12:00', endTime:'13:00', color:'green', icon:'gym', details:'' },
      { id:'dogs', title:'Passear com os cachorros', time:'18:30', endTime:'19:00', color:'green', icon:'dogs', details:'' },
      { id:'study', title:'Estudar 1h', time:'20:00', endTime:'21:00', color:'purple', icon:'study', details:'' },
      { id:'clean', title:'Limpeza da casa', time:'19:00', endTime:'20:00', color:'yellow', icon:'trash', details:'' },
      { id:'meal', title:'Preparar marmitas', time:'15:00', endTime:'17:00', color:'orange', icon:'food', details:'' }
    ]
  }
}

function normalize(raw) {
  const s = seed()
  return {
    ...s, ...raw, version:4,
    routines:(raw?.routines || s.routines).map(r => ({ details:'', ...classify(r.title), ...r })),
    tasks:(raw?.tasks || s.tasks).map(t => ({ endTime:'', details:'', ...classify(t.title), ...t })),
    priorities:raw?.priorities || {}, completions:raw?.completions || {},
    notes:raw?.notes || s.notes, noteCategories:raw?.noteCategories || s.noteCategories,
    quickTemplates:raw?.quickTemplates || s.quickTemplates
  }
}

function getWeek(base) {
  const day = base.getDay(), monday = addDays(base, day === 0 ? -6 : 1-day)
  return Array.from({length:7}, (_,i) => addDays(monday,i))
}
function getMonthCells(base) {
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const start = addDays(first, first.getDay() === 0 ? -6 : 1-first.getDay())
  return Array.from({length:42}, (_,i) => addDays(start,i))
}

function dragPayload(e, payload) {
  e.dataTransfer.effectAllowed = payload.kind === 'task' ? 'move' : 'copy'
  e.dataTransfer.setData('application/x-minha-rotina', JSON.stringify(payload))
  e.dataTransfer.setData('text/plain', payload.item?.title || 'item')
}
function readDrag(e, fallback) {
  try {
    const raw = e.dataTransfer.getData('application/x-minha-rotina')
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export default function AppV4() {
  const [data,setData] = useState(null)
  const [tab,setTab] = useState('today')
  const [date,setDate] = useState(new Date())
  const [weekAnchor,setWeekAnchor] = useState(new Date())
  const [monthAnchor,setMonthAnchor] = useState(new Date())
  const [taskEditor,setTaskEditor] = useState(null)
  const [routineEditor,setRoutineEditor] = useState(null)
  const [noteEditor,setNoteEditor] = useState(null)
  const [showArchived,setShowArchived] = useState(false)
  const [dragged,setDragged] = useState(null)

  useEffect(() => { loadState(seed()).then(v => setData(normalize(v))) }, [])
  useEffect(() => { if (data) saveState(data) }, [data])
  if (!data) return <div className="v4-loading">Carregando sua rotina…</div>

  const save = fn => setData(p => typeof fn === 'function' ? fn(p) : fn)
  const dateKey = keyOf(date)
  const routinesToday = data.routines.filter(r => r.days.includes(date.getDay()))
  const tasksToday = data.tasks.filter(t => t.date === dateKey)
  const priorities = (data.priorities[dateKey] || []).map((p,i) => typeof p === 'string' ? { id:'legacy-'+i, title:p, color:'red' } : p)
  const done = (itemId,type='task',k=dateKey) => !!data.completions[`${k}:${type}:${itemId}`]
  const toggle = (itemId,type='task',k=dateKey) => save(p => ({ ...p, completions:{ ...p.completions, [`${k}:${type}:${itemId}`]:!p.completions[`${k}:${type}:${itemId}`] } }))
  const upsertTask = task => save(p => ({ ...p, tasks:p.tasks.some(x => x.id === task.id) ? p.tasks.map(x => x.id === task.id ? task : x) : [...p.tasks,{...task,id:id()}] }))
  const upsertRoutine = routine => save(p => ({ ...p, routines:p.routines.some(x => x.id === routine.id) ? p.routines.map(x => x.id === routine.id ? routine : x) : [...p.routines,{...routine,id:id()}] }))
  const deleteTask = taskId => confirm('Remover esta tarefa?') && save(p => ({...p,tasks:p.tasks.filter(t=>t.id!==taskId)}))
  const deleteRoutine = routineId => confirm('Remover esta rotina?') && save(p => ({...p,routines:p.routines.filter(r=>r.id!==routineId)}))

  const dropOnDate = (e,targetDate) => {
    e.preventDefault()
    const payload = readDrag(e, dragged)
    if (!payload) return
    if (payload.kind === 'task') save(p => ({...p,tasks:p.tasks.map(t=>t.id===payload.item.id?{...t,date:targetDate}:t)}))
    if (payload.kind === 'template') upsertTask({...payload.item,id:null,date:targetDate})
    setDragged(null)
  }

  const addPriority = title => {
    const next = [...priorities,{id:id(),title,color:classify(title).color}]
    save(p => ({...p,priorities:{...p.priorities,[dateKey]:next}}))
  }

  const upsertNote = note => save(p => ({
    ...p,
    notes:p.notes.some(n=>n.id===note.id) ? p.notes.map(n=>n.id===note.id?note:n) : [...p.notes,{...note,id:id(),createdAt:Date.now()}],
    noteCategories:note.category && !p.noteCategories.includes(note.category) ? [...p.noteCategories,note.category] : p.noteCategories
  }))
  const deleteNote = noteId => confirm('Excluir esta anotação?') && save(p => ({...p,notes:p.notes.filter(n=>n.id!==noteId)}))

  return <div className="v4-shell">
    <aside className="v4-sidebar">
      <div className="v4-brand"><span>MR</span><div><strong>Minha Rotina</strong><small>um dia de cada vez</small></div></div>
      <nav>
        <Nav active={tab==='today'} icon={<Home size={18}/>} label="Hoje" onClick={()=>setTab('today')}/>
        <Nav active={tab==='week'} icon={<CalendarDays size={18}/>} label="Semana" onClick={()=>setTab('week')}/>
        <Nav active={tab==='month'} icon={<CalendarDays size={18}/>} label="Mês" onClick={()=>setTab('month')}/>
        <Nav active={tab==='routines'} icon={<Repeat2 size={18}/>} label="Rotinas" onClick={()=>setTab('routines')}/>
        <Nav active={tab==='notes'} icon={<StickyNote size={18}/>} label="Anotações" onClick={()=>setTab('notes')}/>
      </nav>
      <div className="v4-legend">{COLORS.map(c=><span key={c.key}><i style={{background:c.hex}}/>{c.label}</span>)}</div>
    </aside>

    <main className="v4-content">
      {tab!=='notes' && <QuickBar templates={data.quickTemplates} setDragged={setDragged} onClick={t=>setTaskEditor({...t,id:null,date:dateKey})}/>} 

      {tab==='today' && <Today
        date={date} setDate={setDate} routines={routinesToday} tasks={tasksToday}
        priorities={priorities} done={done} toggle={toggle} save={save}
        setTaskEditor={setTaskEditor} setRoutineEditor={setRoutineEditor}
        deleteTask={deleteTask} deleteRoutine={deleteRoutine} addPriority={addPriority}
      />}

      {tab==='week' && <Week
        week={getWeek(weekAnchor)} setWeekAnchor={setWeekAnchor} data={data}
        setDragged={setDragged} dropOnDate={dropOnDate} setTaskEditor={setTaskEditor} deleteTask={deleteTask}
      />}

      {tab==='month' && <Month
        monthAnchor={monthAnchor} setMonthAnchor={setMonthAnchor} cells={getMonthCells(monthAnchor)}
        data={data} setDragged={setDragged} dropOnDate={dropOnDate} setTaskEditor={setTaskEditor}
      />}

      {tab==='routines' && <Routines data={data} setRoutineEditor={setRoutineEditor} deleteRoutine={deleteRoutine}/>} 

      {tab==='notes' && <Notes
        notes={data.notes.filter(n=>n.archived===showArchived).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||b.createdAt-a.createdAt)}
        showArchived={showArchived} setShowArchived={setShowArchived} save={save}
        setNoteEditor={setNoteEditor} deleteNote={deleteNote}
      />}
    </main>

    {taskEditor && <TaskModal item={taskEditor} close={()=>setTaskEditor(null)} saveItem={x=>{upsertTask(x);setTaskEditor(null)}}/>}
    {routineEditor && <RoutineModal item={routineEditor} close={()=>setRoutineEditor(null)} saveItem={x=>{upsertRoutine(x);setRoutineEditor(null)}}/>}
    {noteEditor && <NoteModal item={noteEditor} categories={data.noteCategories} close={()=>setNoteEditor(null)} saveItem={x=>{upsertNote(x);setNoteEditor(null)}}/>}
  </div>
}

function Nav({active,icon,label,onClick}) { return <button className={active?'active':''} onClick={onClick}>{icon}{label}</button> }
function Header({eyebrow,title,subtitle,actions}) { return <header className="v4-header"><div><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div><div className="v4-header-actions">{actions}</div></header> }
function Card({title,eyebrow,action,children,className=''}) { return <article className={`v4-card ${className}`}><div className="v4-card-head"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>{children}</article> }

function QuickBar({templates,setDragged,onClick}) {
  return <div className="v4-quickbar">
    <div className="v4-quick-title"><Sparkles size={16}/><strong>Rápidos</strong></div>
    {templates.map(t=><button
      key={t.id} draggable="true"
      onDragStart={e=>{ const p={kind:'template',item:t}; setDragged(p); dragPayload(e,p) }}
      onDragEnd={()=>setDragged(null)} onClick={()=>onClick(t)}
      style={{'--c':colorHex(t.color)}}
    ><GripVertical size={14}/><Icon name={t.icon}/><span>{t.title}</span></button>)}
    <small>Arraste para um dia da Semana/Mês ou clique para editar.</small>
  </div>
}

function Today({date,setDate,routines,tasks,priorities,done,toggle,save,setTaskEditor,setRoutineEditor,deleteTask,deleteRoutine,addPriority}) {
  const dateKey = keyOf(date)
  const events = [...routines.map(r=>({...r,kind:'routine'})), ...tasks.map(t=>({...t,kind:'task'}))]
    .sort((a,b)=>(toMin(a.time)??9999)-(toMin(b.time)??9999))
  const suggestions = ['Terminar a tarefa mais importante do trabalho','Estudar 1h','Ir à academia','Passear com os cachorros','Lavar roupa','Preparar marmitas','Resolver uma pendência da casa','Avançar no projeto pessoal','Planejar amanhã']

  return <>
    <Header eyebrow="Seu dia" title="Hoje" subtitle={ptDate.format(date)} actions={<>
      <button className="v4-icon" onClick={()=>setDate(addDays(date,-1))}><ChevronLeft size={18}/></button>
      <button className="v4-ghost" onClick={()=>setDate(new Date())}>Hoje</button>
      <button className="v4-icon" onClick={()=>setDate(addDays(date,1))}><ChevronRight size={18}/></button>
    </>}/>

    <section className="v4-today-grid">
      <Card title="Dia completo — 24h" eyebrow="Linha do tempo" className="v4-day-card">
        <DayTimeline events={events}/>
      </Card>

      <div className="v4-right-stack">
        <Card title="Itens de hoje" eyebrow="Agenda" action={<button className="v4-small" onClick={()=>setTaskEditor({id:null,title:'',date:dateKey,time:'',endTime:'',details:'',...classify('')})}><CirclePlus size={15}/>Tarefa</button>}>
          <div className="v4-agenda-list">
            {events.map(e=>{
              const type=e.kind==='routine'?'routine':'task', isDone=done(e.id,type)
              return <div className={`v4-agenda-row ${isDone?'done':''}`} style={{'--c':colorHex(e.color)}} key={e.kind+e.id}>
                <button className="v4-check" onClick={()=>toggle(e.id,type)}>{isDone&&<Check size={14}/>}</button>
                <span className="v4-agenda-time">{e.time}{e.endTime?`–${e.endTime}`:''}</span>
                <span className="v4-agenda-icon"><Icon name={e.icon}/></span>
                <div><strong>{e.title}</strong>{e.details&&<small>{e.details}</small>}</div>
                <button className="v4-mini" onClick={()=>e.kind==='routine'?setRoutineEditor(e):setTaskEditor(e)}><Pencil size={14}/></button>
                <button className="v4-mini danger" onClick={()=>e.kind==='routine'?deleteRoutine(e.id):deleteTask(e.id)}><Trash2 size={14}/></button>
              </div>
            })}
          </div>
        </Card>
        <NowPanel date={date} events={events}/>
      </div>
    </section>

    <Card title="Prioridades" eyebrow="Foco — deixe para revisar no fim da página" action={<button className="v4-small" onClick={()=>addPriority('Nova prioridade')}><CirclePlus size={15}/>Adicionar</button>} className="v4-priority-bottom">
      <div className="v4-suggestions"><span><Lightbulb size={14}/> Ideias rápidas:</span>{suggestions.map(s=><button key={s} onClick={()=>addPriority(s)}>{s}</button>)}</div>
      {!priorities.length && <div className="v4-empty">Clique em uma ideia acima ou adicione algo seu.</div>}
      <div className="v4-priority-list">{priorities.map((p,i)=><div className="v4-priority" key={p.id}>
        <span style={{background:colorHex(p.color)}}>{i+1}</span>
        <input value={p.title} onChange={e=>save(d=>({...d,priorities:{...d.priorities,[dateKey]:priorities.map(x=>x.id===p.id?{...x,title:e.target.value}:x)}}))}/>
        <button className="v4-mini danger" onClick={()=>save(d=>({...d,priorities:{...d.priorities,[dateKey]:priorities.filter(x=>x.id!==p.id)}}))}><Trash2 size={14}/></button>
      </div>)}</div>
    </Card>
  </>
}

function timelinePieces(events) {
  const pieces=[]
  events.forEach(e=>{
    const start=toMin(e.time); if(start==null)return
    let end=e.endTime?toMin(e.endTime):start+20
    if(end==null) end=start+20
    if(e.icon==='sleep' && end<=start) end+=1440
    if(end<=start) end=start+20
    if(end>1440){pieces.push({event:e,start,end:1440,key:e.id+'a'});pieces.push({event:e,start:0,end:end-1440,key:e.id+'b'})}
    else pieces.push({event:e,start,end,key:e.id})
  })
  pieces.sort((a,b)=>a.start-b.start || a.end-b.end)

  const groups=[]
  let current=[], groupEnd=-1
  for(const p of pieces){
    if(!current.length || p.start<groupEnd){current.push(p);groupEnd=Math.max(groupEnd,p.end)}
    else {groups.push(current);current=[p];groupEnd=p.end}
  }
  if(current.length)groups.push(current)

  const laid=[]
  for(const group of groups){
    const laneEnds=[]
    group.forEach(p=>{
      let lane=laneEnds.findIndex(end=>end<=p.start)
      if(lane<0){lane=laneEnds.length;laneEnds.push(p.end)} else laneEnds[lane]=p.end
      p.lane=lane
    })
    const count=Math.max(1,laneEnds.length)
    group.forEach(p=>laid.push({...p,laneCount:count}))
  }
  return laid
}

function DayTimeline({events}) {
  const pieces=useMemo(()=>timelinePieces(events),[events])
  return <div className="v4-day24">
    {Array.from({length:25},(_,h)=><div className="v4-hour" style={{top:`${(h/24)*100}%`}} key={h}><span>{String(h%24).padStart(2,'0')}:00</span><i/></div>)}
    {pieces.map(p=>{
      const width=100/p.laneCount
      return <div className="v4-time-block" key={p.key} title={p.event.details||p.event.title} style={{
        top:`${(p.start/1440)*100}%`, height:`${Math.max(((p.end-p.start)/1440)*100,1.25)}%`,
        left:`calc(58px + ${(p.lane*width)}% * .84)`, width:`calc(${width}% * .84 - 4px)`,
        background:colorHex(p.event.color)
      }}><Icon name={p.event.icon} size={12}/><span>{p.event.title}</span></div>
    })}
  </div>
}

function NowPanel({date,events}) {
  const [now,setNow]=useState(new Date())
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t)},[])
  const isToday=keyOf(date)===keyOf(now)
  const currentMin=now.getHours()*60+now.getMinutes()+now.getSeconds()/60
  const candidates=events.map(e=>{
    const start=toMin(e.time); if(start==null)return null
    let end=e.endTime?toMin(e.endTime):start+20
    if(e.icon==='sleep'&&end<=start)end+=1440
    if(end<=start)end=start+20
    let cur=currentMin
    if(end>1440 && cur<start)cur+=1440
    return {...e,_start:start,_end:end,_cur:cur,_duration:end-start}
  }).filter(Boolean)
  const active=isToday?candidates.filter(e=>e._cur>=e._start&&e._cur<e._end).sort((a,b)=>a._duration-b._duration)[0]:null
  const upcoming=isToday?candidates.filter(e=>e._start>currentMin).sort((a,b)=>a._start-b._start)[0]:candidates.sort((a,b)=>a._start-b._start)[0]
  const target=active?active._end:(upcoming?upcoming._start:null)
  const seconds=target==null?null:Math.max(0,Math.round((target-(active?active._cur:currentMin))*60))
  const fmt=s=>`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return <article className="v4-now">
    <div className="v4-now-top"><Clock3 size={22}/><span>AGORA</span></div>
    {!isToday ? <><h2>Visualizando outro dia</h2><p>Primeiro item planejado: <strong>{upcoming?.title||'nenhum'}</strong>.</p></> : active ? <>
      <h2>{active.title}</h2>
      <p>Você deveria estar nisso agora.</p>
      <div className="v4-countdown"><strong>{seconds!=null?fmt(seconds):'--:--:--'}</strong><span>até terminar</span></div>
      <div className="v4-next">Próximo: <strong>{upcoming?.title||'fim da agenda'}</strong>{upcoming?.time?` às ${upcoming.time}`:''}</div>
    </> : <>
      <h2>Intervalo livre</h2>
      <p>Não há atividade programada neste horário.</p>
      {upcoming?<><div className="v4-countdown"><strong>{fmt(seconds||0)}</strong><span>até a próxima</span></div><div className="v4-next">Próximo: <strong>{upcoming.title}</strong> às {upcoming.time}</div></>:<div className="v4-next">Sua agenda de hoje terminou.</div>}
    </>}
  </article>
}

function Week({week,setWeekAnchor,data,setDragged,dropOnDate,setTaskEditor,deleteTask}) {
  return <><Header eyebrow="Visão geral" title="Semana" subtitle="Arraste tarefas ou itens rápidos para qualquer dia." actions={<>
    <button className="v4-icon" onClick={()=>setWeekAnchor(d=>addDays(d,-7))}><ChevronLeft size={18}/></button>
    <button className="v4-ghost" onClick={()=>setWeekAnchor(new Date())}>Esta semana</button>
    <button className="v4-icon" onClick={()=>setWeekAnchor(d=>addDays(d,7))}><ChevronRight size={18}/></button>
  </>}/>
  <section className="v4-week">{week.map(d=>{const k=keyOf(d),ts=data.tasks.filter(t=>t.date===k),rs=data.routines.filter(r=>r.days.includes(d.getDay()));return <article className="v4-dropday" key={k} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='copy'}} onDrop={e=>dropOnDate(e,k)}>
    <div className="v4-day-head"><span>{WEEK.find(w=>w.key===d.getDay())?.short}</span><strong>{d.getDate()}</strong></div>
    <div className="v4-mini-list">{rs.map(r=><div className="v4-mini-item" style={{'--c':colorHex(r.color)}} key={r.id}><Icon name={r.icon} size={11}/><span>{r.time} {r.title}</span></div>)}
    {ts.map(t=><div className="v4-mini-item task" draggable="true" onDragStart={e=>{const p={kind:'task',item:t};setDragged(p);dragPayload(e,p)}} onDragEnd={()=>setDragged(null)} style={{'--c':colorHex(t.color)}} key={t.id}><GripVertical size={11}/><Icon name={t.icon} size={11}/><button onClick={()=>setTaskEditor(t)}>{t.time} {t.title}</button><button onClick={()=>deleteTask(t.id)}><Trash2 size={10}/></button></div>)}</div>
    <button className="v4-addday" onClick={()=>setTaskEditor({id:null,title:'',date:k,time:'',endTime:'',details:'',...classify('')})}><CirclePlus size={14}/> tarefa</button>
  </article>})}</section></>
}

function Month({monthAnchor,setMonthAnchor,cells,data,setDragged,dropOnDate,setTaskEditor}) {
  const copyPrev=()=>{
    const cur=new Date(monthAnchor.getFullYear(),monthAnchor.getMonth(),1), prev=new Date(cur.getFullYear(),cur.getMonth()-1,1)
    const pk=keyOf(prev).slice(0,7), ck=keyOf(cur).slice(0,7), source=data.tasks.filter(t=>t.date.startsWith(pk))
    if(!source.length)return alert('O mês anterior não tem tarefas pontuais para copiar.')
    alert('A cópia do mês anterior continua disponível; use a versão atual do botão depois que configurarmos sincronização.')
  }
  return <><Header eyebrow="Planejamento" title={cap(ptMonth.format(monthAnchor))} subtitle="Arraste tarefas e rápidos diretamente para os dias." actions={<>
    <button className="v4-ghost" onClick={copyPrev}><Copy size={15}/>Copiar mês anterior</button>
    <button className="v4-icon" onClick={()=>setMonthAnchor(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}><ChevronLeft size={18}/></button>
    <button className="v4-ghost" onClick={()=>setMonthAnchor(new Date())}>Este mês</button>
    <button className="v4-icon" onClick={()=>setMonthAnchor(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}><ChevronRight size={18}/></button>
  </>}/>
  <div className="v4-month-weekdays">{WEEK.map(w=><span key={w.key}>{w.short}</span>)}</div>
  <section className="v4-month">{cells.map(d=>{const k=keyOf(d),ts=data.tasks.filter(t=>t.date===k),rs=data.routines.filter(r=>r.days.includes(d.getDay()));return <article className={`v4-month-cell ${d.getMonth()!==monthAnchor.getMonth()?'muted':''}`} key={k} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='copy'}} onDrop={e=>dropOnDate(e,k)}>
    <div className="v4-month-head"><strong>{d.getDate()}</strong><button onClick={()=>setTaskEditor({id:null,title:'',date:k,time:'',endTime:'',details:'',...classify('')})}><CirclePlus size={13}/></button></div>
    <div className="v4-month-items">{[...rs.slice(0,3).map(r=>({...r,_routine:true})),...ts].slice(0,7).map(e=><button className="v4-month-item" draggable={!e._routine} onDragStart={ev=>{if(e._routine)return;const p={kind:'task',item:e};setDragged(p);dragPayload(ev,p)}} onDragEnd={()=>setDragged(null)} onClick={()=>!e._routine&&setTaskEditor(e)} style={{'--c':colorHex(e.color)}} key={(e._routine?'r':'t')+e.id}>{e.time} {e.title}</button>)}</div>
  </article>})}</section></>
}

function Routines({data,setRoutineEditor,deleteRoutine}) {
  return <><Header eyebrow="Automático" title="Rotinas" subtitle="Edite horários, dias, detalhes, cores e ícones." actions={<button className="v4-primary" onClick={()=>setRoutineEditor({id:null,title:'',time:'08:00',endTime:'',days:[1,2,3,4,5],details:'',...classify('')})}><CirclePlus size={16}/>Nova rotina</button>}/>
  <section className="v4-routines">{data.routines.map(r=><article className="v4-routine" style={{'--c':colorHex(r.color)}} key={r.id}><span className="v4-routine-icon"><Icon name={r.icon}/></span><div><strong>{r.title}</strong><small>{r.time}{r.endTime?`–${r.endTime}`:''}</small><div className="v4-days">{WEEK.map(w=><span className={r.days.includes(w.key)?'on':''} key={w.key}>{w.short[0]}</span>)}</div></div><button className="v4-mini" onClick={()=>setRoutineEditor(r)}><Pencil size={14}/></button><button className="v4-mini danger" onClick={()=>deleteRoutine(r.id)}><Trash2 size={14}/></button></article>)}</section></>
}

function Notes({notes,showArchived,setShowArchived,save,setNoteEditor,deleteNote}) {
  return <><Header eyebrow="Quadro pessoal" title="Anotações" subtitle="Ideias, lembretes e referências. Não use como cofre de senhas." actions={<><button className="v4-ghost" onClick={()=>setShowArchived(v=>!v)}>{showArchived?<ArchiveRestore size={15}/>:<Archive size={15}/>} {showArchived?'Ativas':'Arquivadas'}</button><button className="v4-primary" onClick={()=>setNoteEditor({id:null,title:'',body:'',category:'Pessoal',color:'orange',favorite:false,archived:false,private:false})}><CirclePlus size={16}/>Nova anotação</button></>}/>
  <section className="v4-notes">{notes.map(n=><NoteCard key={n.id} note={n} edit={()=>setNoteEditor(n)} remove={()=>deleteNote(n.id)} update={patch=>save(p=>({...p,notes:p.notes.map(x=>x.id===n.id?{...x,...patch}:x)}))}/>)}</section></>
}
function NoteCard({note,edit,remove,update}) { const [reveal,setReveal]=useState(false); return <article className="v4-note" style={{'--c':colorHex(note.color)}}><div className="v4-note-head"><span>{note.category}</span><div><button onClick={()=>update({favorite:!note.favorite})}>{note.favorite?<PinOff size={14}/>:<Pin size={14}/>}</button><button onClick={edit}><Pencil size={14}/></button><button onClick={()=>update({archived:!note.archived})}>{note.archived?<ArchiveRestore size={14}/>:<Archive size={14}/>}</button><button onClick={remove}><Trash2 size={14}/></button></div></div><h3>{note.title}</h3>{note.private&&!reveal?<button className="v4-private" onClick={()=>setReveal(true)}><Eye size={14}/>Mostrar detalhes ocultos</button>:<><p>{note.body}</p>{note.private&&<button className="v4-private" onClick={()=>setReveal(false)}><EyeOff size={14}/>Ocultar</button>}</>}{note.favorite&&<span className="v4-favorite">★ favorito</span>}</article> }

function Modal({title,close,children}) { return <div className="v4-modal-bg"><section className="v4-modal"><div className="v4-modal-head"><h2>{title}</h2><button className="v4-icon" onClick={close}><X size={18}/></button></div>{children}</section></div> }
function Field({label,children}) { return <label className="v4-field"><span>{label}</span>{children}</label> }
function ColorPicker({value,onChange}) { return <div className="v4-color-picker">{COLORS.map(c=><button type="button" className={value===c.key?'selected':''} onClick={()=>onChange(c.key)} key={c.key}><i style={{background:c.hex}}/>{c.label}</button>)}</div> }
function IconPicker({value,onChange}) { return <div className="v4-icon-picker">{Object.keys(ICONS).filter(k=>k!=='default').map(k=><button type="button" className={value===k?'selected':''} onClick={()=>onChange(k)} key={k}><Icon name={k}/></button>)}</div> }

function TaskModal({item,close,saveItem}) {
  const [x,setX]=useState({...item})
  const autoTitle=v=>{const guess=classify(v);setX(p=>({...p,title:v,...guess}))}
  return <Modal title={x.id?'Editar tarefa':'Nova tarefa'} close={close}><form onSubmit={e=>{e.preventDefault();if(x.title.trim())saveItem(x)}}>
    <Field label="Tarefa"><input autoFocus value={x.title||''} onChange={e=>autoTitle(e.target.value)} placeholder="Ex.: mercado, escritório, academia"/></Field>
    <div className="v4-field-row"><Field label="Dia"><input type="date" value={x.date||''} onChange={e=>setX({...x,date:e.target.value})}/></Field><Field label="Início"><input type="time" value={x.time||''} onChange={e=>setX({...x,time:e.target.value})}/></Field><Field label="Fim"><input type="time" value={x.endTime||''} onChange={e=>setX({...x,endTime:e.target.value})}/></Field></div>
    <Field label="Detalhes"><textarea rows="4" value={x.details||''} onChange={e=>setX({...x,details:e.target.value})} placeholder="Anotações, contexto, checklist..."/></Field>
    <Field label="Cor"><ColorPicker value={x.color} onChange={color=>setX({...x,color})}/></Field>
    <Field label="Ícone"><IconPicker value={x.icon} onChange={icon=>setX({...x,icon})}/></Field>
    <div className="v4-modal-actions"><button type="button" className="v4-ghost" onClick={close}>Cancelar</button><button className="v4-primary">Salvar</button></div>
  </form></Modal>
}

function RoutineModal({item,close,saveItem}) {
  const [x,setX]=useState({...item})
  const toggleDay=d=>setX(p=>({...p,days:p.days.includes(d)?p.days.filter(v=>v!==d):[...p.days,d]}))
  return <Modal title={x.id?'Editar rotina':'Nova rotina'} close={close}><form onSubmit={e=>{e.preventDefault();if(x.title.trim()&&x.days.length)saveItem(x)}}>
    <Field label="Rotina"><input value={x.title||''} onChange={e=>{const v=e.target.value,g=classify(v);setX(p=>({...p,title:v,...g}))}}/></Field>
    <div className="v4-field-row"><Field label="Início"><input type="time" value={x.time||''} onChange={e=>setX({...x,time:e.target.value})}/></Field><Field label="Fim"><input type="time" value={x.endTime||''} onChange={e=>setX({...x,endTime:e.target.value})}/></Field></div>
    <Field label="Dias"><div className="v4-day-picker">{WEEK.map(w=><button type="button" className={x.days.includes(w.key)?'selected':''} onClick={()=>toggleDay(w.key)} key={w.key}>{w.short}</button>)}</div></Field>
    <Field label="Detalhes"><textarea rows="3" value={x.details||''} onChange={e=>setX({...x,details:e.target.value})}/></Field>
    <Field label="Cor"><ColorPicker value={x.color} onChange={color=>setX({...x,color})}/></Field>
    <Field label="Ícone"><IconPicker value={x.icon} onChange={icon=>setX({...x,icon})}/></Field>
    <div className="v4-modal-actions"><button type="button" className="v4-ghost" onClick={close}>Cancelar</button><button className="v4-primary">Salvar</button></div>
  </form></Modal>
}

function NoteModal({item,categories,close,saveItem}) {
  const [x,setX]=useState({...item})
  return <Modal title={x.id?'Editar anotação':'Nova anotação'} close={close}><form onSubmit={e=>{e.preventDefault();if(x.title.trim())saveItem(x)}}>
    <Field label="Título"><input value={x.title||''} onChange={e=>setX({...x,title:e.target.value})}/></Field>
    <Field label="Categoria"><input list="note-cats" value={x.category||''} onChange={e=>setX({...x,category:e.target.value})}/><datalist id="note-cats">{categories.map(c=><option value={c} key={c}/>)}</datalist></Field>
    <Field label="Conteúdo"><textarea rows="8" value={x.body||''} onChange={e=>setX({...x,body:e.target.value})}/></Field>
    <Field label="Cor"><ColorPicker value={x.color} onChange={color=>setX({...x,color})}/></Field>
    <div className="v4-check-options"><label><input type="checkbox" checked={!!x.favorite} onChange={e=>setX({...x,favorite:e.target.checked})}/> Favorito</label><label><input type="checkbox" checked={!!x.private} onChange={e=>setX({...x,private:e.target.checked})}/> Ocultar detalhes visualmente</label></div>
    <div className="v4-modal-actions"><button type="button" className="v4-ghost" onClick={close}>Cancelar</button><button className="v4-primary">Salvar</button></div>
  </form></Modal>
}
