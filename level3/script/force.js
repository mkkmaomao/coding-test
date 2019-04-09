var svg = d3.select(".force-chart svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
var new_data = [];

var linksObj = {};

d3.json("dataset/HKUST_coauthor_graph.json", function (error, data) {
    if (error) throw error;
    for (var i = 0; i < data.nodes.length; i++) {
        if (data.nodes[i].dept != "CSE") {
            data.nodes.splice(i,1); //和delete的区别
            i = i-1;
        }

    }
    //console.log(data);

    var nodes = data.nodes.map(d => Object.create(d)); 
    console.log(nodes);
    var index = new Map(nodes.map(d => [d.id, d]));
    console.log(index);
    var links = data.edges.map(d => Object.assign(Object.create(d), {
        source: index.get(d.source),  //node与node之间的关联,是用target和source表示的
        target: index.get(d.target)
    }));

    var new_links = [];

   // console.log(links) all links shown in json doc
    for (var i = 0; i < links.length; i++) {
        if (links[i].source != null && links[i].target != null) {
            new_links.push(links[i]); //both of source and target are from CSE

            if (linksObj[links[i].source.id] === undefined) { 
                linksObj[links[i].source.id] = [];  
            }
            linksObj[links[i].source.id].push(links[i]);  //这条link的source node.id -- link
            
            if (linksObj[links[i].target.id] === undefined) { 
                linksObj[links[i].target.id] = [];
            }
            linksObj[links[i].target.id].push(links[i]); //同一条link的target node.id -- link
        }
            // linksObj[1] -> links[{source:1, target:276}, {1: 292}, ...  ]
            //linksObj[276] -> [{links: source:1, target:276}, ...]
            
    }
    console.log(new_links);
    console.log(linksObj)
    
    var color = d3.scaleOrdinal()
        .domain(d3.range(nodes.length))
        .range(d3.schemeCategory10);

    var forceSimulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(new_links))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter());

    //生成节点函数
    forceSimulation.nodes(nodes)
        .on("tick", ticked);
    //生成边函数
    forceSimulation.force("link")
        .links(new_links)
        .distance(100)
    //设置图形的中心位置
    forceSimulation.force("center")
        .x(width / 2)
        .y(height / 2);

    //绘制边
    var link = svg.append("g")
        .selectAll("line")
        .data(new_links)
        .enter().append("line")
        .attr("stroke-width", d => Math.sqrt(d.value))
        .attr("stroke", function (d, i) {
            return color(i);
        });

    //绘制节点     
    var node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", function (d) {
            return "circle-" + d.id; //
        })
        .attr("r", 5)
        // 设置节点的填充色，通过节点的group属性来计算节点的填充颜色
        .attr("fill", function (d, i) { return color(i); })
        // 以定义的这些人物节点为参数，调用drag()函数
        // 绑定拖拽函数的三个钩子，即拖拽开始、拖拽中、拖拽结束
        .call(d3.drag()
            .on("start", started)
            .on("drag", dragged)
            .on("end", ended))

        .on("mouseover", function (d) { 
            d3.select(".active")
                .classed("active", false) //删除类
                .transition()
                .duration(500)
                .attr("r", 5);
            d3.select(this) //当前DOM元素
                .classed("active", true) //添加类
                .transition()
                .duration(500)
                .attr("r", 20);
            if (linksObj[d.id] !== undefined && linksObj[d.id].length > 0) { 
                
                var sId = d.id; 
                var tId = linksObj[d.id][0].target.id; 
                // 因为一个node连好几条线 指定linksObj[1][0].target.id -> 每个source id对应的第一个target id 在矩阵中显示十字
                var obj = matrixObj[sId + "-" + tId];
        
                obj.flag = true;
                gridOver(obj);
            }
        })
        .on("mouseout", function (d) {
            d3.select(this)
                .classed("active", false)
                .transition()
                .duration(500)
                .attr("r", 5);
        });
        ;


    forceSimulation
        .nodes(nodes)
        .on("tick", ticked);// 此处在每次tick时绘制力导向图
    forceSimulation.force("link")
        .links(new_links);

    function ticked() {

        // 每次tick计时到时，连接线的响应动作
        // 设置连接线两端的节点的位置
        link
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        // 每次tick计时到时，节点的响应动作
        // 设置节点的圆心坐标
        node
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });
    }

    function started(d) {
        // restart()方法重新启动模拟器的内部计时器并返回模拟器。
        // 与simulation.alphaTarget或simulation.alpha一起使用时，此方法可用于在交互
        // 过程中进行“重新加热”模拟，例如在拖动节点时，在simulation.stop暂停之后恢复模拟
        if (!d3.event.active) {
            forceSimulation.alphaTarget(0.3).restart();//设置衰减系数，对节点位置移动过程的模拟，数值越高移动越快，数值范围[0，1]
        }
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    function ended(d) {
        if (!d3.event.active) {
            forceSimulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    }
});