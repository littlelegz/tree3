import { RadialNode, RadialNodeLink } from './types';
import * as d3 from 'd3';

function getBoundingBox(node: RadialNode, isVariable: boolean): { minX: number; maxX: number; minY: number; maxY: number } {
  let bbox = {
    minX: node.x ?? 0,
    maxX: node.x ?? 0,
    minY: isVariable ? node.radius ?? 0 : node.y ?? 0,
    maxY: isVariable ? node.radius ?? 0 : node.y ?? 0
  };

  if (node.children) {
    node.children.forEach(child => {
      const childBox = getBoundingBox(child as RadialNode, isVariable);
      bbox.minX = Math.min(bbox.minX, childBox.minX);
      bbox.maxX = Math.max(bbox.maxX, childBox.maxX);
      bbox.minY = Math.min(bbox.minY, childBox.minY);
      bbox.maxY = Math.max(bbox.maxY, childBox.maxY);
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

export function highlightDescendants(node: RadialNode, active: boolean, linksVariable: boolean, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>): void {
  const bbox = getBoundingBox(node, linksVariable);

  // Remove existing highlight
  svg.selectAll('.highlight-box').remove();

  if (active) {
    // Create highlight box
    svg.insert('path', ':first-child')
      .attr('class', 'highlight-box')
      .attr('d', d3.arc()({
        innerRadius: bbox.minY,
        outerRadius: bbox.maxY,
        startAngle: (bbox.minX) * (Math.PI / 180),
        endAngle: (bbox.maxX) * (Math.PI / 180)
      }))
      .style('fill', 'rgba(255, 255, 0, 0.2)')
      .style('stroke', 'none');
  }
}

export function renderSubmenu(event: MouseEvent, d: RadialNode): void {
  console.log("Render submenu", d);
  console.log("Render submenu event", event);

}