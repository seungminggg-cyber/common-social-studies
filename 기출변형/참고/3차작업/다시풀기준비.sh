#!/bin/bash
# 사용: SCRATCH=<세션 scratchpad 폴더> bash 다시풀기준비.sh <차수> <회차>
#  → $SCRATCH/solve<차수>-<회차>/ 에 문제만.json(정답·해설 뺀 문항), 정답.json, 문제 쪽 그림(p-04.png~)
#  모의고사(content/<차수>/mock/m<회차>.js)용. 다시 풀기 검토자에게는 검토지시.md + 이 폴더를 준다.
set -e
ED=$1; N=$2
S=${SCRATCH:?SCRATCH 폴더를 지정하세요}
D=$S/solve$ED-$N; mkdir -p "$D"
cd /workspace/common-social-studies/기출변형
node -e "
import('./content/$ED/mock/m$N.js?'+Date.now()).then(m=>{
const qs=m.default.questions;
require('fs').writeFileSync('$D/문제만.json',JSON.stringify(qs.map((q,i)=>{const {answer,explain,note,src,...r}=q;return {no:i+1,...r}}),null,1));
require('fs').writeFileSync('$D/정답.json',JSON.stringify(qs.map((q,i)=>({no:i+1,answer:q.answer}))));
console.log(qs.length,'문항')})"
MX_ONLY=$N MX_NOANS=1 MX_NAME=s$ED-$N node build.mjs $ED mock mx 2>&1 | grep "쪽 →"
pdftoppm -r 100 -f 4 -png out/$ED/s$ED-$N.pdf "$D/p"
ls "$D" | tr '\n' ' '
