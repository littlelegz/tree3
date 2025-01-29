import { UnrootedNode } from './types';
import * as d3 from 'd3';

// Recursively search for the bounding box of a node and its children
function getBoundingBox(node: UnrootedNode): { minX: number; maxX: number; minY: number; maxY: number } {
    let bbox = {
        minX: node.x,
        maxX: node.x,
        minY: node.y,
        maxY: node.y,
    };

    if (node.branchset) {
        node.branchset.forEach(child => {
            const childBox = getBoundingBox(child as UnrootedNode);
            bbox.minX = Math.min(bbox.minX, childBox.minX);
            bbox.maxX = Math.max(bbox.maxX, childBox.maxX);
            bbox.minY = Math.min(bbox.minY, childBox.minY);
            bbox.maxY = Math.max(bbox.maxY, childBox.maxY);
        });
    }

    return bbox;
}

export function highlightClade(node: UnrootedNode, active: boolean, svg: d3.Selection<SVGGElement, unknown, null, undefined>, scale: number): void {
    if (node.isTip) return;
    
    let bbox = {
        minX: (node.branchset[0] as UnrootedNode).x,
        maxX: (node.branchset[0] as UnrootedNode).x,
        minY: (node.branchset[0] as UnrootedNode).y,
        maxY: (node.branchset[0] as UnrootedNode).y,
    };

    for (const child of node.branchset) {
        const childBox = getBoundingBox(child as UnrootedNode);
        bbox.minX = Math.min(bbox.minX, childBox.minX);
        bbox.maxX = Math.max(bbox.maxX, childBox.maxX);
        bbox.minY = Math.min(bbox.minY, childBox.minY);
        bbox.maxY = Math.max(bbox.maxY, childBox
        .maxY);
    }

    // Remove existing highlight
    svg.selectAll('.highlight-box').remove();

    if (active) {
        // Node center point
        const nodeX = node.x * scale ;
        const nodeY = node.y * scale ;

        // Furthest points
        const topLeft = {
            x: bbox.minX * scale ,
            y: bbox.minY * scale 
        };
        const bottomRight = {
            x: bbox.maxX * scale ,
            y: bbox.maxY * scale 
        };

        svg.insert('path', ':first-child')
            .attr('class', 'highlight-box')
            .attr('d', `
                M ${nodeX} ${nodeY}
                L ${topLeft.x} ${topLeft.y}
                L ${bottomRight.x} ${bottomRight.y}
                Z
            `)
            .style('fill', 'rgba(255, 255, 0, 0.2)')
            .style('stroke', 'none');
    }
}