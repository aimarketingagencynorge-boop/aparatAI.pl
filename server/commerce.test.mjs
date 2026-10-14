import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import Stripe from 'stripe';
import { createApp, errorHandler } from './app.mjs';
import { installAccounts } from './accounts.mjs';
import { MemoryTrialStore } from './trial-store.mjs';
import { TestDB } from './test-db.mjs';

const image=`data:image/png;base64,${(await sharp({create:{width:8,height:8,channels:3,background:'white'}}).png().toBuffer()).toString('base64')}`;
async function fixture(t, { videoFailure=false, startFailure=false, pending=false, paypalWrongAmount=false }={}) {
 const db=new TestDB(); db.documents.set('users/u1',{credits:100,totalCredits:100,plan:'starter'});let starts=0,captures=0;
 const videoProvider={start:async()=>{starts++;if(startFailure)throw new Error('Provider rejected');return 'operations/video1';},poll:async()=>pending?{done:false}:videoFailure?{done:true,failed:true}:{done:true,uri:'https://generativelanguage.googleapis.com/video/test'},download:async()=>Buffer.from('mp4-test')};
 const paypal=async(path,method,body)=>{
  if(path==='/v2/checkout/orders')return{id:'ORDER12345',links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token=ORDER12345'}]};
  if(method==='POST')captures++;
  return{id:'ORDER12345',intent:'CAPTURE',status:method==='POST'||captures?'COMPLETED':'APPROVED',purchase_units:[{payments:{captures:[{status:'COMPLETED',amount:{currency_code:'PLN',value:paypalWrongAmount?'1.00':'99.00'}}]}}]};
 };
 const stripe={webhooks:new Stripe('sk_test_fixture').webhooks,prices:{retrieve:async()=>({active:true,unit_amount:9900,currency:'pln'})},checkout:{sessions:{create:async()=>({id:'cs_test_checkout',url:'https://checkout.stripe.com/test'}),retrieve:async()=>({id:'cs_test_checkout',payment_status:'paid',amount_total:9900,currency:'pln',client_reference_id:'u1',metadata:{plan:'starter'}}),listLineItems:async()=>({data:[{price:{id:'price_test'},quantity:1}]})}}};
 const app=createApp({store:new MemoryTrialStore(),secret:'test-secret-that-is-at-least-32-characters',origins:['https://aparatai.pl'],generate:async()=>image,logger:()=>{}});
 installAccounts(app,{db,generate:async()=>image,origin:'https://aparatai.pl',configuredPlans:[{id:'starter',credits:100,price:'price_test'}],stripeClient:stripe,webhookSecret:'whsec_fixture',paypal,videoProvider,videoEnabled:true,verifyToken:async token=>{if(!['u1','u2'].includes(token))throw new Error();return{uid:token};}});
 app.use(errorHandler);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>new Promise(r=>server.close(r)));
 const url=`http://127.0.0.1:${server.address().port}`;
 const get=(path,uid='u1')=>fetch(url+path,{headers:{Authorization:`Bearer ${uid}`}});
 const post=(path,body,uid='u1')=>fetch(url+path,{method:'POST',headers:{Authorization:`Bearer ${uid}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 return{db,get,post,starts:()=>starts,captures:()=>captures};
}
test('Stripe return confirmation credits only the owner and only once',async t=>{
 const f=await fixture(t);
 assert.equal((await f.post('/api/checkout/confirm',{sessionId:'cs_test_checkout'},'u2')).status,404);
 for(let i=0;i<2;i++)assert.equal((await f.post('/api/checkout/confirm',{sessionId:'cs_test_checkout'})).status,200);
 assert.equal(f.db.documents.get('users/u1').credits,200);
});
test('Stripe uses frozen order credits and rejects a different paid amount',async t=>{
 const f=await fixture(t);
 const order={uid:'u1',plan:'starter',credits:50,price:'price_test',amount:9900,currency:'pln'};
 f.db.documents.set('stripeOrders/cs_test_checkout',{...order,amount:9999});
 assert.equal((await f.post('/api/checkout/confirm',{sessionId:'cs_test_checkout'})).status,400);
 assert.equal(f.db.documents.get('users/u1').credits,100);
 f.db.documents.set('stripeOrders/cs_test_checkout',order);
 assert.equal((await f.post('/api/checkout/confirm',{sessionId:'cs_test_checkout'})).status,200);
 assert.equal(f.db.documents.get('users/u1').credits,150);
});
test('Stripe checkout ignores client credits and amount and stores server package',async t=>{
 const f=await fixture(t);
 assert.equal((await f.post('/api/checkout',{plan:'starter',credits:999999,amount:1})).status,200);
 const order=f.db.documents.get('stripeOrders/cs_test_checkout');
 assert.equal(order.credits,100);assert.equal(order.amount,9900);assert.equal(order.uid,'u1');
});
test('PayPal capture verifies stored order ownership and grants credits once',async t=>{
 const f=await fixture(t);
 assert.equal((await f.post('/api/paypal/checkout',{plan:'starter',amount:1,credits:99999})).status,200);
 assert.equal((await f.post('/api/paypal/confirm',{orderId:'ORDER12345'},'u2')).status,404);
 for(let i=0;i<2;i++)assert.equal((await f.post('/api/paypal/confirm',{orderId:'ORDER12345'})).status,200);
 assert.equal(f.captures(),1);assert.equal(f.db.documents.get('users/u1').credits,200);
});
test('PayPal wrong amount cannot fund an account',async t=>{
 const f=await fixture(t,{paypalWrongAmount:true});await f.post('/api/paypal/checkout',{plan:'starter'});
 assert.equal((await f.post('/api/paypal/confirm',{orderId:'ORDER12345'})).status,409);
 assert.equal(f.db.documents.get('users/u1').credits,100);
});
test('video retries reuse the durable job without a second charge or provider call',async t=>{
 const f=await fixture(t);const requestId=randomUUID();const body={image,requestId,aspectRatio:'9:16'};
 const responses=await Promise.all([f.post('/api/studio/video',body),f.post('/api/studio/video',body)]);
 assert.deepEqual(responses.map(r=>r.status),[200,200]);assert.equal(f.starts(),1);assert.equal(f.db.documents.get('users/u1').credits,90);
 assert.equal((await f.get(`/api/studio/video/${requestId}`,'u2')).status,404);
 assert.equal((await f.get(`/api/studio/video/${requestId}/content`,'u2')).status,404);
 assert.equal((await (await f.get(`/api/studio/video/${requestId}`)).json()).state,'succeeded');
 assert.equal(await (await f.get(`/api/studio/video/${requestId}/content`)).text(),'mp4-test');
 assert.equal(f.db.documents.get('users/u1').activeGeneration,undefined);
});
test('failed video refunds its actual cost exactly once',async t=>{
 const f=await fixture(t,{videoFailure:true});const requestId=randomUUID();await f.post('/api/studio/video',{image,requestId,aspectRatio:'16:9'});
 for(let i=0;i<2;i++)assert.equal((await (await f.get(`/api/studio/video/${requestId}`)).json()).state,'failed');
 assert.equal(f.db.documents.get('users/u1').credits,100);
});
test('rejected video start refunds; invalid and unaffordable requests do not call provider',async t=>{
 const f=await fixture(t,{startFailure:true});
 assert.equal((await f.post('/api/studio/video',{image,requestId:randomUUID(),aspectRatio:'1:1'})).status,400);
 assert.equal(f.starts(),0);
 assert.equal((await f.post('/api/studio/video',{image,requestId:randomUUID(),aspectRatio:'16:9'})).status,503);
 assert.equal(f.db.documents.get('users/u1').credits,100);
 f.db.documents.set('users/u1',{credits:9});
 assert.equal((await f.post('/api/studio/video',{image,requestId:randomUUID(),aspectRatio:'16:9'})).status,402);assert.equal(f.starts(),1);
});
test('unfinished video keeps account lock; photo cannot spend reserved credits concurrently',async t=>{
 const f=await fixture(t,{pending:true});const requestId=randomUUID();await f.post('/api/studio/video',{image,requestId,aspectRatio:'9:16'});
 assert.equal((await (await f.get(`/api/studio/video/${requestId}`)).json()).state,'processing');
 assert.equal((await f.post('/api/studio',{image,scene:'white'})).status,409);
 assert.equal(f.db.documents.get('users/u1').credits,90);
});
test('configured PLN packages grant 20/100/500 once and test checkout is restricted',async t=>{
 const plans=[
  {id:'mini',credits:20,amount:4900,currency:'pln',price:'price_1UQWO1GCTUVg4lvlqBkIVM8n'},
  {id:'starter',credits:100,amount:19900,currency:'pln',price:'price_1UQWOrGCTUVg4lvlAQLfHdlE'},
  {id:'pro',credits:500,amount:79900,currency:'pln',price:'price_1UQWPlGCTUVg4lvlJaFWXeZX'},
 ];
 const db=new TestDB();db.documents.set('users/u1',{credits:0,totalCredits:0,plan:'free'});
 const sdk=new Stripe('sk_test_fixture');const webhookSecret='whsec_fixture';const sessions=new Map();
 const stripe={webhooks:sdk.webhooks,prices:{retrieve:async id=>({...plans.find(p=>p.price===id),id,unit_amount:plans.find(p=>p.price===id).amount,active:true,livemode:false})},checkout:{sessions:{
  create:async input=>{assert.equal(input.locale,'pl');assert.equal(input.mode,'payment');const plan=plans.find(p=>p.price===input.line_items[0].price);const id=`cs_test_${plan.id}`;const session={id,livemode:false,payment_status:'paid',client_reference_id:input.client_reference_id,metadata:input.metadata,amount_total:plan.amount,currency:'pln',url:'https://checkout.stripe.com/test'};sessions.set(id,session);return session;},
  retrieve:async id=>sessions.get(id),listLineItems:async id=>({data:[{price:{id:plans.find(p=>p.id===sessions.get(id).metadata.plan).price},quantity:1}]}),
 }}};
 const app=createApp({store:new MemoryTrialStore(),secret:'test-secret-that-is-at-least-32-characters',origins:['https://www.aparatai.pl'],generate:async()=>image,logger:()=>{}});
 installAccounts(app,{db,generate:async()=>image,origin:'https://www.aparatai.pl',configuredPlans:plans,stripeClient:stripe,webhookSecret,paypal:null,stripeMode:'test',testEmails:['owner@example.com'],verifyToken:async token=>({uid:token,email:token==='u1'?'owner@example.com':'visitor@example.com',email_verified:true})});app.use(errorHandler);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>new Promise(r=>server.close(r)));const url=`http://127.0.0.1:${server.address().port}`;
 const request=(path,body,uid='u1',extra={})=>fetch(url+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:`Bearer ${uid}`,...extra},...(body?{body:JSON.stringify(body)}:{})});
 assert.deepEqual((await (await request('/api/plans',null,'u2')).json()).plans,[]);
 assert.equal((await request('/api/checkout',{plan:'mini'},'u2')).status,403);
 assert.equal((await (await request('/api/plans',null)).json()).plans.length,3);
 let total=0;
 for(const plan of plans){
  assert.equal((await request('/api/checkout',{plan:plan.id,credits:999999,amount:1})).status,200);
  const session=sessions.get(`cs_test_${plan.id}`);
  for(const type of ['checkout.session.completed','checkout.session.completed','checkout.session.async_payment_succeeded']){
   const event={id:`evt_${plan.id}_${type}`,type,data:{object:session}};
   const signature=sdk.webhooks.generateTestHeaderString({payload:JSON.stringify(event),secret:webhookSecret});
   assert.equal((await request('/api/stripe/webhook',event,'u1',{'stripe-signature':signature})).status,200);
  }
  assert.equal((await request('/api/checkout/confirm',{sessionId:session.id})).status,200);
  total+=plan.credits;assert.equal(db.documents.get('users/u1').credits,total);
 }
 assert.equal(total,620);
});
