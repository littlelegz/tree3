import { UnrootedNode } from './types';
import * as d3 from 'd3';

const getAllLeafCoords = (node: UnrootedNode, scale: number): Array<{ x: number, y: number }> => {
    const coords: Array<{ x: number, y: number }> = [];

    if (node.branchset.length === 0) {
        coords.push({
            x: node.x * scale,
            y: node.y * scale
        });
    }

    if (node.branchset) {
        (node.branchset as UnrootedNode[]).forEach(child => {
            coords.push(...getAllLeafCoords(child, scale));
        });
    }

    return coords;
};

export function highlightClade(node: UnrootedNode, active: boolean, svg: d3.Selection<SVGGElement, unknown, null, undefined>, scale: number): void {
    if (node.isTip) return;

    // Get array of all coordinates of children
    const childrenCoords = getAllLeafCoords(node, scale);

    console.log(childrenCoords);

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