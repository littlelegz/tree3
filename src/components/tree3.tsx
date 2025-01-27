import React, { useEffect, useRef, useState, JSX, forwardRef, useImperativeHandle } from 'react';
import { createRoot } from 'react-dom/client';
import * as d3 from 'd3';
import { D3Node, RadialNode, RadialNodeLink, RadialTreeProps } from './types';
import { highlightDescendants, countLeaves } from './treeUtils.ts';
import '../css/tree3.css';

export interface RadialTreeRef {
  getLinkExtensions: () => d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown> | null;
  getLinks: () => d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown> | null;
  getInnerNodes: () => d3.Selection<SVGGElement, RadialNode, SVGGElement, unknown> | null;
  getLeaves: () => d3.Selection<SVGTextElement, RadialNode, SVGGElement, unknown> | null;
}

export const RadialTree = forwardRef<RadialTreeRef, RadialTreeProps>(({
  data,
  width = 1000,
  onNodeClick
}, ref) => {
  const [variableLinks, setVariableLinks] = useState(false);
  const [displayLeaves, setDisplayLeaves] = useState(true);
  const linkExtensionRef = useRef<d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown>>(null);
  const linkRef = useRef<d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown>>(null);
  const nodesRef = useRef<d3.Selection<SVGGElement, RadialNode, SVGGElement, unknown>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leafLabelsRef = useRef<d3.Selection<SVGTextElement, RadialNode, SVGGElement, unknown>>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined>>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const variableLinksRef = useRef<boolean>(false); // Using this ref so highlighting descendants updates correctly


  const outerRadius = width / 2;
  const innerRadius = outerRadius - 170;

  const maxLength = (d: RadialNode): number => {
    return (d.data.value || 0) + (d.children ? d3.max(d.children, maxLength) || 0 : 0);
  };

  const setRadius = (d: RadialNode, y0: number, k: number): void => {
    d.radius = (y0 += d.data.value || 0) * k;
    if (d.children) d.children.forEach(d => setRadius(d, y0, k));
  };

  function linkStep(startAngle: number, startRadius: number, endAngle: number, endRadius: number) {
    const c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI);
    const s0 = Math.sin(startAngle);
    const c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI);
    const s1 = Math.sin(endAngle);
    return "M" + startRadius * c0 + "," + startRadius * s0
      + (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
      + "L" + endRadius * c1 + "," + endRadius * s1;
  }

  function linkVariable(d: RadialNodeLink): string {
    return linkStep(d.source.x ?? 0, d.source.radius ?? 0, d.target.x ?? 0, d.target.radius ?? 0);
  }

  function linkConstant(d: RadialNodeLink): string {
    return linkStep(d.source.x ?? 0, d.source.y ?? 0, d.target.x ?? 0, d.target.y ?? 0);
  }

  function linkExtensionVariable(d: RadialNodeLink): string {
    return linkStep(d.target.x ?? 0, d.target.radius ?? 0, d.target.x ?? 0, innerRadius);
  }

  function linkExtensionConstant(d: RadialNodeLink): string {
    return linkStep(d.target.x ?? 0, d.target.y ?? 0, d.target.x ?? 0, innerRadius);
  }

  function nodeTransformVariable(d: RadialNode): string {
    return `
      rotate(${(d.x ?? 0) - 90}) 
      translate(${d.radius || d.y},0)
      ${(d.x ?? 0) >= 180 ? "rotate(180)" : ""}
    `;
  }

  function nodeTransformConstant(d: RadialNode) {
    return `
      rotate(${(d.x ?? 0) - 90}) 
      translate(${d.y},0)
      ${(d.x ?? 0) >= 180 ? "rotate(180)" : ""}
    `;
  }

  useEffect(() => { // Render tree
    if (!containerRef.current || !data) return;

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5]) // Min/max zoom level
      .on('zoom', (event) => {
        svg.attr('transform', event.transform);
      });

    d3.select(containerRef.current).selectAll("*").remove();

    // Make SVG element
    const svg: d3.Selection<SVGSVGElement, unknown, null, undefined> = d3.select(containerRef.current).append("svg");
    svg.attr("viewBox", [-outerRadius, -outerRadius, width, width])
      .attr("font-family", "sans-serif")
      .attr("font-size", 5)
      .call(zoom);

    svg.append("style").text(`
      .link--active {
        stroke: #000 !important;
        stroke-width: 1.5px;
      }

      .link--important {
        stroke: #F00 !important;
        stroke-width: 1.5px;
      }

      .link-extension--active {
        stroke-opacity: .6;
      }

      .label--active {
        font-weight: bold;
      }

      .node--active {
        stroke: #003366 !important;
        fill: #0066cc !important;
      }

      .tooltip-node {
        position: absolute;
        background: white;
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10;
      }
    `);

    const cluster = d3.cluster<D3Node>()
      .size([355, innerRadius]) // [angle to spread nodes, radius]
      .separation((a, b) => 1)

    const root = d3.hierarchy<D3Node>(data);
    const tree = d3.tree<D3Node>()
      .size([2 * Math.PI, 4000])
      .nodeSize([30, 30])
      .separation((a, b) => {
        return (a.parent === b.parent ? 1 : 2) / a.depth * ((a.data.value || 0) / 50);
      });

    // Generate tree layout
    const treeData = tree(root);

    cluster(treeData); // Not sure what this does, possibly places leaves all on same level
    setRadius(treeData, 0, innerRadius / maxLength(treeData));

    function linkhovered(active: boolean): (event: d3.BaseType, d: RadialNodeLink) => void {
      return function (event: d3.BaseType, d: RadialNodeLink): void {
        d3.select(this).classed("link--active", active);
        if (d.target.linkExtensionNode) {
          d3.select(d.target.linkExtensionNode).classed("link-extension--active", active).raise();
        }
      };
    }

    const linkExtension = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.25)
      .selectAll("path")
      .data(treeData.links().filter(d => !d.target.children)) // targets nodes without children
      .join("path")
      .each(function (d: RadialNodeLink) { d.target.linkExtensionNode = this as SVGPathElement; })
      .attr("d", linkExtensionConstant);

    const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#444")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .each(function (d: RadialNodeLink) { d.target.linkNode = this as SVGPathElement; })
      .attr("d", linkConstant)
      .attr("stroke", (d: RadialNodeLink) => d.target.color || "#000")
      .on("mouseover", linkhovered(true))
      .on("mouseout", linkhovered(false));

    const leafLabels = svg.append("g")
      .selectAll("text")
      .data(root.leaves())
      .join("text")
      .attr("dy", ".31em")
      .attr("transform", d => `rotate(${(d.x ?? 0) - 90}) translate(${innerRadius + 4},0)${(d.x ?? 0) < 180 ? "" : " rotate(180)"}`)
      .attr("text-anchor", d => (d.x ?? 0) < 180 ? "start" : "end")
      .text(d => d.data.name.replace(/_/g, " "))
      .on("mouseover", leafhovered(true))
      .on("mouseout", leafhovered(false));

    function leafhovered(active: boolean): (event: d3.BaseType, d: RadialNode) => void {
      return function (event, d) {
        d3.select(this).classed("label--active", active);
        if (d.linkExtensionNode) {
          d3.select(d.linkExtensionNode).classed("link-extension--active", active).raise();
        }
        do {
          if (d.linkNode) {
            d3.select(d.linkNode).classed("link--active", active).raise();
          }
        } while (d.parent && (d = d.parent));
      };
    }

    function nodeMouseOver(active: boolean): (event: MouseEvent, d: RadialNode) => void {
      return function (event, d) {
        d3.select(this).classed("node--active", active);

        // Highlight connected links
        if (d.linkExtensionNode) {
          d3.select(d.linkExtensionNode)
            .classed("link-extension--active", active)
            .raise();
        }

        // Highlight path to root
        let current = d;
        do {
          if (current.linkNode) {
            d3.select(current.linkNode)
              .classed("link--important", active)
              .raise();
          }
        } while (current.parent && (current = current.parent));

        // Highlight descendants
        highlightDescendants(d, active, variableLinksRef.current, svg);
      };
    }

    function showHoverLabel(event: MouseEvent, d: RadialNode): void {
      // Clear any existing tooltips
      d3.selectAll('.tooltip-node').remove();

      tooltipRef.current = d3.select(containerRef.current)
        .append('div')
        .attr('class', 'tooltip-node')
        .style('position', 'fixed')
        .style('left', `${event.clientX + 10}px`)
        .style('top', `${event.clientY - 10}px`)
        .style('opacity', 0)
        .html(`${d.data.name}<br/>Leaves: ${countLeaves(d)}`);

      tooltipRef.current
        .transition()
        .duration(200)
        .style('opacity', 1);
    }

    function hideHoverLabel(): void {
      if (tooltipRef.current) {
        tooltipRef.current
          .transition()
          .duration(200)
          .style('opacity', 0)
          .remove();
      }
    }

    function nodeClicked(event: MouseEvent, d: RadialNode): void {
      d3.selectAll('.tooltip-node').remove();

      const menu = d3.select(containerRef.current)
        .append('div')
        .attr('class', 'menu-node')
        .style('position', 'fixed')
        .style('left', `${event.clientX + 10}px`)
        .style('top', `${event.clientY - 10}px`)
        .style('opacity', 1)
        .node();

      const MenuContent = (
        <>
          <div className="menu-header">{d.data.name}<button
            className="menu-close-btn"
            onClick={() => {
              menu?.remove();
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >X</button></div>
          <div className="menu-buttons">
            <button className="menu-btn" onClick={() => console.log('expand', d)}>
              Expand All
            </button>
            <button className="menu-btn" onClick={() => console.log('collapse', d)}>
              Collapse All
            </button>
            <button className="menu-btn" onClick={() => console.log('focus', d)}>
              Focus Here
            </button>
          </div>
        </>
      );

      if (menu) {
        const root = createRoot(menu);
        root.render(MenuContent);
      }
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
      .attr("r", 3)
      .style("fill", "#fff")
      .style("stroke", "steelblue")
      .style("stroke-width", 1.5)
      .on("click", nodeClicked)
      .on("mouseover", nodeMouseOver(true))
      .on("mouseout", nodeMouseOver(false))
      .on('mouseenter', showHoverLabel)
      .on('mouseleave', hideHoverLabel);

    linkExtensionRef.current = linkExtension as unknown as d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown>;
    linkRef.current = link as unknown as d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown>;
    nodesRef.current = nodes as unknown as d3.Selection<SVGGElement, RadialNode, SVGGElement, unknown>;
    leafLabelsRef.current = leafLabels as unknown as d3.Selection<SVGTextElement, RadialNode, SVGGElement, unknown>;
    svgRef.current = svg.node();

    // Append SVG to container
    containerRef.current.innerHTML = ''; // Clear existing content
    containerRef.current.appendChild(svg.node()!);

  }, [data, width, onNodeClick]);

  useEffect(() => { // Transition between variable and constant links
    const t = d3.transition().duration(750);
    linkExtensionRef.current?.transition(t)
      .attr("d", variableLinks ? linkExtensionVariable : linkExtensionConstant);
    linkRef.current?.transition(t)
      .attr("d", variableLinks ? linkVariable : linkConstant);
    nodesRef.current?.transition(t)
      .attr("transform", variableLinks ? nodeTransformVariable : nodeTransformConstant);
    variableLinksRef.current = variableLinks;
  }, [variableLinks]);

  useEffect(() => { // Toggle leaf label visibility
    leafLabelsRef.current?.style("display", displayLeaves ? "block" : "none");
    linkExtensionRef.current?.style("display", displayLeaves ? "block" : "none");
  }, [displayLeaves]);

  useImperativeHandle(ref, () => ({
    getLinkExtensions: () => linkExtensionRef.current,
    getLinks: () => linkRef.current,
    getInnerNodes: () => nodesRef.current,
    getLeaves: () => leafLabelsRef.current
  }));

  return (
    <div className="radial-tree">
      <button onClick={() => setVariableLinks(!variableLinks)}>
        Toggle Variable Links
      </button>
      <button onClick={() => setDisplayLeaves(!displayLeaves)}>
        Toggle Leaves
      </button>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );

});
