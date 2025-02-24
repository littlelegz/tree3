import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import * as d3 from 'd3';
import { TreeNode, UnrootedData, UnrootedNode, Link, EqAngNode, UnrootedTreeProps } from './types';
import { highlightClade } from './unrootedUtils.ts';
import {
  readTree
} from './utils.ts';
import {
  countLeaves,
  toggleHighlightDescendantLinks,
  toggleHighlightTerminalLinks,
  toggleCollapseClade,
  findAndZoom
} from './unrootedUtils.ts';
import '../css/tree3.css';
import '../css/menu.css';

export interface UnrootedTreeRef {
  getLinkExtensions: () => d3.Selection<SVGPathElement, Link<UnrootedNode>, SVGGElement, unknown> | null;
  getLinks: () => d3.Selection<SVGPathElement, Link<UnrootedNode>, SVGGElement, unknown> | null;
  getNodes: () => d3.Selection<SVGGElement, UnrootedNode, SVGGElement, unknown> | null;
  getLeaves: () => d3.Selection<SVGTextElement, UnrootedNode, SVGGElement, unknown> | null;
  setDisplayLeaves: (value: boolean) => void;
  recenterView: () => void;
  refresh: () => void;
  getRoot: () => UnrootedData | null;
  getData: () => UnrootedData | null;
  getContainer: () => HTMLDivElement | null;
  findAndZoom: (name: string, container: React.MutableRefObject<HTMLDivElement>) => void;
}

const UnrootedTree = forwardRef<UnrootedTreeRef, UnrootedTreeProps>(({
  data,
  scale = 500,
  onNodeClick,
  onLinkClick,
  onLeafClick,
  onNodeMouseOver,
  onNodeMouseOut,
  onLeafMouseOver,
  onLeafMouseOut,
  onLinkMouseOver,
  onLinkMouseOut,
  customNodeMenuItems,
  customLeafMenuItems,
  customLinkMenuItems,
  nodeStyler,
  linkStyler,
  leafStyler,
  homeNode,
  linkRoot = true,
}, ref) => {
  const [displayLeaves, setDisplayLeaves] = useState(true);
  const linkExtensionRef = useRef<d3.Selection<SVGPathElement, Link<UnrootedNode>, SVGGElement, unknown>>(null);
  const linkRef = useRef<d3.Selection<SVGPathElement, Link<UnrootedNode>, SVGGElement, unknown>>(null);
  const nodesRef = useRef<d3.Selection<SVGGElement, UnrootedNode, SVGGElement, unknown>>(null);
  const leafLabelsRef = useRef<d3.Selection<SVGTextElement, UnrootedNode, SVGGElement, unknown>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined>>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [varData, setVarData] = useState<UnrootedData | null>(null);

  // Read tree and calculate layout
  useEffect(() => {
    if (!data) return;
    const tree: UnrootedData = {
      data: [],
      edges: []
    };
    const eq = fortify(equalAngleLayout(readTree(data)));
    tree.data = eq;
    tree.edges = edges(eq);
    setVarData(tree);
  }, [data, refreshTrigger]);

  // Main helper methods
  const getBoundingBox = (data: UnrootedData) => { // Used for centering the tree during first render
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

  const linkPath = (d: Link<UnrootedNode>): string => {
    const sourceX = d.source.x * scale;
    const sourceY = d.source.y * scale;
    const targetX = d.target.x * scale;
    const targetY = d.target.y * scale;

    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  };

  const linkExtension = (d: Link<UnrootedNode>): string => {
    if (!d.target.labelElement) return '';

    const sourceX = d.source.x * scale;
    const sourceY = d.source.y * scale;
    const targetX = d.target.x * scale;
    const targetY = d.target.y * scale;

    // Calculate angle and extension direction
    const angle = Math.atan2(targetY - sourceY, targetX - sourceX);

    // Extend in direction based on text-anchor
    const extensionLength = 600;
    const extendedX = targetX + Math.cos(angle) * extensionLength;
    const extendedY = targetY + Math.sin(angle) * extensionLength;

    return `M${sourceX},${sourceY}L${extendedX},${extendedY}`;
  };

  // Rotate leafLabels based on angle of the link, and flip for readability
  const getRotate = (d: UnrootedNode): string => {
    const x1 = d.parent?.x ?? 0;
    const y1 = d.parent?.y ?? 0;
    const x2 = d.x;
    const y2 = d.y;
    let angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    // Flip text if angle is past -90
    if (angle < -90 || angle > 90) {
      angle += 180;
      return `rotate(${angle}, ${d.x * scale}, ${d.y * scale})`;
    }
    return `rotate(${angle}, ${d.x * scale}, ${d.y * scale})`;
  }

  useEffect(() => { // Render tree
    if (!containerRef.current || !varData) return;

    // Clear existing content
    d3.select(containerRef.current).selectAll("*").remove();

    // Initialize SVG Main container, used for zoom/pan listening
    const bbox = getBoundingBox(varData);
    const initialScale = 0.5;
    const translateX = (containerRef.current.clientWidth - bbox.width * initialScale) / 2 - bbox.x * initialScale;
    const translateY = (containerRef.current.clientHeight - bbox.height * initialScale) / 2 - bbox.y * initialScale;

    const initialTransform = d3.zoomIdentity.translate(translateX, translateY).scale(initialScale);

    const svgMain = d3.select(containerRef.current).append("svg")
      //.attr("viewBox", `0 0 ${bbox.width} ${bbox.height}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("font-family", "sans-serif")
      .attr("font-size", 5);

    // Initialize base SVG group
    const svg = svgMain.append("g").attr("class", "tree")
    //.attr("transform", `translate(${translateX}, ${translateY})`);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 8])
      .on('zoom', (event) => {
        svg.attr('transform', event.transform);
      });

    // Apply zoom behavior
    svgMain.call(zoom);

    // Link functions
    function linkhovered(active: boolean): (event: MouseEvent, d: Link<UnrootedNode>) => void {
      return function (this: SVGPathElement, event: MouseEvent, d: Link<UnrootedNode>): void {
        if (active) {
          onLinkMouseOver?.(event, d.source, d.target);
        } else {
          onLinkMouseOut?.(event, d.source, d.target);
        }
        d3.select(this).classed("link--active", active);
        if (d.target.linkExtensionNode) {
          d3.select(d.target.linkExtensionNode).classed("link-extension--active", active).raise();
        }

        highlightClade(d.target, active, svg, scale);
      };
    }

    function linkClicked(event: MouseEvent, d: Link<UnrootedNode>): void {
      d3.selectAll('.tooltip-node').remove();

      const menu = d3.select(containerRef.current)
        .append('div')
        .attr('class', 'menu-node')
        .style('position', 'fixed')
        .style('left', `${event.clientX + 10}px`)
        .style('top', `${event.clientY - 10}px`)
        .style('opacity', 1)
        .node();

      const MenuContent = (
        <>
          <div className="menu-header">{d.source.thisName}-{d.target.thisName}</div>
          <div className="menu-buttons">
            <div className="dropdown-divider" />

            <a className="dropdown-item" onClick={() => rootOnBranch(d)}>
              Root Here
            </a>
            <div className="dropdown-divider" />
            {/* Custom menu items */}
            {customLinkMenuItems?.map(item => {
              if (item.toShow(d.source, d.target)) {
                return (
                  <a className="dropdown-item" onClick={() => { item.onClick(d.source, d.target); menu?.remove(); }}>
                    {item.label(d.source, d.target)}
                  </a>
                );
              }
            })}
          </div>
        </>
      );

      if (menu) {
        const root = createRoot(menu);
        root.render(MenuContent);

        setTimeout(() => {
          const handleClickOutside = (e: MouseEvent) => {
            if (menu && !menu.contains(e.target as Node)) {
              try {
                menu.remove();
              } catch (e) { // When rerooting, tree display is refreshed and menu is removed
                console.error(e);
              }
              window.removeEventListener('click', handleClickOutside);
            }
          };
          window.addEventListener('click', handleClickOutside);
        }, 5);
      }
      const linkElement = d3.select(event.target as SVGPathElement);
      const isHighlighted = linkElement.classed('link--highlight');

      linkElement
        .classed('link--highlight', !isHighlighted)
        .raise();
      onLinkClick?.(event, d.source, d.target);
    }

    if (linkRoot) { // Root (Node1) does not have links connecting to or from it
      const root = varData.data[varData.data.length - 1]; // Root is always the last one to be read
      // find the first nontip child node
      const firstChild = root.children.find(child => !child.isTip);
      const tips = root.children.filter(child => child.isTip);
      if (firstChild) {
        // Create a link from root to firstChild
        const link = {
          source: root,
          target: firstChild
        };
        varData.edges.push(link);
      }
      if (tips) {
        tips.forEach(tip => {
          const link = {
            source: root,
            target: tip
          };
          varData.edges.push(link);
        });
      }
    }

    // Draw links first, then calculate and draw extension
    var linksData = varData.edges;

    // Add root node if present
    if (varData.root) {
      linksData = linksData.concat(varData.root.edges);
    }

    const links = svg.append("g")
      .attr("class", "links")
      .attr("fill", "none")
      .attr("stroke", "#444")
      .selectAll("path")
      .data(linksData)
      .join("path")
      .each(function (d: Link<UnrootedNode>) {
        d.target.linkNode = this as SVGPathElement;
        if (!d.source.forwardLinkNodes) {
          d.source.forwardLinkNodes = [];
        }
        d.source.forwardLinkNodes.push(this as SVGPathElement);
      })
      .attr("d", linkPath)
      .attr("stroke", (d: Link<UnrootedNode>) => d.target.color || "#000")
      .style("cursor", "pointer")
      .on("mouseover", linkhovered(true))
      .on("mouseout", linkhovered(false))
      .on("click", linkClicked);

    // If given linkStyler, apply it
    if (linkStyler) {
      links.each((d) => linkStyler(d.source, d.target));
    }

    // Leaf functions
    function leafhovered(active: boolean): (event: MouseEvent, d: UnrootedNode) => void {
      return function (this: SVGPathElement, event: MouseEvent, d: UnrootedNode): void {
        if (active) {
          onLeafMouseOver?.(event, d);
        } else {
          onLeafMouseOut?.(event, d);
        }
        d3.select(this).classed("label--active", active);
        if (d.linkExtensionNode) {
          d3.select(d.linkExtensionNode).classed("link-extension--active", active).raise();
        }
        do {
          if (d.linkNode) {
            d3.select(d.linkNode).classed("link--active", active).raise();
          }
        } while (d.parent && (d = d.parent));
      };
    }

    function leafClicked(event: MouseEvent, d: UnrootedNode): void {
      d3.selectAll('.tooltip-node').remove();

      const menu = d3.select(containerRef.current)
        .append('div')
        .attr('class', 'menu-node')
        .style('position', 'fixed')
        .style('left', `${event.clientX + 10}px`)
        .style('top', `${event.clientY - 10}px`)
        .style('opacity', 1)
        .node();

      const MenuContent = (
        <>
          <div className="menu-header">
            {d.data.name}
          </div>
          <div className="menu-buttons">
            <div className="dropdown-divider" />
            {/* Custom menu items */}
            {customLeafMenuItems?.map(item => {
              if (item.toShow(d)) {
                return (
                  <a className="dropdown-item" onClick={() => { item.onClick(d); menu?.remove(); }}>
                    {item.label(d)}
                  </a>
                );
              }
            })}
          </div>
        </>
      );

      if (menu) {
        const root = createRoot(menu);
        root.render(MenuContent);

        setTimeout(() => {
          const handleClickOutside = (e: MouseEvent) => {
            if (menu && !menu.contains(e.target as Node)) {
              try {
                menu.remove();
              } catch (e) { // When rerooting, tree display is refreshed and menu is removed
                console.error(e);
              }
              window.removeEventListener('click', handleClickOutside);
            }
          };
          window.addEventListener('click', handleClickOutside);
        }, 5);
      }

      onLeafClick?.(event, d);
    }

    // Draw leaf labels
    const leafLabels = svg.append("g")
      .attr("class", "leaves")
      .selectAll(".leaf-label")
      .data(varData.data.filter(d => d.isTip))
      .join("text")
      .each(function (d: UnrootedNode) { d.labelElement = this as SVGTextElement; })
      .attr("class", "leaf-label")
      .attr("x", d => {
        const angle = Math.atan2(d.y - (d.parent?.y ?? 0), d.x - (d.parent?.x ?? 0)) * (180 / Math.PI);
        const isEnd = angle < -90 || angle > 90;
        return d.x * scale + (isEnd ? -600 : 600); // Shifting label away from center depends on it's orientation around center
      })
      .attr("y", d => d.y * scale)
      .attr("dy", ".31em")
      .attr("transform", d => getRotate(d))
      .attr("text-anchor", d => {
        const angle = Math.atan2(d.y - (d.parent?.y ?? 0), d.x - (d.parent?.x ?? 0)) * (180 / Math.PI);
        return (angle < -90 || angle > 90) ? "end" : "start"; // Text anchor depends on it's so reader can read it
      })
      .text(d => d.thisName.replace(/_/g, " "))
      .on("mouseover", leafhovered(true))
      .on("mouseout", leafhovered(false))
      .on("click", leafClicked);

    // If given leafStyler, apply it
    if (leafStyler) {
      leafLabels.each((d) => leafStyler(d));
    }

    // Node functions
    function nodeHovered(active: boolean): (event: MouseEvent, d: UnrootedNode) => void {
      return function (this: SVGGElement, event, d) {
        if (active) {
          onNodeMouseOver?.(event, d);
        } else {
          onNodeMouseOut?.(event, d);
        }
        d3.select(this).classed("node--active", active);

        // Highlight connected links
        if (d.linkExtensionNode) {
          d3.select(d.linkExtensionNode)
            .classed("link-extension--active", active)
            .raise();
        }

        // Highlight descendants
        highlightClade(d, active, svg, scale);
      };
    }

    function showHoverLabel(event: MouseEvent, d: UnrootedNode): void {
      // Clear any existing tooltips
      d3.selectAll('.tooltip-node').remove();

      tooltipRef.current = d3.select(containerRef.current)
        .append('div')
        .attr('class', 'tooltip-node')
        .style('position', 'fixed')
        .style('left', `${event.clientX + 10}px`)
        .style('top', `${event.clientY - 10}px`)
        .style('opacity', 0)
        .html(`${d.thisName}<br/>Leaves: ${countLeaves(d)}`);

      tooltipRef.current
        .transition()
        .duration(200)
        .style('opacity', 1);
    }

    function hideHoverLabel(): void {
      if (tooltipRef.current) {
        tooltipRef.current
          .transition()
          .duration(200)
          .style('opacity', 0)
          .remove();
      }
    }

    function nodeClicked(event: MouseEvent, d: UnrootedNode): void {
      d3.selectAll('.tooltip-node').remove();

      const menu = d3.select(containerRef.current)
        .append('div')
        .attr('class', 'menu-node')
        .style('position', 'fixed')
        .style('left', `${event.clientX + 10}px`)
        .style('top', `${event.clientY - 10}px`)
        .style('opacity', 1)
        .node();

      const MenuContent = (
        <>
          <div className="menu-header">{d.thisName}</div>
          <div className="menu-buttons">
            <a className="dropdown-item" onClick={() => toggleCollapseClade(d)}>
              Collapse Clade
            </a>
            <div className="dropdown-divider" />
            <div className="dropdown-header">Toggle Selections</div>
            <a className="dropdown-item" onClick={() => toggleHighlightDescendantLinks(d)}>
              Descendant Links
            </a>
            <a className="dropdown-item" onClick={() => toggleHighlightTerminalLinks(d)}>
              Terminal Links
            </a>
            <div className="dropdown-divider" />
            {/* Custom menu items */}
            {customNodeMenuItems?.map(item => {
              if (item.toShow(d)) {
                return (
                  <a className="dropdown-item" onClick={() => { item.onClick(d); menu?.remove(); }}>
                    {item.label(d)}
                  </a>
                );
              }
            })}
          </div>
        </>
      );

      if (menu) {
        const root = createRoot(menu);
        root.render(MenuContent);

        setTimeout(() => {
          const handleClickOutside = (e: MouseEvent) => {
            if (menu && !menu.contains(e.target as Node)) {
              try {
                menu.remove();
              } catch (e) { // When rerooting, tree display is refreshed and menu is removed
                console.error(e);
              }
              window.removeEventListener('click', handleClickOutside);
            }
          };
          window.addEventListener('click', handleClickOutside);
        }, 5);
      }

      onNodeClick?.(event, d);
    }

    // Draw nodes
    const nodesData = varData.data.filter(d => !d.isTip);

    // Add root node if present
    if (varData.root) {
      nodesData.push(varData.root.node);
    }

    const nodes = svg.append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(nodesData)
      .join("g")
      .each(function (d: UnrootedNode) { d.nodeElement = this as SVGGElement; })
      .attr("class", "inner-node")
      .attr("transform", d => `translate(${d.x * scale}, ${d.y * scale})`);

    // Add circles for nodes
    nodes.append("circle")
      .attr("r", 3)
      .style("fill", "#fff")
      .style("stroke", "steelblue")
      .style("stroke-width", 1.5)
      .on("click", nodeClicked)
      .on("mouseover", nodeHovered(true))
      .on("mouseout", nodeHovered(false))
      .on('mouseenter', showHoverLabel)
      .on('mouseleave', hideHoverLabel);

    // If given nodeStyler, apply it
    if (nodeStyler) {
      nodes.each((d) => nodeStyler(d));
    }

    // Draw link extensions
    const linkExtensions = svg.append("g")
      .attr("class", "link-extensions")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-dasharray", "4,4")
      .selectAll("path")
      .data(varData.edges.filter(d => d.target.children.length === 0)) // targets nodes without children
      .join("path")
      .each(function (d: Link<UnrootedNode>) { d.target.linkExtensionNode = this as SVGPathElement; })
      .attr("d", linkExtension);

    linkExtensionRef.current = linkExtensions as unknown as d3.Selection<SVGPathElement, Link<UnrootedNode>, SVGGElement, unknown>;
    linkRef.current = links as unknown as d3.Selection<SVGPathElement, Link<UnrootedNode>, SVGGElement, unknown>;
    nodesRef.current = nodes as unknown as d3.Selection<SVGGElement, UnrootedNode, SVGGElement, unknown>;
    leafLabelsRef.current = leafLabels as unknown as d3.Selection<SVGTextElement, UnrootedNode, SVGGElement, unknown>;
    svgRef.current = svgMain.node();

    // Finally, zoom to center
    if (svgRef.current && containerRef.current) {
      if (homeNode) {
        findAndZoom(homeNode, d3.select(svgRef.current), containerRef as React.MutableRefObject<HTMLDivElement>, scale);
      } else {
        svgMain.call(zoom.transform, initialTransform);
      }
    }
  }, [varData]);

  useEffect(() => { // Toggle leaf label visibility
    leafLabelsRef.current?.style("display", displayLeaves ? "block" : "none");
    linkExtensionRef.current?.style("display", displayLeaves ? "block" : "none");
  }, [displayLeaves]);

  const recenterView = () => {
    const svg = d3.select(containerRef.current).select('svg').select('g');

    svg.transition()
      .duration(750)
      .attr('transform', "translate(0,0)");
  };

  const rootOnBranch = useMemo(() => (d: Link<UnrootedNode>) => {
    const rootNode = {
      parent: null,
      parentId: null,
      parentName: null,
      thisName: 'root',
      thisId: -1,
      children: [d.source, d.target],
      length: 0,
      isTip: false,
      x: (d.source.x + d.target.x) / 2,
      y: (d.source.y + d.target.y) / 2,
      angle: 0,
      data: {
        name: 'root',
        value: 0
      },
      branchset: [d.source, d.target]
    }

    const rootEdges = [{
      source: rootNode,
      target: d.source
    }, {
      source: rootNode,
      target: d.target
    }]

    const newData = addRoot(varData?.data ?? [], d.source, d.target);
    var newEdges = edges(newData);

    if (varData) {
      setVarData({
        data: newData,
        edges: newEdges,
        root: {
          node: rootNode,
          edges: rootEdges
        }
      });
    }
  }, [varData]);

  useImperativeHandle(ref, () => ({
    getLinkExtensions: () => linkExtensionRef.current,
    getLinks: () => linkRef.current,
    getNodes: () => nodesRef.current,
    getLeaves: () => leafLabelsRef.current,
    setDisplayLeaves: (value: boolean) => setDisplayLeaves(value),
    recenterView: () => recenterView(),
    refresh: () => setRefreshTrigger(prev => prev + 1),
    getRoot: () => varData,
    getData: () => varData,
    getContainer: () => containerRef.current,
    findAndZoom: (name: string, container: React.MutableRefObject<HTMLDivElement>) => {
      if (svgRef.current && varData) {
        findAndZoom(name, d3.select(svgRef.current), container, scale);
      }
    },
  }));

  return (
    <div className="radial-tree" style={{ width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{
        width: "100%",
        height: "100%",
        overflow: "show",
      }} />
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
 * - Input is now object of type UnrootedData, calculated edges are Link<UnrootedNode>
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
      source: parent,
      target: row
    };
    result.push(pair);
  }
  return result;
}

function addRoot(df: UnrootedNode[], rootLeft: UnrootedNode, rootRight: UnrootedNode): UnrootedNode[] {


  function swap(node: UnrootedNode) {
    let current = node;
    let parent = node.parent;

    //remove current from parent's children, add parent to current's children
    while (parent) {
      parent.children = parent.children.filter(child => child !== current);
      parent.parentId = current.thisId;
      current.children.push(parent);

      // move up the tree
      current = parent;
      var nextparent = parent.parent || null;

      // update parent's parent
      parent.parent = current;
      parent = nextparent;
    }
  }

  if (rootLeft.parentName === rootRight.thisName) { // rootRight child-parent relationships are reversed
    // recursively swap parent and child
    rootRight.children = rootRight.children.filter(child => child !== rootLeft)
    swap(rootRight);
  } else {
    rootLeft.children = rootLeft.children.filter(child => child !== rootRight)
    swap(rootLeft);
  }


  rootRight.parentId = null;
  rootRight.parent = null;
  rootLeft.parentId = null;
  rootLeft.parent = null;

  // For every entry in df, set forwardLinkNodes to empty array
  df.forEach(node => {
    node.forwardLinkNodes = [];
  });

  return df;
}

/**
 * Convert parsed Newick tree from readTree() into data
 * frame.
 * this is akin to a "phylo" object in R.
 * EDIT: Instead of preorder traversal, use recursive function
 * so children and parents and linked.
 */
function fortify(tree: EqAngNode, sort = true): UnrootedNode[] {
  var df: UnrootedNode[] = [];

  function convertNode(node: EqAngNode): UnrootedNode {
    // Convert current node
    const unrootedNode: UnrootedNode = {
      parent: node.parent as UnrootedNode,
      parentId: node.parent?.id ?? null,
      parentName: node.parent?.name ?? null,
      thisId: node.id ?? -1,
      thisName: node.name ?? '',
      children: [],
      length: node.length ?? 0,
      isTip: node.branchset?.length === 0,
      x: node.x,
      y: node.y,
      angle: node.angle,
      data: {
        name: node.name ?? '',
        value: node.length ?? 0
      },
      branchset: node.branchset ?? []
    };

    // Recursively convert children
    if (node.branchset) {
      unrootedNode.children = node.branchset.map(child => {
        const convertedChild = convertNode(child as EqAngNode);
        convertedChild.parent = unrootedNode;
        df.push(convertedChild);
        return convertedChild;
      });
    }

    return unrootedNode;
  }

  // Start conversion from root
  const rootNode = convertNode(tree);
  df.push(rootNode);

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

export default UnrootedTree;