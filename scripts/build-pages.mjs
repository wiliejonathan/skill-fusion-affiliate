import {cpSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd();
const next=resolve(root,'node_modules/next/dist/bin/next');
for(const cwd of [root,resolve(root,'admin')]){
  const result=spawnSync(process.execPath,[next,'build','--webpack'],{cwd,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
  if(result.status!==0) process.exit(result.status||1);
}
rmSync('pages-dist',{recursive:true,force:true});
cpSync('out','pages-dist',{recursive:true});
mkdirSync('pages-dist/admin',{recursive:true});
cpSync('admin/out','pages-dist/admin',{recursive:true});
writeFileSync('pages-dist/.nojekyll','');
writeFileSync('pages-dist/admin.html','<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./admin/"><a href="./admin/">Skill Fusion Admin</a>');
