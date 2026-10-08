export const criteria = ['Inzet en motivatie','Samenwerken','Communicatie','Verantwoordelijkheid nemen','Werkafspraken nakomen','Reflectie op eigen werk'];
export function grade(scores, honesty) {
  if (scores.length !== 6 || ![...scores,honesty].every(x => Number.isInteger(x) && x >= 1 && x <= 4)) return null;
  return ((scores.reduce((a,b)=>a+b,0)+honesty)/7-1)*10/3;
}
export function processGrade(reviews, expected) {
  if (reviews.length !== expected || reviews.some(r=>r.grade === null)) return null;
  return reviews.reduce((a,r)=>a+r.grade,0)/expected;
}
export function csvCell(value) { return '"'+String(value ?? '').replace(/^[=+@\-\t\r]/,'\u0027$&').replaceAll('"','""')+'"'; }
