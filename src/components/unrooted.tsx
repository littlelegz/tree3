import React, { forwardRef, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TreeNode, UnrootedData, UnrootedNode, Link, EqAngNode } from './types';
import { highlightClade } from './unrootedUtils.ts';

interface UnrootedTreeProps {
    data: any;
    width?: number;
    height?: number;
    scale?: number;
}

export interface UnrootedTreeHandle {
    getLeaves: () => any[];
    getSvg: () => SVGSVGElement | null;
}

export const UnrootedTree = forwardRef<UnrootedTreeHandle, UnrootedTreeProps>(({
    data,
    width = 500,
    height = 500,
    scale = 500,
}, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const getBoundingBox = (data: UnrootedData, scale: number) => {
        const nodes: UnrootedNode[] = data.data;
        const edges: Link<UnrootedNode>[] = data.edges;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        // Check nodes
        nodes.forEach((node: any) => {
            minX = Math.min(minX, node.x * scale);
            maxX = Math.max(maxX, node.x * scale);
            minY = Math.min(minY, node.y * scale);
            maxY = Math.max(maxY, node.y * scale);
        });

        // Check edges
        edges.forEach((edge: any) => {
            minX = Math.min(minX, edge.source.x * scale, edge.target.x * scale);
            maxX = Math.max(maxX, edge.source.x * scale, edge.target.x * scale);
            minY = Math.min(minY, edge.source.y * scale, edge.target.y * scale);
            maxY = Math.max(maxY, edge.source.y * scale, edge.target.y * scale);
        });

        const padding = 50;
        return {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2
        };
    };

    const linkPath = (d: Link<UnrootedNode>, scale: number): string => {
        const sourceX = d.source.x * scale;
        const sourceY = d.source.y * scale;
        const targetX = d.target.x * scale;
        const targetY = d.target.y * scale;

        return `M${sourceX},${sourceY}L${targetX},${targetY}`;
    };

    useEffect(() => {
        if (!data || !containerRef.current) {
            return;
        };

        // Clear existing content
        d3.select(containerRef.current).selectAll("*").remove();

        const tree: UnrootedData = {
            data: [],
            edges: []
        };

        // Calculating links and nodes for unrooted tree
        const eq = fortify(equalAngleLayout(data));
        tree.data = eq;
        tree.edges = edges(eq);

        /*
        * Draw the tree
        */

        // Zoom/Pan behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 5]) // Min/max zoom level
            .on('zoom', (event) => {
                svgMain.select("g").attr('transform', event.transform);
            });

        // Initialize SVG Main container, used for zoom/pan listening
        const bbox = getBoundingBox(tree, scale);
        const svgMain = d3.select(containerRef.current).append("svg")
            .attr("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`)
            .attr("font-family", "sans-serif")
            .attr("font-size", 5)
            .call(zoom);

        // Initialize base SVG group
        const svg = svgMain.append("g");

        // Append styles
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

        // Draw links
        const links = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#444")
            .selectAll("path")
            .data(tree.edges)
            .join("path")
            .each(function (d: Link<UnrootedNode>) { d.target.linkNode = this as SVGPathElement; })
            .attr("d", d => linkPath(d, scale))
            .attr("fill", "none")
            .attr("stroke-width", 1)
            .attr("stroke", "black")
            .on("click", (event, d) => console.log(d));

        function nodeHovered(active: boolean): (event: MouseEvent, d: UnrootedNode) => void {
            return function (event, d) {
                d3.select(this).classed("node--active", active);
                // Highlight descendants. Disabled for now. TODO how to calculate angles
                // highlightClade(d, active, svg, scale);
            };
        }

        // Draw nodes
        const nodes = svg.append("g")
            .selectAll(".node")
            .data(tree.data.filter(d => !d.isTip))
            .join("g")
            .attr("class", "inner-node")
            .attr("transform", d => `translate(${d.x * scale}, ${d.y * scale})`);


        nodes.append("circle")
            .attr("r", 3)
            .style("fill", "#fff")
            .style("stroke", "steelblue")
            .style("stroke-width", 1.5)
            .on("mouseover", nodeHovered(true))
            .on("mouseout", nodeHovered(false))
            .on("click", (event, d) => console.log(d));

        // Append SVG to container
        containerRef.current.innerHTML = ''; // Clear existing content
        containerRef.current.appendChild(svgMain.node()!);

    }, [data, containerRef]);

    return (
        <div ref={containerRef} style={{
            border: "1px solid #ccc",
            borderRadius: "4px"
        }}>
        </div>
    );
});


/**
 * Below code was taken from Euphrasiologist's lwPhylo package
 * find it here: https://github.com/Euphrasiologist/lwPhylo
 */

/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think.
 * - Removed rectangular layout related code
 * - Simplified return data structure to just the source and target
 * - Input is now object of type UnrootedData, calculated edges are 
 */

function edges(df: UnrootedNode[]) {
    var result: Link<UnrootedNode>[] = [],
        parent: UnrootedNode | undefined;

    // make sure data frame is sorted
    df.sort(function (a, b) {
        return a.thisId - b.thisId;
    });

    for (const row of df) {
        if (row.parentId === null) {
            continue; // skip the root
        }
        parent = df[row.parentId];
        if (parent === null || parent === undefined) continue;
        var pair = {
            source: df[row.thisId],
            target: parent
        };
        result.push(pair);
    }
    return result;
}

/**
 * Convert parsed Newick tree from readTree() into data
 * frame.
 * this is akin to a "phylo" object in R.
 */
function fortify(tree: EqAngNode, sort = true): UnrootedNode[] {
    var df: UnrootedNode[] = [];

    for (const node of preorder(tree)) {
        if (node.parent === null) {
            df.push({
                parent: null,
                parentId: null,
                parentName: null,
                thisId: node.id,
                thisName: node.name,
                branchset: node.branchset.map((x: TreeNode) => x),
                length: 0.,
                isTip: false,
                x: node.x,
                y: node.y,
                angle: node.angle
            } as unknown as UnrootedNode)
        }
        else {
            df.push({
                parent: node.parent as UnrootedNode,
                parentId: node.parent?.id ?? null,
                parentName: node.parent?.name ?? null,
                thisId: node.id,
                thisName: node.name,
                branchset: node.branchset.map((x: TreeNode) => x),
                length: node.length,
                isTip: (node.branchset.length === 0),
                x: node.x,
                y: node.y,
                angle: node.angle
            } as unknown as UnrootedNode)
        }
    }

    if (sort) {
        df = df.sort(function (a, b) {
            return a.thisId - b.thisId;
        })
    }
    return (df);
}

/**
 * Recursive function for pre-order traversal of tree
 */

function preorder(node: EqAngNode, list: EqAngNode[] = []): EqAngNode[] {
    list.push(node);
    for (var i = 0; i < node.branchset.length; i++) {
        list = preorder(node.branchset[i] as EqAngNode, list);
    }
    return list;
}



/**
 * Count the number of tips that descend from this node
 */

function numTips(thisnode: EqAngNode): number {
    var result = 0;
    for (const node of levelorder(thisnode)) {
        if (node.branchset.length === 0) result++;
    }
    return (result);
}

/**
 * Recursive function for breadth-first search of a tree
 * the root node is visited first.
 */

function levelorder(root: EqAngNode): EqAngNode[] {
    // aka breadth-first search
    var queue: EqAngNode[] = [root],
        result: EqAngNode[] = [],
        curnode: EqAngNode | undefined;

    while (queue.length > 0) {
        curnode = queue.pop();
        if (curnode) {
            result.push(curnode);
            for (const child of curnode.branchset) {
                queue.push(child as EqAngNode);
            }
        }
    }
    return (result);
}

function equalAngleLayout(node: TreeNode): EqAngNode {
    // Cast node to EqAngNode to add required properties
    const eqNode = node as EqAngNode;

    if (eqNode.parent === null) {
        // node is root
        eqNode.start = 0.;  // guarantees no arcs overlap 0
        eqNode.end = 2.; // *pi
        eqNode.angle = 0.;  // irrelevant
        eqNode.ntips = numTips(eqNode);
        eqNode.x = 0;
        eqNode.y = 0;
    }

    var child: EqAngNode,
        arc: number,
        lastStart = eqNode.start;

    for (var i = 0; i < eqNode.branchset.length; i++) {
        // the child of the current node
        child = eqNode.branchset[i] as EqAngNode;
        // the number of tips the child node has
        child.ntips = numTips(child);

        // assign proportion of arc to this child
        arc = (eqNode.end - eqNode.start) * child.ntips / eqNode.ntips;
        child.start = lastStart;
        child.end = child.start + arc;

        // bisect the arc
        child.angle = child.start + (child.end - child.start) / 2.;
        lastStart = child.end;

        // map to coordinates
        child.x = eqNode.x + (child.length ?? 0) * Math.sin(child.angle * Math.PI);
        child.y = eqNode.y + (child.length ?? 0) * Math.cos(child.angle * Math.PI);

        // climb up
        equalAngleLayout(child);
    }
    // had to add this!
    return eqNode;
}