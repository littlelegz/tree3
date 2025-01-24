import React, { useEffect, useRef, useState, JSX } from 'react';
import * as d3 from 'd3';
import { D3Node } from './utils';
import { HierarchyNode } from 'd3-hierarchy';

interface RadialTreeProps {
  data: D3Node;
  containerRef: React.RefObject<HTMLDivElement>;
  width?: number;
  height?: number;
  onNodeClick?: (node: D3Node) => void;
}

interface RadialNodeLink {
  source: RadialNode;
  target: RadialNode;
}

// Extend D3's HierarchyNode with radius property
interface RadialNode extends d3.HierarchyNode<D3Node> {
  radius?: number;
  linkNode?: SVGPathElement;
  linkExtensionNode?: SVGPathElement;
}

export const RadialTree = ({
  data,
  containerRef,
  width = 1000,
  height = 1000,
  onNodeClick
}: RadialTreeProps): JSX.Element => {
  const [variableLinks, setVariableLinks] = useState(true);
  const linkExtensionRef = useRef<d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown>>(null);
  const linkRef = useRef<d3.Selection<SVGPathElement, RadialNodeLink, SVGGElement, unknown>>(null);
  const nodesRef = useRef<d3.Selection<SVGGElement, RadialNode, SVGGElement, unknown>>(null);

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

  useEffect(() => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

    // Make SVG element
    const svg = d3.select(containerRef.current).append("svg");
    svg.attr("viewBox", [-outerRadius, -outerRadius, width, width])
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

    const cluster = d3.cluster<D3Node>()
      .size([360, innerRadius])
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

    function updateNodeLinkExtension(node: RadialNode, active: boolean) {
      d3.select(node.linkExtensionNode).classed("link-extension--active", active);
    }

    const linkExtension = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.25)
      .selectAll("path")
      .data(treeData.links().filter(d => !d.target.children)) // targets nodes without children
      .join("path")
      .each(function (d: RadialNode) { d.target.linkExtensionNode = this; })
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

  }, [data, width, height, containerRef, onNodeClick]);

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
    <div className="radial-tree">
      <button onClick={() => setVariableLinks(!variableLinks)}>
        Toggle Variable Links
      </button>
    </div>
  );

};