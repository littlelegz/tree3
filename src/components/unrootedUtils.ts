import { UnrootedNode } from './types';
import * as d3 from 'd3';

const getAllLeafCoords = (node: UnrootedNode, scale: number): Array<{ x: number, y: number }> => {
  const coords: Array<{ x: number, y: number }> = [];
  const source = node.parent as UnrootedNode;
  if (!source) return coords;
  const target = node;

  // Accounting for linkExtensions
  const sourceX = source.x * scale;
  const sourceY = source.y * scale;
  const targetX = target.x * scale;
  const targetY = target.y * scale;

  const angle = Math.atan2(targetY - sourceY, targetX - sourceX);

  // Extend in direction based on text-anchor
  const extensionLength = 600;
  const extendedX = targetX + Math.cos(angle) * extensionLength;
  const extendedY = targetY + Math.sin(angle) * extensionLength;

  if (node.children && node.children.length === 0) {
    coords.push({
      x: extendedX,
      y: extendedY
    });
  }

  if (node.children) {
    (node.children as UnrootedNode[]).forEach(child => {
      coords.push(...getAllLeafCoords(child, scale));
    });
  }

  return coords;
};

export const countLeaves = (node: UnrootedNode): number => {
  if (!node.children || node.children.length === 0) {
    return 1;
  }
  return node.children.reduce((sum: number, child: any) => sum + countLeaves(child), 0);
};

export function highlightClade(node: UnrootedNode, active: boolean, svg: d3.Selection<SVGGElement, unknown, null, undefined>, scale: number): void {
  if (node.isTip) return;

  // Get array of all coordinates of children
  const childrenCoords = getAllLeafCoords(node, scale);

  const complexPath = (coords: Array<{ x: number, y: number }>, nodeX: number, nodeY: number): string => {
    let path = `M ${nodeX} ${nodeY}`;

    coords.forEach(coord => {
      path += ` L ${coord.x} ${coord.y}`;
    });
    path += ` L ${nodeX} ${nodeY}`;

    return path;
  };

  // Remove existing highlight
  svg.selectAll('.highlight-box').remove();

  if (active) {
    // Node center point
    const nodeX = node.x * scale;
    const nodeY = node.y * scale;

    svg.insert('path', ':first-child')
      .attr('class', 'highlight-box')
      .attr('d', complexPath(childrenCoords, nodeX, nodeY))
      .style('fill', 'rgba(255, 255, 0, 0.2)')
      .style('stroke', 'none');
  }
}

export function colorClade(node: UnrootedNode, active: boolean, svg: d3.Selection<SVGGElement, unknown, null, undefined>, scale: number, color: string): void {
  if (node.isTip) return;

  // Get array of all coordinates of children
  const childrenCoords = getAllLeafCoords(node, scale);

  const complexPath = (coords: Array<{ x: number, y: number }>, nodeX: number, nodeY: number): string => {
    let path = `M ${nodeX} ${nodeY}`;

    coords.forEach(coord => {
      path += ` L ${coord.x} ${coord.y}`;
    });
    path += ` L ${nodeX} ${nodeY}`;

    return path;
  };

  // Remove existing highlight
  svg.selectAll(`.color-box-${node.data.name}`).remove();

  if (active) {
    // Node center point
    const nodeX = node.x * scale;
    const nodeY = node.y * scale;

    let colorGroup: d3.Selection<SVGGElement, unknown, null, undefined> = svg.select('g.color-boxes');
    if (colorGroup.empty()) {
      colorGroup = svg.insert('g', ':first-child')
        .attr('class', 'color-boxes')
        .style('isolation', 'isolate')
        .lower();
    }

    colorGroup.append('path')
      .attr('class', `color-box color-box-${node.data.name}`)
      .attr('d', complexPath(childrenCoords, nodeX, nodeY))
      .style('fill', color)
      .style('stroke', 'none')
      .style('composite-operation', 'source-over');
  }
}

// mapChildren is different from UnrootedNodes. Children are stored in children as TreeNodes (without elements data), and in 
// forwardLinkNodes as SVGPathElements. We need to recurse through the forwardLinkNodes to get the children.
function mapChildren(node: UnrootedNode, callback: (node: UnrootedNode) => void): void {
  if (node.forwardLinkNodes) {
    node.forwardLinkNodes.forEach(pathElement => {
      const linkData = (pathElement as any).__data__;
      if (linkData && linkData.target) {
        mapChildren(linkData.target as UnrootedNode, callback);
      }
    });
  }
  callback(node);
}

function toggleElementClass(element: SVGElement | null, className: string, active: boolean): void {
  if (!element) return;
  d3.select(element).classed(className, active);
}

export function toggleCollapseClade(node: UnrootedNode): void {
  if (node.nodeElement) {
    const isHidden = d3.select(node.nodeElement).select("circle").classed('node--collapsed');
    d3.select(node.nodeElement).select("circle").classed('node--collapsed', !isHidden);
    if (node.children) {
      node.children.forEach(child => {
        mapChildren(child as UnrootedNode, child => {
          toggleElementClass(child.linkNode as SVGElement, 'link--hidden', !isHidden);
          toggleElementClass(child.nodeElement as SVGElement, 'link--hidden', !isHidden);
          toggleElementClass(child.linkExtensionNode as SVGElement, 'link--hidden', !isHidden);
          toggleElementClass(child.labelElement as SVGElement, 'link--hidden', !isHidden);
          // Reset any collapsed nodes under this clade
          if (child.nodeElement) {
            d3.select(child.nodeElement).select("circle").classed('node--collapsed', !isHidden);
          }
        });
      });
    }
  }
}

export function toggleHighlightDescendantLinks(node: UnrootedNode): void {
  if (node.forwardLinkNodes) {
    node.forwardLinkNodes.forEach(child => {
      mapChildren((child as any).__data__.target as UnrootedNode, child => {
        if (child.linkNode) {
          const isHighlighted = d3.select(child.linkNode).classed('link--highlight');
          d3.select(child.linkNode).classed('link--highlight', !isHighlighted);
        }
      });
    });
  }
}

export function toggleHighlightTerminalLinks(node: UnrootedNode): void {
  // Recurse through all children and highlight links
  if (node.children) {
    node.children.forEach(child => {
      mapChildren(child as UnrootedNode, child => {
        if (child.children.length === 0 && child.linkNode) {
          const isHighlighted = d3.select(child.linkNode).classed('link--highlight');
          d3.select(child.linkNode).classed('link--highlight', !isHighlighted);
        }
      });
    });
  }
}

export function findAndZoom(name: string,
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  container: React.MutableRefObject<HTMLDivElement>,
  scale: number
): void {
  // Find node with name in tree
  const node = svg.select('g.nodes')
    .selectAll<SVGGElement, UnrootedNode>('g.inner-node')
    .filter(d => d.data.name === name);

  // Find leaf with name in tree
  const leaf = svg.select('g.leaves')
    .selectAll<SVGTextElement, UnrootedNode>('text.leaf-label')
    .filter(d => d.data.name === name);

  if (!node.empty()) { // Found node
    const nodeElement = node.node();
    const nodeData = node.data()[0];

    if (!nodeElement) {
      return;
    }

    const x = (nodeData.x ?? 0) * scale;
    const y = (nodeData.y ?? 0) * scale;

    // Center the node
    const centerOffsetX = container.current.clientWidth / 2;
    const centerOffsetY = container.current.clientHeight / 2;

    const zoom = d3.zoom().on("zoom", (event) => {
      svg.select("g").attr("transform", event.transform);
    });

    svg.transition()
      .duration(750)
      .call(zoom.transform as any, d3.zoomIdentity
        .translate(-x + centerOffsetX, -y + centerOffsetY)
        .scale(1));

    const circle = d3.select(nodeElement).select('circle');
    const currRadius = circle.attr("r");
    const currColor = circle.style("fill");
    const newRadius = (parseFloat(currRadius) * 2).toString();


    circle.transition()
      .delay(1000)
      .style("fill", "red")
      .style("r", newRadius)
      .transition()
      .duration(750)
      .style("fill", currColor)
      .style("r", currRadius)
      .transition()
      .duration(750)
      .style("fill", "red")
      .style("r", newRadius)
      .transition()
      .duration(750)
      .style("fill", currColor)
      .style("r", currRadius);

  } else if (!leaf.empty()) { // Found leaf
    const leafElement = leaf.node();
    const leafData = leaf.data()[0];

    if (!leafElement) {
      return;
    }

    const path = leafData.linkExtensionNode;
    if (path) {
      const pathStrValue = path.getAttribute('d') || '';
      const lastLCoords = pathStrValue.match(/L\s*([0-9.-]+)\s*,?\s*([0-9.-]+)\s*$/);
      if (lastLCoords) {
        const [_, x, y] = lastLCoords;

        // Center the node
        const centerOffsetX = container.current.clientWidth / 2;
        const centerOffsetY = container.current.clientHeight / 2;

        const zoom = d3.zoom().on("zoom", (event) => {
          svg.select("g").attr("transform", event.transform);
        });

        // Apply transform here
        svg.transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity
            .translate(-x + centerOffsetX, -y + centerOffsetY)
            .scale(1));

        // Pulse the leaf label and link extension
        const text = d3.select(leafElement);
        const currColor = text.style("fill");
        const currSize = text.style("font-size");
        const newSize = (parseFloat(currSize) * 2).toString();

        text.transition()
          .delay(750)
          .style("fill", "red")
          .style("font-size", newSize)
          .transition()
          .duration(750)
          .style("fill", currColor)
          .style("font-size", currSize)
          .transition()
          .duration(750)
          .style("fill", "red")
          .style("font-size", newSize)
          .transition()
          .duration(750)
          .style("fill", currColor)
          .style("font-size", currSize);

        // Pulse the link extension
        const linkExtension = d3.select(path);
        const currStroke = linkExtension.style("stroke");
        const currStrokeWidth = linkExtension.style("stroke-width");
        const newStrokeWidth = (parseFloat(currStrokeWidth) * 2).toString();

        linkExtension.transition()
          .delay(750)
          .style("stroke", "red")
          .style("stroke-width", newStrokeWidth)
          .transition()
          .duration(750)
          .style("stroke", currStroke)
          .style("stroke-width", currStrokeWidth)
          .transition()
          .duration(750)
          .style("stroke", "red")
          .style("stroke-width", newStrokeWidth)
          .transition()
          .duration(750)
          .style("stroke", currStroke)
          .style("stroke-width", currStrokeWidth);
      } else {
        //console.warn("findAndZoom failed. No coordinates found in path string for query:", name);
      }
    } else {
      //console.warn("No path string found for leaf", name);
    }



  }
}