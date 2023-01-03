//Data Tools
//把標示為空值的字串('NA')變成JavaScript認知的空值
//string如果成立，執行問號後程式碼，若不成立則執行冒號後程式碼
const parseNA = string => (string == NaN ? undefined : string);
const parseBL = string => (string == 'True' ? 'True' : 'False');
const parseET = string => (string == "" ? undefined : string);
// const parseNU = Number => (Number == '' ? undefined : Number);




// get csv file
d3.csv("data/video_games.csv",type).then(
    res=>{
        ready(res);
    }
);

//Data utilities
function type(d){
    
    return {
        Title:parseNA(d.Title),
        Score:+d.Score,
        Sales:+d.Sales,
        Max_Players:+d.Max_Players,
        Genres:parseNA(d.Genres),
        Used_Price:+d.Used_Price,
        Release_Console:parseNA(d.Release_Console),
        Handheld:parseBL(d.Handheld),
        Multiplatform:parseBL(d.Multiplatform),
        Licensed:parseBL(d.Licensed),
        Publisher:parseET(d.Publishers),
        Sequel:parseBL(d.Sequel),
        Release_Year:+d.Release_Year,

    }
}


//Data Selection
function filterData(data){
    return data.filter(
        d=>{
            return(
                d.Score > 0 && d.Score <= 100 &&
                d.Sales > 0 && d.Title && d.Genres &&
                d.Used_Price
            );
            
        }
    );
}

function prepareBarChartData(data){
    console.log(data);
    const dataMap = d3.rollup(
        data,
        v => d3.median(v, leaf => leaf.Sales),          
        d => d.Score
    );
    // debugger
    const dataArray = Array.from(dataMap, d=>({Score:d[0],Sales:d[1]}));
    // debugger;
    return dataArray;
}

//setupCanvas
function setupCanvas(barChartData, gamesClean){

    let metric = 'Sales';

    function click(){
        metric = this.dataset.name;
        let thisData = chooseData(metric, gamesClean);
        update(thisData);
        
    }

    d3.selectAll('button').on('click', click);

    function update(data){
        console.log(data);
        xMax = d3.max(data, d=>d[metric]);
        xScale_v1 = d3.scaleLinear([0, xMax], [0, barchart_width]);
        yScale = d3.scaleBand().domain(data.map(d=>d.Title))
        .rangeRound([0, barchart_height])
        .paddingInner(0.25);


        const defaultDelay = 1000;
        const transitionDelay = d3.transition().duration(defaultDelay);

        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v1));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));

        header.select('tspan').text(`Top 15 ${metric} video games ${metric === 'Score' ? '' : 'in $US '}`);
        
        // Update Bar
        bars.selectAll('.bar').data(data, d=>d.Title).join(
            enter => {
                enter.append('rect').attr('class', 'bar')
                .attr('x',0).attr('y',d=>yScale(d.Title))
                .attr('height',yScale.bandwidth())
                .style('fill','lightcyan')
                .transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr('width',d=>xScale_v1(d[metric]))
                .style('fill','dodgerblue');   
            },
            update =>{
                update.transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr('y',d=>yScale(d.Title))
                .attr('width',d=>xScale_v1(d[metric]));
            },
            exit => {
                exit.transition().duration(defaultDelay/2)
                .style('fill-opacity',0)
                .remove()
                // debugger
            },
        );
            d3.selectAll('.bar')
              .on('mouseover', mouseover)
              .on('mousemove', mousemove)
              .on('mouseout', mouseout);

        }
    

    const svg_width = 650;
    const svg_height = 500;
    const barchart_margin = {top:80, right:40, bottom:40,left:250};
    const barchart_width = svg_width - (barchart_margin.left + barchart_margin.right);
    const barchart_height = svg_height - (barchart_margin.top + barchart_margin.bottom);

    const this_svg = d3.select('.bar-chart-container').append('svg')
    .attr('width', svg_width).attr('height', svg_height).append('g')
    .attr('transform', `translate(${barchart_margin.left}, ${barchart_margin.top})`);

    //scale
    //d3.extent -> find min & max
    const xExtent = d3.extent(barChartData, d=> d.Sales);
    //debugger;
    //v1 (min, max)
    let xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, barchart_width]);
    let xMax = d3.max(barChartData, d=> d.Sales)
    //y
    let yScale = d3.scaleBand().domain(barChartData.map(d=>d.Title))
                                 .rangeRound([0, barchart_height])
                                 .paddingInner(0.25);
    //Draw bars
    // const bars = this_svg.selectAll('.bar').data(barChartData).enter()
    //                      .append('rect').attr('class', 'bar')
    //                      .attr('x',0).attr('y',d=>yScale(d.Score))
    //                      .attr('width',d=>xScale_v1(d.Sales))
    //                      .attr('height', yScale.bandwidth())
    //                      .style('fill','dodgerblue');
    const bars = this_svg.append('g').attr('class', 'bars');      
    //Draw header
    let header = this_svg.append('g').attr('class', 'bar-header')
                   .attr('transform', `translate(0,${-barchart_margin.top/2})`)
                   .append('text');
    header.append('tspan').text("Top 15 xxx video games");
    header.append('tspan').text('Years: 2004 ~ 2010')
          .attr('x', 0).attr('y', 20).style('font-size', '0.8em').style('fill', '#555');
    // header.append('tspan').text("Score：a typical review score for this game, out of 100 (19~98).")
    //       .attr('x', 0).attr('y',750).style('font-size', '0.5em').style('fill', '#555');                     //註解
    //tickSizeInner : the length of the tick lines
    //tickSizeOuter : the length of the square ends of the domain path
    let xAxis = d3.axisTop(xScale_v1)
                    .tickFormat(formatTicks)
                    .tickSizeInner(-barchart_height)
                    .tickSizeOuter(0);
    // const xAxisDraw = this_svg.append('g')
    //                           .attr('class', 'x axis')
    //                           .call(xAxis);
    let xAxisDraw = this_svg.append('g').attr('class', 'x axis');
                              
    let yAxis = d3.axisLeft(yScale).tickSize(0);
    let yAxisDraw = this_svg.append('g').attr('class', 'y axis');                       
    yAxisDraw.selectAll('text').attr('dx', '-0.6em');
    update(barChartData);
    
        const tip = d3.select('.tooltip');

        function mouseover(e){

            const thisBarData = d3.select(this).data()[0];
            const bodyData = [
                ['Score', formatTicks(thisBarData.Score)],
                ['Sales', `${formatTicks(thisBarData.Sales)} million $US`],
                ['Used_Price',`${formatTicks(thisBarData.Used_Price)}  $US`],
                ['Release_Year',thisBarData.Release_Year]
            ];
            // debugger

            tip.style('left', (e.clientX+15)+'px')
               .style('top', e.clientY+'px')
               .transition()
               .style('opacity', 0.98)
               
            tip.select('h3').html(`${thisBarData.Title}, ${thisBarData.Release_Console}`);
            tip.select('h4').html(`${thisBarData.Publisher}, ${thisBarData.Genres}`);

            d3.select('.tip-body').selectAll('p').data(bodyData)
              .join('p').attr('class','tip-info')
              .html(d=>`${d[0]} : ${d[1]}`);
        }


        function mousemove(e){
            tip.style('left', (e.clientX+15)+'px')
               .style('top', e.clientY+'px')
        }

        function mouseout(e){
            tip.transition()
               .style('opacity',0)
        }
        d3.selectAll('.bar')
          .on('mouseover', mouseover)
          .on('mousemove', mousemove)
          .on('mouseout', mouseout);



    }


function formatTicks(d){
    return d3.format('.2s')(d)
    .replace('M','mil')
    .replace('G','bil')
    .replace('T','tri')
}


function setupCanvas_scatter(scatterData){



    const svg_width=500;
    const svg_height=500;
    const chart_margin={top:80,right:40,bottom:40,left:80};
    const chart_width=svg_width-(chart_margin.left+chart_margin.right);
    const chart_height=svg_height-(chart_margin.top+chart_margin.bottom);
    const this_svg=d3.select('.scatter-plot-container').append('svg')
    .attr('width', svg_width).attr('height',svg_height)
    .append('g')
    .attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);
    const xExtent=d3.extent(scatterData, d=>d.Sales);
    const xScale=d3.scaleLinear().domain(xExtent).range([0,chart_width]);
    const yExtent=d3.extent(scatterData, d=>d.Score)
    const yScale=d3.scaleLinear().domain(yExtent).range([chart_height,0]);
    this_svg.selectAll('.scatter').data(scatterData).enter()
        .append('circle')
        .attr('class','scatter')
        .attr('cx',d=>xScale(d.Sales))
        .attr('cy',d=>yScale(d.Score))
        .attr('r',5)
        .style('fill','dodgerblue')
        .style('fill-opacity',0.5);
    function addLabel(axis, label, x, y){
        axis.selectAll('.tick:last-of-type text')
        .clone()
        .text(label)
        .attr('x',x)
        .attr('y',y)
        .style('text-anchor','start')
        .style('font-weight','bold')
        .style('fill','#555')

    }
    const xAxis=d3.axisBottom(xScale).ticks(5).tickFormat(formatTicks)
            .tickSizeInner(-chart_height).tickSizeOuter(0);
    const xAxisDraw=this_svg.append('g').attr('class','xaxis')
            .attr('transform',`translate(-10,${chart_height+10})`)
            .call(xAxis)
            .call(addLabel,'Sales',25,0);
    xAxisDraw.selectAll('text').attr('dy','2em');
    const yAxis=d3.axisLeft(yScale).ticks(5).tickFormat(formatTicks)
                 .tickSizeInner(-chart_height).tickSizeOuter(0);
    const yAxisDraw=this_svg.append('g').attr('class','yaxis')
            .attr('transform',`translate(-10,10)`)
            .call(yAxis)
            .call(addLabel,'Score',-30,-30);
    yAxisDraw.selectAll('text').attr('dx','-2em');
    //Draw header
    const header =this_svg.append('g').attr('class','bar-header')
            .attr('transform',`translate(0,${-chart_margin.top/2})`)
            .append('text');
    header.append('tspan').text('Sales vs. Score');
    function brushed(e){
        if(e.selection){
            //取得選取的矩形座標
            const [[x0,y0],[x1,y1]] =e.selection;
            //判斷有哪些資料落在選取範圍中
            const selected =scatterData.filter(
                d=>
                    x0 <=xScale(d.Sales) && xScale(d.Sales) < x1 &&
                    y0 <=yScale(d.Score) && yScale(d.Score) < y1

            );
            console.log(selected);
            updateSelected(selected);
        }
    }
    function updateSelected(data){
        d3.select('.selected-body').selectAll('.selected-element')
        .data(data, d=>d.id).join(
            enter=>{
                enter.append('p').attr('class','selected-element')
                     .html(
                        d=>`<span class="selected-title">${d.Title}</span>, 
                        <br>Sales: ${formatTicks(d.Sales)} |
                        Score: ${formatTicks(d.Score)}
                        Used_Price: ${formatTicks(d.Used_Price)}`
                    );
            },
            update=>{
                update
            },
            exit=>{
                exit.remove();
            }

        )
    }

    //add brush
    const brush=d3.brush().extent([[0,0],[svg_width,svg_height]]).on('brush',brushed);
    this_svg.append('g').attr('class','brush').call(brush);
    d3.select('.selected-container')
        .style('width',`${svg_width}px`).style('height',`${svg_height}px`);
    

}


//Main
function ready(video_games){
    const gamesClean = filterData(video_games);
    //console.log(moviesClean);
    // const barChartData = prepareBarChartData(gamesClean).sort(
    //     (a,b)=>{
    //         return d3.ascending(b.Score,a.Score);
    //     }
    // );
    //Get Top 15 Score video_game
    const SalesData = chooseData('Sales',gamesClean);
    setupCanvas(SalesData, gamesClean);
    // console.log(barChartData);
    // setupCanvas(barChartData);

    setupCanvas_scatter(SalesData);//     新增的
}

function chooseData(metric, gamesClean){
    const thisData = gamesClean.sort((a,b)=>b[metric]-a[metric]).filter((d,i)=>i<15);
    return thisData;
}