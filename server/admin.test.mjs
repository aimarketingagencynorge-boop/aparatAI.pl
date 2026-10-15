import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { installAdmin, adminAuthorizer } from './admin.mjs';
import { errorHandler } from './app.mjs';
import { TestDB } from './test-db.mjs';

async function fixture(t){
 const db=new TestDB();db.documents.set('users/customer',{credits:5,totalCredits:20,plan:'mini'});
 const app=express();app.use(express.json());
 const isAdmin=adminAuthorizer('owner@example.com');
 installAdmin(app,{db,isAdmin,authenticate:(req,_res,next)=>{const role=req.get('authorization');req.account={uid:role,email:role==='owner'?'owner@example.com':'customer@example.com',email_verified:role!=='unverified'};next();},findIdentity:async email=>({uid:'customer',email})});app.use(errorHandler);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>new Promise(r=>server.close(r)));
 const post=(path,body,role='owner')=>fetch(`http://127.0.0.1:${server.address().port}${path}`,{method:'POST',headers:{Authorization:role,'Content-Type':'application/json'},body:JSON.stringify(body)});
 return{db,post};
}
test('admin access requires the server allowlist and a verified email',()=>{
 const can=adminAuthorizer(' OWNER@example.com ');
 assert.equal(can({email:'owner@example.com',email_verified:true}),true);
 assert.equal(can({email:'owner@example.com',email_verified:false}),false);
 assert.equal(can({email:'visitor@example.com',email_verified:true,role:'admin'}),false);
 assert.equal(adminAuthorizer('')({email:'owner@example.com',email_verified:true}),false);
});
test('customer cannot read another account or alter credits even with a forged admin role',async t=>{
 const f=await fixture(t);
 assert.equal((await f.post('/api/admin/account',{email:'owner@example.com',role:'admin'},'customer')).status,403);
 assert.equal((await f.post('/api/admin/credits',{uid:'customer',delta:100,reason:'forged admin role',requestId:randomUUID(),role:'admin'},'customer')).status,403);
 assert.equal(f.db.documents.get('users/customer').credits,5);
});
test('admin correction is atomic and idempotent across concurrent retries, with an audit entry',async t=>{
 const f=await fixture(t);const body={uid:'customer',delta:20,reason:'Ręczna korekta po reklamacji',requestId:randomUUID()};
 const responses=await Promise.all([f.post('/api/admin/credits',body),f.post('/api/admin/credits',body)]);
 assert.deepEqual(responses.map(r=>r.status),[200,200]);assert.equal(f.db.documents.get('users/customer').credits,25);
 const audit=f.db.documents.get(`adminAudit/${body.requestId}`);assert.equal(audit.before,5);assert.equal(audit.after,25);assert.equal(audit.adminUid,'owner');assert.equal(audit.reason,body.reason);
 assert.equal((await f.post('/api/admin/credits',{...body,delta:30})).status,409);
 assert.equal((await f.post('/api/admin/credits',{...body,delta:-50,requestId:randomUUID()})).status,409);
 assert.equal(f.db.documents.get('users/customer').credits,25);
});
test('admin cannot subtract during an active generation; lookup returns only account metadata',async t=>{
 const f=await fixture(t);f.db.documents.set('users/customer',{credits:5,activeGeneration:'job1',secret:'must not leak'});
 assert.equal((await f.post('/api/admin/credits',{uid:'customer',delta:-1,reason:'Korekta testowa salda',requestId:randomUUID()})).status,409);
 const account=await(await f.post('/api/admin/account',{email:'customer@example.com'})).json();assert.equal(account.credits,5);assert.equal(account.secret,undefined);
});
