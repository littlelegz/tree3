import { UnrootedNode } from './types';
import * as d3 from 'd3';

const getAllLeafCoords = (node: UnrootedNode, scale: number): Array<{ x: number, y: number }> => {
  const coords: Array<{ x: number, y: number }> = [];
  const source = node.parent as UnrootedNode;
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

  if (node.branchset.length === 0) {
    coords.push({
      x: extendedX,
      y: extendedY
    });
  }

  if (node.branchset) {
    (node.branchset as UnrootedNode[]).forEach(child => {
      coords.push(...getAllLeafCoords(child, scale));
    });
  }

  return coords;
};

export const countLeaves = (node: UnrootedNode): number => {
  if (!node.branchset || node.branchset.length === 0) {
    return 1;
  }
  return node.branchset.reduce((sum: number, child: any) => sum + countLeaves(child), 0);
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

// mapChildren is different from UnrootedNodes. Children are stored in branchset as TreeNodes (without elements data), and in 
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
    if (node.branchset) {
      node.branchset.forEach(child => {
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
  if (node.branchset) {
    node.branchset.forEach(child => {
      mapChildren(child as UnrootedNode, child => {
        if (!child.branchset && child.linkNode) {
          const isHighlighted = d3.select(child.linkNode).classed('link--highlight');
          d3.select(child.linkNode).classed('link--highlight', !isHighlighted);
        }
      });
    });
  }
}