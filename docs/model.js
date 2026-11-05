export const mean = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
export function summary(group, submissions) {
 const rows=submissions.filter(s=>s.group_id===group.id);
 return group.roster.map(person=>{
  const own=rows.find(s=>s.actor_id===person.id);
  const self=own?.answers.find(a=>a.target_id===person.id)?.criteria;
  const peers=rows.filter(s=>s.actor_id!==person.id).map(s=>s.answers.find(a=>a.target_id===person.id)?.criteria).filter(Boolean);
  const selfMean=self?mean(self.map(c=>c.score)):null;
  const peerMean=peers.length?mean(peers.flatMap(c=>c.map(x=>x.score))):null;
  return {person,own,self,peers,selfMean,peerMean,gap:selfMean!==null&&peerMean!==null?Math.abs(selfMean-peerMean):null};
 });
}
export function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export const csv = rows => '\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');
