import csv,glob,collections,json,sys
Y0,Y1=int(sys.argv[1]),int(sys.argv[2])
out={}
for fn in sorted(glob.glob('KG*.csv')):
    d=collections.defaultdict(dict)
    for r in csv.DictReader(open(fn)):
        if r['Q_FLAG']: continue
        y=int(r['DATE'][:4])
        if not Y0<=y<=Y1: continue
        d[r['DATE']][r['ELEMENT']]=int(r['DATA_VALUE'])/10
    T=collections.defaultdict(list); P=collections.defaultdict(list)
    for date,e in d.items():
        ym=(int(date[:4]),int(date[4:6]))
        t=e.get('TAVG')
        if t is None and 'TMAX' in e and 'TMIN' in e: t=(e['TMAX']+e['TMIN'])/2
        if t is not None: T[ym].append(t)
        if 'PRCP' in e: P[ym].append(e['PRCP'])
    import calendar
    tm=[[] for _ in range(12)]; pm=[[] for _ in range(12)]
    for (y,m),v in T.items():
        if len(v)>=calendar.monthrange(y,m)[1]-3: tm[m-1].append(sum(v)/len(v))
    for (y,m),v in P.items():
        if len(v)>=calendar.monthrange(y,m)[1]-1: pm[m-1].append(sum(v))
    nt=min(len(x) for x in tm); np_=min(len(x) for x in pm)
    res={'id':fn[:-4],'nT':nt,'nP':np_,
     'temp':[round(sum(x)/len(x),1) if len(x)>=int(sys.argv[3]) else None for x in tm],
     'prcp':[round(sum(x)/len(x)) if len(x)>=int(sys.argv[3]) else None for x in pm]}
    print(res)
    out[fn[:-4]]=res
json.dump(out,open('normals_'+sys.argv[1]+'.json','w'))
