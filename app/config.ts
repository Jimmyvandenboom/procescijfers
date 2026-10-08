export const projects=[{id:'stad',name:'Stad van de Toekomst',tag:'Klas 3 · Expeditie 1',groups:[['Alex','Bo','Charlie','Dani'],['Eli','Finn']]},{id:'campus',name:'Campus@Sea',tag:'Klas 4 · Expeditie 1',groups:[['Alex','Bo'],['Charlie','Dani','Eli','Finn']]}];
export function members(project:string,actor:string){return projects.find(p=>p.id===project)?.groups.find(g=>g.includes(actor));}
