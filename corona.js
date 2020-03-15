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
    corona.daily[dayString]=await corona.getJSONdaily(url)
    return corona.daily[dayString]
}

corona.getJSONdaily=async(url)=>{
    let txt= await (await fetch(url)).text()
    if(txt.slice(-1).match(/[\s\n]/)){
        txt=txt.slice(0,-1)
    }
    //txt=txt.replace('"Korea, South"','South Korea') // wrangling
    txt=txt.replace(/"([^"]+)\,([^"]+)"/g,'$1$2')
    let arr = txt.split(/\n/g).map(x=>x.split(','))
    // create dataframe
    let labels = arr[0]
    let J={}
    labels.forEach(L=>{
        J[L]=[]
    })
    arr.slice(1).forEach((r,i)=>{
        r.forEach((v,j)=>{
            try{
                J[labels[j]][i]=v
            }catch(err){
                r
                //debugger
            }
            
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