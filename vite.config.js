import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function agendaSchedulingUpgrade(){
  return {
    name:'agenda-scheduling-upgrade',
    enforce:'pre',
    transform(code,id){
      if(!id.endsWith('/src/AppV6.jsx')&&!id.endsWith('\\src\\AppV6.jsx')) return null

      let next=code

      next=next.replace(
        /function taskOccurs\(t,dateKey\)\{[^\n]*\}/,
        `function taskOccurs(t,dateKey){
  if(t.repeat==='none'||!t.repeat)return t.date===dateKey
  const until=t.until||t.date
  if(dateKey<t.date||dateKey>until)return false
  if((t.excludedDates||[]).includes(dateKey))return false
  if(t.repeat==='weeklyRange'){
    const day=parseDate(dateKey).getDay()
    const selected=Array.isArray(t.weekdays)&&t.weekdays.length?t.weekdays:[0,1,2,3,4,5,6]
    return selected.includes(day)
  }
  return true
}`
      )

      next=next.replaceAll("task.repeat!=='daily'","!['daily','weeklyRange'].includes(task.repeat)")

      next=next.replace(
        /function TaskModal\(\{item,close,saveItem\}\)\{[\s\S]*?(?=\nfunction DeleteModal)/,
        `function TaskModal({item,close,saveItem}){
 const initialRepeat=item.repeat==='daily'?'weeklyRange':(item.repeat||'none')
 const initialDays=Array.isArray(item.weekdays)&&item.weekdays.length?item.weekdays:[0,1,2,3,4,5,6]
 const[x,setX]=useState({...item,repeat:initialRepeat,until:item.until||item.date,excludedDates:item.excludedDates||[],weekdays:initialDays})
 const isRange=x.repeat==='weeklyRange'
 const toggleWeekday=day=>setX(p=>({...p,weekdays:p.weekdays.includes(day)?p.weekdays.filter(d=>d!==day):[...p.weekdays,day]}))
 const submit=e=>{
   e.preventDefault()
   if(!x.title.trim())return
   if(isRange&&x.weekdays.length===0)return
   saveItem({...x,until:isRange?(x.until||x.date):x.date,repeat:isRange?'weeklyRange':'none'})
 }
 return<Modal title={x.id?'Editar tarefa':'Nova tarefa'} close={close}><form onSubmit={submit}>
   <Field label="Tarefa"><input value={x.title||''} onChange={e=>{const v=e.target.value;setX(p=>({...p,title:v,...classify(v)}))}}/></Field>
   <div className="v6-fieldrow">
     <Field label="Data inicial"><input type="date" value={x.date||''} onChange={e=>setX(p=>({...p,date:e.target.value,until:isRange?(p.until&&p.until>=e.target.value?p.until:e.target.value):e.target.value}))}/></Field>
     <Field label="Início"><input type="time" step="300" value={x.time||''} onChange={e=>setX({...x,time:e.target.value})}/></Field>
     <Field label="Fim"><input type="time" step="300" value={x.endTime||''} onChange={e=>setX({...x,endTime:e.target.value})}/></Field>
   </div>
   <Field label="Período"><select value={x.repeat} onChange={e=>setX(p=>({...p,repeat:e.target.value,until:e.target.value==='none'?p.date:(p.until||p.date),weekdays:e.target.value==='weeklyRange'&&(!p.weekdays||!p.weekdays.length)?[0,1,2,3,4,5,6]:p.weekdays}))}><option value="none">Somente neste dia</option><option value="weeklyRange">Entre duas datas / escolher dias da semana</option></select></Field>
   {isRange&&<>
     <div className="v6-fieldrow v6-date-range-row">
       <Field label="Data final"><input type="date" min={x.date||''} value={x.until||x.date||''} onChange={e=>setX({...x,until:e.target.value})}/></Field>
     </div>
     <Field label="Dias da semana"><div className="v6-days">{WEEK.map(w=><button type="button" className={x.weekdays.includes(w.key)?'selected':''} onClick={()=>toggleWeekday(w.key)} key={w.key}>{w.short}</button>)}</div>{x.weekdays.length===0&&<small style={{color:'#b34a4a'}}>Selecione pelo menos um dia.</small>}</Field>
   </>}
   <Field label="Detalhes"><textarea rows="4" value={x.details||''} onChange={e=>setX({...x,details:e.target.value})}/></Field>
   <Field label="Cor"><ColorPicker value={x.color} onChange={color=>setX({...x,color})}/></Field>
   <Field label="Ícone"><IconPicker value={x.icon} onChange={icon=>setX({...x,icon})}/></Field>
   <button className="v6-save">Salvar</button>
 </form></Modal>
}
`
      )

      if(next===code){
        console.warn('[agenda-scheduling-upgrade] Nenhuma alteração aplicada em AppV6.jsx')
      }
      return {code:next,map:null}
    }
  }
}

export default defineConfig({
  plugins: [agendaSchedulingUpgrade(), react()],
})
