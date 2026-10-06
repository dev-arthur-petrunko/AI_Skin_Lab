import glob
procs=[]
for d in glob.glob('/proc/[0-9]*'):
    try:
        with open(d+'/cmdline') as f: c=f.read().replace(chr(0),' ')
        if 'cron' in c or 'uvicorn' in c: procs.append(c[:100])
    except: pass
for p in procs: print(p)
print('done')