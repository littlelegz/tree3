# tree3
A javascript library for generating interactive phylogenetic tree visualizations. Relies on [D3](http://d3js.org) [hierarchy layout](https://github.com/d3/d3-3.x-api-reference/blob/master/Hierarchy-Layout.md) to generate SVG elements, with a focus on customizability.

## Example Github Page
TODO

## Features
* Layouts: Radial, Rectangular, Unrooted (Equal-Angle)
* Pan/Zoom functionality


## Tree params

### data 
    `(String)` required. Newick data 

### width
    `(number)` Determines the width of the generated svg

### scale 
    (Unrooted Tree Only!)
    `(number)` Used to scale the size of the tree to make nodes and leaves more readable. Defaults to ``500``

### onNodeClick, onNodeMouseOver, onNodeMouseOut
    `function (event, node)` Click, mouse enter, and mouse leave callback functions for inner nodes

### onLeafClick, onLeafMouseOver, onLeafMouseOut
    `function (event, node)` Click, mouse enter, and mouse leave callback functions for leaves

### onLinkClick, onLinkMouseOver, onLinkMouseOut
    `function (event, source node, target node)` Click, mouse enter, and mouse leave callback functions for links

### customNodeMenuItems
    [
        {
            `label function (node) => string` Determines the label of the custom option
            `onClick function (onClick)` Callback 
            `toShow function (node) => boolean` Determines whether to show this option for the given node
        }
    ]

### nodeStyler, leafStyler
    `function (node)` Callback used for custom rendering options

### linkStyler
    `function (source node, target node)` Callback used for custom rendering options

## Radial and Rectangular Tree Functions
These functions can be accessed through the useRef React hook of the tree element

### getNodes
    Returns the d3 selection of all nodes

### getLeaves
    Returns the d3 selection of all leaves

### getLinks
    Returns the d3 selection of all links

### setVariableLinks (boolean)
    Determines whether to render the links according to their length.
    For a radial tree, this defaults to ``false``
    For a rectangular tree, this defaults to ``true``
    Unrooted trees do not have this function

### setDisplayLeaves (boolean)
    Determines whether to render leaf labels or not. Defaults to ``true``

### setTipAlign (boolean)
    Determines whether to align tips with each other, or to attach tips on the ends of branches. Defaults to ``false``

### recenterView
    Resets the pan/zoom of the tree

### getRoot
    Returns the root node. 
    Unrooted trees do not have this function

### getContainer
    Returns the HTML div element that the svg is rendered in

### findAndZoom (query)
    Pans the svg to center the node or leaf. (unstable)

