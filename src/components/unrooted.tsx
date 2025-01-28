import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TreeNode, UnrootedData, UnrootedNode, UnrootedNodeLink, EqAngNode } from './types';

interface UnrootedTreeProps {
  node: TreeNode;
  width?: number;
  height?: number;
}

export const UnrootedTree: React.FC<UnrootedTreeProps> = ({ 
  node, 
  width = 500, 
  height = 500 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!node) return;
    if (!svgRef.current) return;

    const data: UnrootedData = {
      data: [],
      edges: []
    };
    
    const eq = fortify(equalAngleLayout(node));
    data.data = eq;
    data.edges = edges(eq);

    const svg = d3.select(svgRef.current);

    // Draw edges
    svg.selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("x1", d => d.x1 * 100 + 250)
      .attr("y1", d => d.y1 * 100 + 250)
      .attr("x2", d => d.x2 * 100 + 250)
      .attr("y2", d => d.y2 * 100 + 250)
      .attr("stroke-width", 1)
      .attr("stroke", "black");

    // Draw nodes
    svg.selectAll("circle")
      .data(data.data)
      .join("circle")
      .attr("cx", d => d.x * 100 + 250)
      .attr("cy", d => d.y * 100 + 250)
      .attr("r", 2)
      .attr("fill", "red")
      .on("click", (event, d) => console.log(d));

  }, [node]);

  return (
    <svg 
      ref={svgRef}
      width={width}
      height={height}
    />
  );
};

/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think.
 */

function edges(df: UnrootedNode[], rectangular = false) {
    var result: UnrootedNodeLink[] = [],
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
        var pair3 = {
            x1: row.x,
            y1: row.y,
            id1: row.thisId,
            x2: parent.x,
            y2: parent.y,
            id2: row.parentId
        };
        result.push(pair3);
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
                parentId: null,
                parentName: null,
                thisId: node.id,
                thisName: node.name,
                branchset: node.branchset.map((x: TreeNode) => x.id),
                length: 0.,
                isTip: false,
                x: node.x,
                y: node.y,
                angle: node.angle
            } as unknown as UnrootedNode)
        }
        else {
            df.push({
                parentId: node.parent?.id ?? null,
                parentName: node.parent?.name ?? null,
                thisId: node.id,
                thisName: node.name,
                branchset: node.branchset.map((x: TreeNode) => x.id),
                length: node.length,
                isTip: (node.branchset.length == 0),
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
        if (node.branchset.length == 0) result++;
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