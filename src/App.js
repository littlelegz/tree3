import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './App.css';
import { parseNewick, convertToD3Format } from './components/utils.ts';

function App() {
  const svgRef = useRef();
  const linkExtensionRef = useRef();
  const linkRef = useRef();
  const nodesRef = useRef();
  const [treeInputData, setTreeData] = useState(null);
  const [variableLinks, setVariableLinks] = useState(true);

  // Tree rendering constants
  const width = 1000;
  const outerRadius = width / 2;
  const innerRadius = outerRadius - 170;

  // Helper funxs
  function maxLength(d) {
    return d.data.value + (d.children ? d3.max(d.children, maxLength) : 0);
  }

  function setRadius(d, y0, k) {
    d.radius = (y0 += d.data.value) * k;
    if (d.children) d.children.forEach(d => setRadius(d, y0, k));
  }

  function linkVariable(d) {
    return linkStep(d.source.x, d.source.radius, d.target.x, d.target.radius);
  }

  function linkConstant(d) {
    return linkStep(d.source.x, d.source.y, d.target.x, d.target.y);
  }

  function linkExtensionVariable(d) {
    return linkStep(d.target.x, d.target.radius, d.target.x, innerRadius);
  }

  function linkExtensionConstant(d) {
    return linkStep(d.target.x, d.target.y, d.target.x, innerRadius);
  }

  function linkStep(startAngle, startRadius, endAngle, endRadius) {
    const c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI);
    const s0 = Math.sin(startAngle);
    const c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI);
    const s1 = Math.sin(endAngle);
    return "M" + startRadius * c0 + "," + startRadius * s0
      + (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
      + "L" + endRadius * c1 + "," + endRadius * s1;
  }

  function nodeTransformVariable(d) {
    return `
      rotate(${d.x - 90}) 
      translate(${d.radius || d.y},0)
      ${d.x >= 180 ? "rotate(180)" : ""}
    `;
  }

  function nodeTransformConstant(d) {
    return `
      rotate(${d.x - 90}) 
      translate(${d.y},0)
      ${d.x >= 180 ? "rotate(180)" : ""}
    `;
  }

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const response = await fetch('/asr.tree');
        const newickString = await response.text();
        const parsedTree = parseNewick(newickString);
        const d3Tree = convertToD3Format(parsedTree);
        setTreeData(d3Tree);
      } catch (error) {
        console.error('Error loading tree:', error);
      }
    };
    fetchTree();
  }, []);

  useEffect(() => {
    if (!treeInputData) return;

    // Clear any existing SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const cluster = d3.cluster()
      .size([360, innerRadius])
      .separation((a, b) => 1)

    const root = d3.hierarchy(treeInputData);

    const tree = d3.tree()
      .size([2 * Math.PI, 4000])
      .nodeSize([30, 30]) // [x, y] spacing between nodes
      .separation((a, b) => {
        return (a.parent === b.parent ? 1 : 2) / a.depth * (a.data.value / 50);
      });
    // Generate tree layout
    const treeData = tree(root);

    cluster(treeData); // Clusters all nodes onto one layer?
    setRadius(treeData, 0, innerRadius / maxLength(treeData));

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [-outerRadius, -outerRadius, width, width])
      .attr("font-family", "sans-serif")
      .attr("font-size", 5);

    svg.append("style").text(`
      .link--active {
        stroke: #000 !important;
        stroke-width: 1.5px;
      }

      .link-extension--active {
        stroke-opacity: .6;
      }

      .label--active {
        font-weight: bold;
      }

    `);

    const linkExtension = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.25)
      .selectAll("path")
      .data(treeData.links().filter(d => !d.target.children))
      .join("path")
      .each(function (d) { d.target.linkExtensionNode = this; })
      .attr("d", linkExtensionConstant);

    const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#444")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .each(function (d) { d.target.linkNode = this; })
      .attr("d", linkConstant)
      .attr("stroke", d => d.target.color)
      .on("mouseover", linkhovered(true))
      .on("mouseout", linkhovered(false));

    function linkhovered(active) {
      return function (event, d) {
        d3.select(this).classed("link--active", active);
        d3.select(d.linkExtensionNode).classed("link-extension--active", active).raise();
      };
    }

    // Add leaf labels
    svg.append("g")
      .selectAll("text")
      .data(root.leaves())
      .join("text")
      .attr("dy", ".31em")
      .attr("transform", d => `rotate(${d.x - 90}) translate(${innerRadius + 4},0)${d.x < 180 ? "" : " rotate(180)"}`)
      .attr("text-anchor", d => d.x < 180 ? "start" : "end")
      .text(d => d.data.name.replace(/_/g, " "))
      .on("mouseover", leafhovered(true))
      .on("mouseout", leafhovered(false));

    function leafhovered(active) {
      return function (event, d) {
        d3.select(this).classed("label--active", active);
        d3.select(d.linkExtensionNode).classed("link-extension--active", active).raise();
        do d3.select(d.linkNode).classed("link--active", active).raise();
        while (d = d.parent);
      };
    }

    // Add nodes
    const nodes = svg.selectAll(".node")
      .data(treeData.descendants().filter(d => d.children))
      .join("g")
      .attr("class", "inner-node")
      .attr("transform", d => `
        rotate(${d.x - 90}) 
        translate(${d.y},0)
        ${d.x >= 180 ? "rotate(180)" : ""}
    `);

    // Add circles for nodes
    nodes.append("circle")
      .attr("r", 2)
      .style("fill", "#fff")
      .style("stroke", "steelblue")
      .style("stroke-width", 1.5)
      .on("click", function (event, d) {
        console.log(d);
      });

    // Add inner node labels
    // nodes.append("text")
    //   .attr("dy", "0.31em")
    //   .attr("x", d => d.x < 180 === !d.children ? 6 : -6)
    //   .attr("text-anchor", d => d.x < 180 === !d.children ? "start" : "end")
    //   .attr("transform", d => d.x >= 180 ? "rotate(180)" : null)
    //   .text(d => d.data.name.replace(/_/g, " "))
    //   .on("mouseover", mouseovered(true))
    //   .on("mouseout", mouseovered(false));

    linkExtensionRef.current = linkExtension;
    linkRef.current = link;
    nodesRef.current = nodes;

  }, [treeInputData]);

  useEffect(() => {
    const t = d3.transition().duration(750);
    linkExtensionRef.current?.transition(t)
      .attr("d", !variableLinks ? linkExtensionVariable : linkExtensionConstant);
    linkRef.current?.transition(t)
      .attr("d", !variableLinks ? linkVariable : linkConstant);
    nodesRef.current?.transition(t)
      .attr("transform", !variableLinks ? nodeTransformVariable : nodeTransformConstant);
  }, [variableLinks]);

  return (
    <div className="App">
      <button onClick={() => setVariableLinks(!variableLinks)}>Reload</button>
      <div style={{ width: '100vh', height: '100vh' }}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}

export default App;