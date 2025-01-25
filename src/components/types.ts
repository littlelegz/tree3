export interface TreeNode {
    name?: string;
    length?: number;
    branchset?: TreeNode[];
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