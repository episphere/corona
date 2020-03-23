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
        div.innerHTML=`
        <h1><span style="font-family:fantasy">Corona </span><sup style="font-size:medium;color:green">COVID-19</sup> <span style="font-size:small;color:blue">[<a href="https://github.com/episphere/corona" target="_blank">code</a>] [<a href="https://github.com/episphere/corona/issues" target="_blank">issues</a>] [<a href="https://observablehq.com/@episphere/corona" target="_blank" style="font-size:x-large;color:red;background-color:yellow">demo</a>]<span></h1>
        <h3>Selected figures</h3>
        <p>
        <ol>
        <li> <a href="lag.html" target="_blank" style="font-weight:bold;color:green">Reporting Lag</a> - dates of latest reports from all regions.</li>
        </ol>
        </p>

        `
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

corona.agregateByCountry=async(xx)=>{
    if(typeof(xx)=='string'){
        status=xx
        xx=false
    }else{
        status='Confirmed'
    }
    xx = xx||corona.series[status]||await corona.getSeries(status)
    // groups
    let groups = [... new Set(xx.map(x=>x["Country/Region"]))].sort()
    let gg={}
    groups.forEach(g=>{gg[g]=[]})
    xx.forEach(x=>{
        gg[x["Country/Region"]].push(x)
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
    return yy
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
    /*
    if(typeof(localforage)!='object'){
        let s = document.createElement('script')
        s.src='https://cdnjs.cloudflare.com/ajax/libs/localforage/1.7.3/localforage.min.js'
        s.onload=function(){return corona.getSeries(status)}
        document.head.appendChild(s)
    }else{
        let cache = false
        if(localStorage[url]){
            if(Date.now()-JSON.parse(localStorage[url])<3600000){
                let J = await localforage.getItem(url)
                cache=true
            }
        }
        let JF = await localforage.getItem('lala')

    }
    */
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

corona.progression=async()=>{
    let countries = {};
    let confirmedByCountry = await corona.agregateByCountry('Confirmed');
    let deathsByCountry = await corona.agregateByCountry('Deaths');
    let recoveredByCountry = await corona.agregateByCountry('Recovered');
    confirmedByCountry.forEach((x, i) => {
        let c = x["Country/Region"];
        countries[c] = {};
        countries[c].Lat = x.Lat;
        countries[c].Long = x.Long;
        countries[c].times = x.timeSeries.map(ts => ts.time);
        countries[c].confirmed = x.timeSeries.map(ts => ts.value);
        countries[c].deaths = deathsByCountry[i].timeSeries.map(ts => ts.value);
        countries[c].recovered = recoveredByCountry[i].timeSeries.map(
          ts => ts.value
        );
        countries[c].active = countries[c].confirmed.map((cf, j) => {
          // calculate active cases
          return cf - (countries[c].recovered[j] + countries[c].deaths[j]);
        });
    });
    return countries
}

corona.rotate3D=(div)=>{ //rotates 3d plotly graph
    if(typeof(Plotly)=='object'){
        function run() {
          rotate('scene', Math.PI / 180);
          //rotate('scene2', -Math.PI / 180);
          requestAnimationFrame(run);
        } 
        run();

        function rotate(id, angle) {
          var eye0 = div.layout[id].camera.eye
          var rtz = xyz2rtz(eye0);
          rtz.t += angle;

          var eye1 = rtz2xyz(rtz);
          Plotly.relayout(div, id + '.camera.eye', eye1)
        }

        function xyz2rtz(xyz) {
          return {
            r: Math.sqrt(xyz.x * xyz.x + xyz.y * xyz.y),
            t: Math.atan2(xyz.y, xyz.x),
            z: xyz.z
          };
        }

        function rtz2xyz(rtz) {
          return {
            x: rtz.r * Math.cos(rtz.t),
            y: rtz.r * Math.sin(rtz.t),
            z: rtz.z
          };
        }
    }else{
        let s = document.createElement('script')
        s.src='https://cdn.plot.ly/plotly-latest.min.js'
        s.onload=function(){corona.rotate3D(div)}
        document.head.appendChild(s)
    }
}

// selected figures

corona.lagPlot=async (div='coronaLagDiv',maxCountries=20)=>{
    console.log('ploting reporting lags')
    if(typeof(div)=='string'){
        div=document.getElementById(div)
    }
    if(!div){error(`element with id "${div}" not found`)}
    let dailyUpdate=await corona.getDaily()
    let xx = dailyUpdate;
    let t = dailyUpdate.map(x => x["Last Update"]);
    let traceCountry = (country, legend,clr) => {
        let xx = dailyUpdate.filter(x => x["Country/Region"] == country);
        let confirmed = xx.map(x => x.Confirmed);
        let text = xx.map(x => {
          if (x["Country/Region"].length < 2) {
            return x["Country/Region"];
          } else if (x["Province/State"].length > 1) {
            return x["Province/State"];
          } else {
            return x["Country/Region"];
          }
        });
        let traceConfirmed = {
          name: legend||country,
          x: t,
          y: confirmed,
          text: text,
          mode: 'markers+text',
          textposition: 'right',
          textfont: {
            size: 8,
            color: 'gray',
            orientation: 30
          },
          type: 'scatter',
          marker: {
            color: clr,
            size: 6
          }
        };
        return traceConfirmed;
    };

    // get list of countries with more than minDeath

    let cc = await corona.agregateByCountry('Deaths')
    //cc = cc.filter(c=>c.timeSeries.slice(-1)[0].value>=minDeath).sort(function(a,b){
    cc = cc.sort(function(a,b){ // sort by Deaths
        if(a.timeSeries.slice(-1)[0].value>b.timeSeries.slice(-1)[0].value){
            return -1
        }else{
            return 1
        }
    })
    let ccNames = cc.slice(0,maxCountries).map(c=>c["Country/Region"])
    // put selected countries first


    
    let data=ccNames.map((cn,i)=>{
        return traceCountry(cn,`${cn} (${cc[i].timeSeries.slice(-1)[0].value})`)
    })
    Plotly.newPlot(div, data, {
    title: `<span style="font-size:medium;color:maroon">Latest data updates (real time) from countries with highest letal count</span>`,
    autosize: false,
    //width: "100%",
    height:1000,
    yaxis: {
      title: 'Confirmed cases',
      type: 'log',
      autorange: true
    },
    xaxis: {
      title: 'Last update'
    }
    });
    //debugger

}

if(typeof(define)!='undefined'){
    define(corona)
}



//https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-03-2020.csv