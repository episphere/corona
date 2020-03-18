console.log('corona.js loaded');

corona={
    daily:{}, // daily results cached here
    series:{}
}
corona.ui=(div=document.getElementById('coronaDiv'))=>{
    if(typeof(div)=='string'){
        div=document.getElementById(div)
    }
    if(typeof(div)!='object'){
        warning('div not found')
    }else{
        div.innerHTML='cororaDiv here ...'
        corona.div=div
    }
}

corona.getDaily=async(dayString=corona.formatDate(new Date(Date.now()-(24*60*60*1000))))=>{ // default will call with data string from previous day
    let url=`https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/${dayString}.csv`
    let JObj=await corona.getJSONdaily(url)
    // reformat JSON as an array with the right types
    corona.daily[dayString]=corona.Obj2Array(JObj)
    return corona.daily[dayString]
}

corona.Obj2Array=Obj=>{
    let arr=[]
    let labels=Object.keys(Obj)
    Obj[labels[0]].forEach((_,i)=>{
        arr[i]={}
        labels.forEach((L,j)=>{
            arr[i][L]=Obj[L][i]
        })
    })
    return arr
}

corona.agregateDaily=(by="Country/Region")=>{
    // under development
}

corona.agregateSeries=async(xx,groupBy="Country/Region")=>{
    xx = xx||await corona.getSeries(status)
    // groups
    let groups = [... new Set(xx.map(x=>x["Country/Region"]))].sort()
    let gg={}
    groups.forEach(g=>{gg[g]=[]})
    xx.forEach(x=>{
        gg[x[groupBy]].push(x)
    })
    // colapse each of the groups back into the array
    yy=groups.map(g=>{
        // colapse
        // remove time object string
        let avg=aa=>{
            return aa.reduce((a,b)=>a+b)/aa.length
        }
        //if(gg[g].length>1){
        let ts = []
        gg[g].forEach((xi,i)=>{
            ts[i]=[]
            xi.timeSeries.forEach((xij,j)=>{
                ts[i][j]=xij.value
            })
        })
        // transpose
        let tsT=ts[0].map(_=>[])
        ts.forEach((ti,i)=>{
            ti.forEach((tij,j)=>{
                tsT[j][i]=tij
            })
        })
        let sumCounts = tsT.map(x=>x.reduce((a,b)=>a+b)) // sum counts
            //debugger
            
        //}

        //debugger
            
        let xx = gg[g]
        let x={
            "Province/State":g,
            "Country/Region":g,
            "Lat":avg(xx.map(x=>x.Lat)),
            "Long":avg(xx.map(x=>x.Long)),
            timeSeries:xx[0].timeSeries.map((t,i)=>{
                return {
                    time:t.time,
                    value:sumCounts[i]
                }
            })
        }
        return x
    })
}

corona.getJSONdaily=async(url)=>{
    let txt= await (await fetch(url)).text()
    if(txt.slice(-1).match(/[\s\n]/)){ // remove trailing line
        txt=txt.slice(0,-1)
    }
    //txt=txt.replace('"Korea, South"','South Korea') // wrangling
    txt=txt.replace(/"([^"]+)\,([^"]+)[\n\r]*"/g,'$1$2')
    let arr = txt.split(/[\n\r]+/g).map(x=>x.split(','))
    // create dataframe
    let labels = arr[0]
    let J={}
    labels.forEach(L=>{
        J[L]=[]
    })
    arr.slice(1).forEach((r,i)=>{
        r.forEach((v,j)=>{
            //try{
                J[labels[j]][i]=v
            //}catch(err){
            //    r
                //debugger
            //}
            
        })
    })
    // clean each variable
    J["Last Update"]=J["Last Update"].map(v=>new Date(v)) // time
    labels.slice(3).forEach(L=>{
        J[L]=J[L].map(v=>parseFloat(v))
    })
    return J
}

corona.formatDate=(x=new Date())=>{
    var y = x.getFullYear().toString();
    var m = (x.getMonth() + 1).toString();
    var d = x.getDate().toString();
    (d.length == 1) && (d = '0' + d);
    (m.length == 1) && (m = '0' + m);
    return `${m}-${d}-${y}`
}

corona.getSeries=async(status='Confirmed')=>{  // it cal also be "Deaths" and "Recovered"
    //let url = `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_time_series/time_series_19-covid-${status}.csv`
    let url=`https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-${status}.csv`
    //csse_covid_19_time_series/time_series_19-covid-Confirmed.csv
    let txt = await (await fetch(url)).text()
    txt=txt.replace(/"([^"]+)\,([^"]+)"/g,'$1$2') // clean "," from "" variables
    let J=[] // json as an array of objects
    let arr = txt.slice(0,-1).split(/\n/g).map((r,i)=>r.split(',').map((v,j)=>{
        if(i>0&j>1){ // first row contains labels, an values of first two columns are strings
            v=parseFloat(v)
        }
        return v
    }))
    let labels = arr[0].map(L=>L.replace(/\s/g,''))
    arr.slice(1).forEach((r,i)=>{
        J[i]={}
        labels.forEach((L,j)=>{
            J[i][L]=r[j]
        })
    })
    // extract time series
    Lseries=labels.filter(L=>L.match(/\w+\/\w+\/\w+/g))
    J.forEach((Ji,i)=>{
        J[i].timeSeries=[]
        Lseries.forEach((L,j)=>{
            J[i].timeSeries[j]={
                time:L,
                value:Ji[L]
            }
            delete J[i][L] // remove Lseries
        })
    })
    corona.series[status]=J
    return J
}

corona.countrySeries=async(status="Confirmed",country="Portugal")=>{
    let x = await corona.getSeries(status)
    let c = x.filter(d=>d["Country/Region"]==country)[0]
    return c  
}

if(typeof(define)!='undefined'){
    define(corona)
}



//https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-03-2020.csv