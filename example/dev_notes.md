# Dev Journal
### This document is a journal for describing the development of tree3
Starting with the data types used for each tree. Both the radial and rectangular trees use 
the node object, RadialNode. From a raw newick string, the readTree function produces a 
tree of TreeNodes. This object is then truncated into the D3Node which is used to convert 
into the d3.HierarchyNode. RadialNode extends the d3.HierarchyNode with convenient rendering
data. This extensions include:

1. linkNode - The svg path element points to this node
2. linkExtensionNode - This svg path element is the line between a leaf node and it's label. Internal nodes will not have linkExtensions
3. nodeElement - This svg element is the circle representing the node
4. labelElement - This svg element is the text label for a node

Since the underlying node representation is the same for both the radial and rectangular trees,
many of the functions that the two have are similar. 

The unrooted tree has nodes as UnrootedNode objects. This object is a little bloated due to 
my importing it from another repo here [Euphrasiologist's lwPhylo package](https://github.com/Euphrasiologist/lwPhylo).
I made a few modifications so that it would be friendlier to use during rendering, as well 
as changing it to typescript. Importantly, this object is not an extension of d3.HierarchyNode.
Like the RadialNode, it has 

1. linkNode
2. LinkExtensionNode
3. nodeElement
4. nodeLabel

However, it has a few additions

5. fowardLinkNodes - The svg paths linking from this node to it's descendants

Aside from the callback functions, such as on(Node, Leaf, Link)(Click, MouseOver, MouseOut), 
and custom menu items, how the unrootedtree functions is largely different from the last two.
Let's start with the parameters. 

1. scale - The lengths of branches calculated are very small, we need to scale it up for visibility
2. linkRoot - In the lwPhylo package, the first (root) node is not rendered. Here, we render the root by default

We must also mention the reroot function here. Instead of rooting on a given node, the 
user is given an option to add a root in a branch. This redefines the direction of descendants 
based on user preference.  

The most recent addition in the 1.1.0 release is the state param. Currently, two 
things are tracked in the state. 

1. Root node
2. Clade highlights

In an implementation, users can extract the state from one tree, and apply it to
another tree to maintain consistency across different tree representations.