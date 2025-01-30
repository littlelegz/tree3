import { RadialNode, D3Node, TreeNode } from './types';
import * as d3 from 'd3';

function getBoundingBox(node: RadialNode, isVariable: boolean): { minX: number; maxX: number; minY: number } {
  let bbox = {
    minX: node.x ?? 0,
    maxX: node.x ?? 0,
    minY: isVariable ? node.radius ?? 0 : node.y ?? 0,
  };

  if (node.children) {
    node.children.forEach(child => {
      const childBox = getBoundingBox(child as RadialNode, isVariable);
      bbox.minX = Math.min(bbox.minX, childBox.minX);
      bbox.maxX = Math.max(bbox.maxX, childBox.maxX);
      bbox.minY = Math.min(bbox.minY, childBox.minY);
    });
  }

  return bbox;
}

export const countLeaves = (node: RadialNode): number => {
  if (!node.children || node.children.length === 0) {
    return 1;
  }
  return node.children.reduce((sum: number, child: any) => sum + countLeaves(child), 0);
};

export function highlightDescendants(node: RadialNode, active: boolean, linksVariable: boolean, svg: d3.Selection<SVGGElement, unknown, null, undefined>, innerRadius: number): void {
  const bbox = getBoundingBox(node, linksVariable);

  // Remove existing highlight
  svg.selectAll('.highlight-box').remove();

  if (active) {
    // Create highlight box
    svg.insert('path', ':first-child')
      .attr('class', 'highlight-box')
      .attr('d', d3.arc()({
        innerRadius: bbox.minY,
        outerRadius: innerRadius + 170,
        startAngle: (bbox.minX) * (Math.PI / 180), // Angle in radians
        endAngle: (bbox.maxX) * (Math.PI / 180)
      }))
      .style('fill', 'rgba(255, 255, 0, 0.2)')
      .style('stroke', 'none');
  }
}

function mapChildren(node: RadialNode, callback: (node: RadialNode) => void): void {
  if (node.children) {
    node.children.forEach(child => {
      mapChildren(child as RadialNode, callback);
    });
  }
  callback(node);
}

export function toggleHighlightDescendantLinks(node: RadialNode): void {
  if (node.children) {
    node.children.forEach(child => {
      mapChildren(child as RadialNode, child => {
        if (child.linkNode) {
          const isHighlighted = d3.select(child.linkNode).classed('link--highlight');
          d3.select(child.linkNode).classed('link--highlight', !isHighlighted);
        }
      });
    });
  }
}

export function toggleHighlightTerminalLinks(node: RadialNode): void {
  // Recurse through all children and highlight links
  if (node.children) {
    node.children.forEach(child => {
      mapChildren(child as RadialNode, child => {
        if (!child.children && child.linkNode) {
          const isHighlighted = d3.select(child.linkNode).classed('link--highlight');
          d3.select(child.linkNode).classed('link--highlight', !isHighlighted);
        }
      });
    });
  }
}

export function toggleHighlightInternalLinks(node: RadialNode): void {
  // Recurse through all children and highlight links
  if (node.children) {
    node.children.forEach(child => {
      mapChildren(child as RadialNode, child => {
        if (child.children && child.linkNode) {
          const isHighlighted = d3.select(child.linkNode).classed('link--highlight');
          d3.select(child.linkNode).classed('link--highlight', !isHighlighted);
        }
      });
    });
  }
}

export function toggleHighlightLinkToRoot(node: RadialNode): void {
  let current = node;
  do {
    if (current.linkNode) {
      const isHighlighted = d3.select(current.linkNode).classed('link--highlight');
      d3.select(current.linkNode)
        .classed('link--highlight', !isHighlighted)
        .raise();
    }
  } while (current.parent && (current = current.parent));
}

function toggleElementClass(element: SVGElement | null, className: string, active: boolean): void {
  if (!element) return;
  d3.select(element).classed(className, active);
}

export function toggleCollapseClade(node: RadialNode): void {
  if (node.nodeElement) {
    const isHidden = d3.select(node.nodeElement).select("circle").classed('node--collapsed');
    d3.select(node.nodeElement).select("circle").classed('node--collapsed', !isHidden);
    if (node.children) {
      node.children.forEach(child => {
        mapChildren(child as RadialNode, child => {
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

export function reroot(node: RadialNode, data: TreeNode): RadialNode {
  // Already root
  if (!node.parent) return node;

  const tree = d3.tree<D3Node>()
  // BFS to find node.data.name in data
  let queue = [data];
  let found = false;
  var newRoot = data;
  var toFlip = data;
  while (queue.length > 0 && !found) {
    const current = queue.shift();
    if (current?.branchset) {
      for (const child of current.branchset) {
        if (child.name === node.data.name) { // found node
          found = true;
          // remove node from parent's branchset
          const index = current.branchset.indexOf(child);
          current.branchset.splice(index, 1);
          // attach current to this node as child
          // flip current's relationships
          toFlip = current;
          newRoot = child;
          break;
        }
      }
      queue.push(...current.branchset);
    }
  }

  console.log("toflip", toFlip);
  // Easy step: set the new root as the parent of the current root

  
  return node;
}