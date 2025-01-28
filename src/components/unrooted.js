// Original source: Euphrasiologist's lwPhylo 
// https://github.com/Euphrasiologist/lwPhylo/tree/master

import { readTree } from './utils.ts';

/**
 * Recursive function for breadth-first search of a tree
 * the root node is visited first.
 */

function levelorder(root) {
    // aka breadth-first search
    var queue = [root],
        result = [],
        curnode;

    while (queue.length > 0) {
        curnode = queue.pop();
        result.push(curnode);
        for (const child of curnode.branchset) {
            queue.push(child);
        }
    }
    return (result);
}

/**
 * Count the number of tips that descend from this node
 */

function numTips(thisnode) {
    var result = 0;
    for (const node of levelorder(thisnode)) {
        if (node.branchset.length == 0) result++;
    }
    return (result);
}



/**
 * Equal-angle layout algorithm for unrooted trees.
 * Populates the nodes of a tree object with information on
 * the angles to draw branches such that they do not
 * intersect.
 */

function equalAngleLayout(node) {
    if (node.parent === null) {
        // node is root
        node.start = 0.;  // guarantees no arcs overlap 0
        node.end = 2.; // *pi
        node.angle = 0.;  // irrelevant
        node.ntips = numTips(node);
        node.x = 0;
        node.y = 0;
    }

    var child, arc, lastStart = node.start;

    for (var i = 0; i < node.branchset.length; i++) {
        // the child of the current node
        child = node.branchset[i];
        // the number of tips the child node has
        child.ntips = numTips(child);

        // assign proportion of arc to this child
        arc = (node.end - node.start) * child.ntips / node.ntips;
        child.start = lastStart;
        child.end = child.start + arc;

        // bisect the arc
        child.angle = child.start + (child.end - child.start) / 2.;
        lastStart = child.end;

        // map to coordinates
        child.x = node.x + child.length * Math.sin(child.angle * Math.PI);
        child.y = node.y + child.length * Math.cos(child.angle * Math.PI);

        // climb up
        equalAngleLayout(child);
    }
    // had to add this!
    return node;
}

/**
 * Recursive function for pre-order traversal of tree
 */

function preorder(node, list = []) {
    list.push(node);
    for (var i = 0; i < node.branchset.length; i++) {
        list = preorder(node.branchset[i], list);
    }
    return (list);
}

/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think.
 */

function edges(df, rectangular = false) {
    var result = [],
        parent

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

        if (rectangular) {
            var pair1 = {
                x1: row.x,
                y1: row.y,
                id1: row.thisId,
                x2: parent.x,
                y2: row.y,
                id2: undefined
            };
            result.push(pair1);
            var pair2 = {
                x1: parent.x,
                y1: row.y,
                id1: undefined,
                x2: parent.x,
                y2: parent.y,
                id2: row.parentId
            };
            result.push(pair2);
        } else {
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
    }
    return result;
}

/**
 * Convert parsed Newick tree from readTree() into data
 * frame.
 * this is akin to a "phylo" object in R.
 */
function fortify(tree, sort = true) {
    var df = [];

    for (const node of preorder(tree)) {
        if (node.parent === null) {
            df.push({
                'parentId': null,
                'parentName': null,
                'thisId': node.id,
                'thisName': node.name,
                'branchset': node.branchset.map(x => x.id),
                'length': 0.,
                'isTip': false,
                'x': node.x,
                'y': node.y,
                'angle': node.angle
            })
        }
        else {
            df.push({
                'parentId': node.parent.id,
                'parentName': node.parent.name,
                'thisId': node.id,
                'thisName': node.name,
                'branchset': node.branchset.map(x => x.id),
                'length': node.length,
                'isTip': (node.branchset.length == 0),
                'x': node.x,
                'y': node.y,
                'angle': node.angle
            })
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
 * Simple wrapper function for equalAngleLayout()
 */

export function unrooted(node) {
    var data = {};
    // use the Felsenstein equal angle layout algorithm
    var eq = fortify(equalAngleLayout(node));
    data.data = eq;
    // make the edges dataset
    data.edges = edges(eq);

    return data;
}

/**
 * Parse a Newick tree string into a doubly-linked
 * list of JS Objects.  Assigns node labels, branch
 * lengths and node IDs (numbering terminal before
 * internal nodes).
 */

// text: String

/*
  readTree output mapping to D3Node
    {   
        branchLength -> length
        children -> branchset
        id -> no analog, add id
        name -> label
        parent -> no analog, add it
    }
*/


// main function for testing
// async function main() {
//     try {
//         const newickString = await fs.readFile('../../public/asr.tree', 'utf8');
//         const tree = readTree(newickString);
//         console.log(tree)
//         const data = unrooted(tree);
//         // console.log(data);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }