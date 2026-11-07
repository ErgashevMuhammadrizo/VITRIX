// Only against an isolated local/staging database with a disposable test account.
import assert from 'node:assert/strict';
const base = process.env.SECURITY_TEST_URL || 'http://127.0.0.1:3000';
const username = process.env.SECURITY_TEST_USERNAME;
const password = process.env.SECURITY_TEST_PASSWORD;
if (!username || !password) throw new Error('Set disposable SECURITY_TEST_USERNAME and SECURITY_TEST_PASSWORD');
const jar = new Map();
async function call(path, method = 'GET', data, token, language = 'en') {
  const headers = { 'Content-Type':'application/json', 'Accept-Language':language, Origin:base };
  if (token) headers['X-CSRFToken']=token;
  headers.Cookie=[...jar].map(([k,v])=>`${k}=${v}`).join('; ');
  const response=await fetch(base+'/api/v1'+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
  for(const cookie of response.headers.getSetCookie()) {
    const pair=cookie.split(';')[0]; const at=pair.indexOf('='); jar.set(pair.slice(0,at),pair.slice(at+1));
  }
  return { response, data: await response.json() };
}
let r=await call('/auth/csrf/'); let token=r.data.csrfToken;
assert.equal(r.response.headers.get('cache-control'),'no-store');
r=await call('/auth/login/','POST',{username,password});assert.equal(r.response.status,403);
r=await call('/auth/login/','POST',{username,password},token);assert.equal(r.response.status,200);
r=await call('/auth/csrf/');token=r.data.csrfToken;
r=await call('/workspace/');assert.equal(r.response.status,200);assert.ok(r.data.businesses[0].revision);
const business=r.data.businesses[0];
const changes=[{entity:'businesses',op:'upsert',record:{...business,name:business.name+' check'}}];
r=await call('/workspace/','PATCH',{changes},token);assert.equal(r.response.status,200);
r=await call('/workspace/','PATCH',{changes},token);assert.equal(r.response.status,409);
r=await call('/auth/reset-password/','POST',{email:'browser@example.com',code:'123456',password:null},token);assert.equal(r.response.status,400);
r=await call('/auth/login/','POST',{username:'missing-account',password:'wrong'},token,'en');
assert.equal(r.response.status,401);assert.notEqual(r.data.detail,'Login yoki parol noto‘g‘ri.');
const slug = process.env.SECURITY_TEST_SLUG;
if (slug) {
  r=await call(`/public/businesses/${encodeURIComponent(slug)}/?offset=100`);
  assert.equal(r.response.status,200);assert.ok(r.data.products.length > 0);
  assert.equal(r.data.business.ownerId,undefined);
}
const html=await fetch(base+'/');assert.equal(html.headers.get('x-frame-options'),'DENY');
console.log('PASS: real Next → Django HTTP flow: cookies, CSRF, login, locale, revisions, stale conflict, reset-null validation, security headers.');
