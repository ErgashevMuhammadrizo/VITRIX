import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://localhost:3000';
for(const path of ['/','/pricing','/features','/about','/contact','/login','/register','/forgot-password','/demo']){const r=await fetch(origin+path);assert.equal(r.status,200,path)}
const health=await fetch(origin+'/api/v1/health/'); assert.equal(health.status,200,'Django health proxy');
const response=await fetch(origin+'/api/v1/plans/');assert.equal(response.status,401,'Anonymous subscription prices are protected');
console.log('PASS: public/auth pages, connected Django health, subscription price access control');
