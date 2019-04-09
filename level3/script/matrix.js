var matrixObj = {};

function gridOver(d) { 
    var arr = d.id.split("-");
    var sId = arr[0] * 1;

    if (d.flag === false) {  //点到node：传进来是true, highlight 行&列; mouseover: rect.grid 传过来是false, highlight 这个node
        d3.select(".active")
            .classed("active", false)
            .transition()
            .duration(500)
            .attr("r", 5);
         
        d3.select(".circle-" + sId)  //作为source的node的id
            .classed("active", true)
            .transition()
            .duration(500)
            .attr("r", 20);
    } 
    d3.selectAll("rect").style("stroke-width", function (p) {
        return p.x == d.x || p.y == d.y ? "3px" : "1px"  //height 行&列
    });
};

function adjacency() {
    d3.json("dataset/HKUST_coauthor_graph.json", function (miserables) {
        for (var i = 0; i < miserables.nodes.length; i++) {
            if (miserables.nodes[i].dept != "CSE") {
                miserables.nodes.splice(i, 1); //和delete的区别
                i = i-1;
            }
        }
        for (var i = 0; i < miserables.edges.length; i++) {
            miserables.edges[i].weight = miserables.edges[i].publications.length;
        }
        createAdjacencyMatrix(miserables.nodes, miserables.edges);
    });


    function createAdjacencyMatrix(nodes, edges) {
        var edgeHash = {};
        edges.forEach(edge => {
            var id = edge.source + "-" + edge.target
            edgeHash[id] = edge
        })

        var matrix = [];      
        nodes.forEach((s, a) => {
            nodes.forEach((t, b) => {
                var grid = { id: s.id + "-" + t.id, x: b, y: a, weight: 0 }; //竖着画
                if (edgeHash[grid.id]) { //edge.s 和 edge.t 的id 和nodes中的 id 相对应，加到matrix里
                    grid.weight = edgeHash[grid.id].weight; //publications.length
                }
                matrix.push(grid); //s: 1 t: 276, x, y, w
                matrixObj[grid.id] = grid; //0: 上面
                //matrixObj[grid.id].flag = false; 
            })
        })

        console.log(matrixObj);

        var gridW = 20;
        var width = 1500;

        var svg = d3.select(".matrix-chart svg");
        svg.attr("width", width)
            .attr("height", width);

        svg.append("g")
            .attr("transform", "translate(100,100)")
            .attr("id", "adjacencyG")
            .selectAll("rect")
            .data(matrix) 
            .enter()
            .append("rect")
            .attr("class", function (d) {
                return "grid " + ( "grid-"+d.id); //为了后面的调用 rect.grid
            })
            .attr("width", gridW)
            .attr("height", gridW)
            .attr("x", d => d.x * gridW)
            .attr("y", d => d.y * gridW)
            .style("fill-opacity", d => d.weight * .2) //不透明度

        svg
            .append("g")
            .attr("transform", "translate(150,50)")
            .selectAll("text")
            .data(nodes)
            .enter()
            .append("g")
            .attr("transform", function (d, i) {
                return "translate(" + (i * gridW) +",-5)"; //横着移动
            })
            .attr("temp", function (d, i) {
                d3.select(this) //针对这个node
                    .append("text")
                    .text(function (d) {
                        var val = d.fullname;
                        var len = 25 - d.fullname.length;
                        while (len > 0) {
                            val += "-";
                            len--;
                        }
                        return val;
                    })
                    .style("transform", function (d, i) {
                        return "rotate(-45deg) ";
                    })
                    .style("text-anchor", "middle")
                    .style("font-size", "10px")
                    ;
            });
           
        svg
            .append("g").attr("transform", "translate(94,100)")
            .selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .attr("y", (d, i) => i * gridW + 15)
            .text(d => d.fullname)
            .style("text-anchor", "end")
            .style("font-size", "10px")


        d3.selectAll("rect.grid").on("mouseover", function (d) {
            d.flag = false;  
            gridOver(d); 
        });      
    };
}
adjacency();