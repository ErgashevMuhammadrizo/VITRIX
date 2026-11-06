import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://localhost:3000';
for(const path of ['/','/pricing','/features','/about','/contact','/login','/register','/forgot-password','/demo']){const r=await fetch(origin+path);assert.equal(r.status,200,path)}
const response=await fetch(origin+'/api/v1/plans/');assert.equal(response.status,200,'Django proxy');const {plans}=await response.json();assert.equal(plans.find(p=>p.id==='pro').price,20000);assert.equal(plans.find(p=>p.id==='vip').price,39000);console.log('PASS: marketing/auth pages and connected Django pricing API');
