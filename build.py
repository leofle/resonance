import json,re
e=open('engine.js').read().replace("if(typeof module","//if(typeof module")
t=open('index.template.html').read()
lv=json.load(open('final.json'))
t=t.replace("const FIXED=__LEVELS__;\nFIXED.forEach((rows,i)=>LEVELS[i].rows=rows);","LEVELS.splice(0,LEVELS.length,..."+json.dumps(lv,ensure_ascii=False)+");")
t=t.replace("__ENGINE__",e)
assert "__" not in re.sub(r"__proto__","",t[:0]) and "__LEVELS__" not in t and "__ENGINE__" not in t
open('index.html','w').write(t)
s=t[t.index('<script>')+8:t.rindex('</script>')];open('/tmp/res_check.js','w').write(s)
print('built',len(t))
