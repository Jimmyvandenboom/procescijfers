import test from 'node:test';
import assert from 'node:assert/strict';
import {summary,csv} from '../docs/model.js';
const criteria=n=>Array.from({length:6},()=>({score:n,comment:'Voorbeeld'}));
const group={id:'g',roster:[{id:'a',name:'A'},{id:'b',name:'B'},{id:'c',name:'C'}]};
test('Zelf- en peer-scores blijven gescheiden; ontbrekend formulier is geen nul',()=>{
 const result=summary(group,[{group_id:'g',actor_id:'a',answers:[{target_id:'a',criteria:criteria(4)},{target_id:'b',criteria:criteria(2)},{target_id:'c',criteria:criteria(3)}]},{group_id:'g',actor_id:'b',answers:[{target_id:'a',criteria:criteria(2)},{target_id:'b',criteria:criteria(3)},{target_id:'c',criteria:criteria(1)}]}]);
 assert.equal(result[0].selfMean,4);assert.equal(result[0].peerMean,2);assert.equal(result[0].gap,2);
 assert.equal(result[2].selfMean,null);assert.equal(result[2].peerMean,2);assert.equal(result[2].peers.length,2);
});
test('CSV behoudt quotes en regeleinden en neutraliseert Excel-formules',()=>{
 const result=csv([['=HYPERLINK("x")','naam;test','regel\n2']]);
 assert.ok(result.startsWith('\ufeff'));assert.ok(result.includes('"\'=HYPERLINK(""x"")"'));assert.ok(result.includes('"naam;test"'));assert.ok(result.includes('"regel\n2"'));
});
