import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync,rmSync} from 'node:fs';
const run=(args)=>spawnSync(process.execPath,args,{stdio:'inherit'}).status??1;
let result=run(['node_modules/typescript/bin/tsc','-p','tsconfig.test.json']);
if(!result){mkdirSync('.test-output',{recursive:true});writeFileSync('.test-output/package.json','{"type":"commonjs"}');result=run(['--test','.test-output/tests/domain.test.js'])}
rmSync('.test-output',{recursive:true,force:true});process.exit(result);
