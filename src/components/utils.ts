import { TreeNode, D3Node, RadialNode, UnrootedNode } from './types.ts';

export const convertToD3Format = (node: TreeNode | null): D3Node | null => {
  if (!node) return null;

  return {
    name: node.name || '',
    value: node.length || 0,
    children: node.branchset
      ? node.branchset.map(child => convertToD3Format(child))
        .filter((node): node is D3Node => node !== null)
      : [],
  };
};

export const radialToD3Node = (node: RadialNode): D3Node => {
  return {
    name: node.data.name,
    value: node.data.value,
    children: node.children ? node.children.map(child => radialToD3Node(child)) : [],
  };
};

export function readTree(text: string): TreeNode {
  // remove whitespace
  text = text.replace(/\s+$/g, '')  // Remove trailing whitespace
    .replace(/[\r\n]+/g, '') // Remove carriage returns and newlines
    .replace(/\s+/g, '');    // Remove any remaining whitespace

  var tokens = text.split(/(;|\(|\)|,)/),
    root: TreeNode = {
      parent: null,
      branchset: []
    },
    curnode = root,
    nodeId = 0;

  for (const token of tokens) {
    if (token === "" || token === ';') {
      continue
    }
    if (token === '(') {
      // add a child to current node
      let child = {
        parent: curnode,
        branchset: []
      };
      curnode.branchset.push(child);
      curnode = child;  // climb up
    }
    else if (token === ',') {
      // climb down, add another child to parent
      if (curnode.parent) {
        curnode = curnode.parent;
      } else {
        throw new Error("Parent node is undefined");
      }
      let child = {
        'parent': curnode,
        'branchset': []
      }
      curnode.branchset.push(child);
      curnode = child;  // climb up
    }
    else if (token === ')') {
      // climb down twice
      if (curnode.parent) {
        curnode = curnode.parent;
      } else {
        throw new Error("Parent node is undefined");
      }
      if (curnode === null) {
        break;
      }
    }
    else {
      var nodeinfo = token.split(':');

      if (nodeinfo.length === 1) {
        if (token.startsWith(':')) {
          curnode.name = "";
          curnode.length = parseFloat(nodeinfo[0]);
        } else {
          curnode.name = nodeinfo[0];
          curnode.length = undefined;
        }
      }
      else if (nodeinfo.length === 2) {
        curnode.name = nodeinfo[0];
        curnode.length = parseFloat(nodeinfo[1]);
      }
      else {
        // TODO: handle edge cases with >1 ":"
        console.warn(token, "I don't know what to do with two colons!");
      }
      curnode.id = nodeId++;  // assign then increment
    }
  }

  curnode.id = nodeId;

  return (root);
}

export function selectAllLeaves<T extends { children?: T[] }>(node: T): T[] {
  const leaves: T[] = [];

  function traverse(currentNode: T) {
    if (!currentNode.children || currentNode.children.length === 0) {
      leaves.push(currentNode);
    } else {
      currentNode.children.forEach(child => traverse(child));
    }
  }

  traverse(node);
  return leaves;
}

export function selectAllNodes<T extends { children?: T[] }>(node: T): T[] {
  const nodes: T[] = [];

  function traverse(currentNode: T) {
    nodes.push(currentNode);
    if (currentNode.children) {
      currentNode.children.forEach(child => traverse(child));
    }
  }

  traverse(node);
  return nodes;
}