export interface TreeNode {
    name?: string;
    length?: number;
    branchset: TreeNode[];
    id?: number
    parent?: TreeNode | null
}

export interface D3Node {
    name: string;
    value: number;
    children?: D3Node[];
}

export interface RadialTreeProps {
  data: D3Node;
  width?: number;
  onNodeClick?: (node: D3Node) => void;
}

export interface RadialNodeLink {
  source: RadialNode;
  target: RadialNode;
}

// Extend D3's HierarchyNode with radius property
export interface RadialNode extends d3.HierarchyNode<D3Node> {
  radius?: number;
  linkNode?: SVGPathElement;
  linkExtensionNode?: SVGPathElement;
  color?: string;
}

export interface UnrootedNode extends TreeNode {
  angle: number;
  isTip: boolean;
  parentId: number | null;
  parentName: string | null;
  thisId: number;
  thisName: string;
  x: number;
  y: number; 
}

export interface EqAngNode extends TreeNode {
  angle: number;
  end: number;
  ntips: number;
  start: number;
  x: number;
  y: number;
}

export interface UnrootedNodeLink {
  id1: number;
  id2: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface UnrootedData {
  data: UnrootedNode[];
  edges: UnrootedNodeLink[];
}